import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { TicketCommentsSection } from './comments-section';
import { TicketStatusManager } from './status-manager';
import { ArrowLeft, Clock, User } from 'lucide-react';
import type { TicketStatus } from '@/lib/supabase/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireAuth();
  const supabase = await createClient();

  // Consulta protegida por RLS (Anti-IDOR)
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, title, description, status, priority, created_at, requester_id, assignee_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !ticket) {
    notFound();
  }

  // Cargar comentarios
  const { data: comments } = await supabase
    .from('ticket_comments')
    .select('id, ticket_id, author_id, body, is_internal, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  // Cargar nombres de perfiles involucrados
  const authorIds = Array.from(
    new Set([
      ticket.requester_id,
      ticket.assignee_id,
      ...(comments?.map((c) => c.author_id) ?? []),
    ].filter(Boolean) as string[])
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .in('id', authorIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-neon-blue transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver a la lista de tickets</span>
      </Link>

      {/* Ticket Header & Status Manager */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neon-blue font-semibold bg-neon-blue/10 px-2.5 py-1 rounded-md border border-neon-blue/20">
              Ticket #{ticket.id.slice(0, 8)}
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">{ticket.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>
                  Solicitado por:{' '}
                  <strong className="text-slate-300">
                    {profileMap.get(ticket.requester_id)?.full_name ?? 'Usuario'}
                  </strong>
                </span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>{formatDate(ticket.created_at)}</span>
              </div>
            </div>
          </div>

          <TicketStatusManager
            ticketId={ticket.id}
            currentStatus={ticket.status as TicketStatus}
            isAdmin={profile.role === 'ADMIN_TI'}
          />
        </div>

        {/* Description Body */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Detalle del Requerimiento
          </h3>
          <div className="p-4 rounded-xl bg-bg-elevated border border-white/5 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <TicketCommentsSection
        ticketId={ticket.id}
        comments={comments ?? []}
        profileMap={Object.fromEntries(profileMap)}
        currentUserId={profile.id}
        isAdmin={profile.role === 'ADMIN_TI'}
      />
    </div>
  );
}
