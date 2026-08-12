import { defineConfig } from 'astro/config';
import rehypeSanitize from 'rehype-sanitize';

export default defineConfig({
  site: 'https://news-today.app',
  output: 'static',
  markdown: {
    // Los artículos se generan a partir de feeds RSS externos no confiables,
    // resumidos por un LLM: sanitizamos el HTML embebido en el Markdown antes
    // de publicarlo para evitar inyección de <script>/<iframe>/handlers on*.
    rehypePlugins: [rehypeSanitize],
  },
});
