import { z } from 'zod';

export const createKbArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  slug: z
    .string()
    .trim()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  bodyMd: z
    .string()
    .trim()
    .min(10, 'El contenido debe tener al menos 10 caracteres'),
  tags: z.array(z.string().trim()).default([]),
  isPublished: z.boolean().default(false),
});

export const updateKbArticleSchema = z.object({
  articleId: z.string().uuid(),
  title: z.string().trim().min(3).max(200),
  bodyMd: z.string().trim().min(10),
  tags: z.array(z.string().trim()).default([]),
  isPublished: z.boolean(),
});

export type CreateKbArticleInput = z.infer<typeof createKbArticleSchema>;
export type UpdateKbArticleInput = z.infer<typeof updateKbArticleSchema>;
