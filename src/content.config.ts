import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),
    category: z.enum(['modelos', 'negocios', 'investigacion', 'politica', 'producto', 'tecnologia', 'educacion']),
    source_name: z.string(),
    source_url: z.string().url().refine(isHttpUrl, 'source_url debe ser http(s)'),
    published_at: z.date(),
    breaking: z.boolean().default(false),
    generated_by: z.enum(['pipeline', 'manual']).default('manual'),
    video_url: z.string().url().refine(isHttpsUrl, 'video_url debe ser https').optional(),
  }),
});

export const collections = { articles };
