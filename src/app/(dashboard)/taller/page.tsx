import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Cpu, Plus, ArrowRight, Activity, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { BoardStatus, RepairStep } from '@/lib/supabase/types';

const statusLabels: Record<BoardStatus, { label: string; className: string }> = {
  EN_LABORATORIO: { label: 'En Laboratorio', className: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
  EN_REPARACION: { label: 'En Reparación', className: 'bg-neon-blue/10 text-neon-blue border-neon-blue/20' },
  REPARADA: { label: 'Reparada (Pruebas OK)', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ENTREGADA: { label: 'Entregada', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
};

const stepLabels: Record<RepairStep, string> = {
  DIAGNOSTICO: '1. Diagnóstico',
  REPARACION: '2. Reparación',
  PRUEBAS: '3. Pruebas',
  ENTREGA: '4. Entrega',
};

export default async function TallerPage() {
  await requireRole(['ADMIN_TI']);
  const supabase = await createClient();

  const { data: boards } = await supabase
    .from('boards')
    .select('id, serial, model, owner_name, status, current_step, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-neon-blue" />
            Taller de Tarjetas Electrónicas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pipeline de laboratorio: Diagnóstico, Reparación, Pruebas y Entrega
          </p>
        </div>

        <Link
          href="/taller/nueva"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 text-neon-blue font-medium text-sm transition-all shadow-lg shadow-neon-blue/5 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Ingresar Tarjeta</span>
        </Link>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {boards && boards.length === 0 && (
          <div className="col-span-full glass-card rounded-2xl p-12 text-center">
            <Cpu className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No hay tarjetas registradas</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Registra una nueva tarjeta para generar automáticamente el correlativo TRJ-YYYY-NNN y controlar su ciclo de vida.
            </p>
          </div>
        )}

        {boards &&
          boards.map((b) => {
            const status = statusLabels[b.status] || {
              label: b.status,
              className: 'bg-slate-800 text-slate-300',
            };

            return (
              <Link
                key={b.id}
                href={`/taller/${b.id}`}
                className="group glass-card rounded-2xl hover:border-neon-blue/30 p-6 flex flex-col justify-between transition-all shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-neon-blue bg-neon-blue/10 px-2.5 py-1 rounded-lg border border-neon-blue/20">
                      {b.serial}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-neon-blue transition-colors">
                      {b.model}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Cliente/Propietario: <span className="text-slate-300 font-medium">{b.owner_name || 'Interno'}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-elevated border border-white/5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-neon-blue" /> Paso actual
                      </span>
                      <span className="text-neon-blue font-semibold">
                        {b.current_step ? stepLabels[b.current_step] : 'Por Iniciar'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(b.created_at)}</span>
                  </div>
                  <span className="text-neon-blue flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
                    Ver ficha <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
