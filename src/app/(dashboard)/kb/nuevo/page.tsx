'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createKbArticle } from '@/actions/kb';
import { toast } from 'sonner';
import { BookOpen, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewKbArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [bodyMd, setBodyMd] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  function handleTitleChange(val: string) {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const tags = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const res = await createKbArticle({
      title,
      slug,
      bodyMd,
      tags,
      isPublished,
    });

    setLoading(false);

    if (res.success) {
      toast.success('Artículo publicado en la Base de Conocimiento');
      router.push(`/kb/${res.data.slug}`);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/kb"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver a Base de Conocimiento</span>
      </Link>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Nuevo Artículo Técnico</h1>
            <p className="text-xs text-slate-400">Publica guías, diagramas y resoluciones frecuentes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Título del artículo
            </label>
            <input
              type="text"
              required
              placeholder="ej. Procedimiento de calibración de fuentes conmutadas"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Slug URL
            </label>
            <input
              type="text"
              required
              placeholder="procedimiento-calibracion-fuentes"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-indigo-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Etiquetas (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="hardware, calibracion, fuentes, plc"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Contenido (Markdown)
            </label>
            <textarea
              required
              rows={10}
              placeholder="Escribe el artículo con formato Markdown..."
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Publicar inmediatamente (visible para solicitantes)</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Publicar Artículo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
