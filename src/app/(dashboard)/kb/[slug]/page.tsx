import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { BookOpen, ArrowLeft, Eye, Clock, Tag, User } from 'lucide-react';
import { incrementArticleViews } from '@/actions/kb';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function KbArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await requireAuth();
  const supabase = await createClient();

  // RLS garantiza que si no es admin, solo devuelve publicados
  const { data: article, error } = await supabase
    .from('kb_articles')
    .select('id, slug, title, body_md, tags, is_published, view_count, author_id, created_at, updated_at')
    .eq('slug', slug)
    .single();

  if (error || !article) {
    notFound();
  }

  // Incremento atómico no bloqueante
  incrementArticleViews(article.id).catch(() => {});

  const { data: author } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', article.author_id)
    .single();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/kb"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver a Base de Conocimiento</span>
      </Link>

      <article className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 sm:p-10 space-y-6 shadow-xl">
        <div className="space-y-3 pb-6 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20"
              >
                #{tag}
              </span>
            ))}
            {!article.is_published && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Borrador Interno
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span>Por {author?.full_name || 'Técnico TI'}</span>
            </div>
            <span>&bull;</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>{formatDate(article.created_at)}</span>
            </div>
            <span>&bull;</span>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>{article.view_count + 1} lecturas</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
          {article.body_md}
        </div>
      </article>
    </div>
  );
}
