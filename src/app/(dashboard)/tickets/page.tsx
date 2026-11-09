import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Ticket, Plus, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { TicketStatus, TicketPriority } from '@/lib/supabase/types';

const statusBadges: Record<TicketStatus, { label: string; className: string }> = {
  ABIERTO: { label: 'Abierto', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  EN_PROGRESO: { label: 'En Progreso', className: 'bg-neon-blue/10 text-neon-blue border-neon-blue/20' },
  EN_ESPERA: { label: 'En Espera', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  RESUELTO: { label: 'Resuelto', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  CERRADO: { label: 'Cerrado', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const priorityBadges: Record<TicketPriority, { label: string; className: string }> = {
  BAJA: { label: 'Baja', className: 'text-slate-400' },
  MEDIA: { label: 'Media', className: 'text-neon-blue' },
  ALTA: { label: 'Alta', className: 'text-amber-400 font-semibold' },
  CRITICA: { label: 'Crítica', className: 'text-red-400 font-bold' },
};

export default async function TicketsPage() {
  const profile = await requireAuth();
  const supabase = await createClient();

  // Columnas explícitas según principio 9 de arquitectura
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, title, status, priority, created_at, requester_id, assignee_id')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Ticket className="h-6 w-6 text-neon-blue" />
            Mesa de Ayuda
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {profile.role === 'ADMIN_TI'
              ? 'Todos los requerimientos e incidencias registradas en TI'
              : 'Tus tickets de soporte e incidencias técnicas'}
          </p>
        </div>

        <Link
          href="/tickets/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 text-neon-blue font-medium text-sm transition-all shadow-lg shadow-neon-blue/5 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Ticket</span>
        </Link>
      </div>

      {/* Tickets List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {error && (
          <div className="p-6 text-center text-sm text-red-400 flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Error al conectar con la base de datos de tickets: {error.message}</span>
          </div>
        )}

        {tickets && tickets.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-bg-elevated border border-white/10 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Ticket className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No hay tickets registrados</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Crea tu primer ticket de soporte para que el equipo de soporte técnico lo atienda.
            </p>
            <div className="mt-5">
              <Link
                href="/tickets/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-slate-200 text-xs font-medium border border-white/10 hover:border-neon-blue/30 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Crear Ticket Ahora</span>
              </Link>
            </div>
          </div>
        )}

        {tickets && tickets.length > 0 && (
          <div className="divide-y divide-white/5">
            {tickets.map((ticket) => {
              const status = statusBadges[ticket.status] || {
                label: ticket.status,
                className: 'bg-slate-800 text-slate-300',
              };
              const priority = priorityBadges[ticket.priority] || {
                label: ticket.priority,
                className: 'text-slate-300',
              };

              return (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-neon-blue/5 transition-colors block"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-slate-500">&bull;</span>
                      <span className={`text-xs ${priority.className}`}>
                        Prioridad {priority.label}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-100 hover:text-neon-blue transition-colors truncate">
                      {ticket.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
