---
title: "[Ejemplo] Cómo se ve un artículo generado por el pipeline"
dek: "Este es contenido de muestra para probar el diseño del sitio. Reemplazar cuando el flujo de n8n empiece a publicar artículos reales."
category: "producto"
source_name: "Contenido de ejemplo"
source_url: "https://example.com"
published_at: 2026-08-08T09:00:00Z
breaking: true
generated_by: "manual"
---

Este artículo es un **marcador de posición**. Sirve para verificar que el diseño del sitio (ticker, tarjetas, página de artículo) funciona correctamente antes de conectar el pipeline automatizado.

Cuando el flujo de n8n esté activo, cada ejecución debería:

1. Buscar noticias recientes de IA (vía API de noticias o RSS).
2. Enviarlas a Claude para resumir y traducir al español manteniendo precisión factual.
3. Generar un archivo `.md` como este, con el frontmatter completo.
4. Hacer commit al repositorio (o publicarlo vía API de un headless CMS).

Ver `/n8n/README.md` para el detalle del flujo.
