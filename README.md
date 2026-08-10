# News Today

Sitio de noticias de inteligencia artificial en español — con un pipeline automatizado (n8n + Claude) que busca, resume, traduce y publica noticias, y genera audio/video para redes sociales.

Dominio: **news-today.app**

## Estado actual (roadmap)

### ✅ Fase 1 — Pipeline base (en producción)
Búsqueda de noticias (Google News RSS, IA/LLM/data/tecnología) → Claude resume, traduce y categoriza → commit automático a GitHub → Cloudflare Pages redespliega el sitio solo. Corre cada 2h sin intervención (schedule trigger activo en n8n).

### ✅ Fase 2 — Audio y video (en producción)
Cada artículo genera su narración en español con **Google Cloud TTS** (voz neural `es-US-Neural2-B`) y un reel vertical 9:16 con **Creatomate** (template "News Today - Reel vertical": titular + bajada + audio), commiteados y renderizados automáticamente.

- Limitación actual: resolución 270×480 por el plan gratis de Creatomate — pasar a un plan pago para 1080×1920 real.
- Los commits de audio pueden fallar ocasionalmente por colisiones de escritura en GitHub cuando el pipeline procesa varios artículos casi al mismo tiempo; no rompe el pipeline (`continueOnFail`), simplemente ese video no se genera ese ciclo.

### ⏳ Fase 3 — Publicación automática en redes sociales (pendiente)
Objetivo: que el pipeline publique el video generado solo, en el momento en que se crea, en X/Twitter, Instagram y/o TikTok.

**División del trabajo — esto es importante:** por política de seguridad, Claude no puede crear cuentas ni completar registros (ni con permiso explícito). La creación de cuentas y apps de desarrollador la tiene que hacer el dueño del proyecto; conectar esas credenciales al pipeline y programar los nodos de publicación sí lo puede hacer Claude.

| Paso | Quién |
|---|---|
| Crear la cuenta de marca en cada red social | Vos |
| Registrar la cuenta como developer app en la plataforma (para conseguir API access) | Vos |
| Pasar por el proceso de revisión/aprobación de cada plataforma (puede tardar días) | Vos |
| Conectar las credenciales OAuth resultantes en n8n | Claude (con tu ayuda para el paso de login en el navegador) |
| Agregar los nodos de publicación al pipeline y probarlos | Claude |

**Qué necesita cada red social:**

- **X (Twitter)**: cuenta de marca en x.com + cuenta de developer en [developer.x.com](https://developer.x.com) con acceso a la API v2. El tier **Free** de X API es de solo lectura muy limitada — para publicar posts con video hace falta como mínimo el tier **Basic** (de pago, ronda los ~$200 USD/mes a la fecha de escribir esto, confirmar precio vigente).
- **Instagram**: cuenta de **Instagram Business** (no personal) vinculada a una **Página de Facebook**. Se conecta vía Meta for Developers, creando una app con el permiso `instagram_content_publish`. Meta revisa la app antes de habilitar publicación real (App Review), puede tardar.
- **TikTok**: cuenta de TikTok + registro en [TikTok for Developers](https://developers.tiktok.com), Content Posting API. Requiere aprobación de cuenta de negocio, es el proceso más restrictivo de los tres.

Cuando tengas al menos una de estas cuentas + su app de developer aprobada, pasame las credenciales (directo en n8n, como hicimos con las anteriores) y armo el nodo de publicación correspondiente.

## Arquitectura general

```
n8n (orquestador, corriendo en GCP — VM n8n-news-today, proyecto news-today-pipeline)
  │
  ├─ busca noticias (Google News RSS: IA / LLM / data / tecnología)
  ├─ Claude resume, traduce y categoriza
  ├─ commit del artículo → repo GitHub (público) → Cloudflare Pages redespliega
  ├─ genera audio narrado (Google Cloud TTS) → commit a GitHub
  ├─ genera video corto vertical (Creatomate)
  └─ publica en redes sociales          ⏳ fase 3, pendiente
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
├── public/
│   └── audio/               # narraciones .mp3 generadas por el pipeline (TTS)
├── n8n/                     # pipeline de automatización
│   ├── news-today-pipeline.json
│   └── README.md
└── docs/
```

### Agregar un artículo manualmente

Creá un archivo en `src/content/articles/mi-articulo.md`:

```markdown
---
title: "Titular de la noticia"
dek: "Bajada de una o dos líneas"
category: "modelos"   # modelos | negocios | investigacion | politica | producto | tecnologia
source_name: "Nombre de la fuente"
source_url: "https://..."
published_at: 2026-08-08T10:00:00Z
breaking: false
generated_by: "manual"
---

Cuerpo del artículo en Markdown.
```

**Importante:** `published_at` va sin comillas — con comillas queda como string en vez de fecha nativa de YAML y rompe el build (`InvalidContentEntryFrontmatterError`, ya nos pasó una vez con el pipeline).

## Despliegue

Pensado para **Cloudflare Pages** (build: `npm run build`, output: `dist`), con el dominio propio `news-today.app` conectado como Custom Domain — ver instrucciones paso a paso en `n8n/README.md`. También podés usar Vercel o GitHub Pages sin cambios, ya que es un sitio estático estándar.

## Diseño

Identidad tipo "cable de noticias" (wire service): ticker de titulares en vivo, tipografía serif editorial (Newsreader) para titulares + mono (IBM Plex Mono) para metadatos, sobre fondo papel con acento cobalto. El signo distintivo es el ticker de titulares en la parte superior, que refleja las noticias más recientes reales del sitio.

## Licencia

MIT — ver [LICENSE](LICENSE).

---
_Desplegado en Cloudflare Pages con auto-deploy desde GitHub._
