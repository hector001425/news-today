# Pipeline de automatización (n8n)

`news-today-pipeline.json` es el workflow real que corre en producción (no es solo una plantilla de ejemplo — es el que está importado y activo en la VM). Cubre **fase 1 y fase 2 completas**: búsqueda, redacción, publicación, audio y video. Falta **fase 3**: publicación automática en redes sociales.

```
Cada 6h → buscar noticias (IA / LLM / data / tecnología, RSS Google News)
    → convertir RSS a JSON → extraer hasta 5 items (slug estable por hash del link)
    → por cada noticia:
        Claude resume, traduce y categoriza
            → arma Markdown con frontmatter
                ├─→ commit a GitHub (src/content/articles/*.md) → Cloudflare Pages redespliega solo
                └─→ Google Cloud TTS genera audio narrado
                        → commit del .mp3 a GitHub (public/audio/*.mp3)
                            → Creatomate renderiza el reel vertical (titular + bajada + audio)
                                └─→ ⏳ fase 3: publicar el video en redes sociales (pendiente)
```

## Nodos del workflow

| Nodo | Qué hace |
|---|---|
| Disparador programado (cada 6h) | Schedule Trigger — dispara todo el flujo |
| Buscar noticias (RSS) | GET a Google News RSS filtrado a IA/LLM/data/tech, últimas 24h |
| Convertir RSS a JSON | Nodo XML nativo de n8n |
| Extraer items del RSS | Code node — aplana hasta 5 noticias, calcula `slug` estable (hash del link + título) |
| Claude: resumir y traducir | HTTP Request a la API de Anthropic — devuelve título/bajada/categoría/cuerpo en JSON |
| Armar Markdown + frontmatter | Code node — arma el `.md` final, limpia bloques ```json que a veces devuelve Claude |
| Publicar en GitHub (commit) | Crea el archivo en `src/content/articles/` — `continueOnFail`, si el slug ya existe (noticia repetida) el commit falla solo y no rompe el batch: es el mecanismo de deduplicación |
| Generar audio (TTS) | Google Cloud Text-to-Speech, voz `es-US-Neural2-B` |
| Publicar audio (commit) | Sube el `.mp3` a `public/audio/` vía la API de contenidos de GitHub directo (no el nodo GitHub nativo — el audio ya viene en base64 desde Google TTS, y el nodo nativo lo re-codificaría y lo corrompería) |
| Generar video (Creatomate) | Dispara un render async del template "News Today - Reel vertical" (9:16), con el audio real ya público en `raw.githubusercontent.com` |

## Cómo importarlo / actualizarlo

1. En tu instancia de n8n: **Workflows → Import from File** → seleccioná `news-today-pipeline.json`. Si ya existe un workflow con el mismo `id`, lo actualiza en vez de duplicarlo.
2. **Importante:** reimportar borra la asignación de credenciales de los nodos que no la tengan "horneada" en el JSON (ver más abajo). Después de reimportar, siempre verificar en la UI que Claude, GitHub, TTS y Creatomate sigan con su credencial asignada.
3. Reimportar también **desactiva** el workflow — hay que volver a activarlo (toggle "Active") y reiniciar el contenedor de n8n para que tome el cambio (`docker restart n8n-n8n-1`).

## Dónde corre n8n

VM `n8n-news-today` (Compute Engine, `e2-small`, Debian 12) en el proyecto GCP `news-today-pipeline`, con n8n + Postgres vía Docker Compose. **Sin IP pública** — el acceso es por túnel IAP:

```
gcloud compute start-iap-tunnel n8n-news-today 5678 --local-host-port=localhost:5678 --project=news-today-pipeline --zone=us-central1-a
```

Con el túnel abierto, la UI queda en `http://localhost:5678`. Cloud NAT (`nat-router` / `nat-config`, región `us-central1`) le da salida a internet a la VM sin exponerla con IP pública entrante.

## Credenciales configuradas (fase 1 + 2, ya activas)

| Nodo | Tipo de credencial en n8n | Servicio |
|---|---|---|
| Claude: resumir y traducir | Anthropic API | console.anthropic.com |
| Publicar en GitHub / Publicar audio | GitHub API (token fine-grained, permiso `Contents: Read and write` solo sobre `news-today`) | github.com/settings/personal-access-tokens |
| Generar audio (TTS) | Header/Query Auth (API key restringida solo a `texttospeech.googleapis.com`) | Mismo proyecto GCP (`news-today-pipeline`) |
| Generar video (Creatomate) | Header Auth (`Authorization: Bearer <key>`) | creatomate.com — template id `4a1d7b6a-0c13-423a-b37c-46211fbf5d2f` ("News Today - Reel vertical", plan gratis, 270×480) |

## Apagado/encendido automático de la VM (bajar costo)

La VM corre 24/7 hoy aunque el pipeline solo la necesita unos minutos cada corrida. Para que se prenda sola cada 6h, corra el pipeline una vez, y se apague — en vez de quedar prendida todo el día:

