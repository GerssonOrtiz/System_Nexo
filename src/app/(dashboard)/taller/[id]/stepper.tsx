'use client';

import { useState } from 'react';
import { advanceBoardStep } from '@/actions/taller';
import { toast } from 'sonner';
import type { RepairStep, BoardStatus, BoardStep } from '@/lib/supabase/types';
import { ArrowRight, CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Props {
  boardId: string;
  currentStep: RepairStep | null;
  status: BoardStatus;
  completedSteps: BoardStep[];
}

const pipelineOrder: { step: RepairStep; label: string; desc: string }[] = [
  { step: 'DIAGNOSTICO', label: '1. Diagnóstico', desc: 'Análisis de falla y revisión de componentes' },
  { step: 'REPARACION', label: '2. Reparación', desc: 'Sustitución o resoldadura de piezas' },
  { step: 'PRUEBAS', label: '3. Pruebas', desc: 'Medición de voltajes y banco de prueba' },
  { step: 'ENTREGA', label: '4. Entrega', desc: 'Inspección final y entrega al solicitante' },
];

export function BoardStepper({ boardId, currentStep, status, completedSteps }: Props) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  const isDelivered = status === 'ENTREGADA';

  async function handleAdvance() {
    setLoading(true);
    const res = await advanceBoardStep({
      boardId,
      note: note.trim() || undefined,
    });
    setLoading(false);

    if (res.success) {
      toast.success('Paso del pipeline avanzado exitosamente');
      setShowNoteDialog(false);
      setNote('');
    } else {
      toast.error(res.error);
    }
  }

  // Mapa de pasos completados
  const completedMap = new Map(
    completedSteps.map((s) => [s.step, s.completed_at])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Flujo de Reparación
        </h3>

        {!isDelivered && (
          <button
            onClick={() => setShowNoteDialog(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>
              {!currentStep ? 'Iniciar Diagnóstico' : 'Avanzar Siguiente Paso'}
            </span>
          </button>
        )}
      </div>

      {/* Stepper Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {pipelineOrder.map((item, idx) => {
          const isDone = completedMap.has(item.step) && completedMap.get(item.step) !== null;
          const isCurrent = currentStep === item.step && !isDone;
          const isPending = !isDone && !isCurrent;

          return (
            <div
              key={item.step}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-950/30 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold tracking-tight">{item.label}</span>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-slate-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mb-2">{item.desc}</p>
              {isDone && (
                <span className="text-[10px] text-emerald-500/80 font-mono block">
                  Fin: {formatDate(completedMap.get(item.step))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog for Step Transition Note */}
      {showNoteDialog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Avanzar Pipeline</h4>
            <p className="text-xs text-slate-400">
              Registra una observación o hallazgo técnico opcional para la bitácora de este cambio de fase.
            </p>
            <textarea
              rows={3}
              placeholder="ej. Diagnóstico concluido: capacitor C12 desvalorizado y pista dañada..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNoteDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAdvance}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirmar y Avanzar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
