import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),
    category: z.enum(['modelos', 'negocios', 'investigacion', 'politica', 'producto', 'tecnologia']),
    source_name: z.string(),
    source_url: z.string().url(),
    published_at: z.date(),
    breaking: z.boolean().default(false),
    generated_by: z.enum(['pipeline', 'manual']).default('manual'),
  }),
});

export const collections = { articles };
