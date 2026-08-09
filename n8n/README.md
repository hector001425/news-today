# Pipeline de automatización (n8n)

`news-today-pipeline.json` es una plantilla importable en n8n con el flujo de **fase 1** (búsqueda + redacción + publicación, sin audio/video/redes todavía):

```
Cada 2h → buscar noticias (IA / LLM / data / tecnología, RSS Google News) → extraer items
    → por cada noticia: Claude resume, traduce y categoriza → arma Markdown con frontmatter
        → commit a GitHub (news-today/src/content/articles/) → Cloudflare Pages redespliega solo
```

El slug de cada artículo se deriva de un hash del link original, así que es estable entre corridas: si el pipeline vuelve a ver la misma noticia, el commit a GitHub falla porque el archivo ya existe (`continueOnFail` en ese nodo evita que eso corte el resto del batch) — es el mecanismo de deduplicación.

TTS, video corto y publicación en redes sociales quedan para una fase 2, una vez que este flujo esté probado y estable.

## Cómo importarlo

1. En tu instancia de n8n: **Workflows → Import from File** → seleccioná `news-today-pipeline.json`.
2. Configurá las credenciales que pide cada nodo (ver tabla abajo).
3. Ajustá los nodos marcados como "plantilla" (búsqueda de noticias, servicio de video) según lo que prefieras usar.
4. Activá el workflow.

## Dónde corre n8n

VM `n8n-news-today` (Compute Engine, `e2-small`, Debian) en el proyecto GCP `news-today-pipeline`, con n8n + Postgres vía Docker Compose. Sin IP pública — el acceso es por túnel IAP (`gcloud compute start-iap-tunnel n8n-news-today 5678 --local-host-port=localhost:5678 --project=news-today-pipeline --zone=us-central1-a`), nunca expuesto directo a internet.

## Credenciales necesarias (fase 1)

| Nodo | Servicio | Notas |
|---|---|---|
| Claude: resumir y traducir | Anthropic API | API key propia, modelo `claude-sonnet-4-6` sugerido por costo/calidad |
| Publicar en GitHub | GitHub | Token con permiso `repo` sobre `news-today` |

## Credenciales de fase 2 (pendiente)

| Nodo | Servicio | Notas |
|---|---|---|
| Generar audio (TTS) | ElevenLabs o Google Cloud TTS | Con GCP ya disponible, Google Cloud Text-to-Speech es la opción más directa (misma cuenta de facturación) |
| Generar video corto | Creatomate / Shotstack / ffmpeg propio | Cualquiera con API de renderizado por template; para control total, un servicio propio en Cloud Run con ffmpeg |
| Publicar en redes | Twitter/X, LinkedIn, Meta, etc. | Un nodo por red social — n8n trae nodos nativos para varias |

## Despliegue del sitio (Cloudflare Pages)

1. Conectá el repo `news-today` a Cloudflare Pages (Dashboard → Workers & Pages → Create → Pages → Connect to Git).
2. Build command: `npm run build` — Output directory: `dist`.
3. En **Custom domains**, agregá `news-today.app` (y `www.news-today.app` si querés el subdominio) y seguí las instrucciones de DNS que te da Cloudflare.
4. Cada commit que el nodo de GitHub haga a `main` dispara un redespliegue automático — no hace falta tocar nada más.

## Por qué esta arquitectura

- El sitio (Astro) es estático — rápido, barato de hostear, sin backend que mantener.
- n8n hace de orquestador central: es donde vivís vos para monitorear, pausar, o ajustar el pipeline sin tocar código.
- Claude solo se llama para la parte de lenguaje (resumir/traducir/redactar) — el resto son integraciones directas por HTTP.
- Cada pieza (búsqueda de noticias, TTS, video, redes) es reemplazable de forma independiente sin rearmar el resto del flujo.
