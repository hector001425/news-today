import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const base = site?.href.replace(/\/$/, '') ?? 'https://news-today.app';
  const articles = (await getCollection('articles')).sort(
    (a, b) => b.data.published_at.valueOf() - a.data.published_at.valueOf()
  );

  const items = articles
    .slice(0, 50)
    .map((article) => {
      const url = `${base}/articulos/${article.id}/`;
      return `  <item>
    <title>${escapeXml(article.data.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description>${escapeXml(article.data.dek)}</description>
    <pubDate>${article.data.published_at.toUTCString()}</pubDate>
  </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>News Today</title>
  <link>${base}/</link>
  <description>Noticias de inteligencia artificial en español, generadas y curadas de forma automatizada.</description>
  <language>es</language>
${items}
</channel>
</rss>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
