'use client';

import { useState } from 'react';
import { addComment } from '@/actions/tickets';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import type { TicketComment } from '@/lib/supabase/types';
import { MessageSquare, Lock, Send, Loader2 } from 'lucide-react';

interface Props {
  ticketId: string;
  comments: TicketComment[];
  profileMap: Record<string, { full_name: string; username: string }>;
  currentUserId: string;
  isAdmin: boolean;
}

export function TicketCommentsSection({
  ticketId,
  comments,
  profileMap,
  currentUserId,
  isAdmin,
}: Props) {
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    const res = await addComment({
      ticketId,
      body,
      isInternal,
    });
    setLoading(false);

    if (res.success) {
      setBody('');
      setIsInternal(false);
      toast.success('Comentario agregado');
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-neon-blue" />
          <span>Conversación y Seguimiento ({comments.length})</span>
        </h3>

        {/* Comment Thread */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No hay mensajes o notas registradas aún.
            </p>
          ) : (
            comments.map((comment) => {
              const author = profileMap[comment.author_id];
              const isMine = comment.author_id === currentUserId;

              return (
                <div
                  key={comment.id}
                  className={`p-4 rounded-xl border transition-all ${
                    comment.is_internal
                      ? 'bg-amber-950/20 border-amber-800/40'
                      : isMine
                      ? 'bg-neon-blue/5 border-neon-blue/20'
                      : 'bg-bg-elevated border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        {author ? author.full_name : 'Usuario'}
                      </span>
                      {comment.is_internal && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Lock className="h-2.5 w-2.5" /> Nota Interna TI
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* New Comment Box */}
        <form onSubmit={handleSubmit} className="pt-4 border-t border-white/5 space-y-3">
          <textarea
            rows={3}
            required
            placeholder="Escribe una respuesta o nota sobre este requerimiento..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue resize-y transition-all"
          />

          <div className="flex items-center justify-between">
            {isAdmin ? (
              <label className="flex items-center gap-2 text-xs text-amber-400 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-white/20 bg-bg-elevated text-neon-blue focus:ring-neon-blue"
                />
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Marcar como nota interna (oculta al solicitante)
                </span>
              </label>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 text-neon-blue font-medium text-xs transition-all shadow-md shadow-neon-blue/5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Responder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
