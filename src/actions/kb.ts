'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { createKbArticleSchema, updateKbArticleSchema } from '@/lib/validators/kb';
import type { ActionResult } from '@/lib/types';

export async function createKbArticle(
  input: unknown
): Promise<ActionResult<{ slug: string }>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = createKbArticleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('kb_articles').insert({
    title: parsed.data.title,
    slug: parsed.data.slug,
    body_md: parsed.data.bodyMd,
    tags: parsed.data.tags,
    is_published: parsed.data.isPublished,
    author_id: me.id,
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes('unique')
        ? 'El slug ya está en uso'
        : 'Error al crear el artículo',
    };
  }

  revalidatePath('/kb');
  return { success: true, data: { slug: parsed.data.slug } };
}

export async function updateKbArticle(
  input: unknown
): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = updateKbArticleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('kb_articles')
    .update({
      title: parsed.data.title,
      body_md: parsed.data.bodyMd,
      tags: parsed.data.tags,
      is_published: parsed.data.isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.articleId);

  if (error) {
    return { success: false, error: 'Error al actualizar el artículo' };
  }

  revalidatePath('/kb');
  return { success: true, data: null };
}

export async function incrementArticleViews(articleId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('increment_view_count', { p_article_id: articleId });
}