**1. Instance Schedule de Compute Engine** (prende/apaga la VM sola, sin tocar n8n):

```bash
gcloud compute resource-policies create instance-schedule news-today-6h \
  --project=news-today-pipeline \
  --region=us-central1 \
  --vm-start-schedule="0 */6 * * *" \
  --vm-stop-schedule="40 */6 * * *" \
  --timezone="America/Panama"

gcloud compute instances add-resource-policies n8n-news-today \
  --project=news-today-pipeline \
  --zone=us-central1-a \
  --resource-policies=news-today-6h
```

Esto prende la VM a las 00:00/06:00/12:00/18:00 y la apaga 40 min después — ajustar la ventana según cuánto tarda en la práctica una corrida (mirar el historial de ejecuciones en n8n). El Docker Compose de n8n tiene que arrancar solo al bootear la VM (`restart: unless-stopped` o `always` en el compose, y el propio Docker con `systemctl enable docker`) — si ya arranca solo hoy después de un reboot manual, no hay que tocar nada ahí.

**2. Importante — alinear el disparador de n8n con la ventana de encendido.** El Schedule Trigger del workflow ("cada 6h", ya actualizado en `news-today-pipeline.json`) calcula su próximo disparo desde que se activó/reinició n8n — con la VM apagándose y prendiéndose, ese cálculo puede desalinearse y el disparo caer fuera de la ventana en que la VM está prendida. Para que sea confiable, cambiar el nodo **directo en la UI de n8n** (no hace falta reimportar el JSON) de modo "Interval" a modo **"Cron Expression"**, con una hora fija que caiga unos minutos después del horario de arranque de la VM, por ejemplo `10 0,6,12,18 * * *` (dispara a la :10, dándole 10 min de margen a que Docker/n8n terminen de levantar). Confirmar antes cuál es el `GENERIC_TIMEZONE` configurado en el contenedor de n8n, para que la hora del cron coincida con el `--timezone` del Instance Schedule.

**3. Costo**: apagar la VM ~22 de las 24h del día corta el gasto de cómputo (el disco persistente se sigue facturando igual, prendida o apagada, pero es una fracción menor del costo total de una `e2-small`).

**Nota:** estos comandos no se ejecutaron desde acá — hay que correrlos con `gcloud` autenticado contra el proyecto `news-today-pipeline` (por ejemplo desde la máquina donde ya tenés el túnel IAP configurado).

## Fase 3 — publicación en redes sociales (pendiente)

Ver el detalle completo de qué necesita cada red social (cuentas, developer apps, quién hace qué) en la sección "Estado actual (roadmap)" del [`README.md`](../README.md) principal. Resumen del lado de n8n: una vez que exista la cuenta de developer aprobada en cada plataforma, el patrón es siempre el mismo —

1. Conectar la credencial OAuth de esa red en n8n (login vía navegador, botón "Connect" en la credencial)
2. Agregar un nodo después de "Generar video (Creatomate)" — hay que esperar/consultar el estado del render (es async, `status: planned` → `succeeded`) antes de tener la URL final del video para publicar
3. n8n trae nodos nativos para Twitter/X y otras redes; para las que no, HTTP Request directo a su API igual que hicimos con TTS y Creatomate

## Problemas conocidos

- **Colisión de escritura en GitHub**: cuando el pipeline procesa varias noticias casi en simultáneo, a veces el commit del audio (`Publicar audio (commit)`) falla con un conflicto de rama ("is at X but expected Y") porque dos commits intentan actualizar `main` al mismo tiempo. No rompe el pipeline (`continueOnFail`), simplemente ese video no se genera ese ciclo — se reintenta solo si la noticia sigue apareciendo en el RSS.
- **Resolución del video limitada a 270×480**: es el límite del plan gratis de Creatomate. Pasar a un plan pago para 1080×1920 real.
- **Repo público**: `news-today` tiene que ser público para que `raw.githubusercontent.com` sirva el audio sin autenticación (Creatomate no puede pasar un token de GitHub). No hay secretos en el repo — las credenciales viven todas en n8n.

## Despliegue del sitio (Cloudflare Pages)

1. Repo `news-today` conectado a Cloudflare Pages (Dashboard → Workers & Pages → `news-today` → Settings → Builds & deployments → Connect to Git).
2. Build command: `npm run build` — Output directory: `dist`.
3. Custom domains: `news-today.app` y `www.news-today.app`, DNS resuelto en Cloudflare (dominio comprado ahí mismo).
4. Cada commit a `main` (los haga el pipeline o un push manual) dispara un redespliegue automático.

## Por qué esta arquitectura

- El sitio (Astro) es estático — rápido, barato de hostear, sin backend que mantener.
- n8n hace de orquestador central: es donde vivís vos para monitorear, pausar, o ajustar el pipeline sin tocar código.
- Claude solo se llama para la parte de lenguaje (resumir/traducir/redactar) — el resto son integraciones directas por HTTP.
- Cada pieza (búsqueda de noticias, TTS, video, redes) es reemplazable de forma independiente sin rearmar el resto del flujo.
