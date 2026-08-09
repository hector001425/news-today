# News Today

Sitio de noticias de inteligencia artificial en español — con un pipeline automatizado (n8n + Claude) que busca, resume, traduce y publica noticias, y genera audio/video para redes sociales.

Dominio: **news-today.app**

## Arquitectura general

```
n8n (orquestador, corriendo en GCP)
  │
  ├─ busca noticias de IA (RSS / News API)
  ├─ Claude resume y traduce al español
  ├─ commit del artículo → repo GitHub → Cloudflare Pages redespliega
  ├─ genera audio (TTS)
  ├─ genera video corto vertical (para redes)
  └─ publica en redes sociales
```

El detalle completo del pipeline está en [`n8n/README.md`](n8n/README.md) y la plantilla importable en [`n8n/news-today-pipeline.json`](n8n/news-today-pipeline.json).

## El sitio (este repo)

Construido con [Astro](https://astro.build/) — genera HTML estático, muy rápido, y cada artículo es un archivo Markdown en `src/content/articles/`.

### Desarrollo local

```bash
npm install
npm run dev
```

### Estructura

```
news-today/
├── src/
│   ├── content/articles/   # cada noticia es un .md con frontmatter
│   ├── content/config.ts   # esquema de datos del artículo (validado)
│   ├── layouts/Layout.astro
│   ├── pages/index.astro   # portada: ticker + grilla de artículos
│   ├── pages/articulos/[slug].astro
│   └── styles/global.css
├── n8n/                     # pipeline de automatización
│   ├── news-today-pipeline.json
│   └── README.md
├── public/
└── docs/
```

### Agregar un artículo manualmente

Creá un archivo en `src/content/articles/mi-articulo.md`:

```markdown
---
title: "Titular de la noticia"
dek: "Bajada de una o dos líneas"
category: "modelos"   # modelos | negocios | investigacion | politica | producto
source_name: "Nombre de la fuente"
source_url: "https://..."
published_at: 2026-08-08T10:00:00Z
breaking: false
generated_by: "manual"
---

Cuerpo del artículo en Markdown.
```

Los dos archivos en `src/content/articles/ejemplo-*.md` son de muestra — borralos cuando el pipeline empiece a publicar contenido real.

## Despliegue

Pensado para **Cloudflare Pages** (build: `npm run build`, output: `dist`), con el dominio propio `news-today.app` conectado como Custom Domain — ver instrucciones paso a paso en `n8n/README.md`. También podés usar Vercel o GitHub Pages sin cambios, ya que es un sitio estático estándar.

## Diseño

Identidad tipo "cable de noticias" (wire service): ticker de titulares en vivo, tipografía serif editorial (Newsreader) para titulares + mono (IBM Plex Mono) para metadatos, sobre fondo papel con acento cobalto. El signo distintivo es el ticker de titulares en la parte superior, que refleja las noticias más recientes reales del sitio.

## Licencia

MIT — ver [LICENSE](LICENSE).
