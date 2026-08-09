# Pipeline de automatización (n8n)

`news-today-pipeline.json` es una plantilla importable en n8n con el flujo completo:

```
Cada 6h → buscar noticias de IA → deduplicar → por cada noticia:
    Claude resume y traduce al español → arma Markdown con frontmatter
        ├─→ commit a GitHub (news-today/src/content/articles/) → Cloudflare Pages redespliega solo
        └─→ genera audio (TTS) → genera video corto vertical → publica en redes sociales
```

## Cómo importarlo

1. En tu instancia de n8n: **Workflows → Import from File** → seleccioná `news-today-pipeline.json`.
2. Configurá las credenciales que pide cada nodo (ver tabla abajo).
3. Ajustá los nodos marcados como "plantilla" (búsqueda de noticias, servicio de video) según lo que prefieras usar.
4. Activá el workflow.

## Dónde correr n8n

Ya tenés GCP — la opción más simple es:

- **Cloud Run**: contenedor oficial `n8nio/n8n`, con una base de datos Postgres en Cloud SQL (o SQLite si es solo para vos y no te importa perder el historial si se reinicia el contenedor).
- Alternativa más simple para empezar: una VM pequeña de Compute Engine con Docker Compose (n8n + Postgres), que es el setup más documentado por la comunidad de n8n.

## Credenciales necesarias

| Nodo | Servicio | Notas |
|---|---|---|
| Claude: resumir y traducir | Anthropic API | API key propia, modelo `claude-sonnet-4-6` sugerido por costo/calidad |
| Publicar en GitHub | GitHub | Token con permiso `repo` sobre `news-today` |
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
