import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookOpen, Plus, Eye, Clock, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function KbPage() {
  const profile = await requireAuth();
  const supabase = await createClient();

  // Columnas explícitas, RLS filtra si no es admin
  const { data: articles } = await supabase
    .from('kb_articles')
    .select('id, slug, title, tags, is_published, view_count, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            Base de Conocimiento
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manuales, procedimientos técnicos y guías de solución de incidencias
          </p>
        </div>

        {profile.role === 'ADMIN_TI' && (
          <Link
            href="/kb/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 self-start"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Artículo</span>
          </Link>
        )}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles && articles.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <BookOpen className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No hay artículos publicados</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Los artículos de solución técnica creados por el equipo aparecerán aquí.
            </p>
          </div>
        )}

        {articles &&
          articles.map((art) => (
            <Link
              key={art.id}
              href={`/kb/${art.slug}`}
              className="group rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 backdrop-blur-sm p-6 flex flex-col justify-between transition-all hover:border-slate-700 shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {art.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {!art.is_published && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Borrador
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                  {art.title}
                </h3>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{art.view_count} vistas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDate(art.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
