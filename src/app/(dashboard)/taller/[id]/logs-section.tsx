'use client';

import { useState } from 'react';
import { addBoardLog } from '@/actions/taller';
import { toast } from 'sonner';
import type { BoardLog, LogKind } from '@/lib/supabase/types';
import { formatDate } from '@/lib/utils';
import { FileText, Plus, Loader2, Gauge, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  boardId: string;
  logs: BoardLog[];
}

const kindBadges: Record<LogKind, { label: string; icon: any; className: string }> = {
  NOTA_TECNICA: { label: 'Nota', icon: FileText, className: 'text-indigo-400 bg-indigo-500/10' },
  MEDICION: { label: 'Medición', icon: Gauge, className: 'text-cyan-400 bg-cyan-500/10' },
  CAMBIO_ESTADO: { label: 'Fase', icon: RefreshCw, className: 'text-emerald-400 bg-emerald-500/10' },
  ALERTA: { label: 'Alerta', icon: AlertTriangle, className: 'text-amber-400 bg-amber-500/10' },
};

export function BoardLogsSection({ boardId, logs }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<LogKind>('NOTA_TECNICA');
  const [body, setBody] = useState('');
  const [point, setPoint] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('V');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const measurement =
      kind === 'MEDICION' && point && value
        ? {
            point,
            value: parseFloat(value),
            unit,
          }
        : null;

    const res = await addBoardLog({
      boardId,
      kind,
      body,
      measurement,
    });

    setLoading(false);

    if (res.success) {
      toast.success('Entrada guardada en la bitácora');
      setBody('');
      setPoint('');
      setValue('');
      setShowAdd(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-400" />
          <span>Bitácora Técnica ({logs.length})</span>
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showAdd ? 'Cerrar' : 'Agregar Entrada'}</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex gap-2">
            {(['NOTA_TECNICA', 'MEDICION', 'ALERTA'] as LogKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  kind === k
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {kindBadges[k].label}
              </button>
            ))}
          </div>

          <div>
            <textarea
              required
              rows={2}
              placeholder="Descripción del trabajo realizado o síntoma..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {kind === 'MEDICION' && (
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Punto (TP3, VCC)"
                value={point}
                onChange={(e) => setPoint(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
              <input
                type="number"
                step="any"
                placeholder="Valor (3.3)"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
              <input
                type="text"
                placeholder="Unidad (V, Ohm, Hz)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Registrar Bitácora</span>
            </button>
          </div>
        </form>
      )}

      {/* Logs List */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">
            No hay anotaciones técnicas en la bitácora todavía.
          </p>
        ) : (
          logs.map((log) => {
            const badge = kindBadges[log.kind] || kindBadges.NOTA_TECNICA;
            const Icon = badge.icon;
            const measurement = log.measurement as { point?: string; value?: number; unit?: string } | null;

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${badge.className}`}>
                    <Icon className="h-3 w-3" />
                    <span>{badge.label}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{formatDate(log.created_at)}</span>
                </div>

                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{log.body}</p>

                {measurement && measurement.point && (
                  <div className="mt-1 p-2 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 font-mono text-[11px] flex items-center justify-between">
                    <span>Punto de prueba: {measurement.point}</span>
                    <span className="font-bold">
                      {measurement.value} {measurement.unit}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
