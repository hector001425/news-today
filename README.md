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

## Widget de Mercados (sidebar)

Sidebar (`src/components/MarketsWidget.astro`) con índices, materias primas y un bloque de "Pronóstico IA", inspirado en los resúmenes de mercado tipo Google Finance/Gmail. Aparece en la portada y en cada artículo.

Hoy lee `src/content/markets.json`, que se commitea con `"example": true` y valores de muestra — el widget lo muestra con un aviso de "vista previa" para no hacer pasar datos viejos por datos en vivo. Para que sea en vivo, sin tocar el CSP (`connect-src 'self'` bloquea fetch a APIs externas desde el navegador a propósito, igual que con los artículos):

1. Agregar un nodo al workflow de n8n (mismo patrón que la búsqueda de noticias) que consulte una API de mercados cada X minutos (ej. [Twelve Data](https://twelvedata.com/), [Alpha Vantage](https://www.alphavantage.co/) o [Stooq](https://stooq.com/db/h/), todas con plan gratis con límites).
2. Un nodo Claude (igual que redacta los artículos) que tome esos números y escriba 1-2 frases de "pronóstico" — dejar claro en el prompt que es *comentario editorial generado por IA*, no asesoría financiera ni una orden de trading.
3. Un nodo que commitee el resultado a `src/content/markets.json` (mismo formato: `items[]`, `ai_forecast`, `updated_at`) con `"example": false`, vía la API de contenidos de GitHub (igual que hace con `public/audio/*.mp3`).
4. Cloudflare Pages redespliega solo con cada commit, como con los artículos.

**Sobre "IA que haga trading":** el pipeline puede generar comentario/pronóstico de mercado sin problema (paso de arriba). Una IA que *ejecute* operaciones reales es un proyecto aparte — necesita cuenta de broker con API (ej. Alpaca, Interactive Brokers), gestión de riesgo, y activarla implica responsabilidad legal/financiera real. No está incluido acá; avisar si se quiere explorar eso puntualmente.

## Video en los artículos

`content.config.ts` ya acepta un campo opcional `video_url` en el frontmatter de cada artículo; si está presente, la página del artículo lo renderiza en un `<video>` arriba del cuerpo. Hoy ningún artículo lo tiene: el pipeline genera el reel vertical con Creatomate (ver `n8n/README.md`) pero nunca guarda esa URL en el repo, solo la usa para la fase 3 (redes sociales, pendiente).

Para mostrarlo en el sitio: agregar un nodo al pipeline que, después de que Creatomate termine el render, guarde la URL resultante (o el archivo `.mp4`, como ya se hace con el audio) y la escriba en el frontmatter del artículo como `video_url`. Importante: si el video queda en un dominio externo (CDN de Creatomate, YouTube, etc.), hay que sumar ese origen a `media-src` en `public/_headers` — el CSP actual (`default-src 'self'`) lo bloquearía. Si en cambio se sube el `.mp4` a `public/`, funciona sin tocar el CSP, igual que el audio.

## SEO e indexación

Ya en el repo: `robots.txt` + `sitemap.xml` (con `lastmod` por artículo), `rss.xml`, meta `description`, Open Graph, Twitter Card, `<link rel="canonical">` y JSON-LD (`WebSite`/`Organization` en todo el sitio, `NewsArticle` en cada nota).

Pasos para indexar el sitio (una sola vez, salvo que se aclare lo contrario):

1. **Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console)) → alta de propiedad `https://news-today.app` (verificación por DNS TXT o meta tag) → Sitemaps → enviar `https://news-today.app/sitemap.xml`.
2. **Bing Webmaster Tools** ([bing.com/webmasters](https://www.bing.com/webmasters)) → mismo alta + sitemap (podés importar directo desde Search Console). Cubre también Yahoo y el buscador de Copilot/Bing Chat.
3. **Indexación manual de URLs nuevas/urgentes**: en Search Console, "Inspección de URLs" → pegar la URL del artículo → "Solicitar indexación". Sirve para acelerar notas de último momento, no hace falta para cada artículo.
4. **Validar structured data**: pasar una URL de artículo por el [Rich Results Test](https://search.google.com/test/rich-results) de Google para confirmar que el `NewsArticle` JSON-LD se lee bien.
5. **Core Web Vitals / rendimiento**: correr el sitio por [PageSpeed Insights](https://pagespeed.web.dev/) — el sitio es Astro estático así que debería salir bien, pero conviene chequear después de sumar el sidebar de mercados (imágenes/fuentes nuevas pueden pesar).
6. **Google News** (más adelante, opcional): para aparecer en Google News hace falta más que el sitemap — hay que dar de alta el sitio en [Google Publisher Center](https://publishercenter.google.com/) y cumplir sus políticas de contenido (autoría clara, contenido original, etc.). Como todo el contenido acá es generado/traducido por IA a partir de fuentes de terceros, conviene revisar esa política antes de aplicar — Google puede rechazar o penalizar sitios que no dejen claro el origen automatizado.
7. **Seguimiento**: una vez indexado, Search Console muestra clics/impresiones/posición por página — repasarlo cada tanto para ver qué categorías de artículos traen tráfico.

## Despliegue

Pensado para **Cloudflare Pages** (build: `npm run build`, output: `dist`), con el dominio propio `news-today.app` conectado como Custom Domain — ver instrucciones paso a paso en `n8n/README.md`. También podés usar Vercel o GitHub Pages sin cambios, ya que es un sitio estático estándar.

## Diseño

Identidad tipo "cable de noticias" (wire service): ticker de titulares en vivo, tipografía serif editorial (Newsreader) para titulares + mono (IBM Plex Mono) para metadatos, sobre fondo papel con acento cobalto. El signo distintivo es el ticker de titulares en la parte superior, que refleja las noticias más recientes reales del sitio.

## Licencia

MIT — ver [LICENSE](LICENSE).

---
_Desplegado en Cloudflare Pages con auto-deploy desde GitHub._
