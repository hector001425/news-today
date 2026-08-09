import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    dek: z.string(),
    category: z.enum(['modelos', 'negocios', 'investigacion', 'politica', 'producto']),
    source_name: z.string(),
    source_url: z.string().url(),
    published_at: z.date(),
    breaking: z.boolean().default(false),
    generated_by: z.enum(['pipeline', 'manual']).default('manual'),
  }),
});

export const collections = { articles };
