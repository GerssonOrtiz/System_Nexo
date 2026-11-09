'use client';

import { useState } from 'react';
import { updateTicketStatus } from '@/actions/tickets';
import { toast } from 'sonner';
import type { TicketStatus } from '@/lib/supabase/types';
import { Loader2 } from 'lucide-react';

interface Props {
  ticketId: string;
  currentStatus: TicketStatus;
  isAdmin: boolean;
}

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: 'ABIERTO', label: 'Abierto' },
  { value: 'EN_PROGRESO', label: 'En Progreso' },
  { value: 'EN_ESPERA', label: 'En Espera' },
  { value: 'RESUELTO', label: 'Resuelto' },
  { value: 'CERRADO', label: 'Cerrado' },
];

export function TicketStatusManager({ ticketId, currentStatus, isAdmin }: Props) {
  const [status, setStatus] = useState<TicketStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(nextStatus: TicketStatus) {
    if (!isAdmin) return;
    setLoading(true);
    setStatus(nextStatus);

    const res = await updateTicketStatus({
      ticketId,
      status: nextStatus,
    });

    setLoading(false);

    if (res.success) {
      toast.success('Estado del ticket actualizado');
    } else {
      setStatus(currentStatus);
      toast.error(res.error);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Estado:</span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-bg-elevated text-slate-200 border border-white/10">
          {statusOptions.find((s) => s.value === status)?.label ?? status}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <label className="text-xs font-medium text-slate-400">Estado:</label>
      <div className="relative">
        <select
          disabled={loading}
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
          className="px-3 py-1.5 bg-bg-elevated border border-white/10 rounded-xl text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:opacity-50"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-bg-elevated text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        {loading && (
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <Loader2 className="h-3 w-3 animate-spin text-neon-blue" />
          </div>
        )}
      </div>
    </div>
  );
}
