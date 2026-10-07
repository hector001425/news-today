// Toma la respuesta de Claude para ESTE item y la combina con los datos
// originales del item equivalente en 'Extraer items del RSS' (título real,
// link fuente, slug estable) para armar el .md final con frontmatter.

function extractJson(text) {
  let t = text.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

const claudeText = $input.item.json.content[0].text;
const parsed = extractJson(claudeText);

// Si Claude devuelve una categoría fuera del esquema, Astro rechaza el build
// completo del sitio (pasó el 2026-09-23 con "educacion"). Se normaliza aquí.
const VALID_CATEGORIES = ['modelos', 'negocios', 'investigacion', 'politica', 'producto', 'tecnologia', 'educacion'];
const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'tecnologia';
// Los valores vienen del RSS y de Claude (no confiables): JSON.stringify da un
// string YAML válido con comillas, backslashes y saltos de línea escapados.
const yaml = (v) => JSON.stringify(String(v ?? '').replace(/[\r\n]+/g, ' ').trim());
const orig = $('Extraer items del RSS').item.json;

const frontmatter = `---
title: ${yaml(parsed.title)}
dek: ${yaml(parsed.dek)}
category: ${yaml(category)}
source_name: ${yaml(orig.sourceName)}
source_url: ${yaml(orig.link)}
published_at: ${new Date().toISOString()}
breaking: ${parsed.breaking === true}
generated_by: "pipeline"
---

${parsed.body_markdown}
`;

return { json: { slug: orig.slug, filename: `src/content/articles/${orig.slug}.md`, content: frontmatter, title: parsed.title, dek: parsed.dek } };
