'use client';

import { useState } from 'react';
import { addComponent, updateComponentStatus } from '@/actions/taller';
import { toast } from 'sonner';
import type { BoardComponent, ComponentStatus } from '@/lib/supabase/types';
import { Layers, Plus, Loader2 } from 'lucide-react';

interface Props {
  boardId: string;
  components: BoardComponent[];
}

const statusBadges: Record<ComponentStatus, { label: string; className: string }> = {
  REQUERIDO: { label: 'Requerido', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  SOLICITADO: { label: 'Solicitado', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  EN_STOCK: { label: 'En Stock', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  INSTALADO: { label: 'Instalado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export function BoardBomSection({ boardId, components }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [designator, setDesignator] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [pkg, setPkg] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await addComponent({
      boardId,
      designator,
      partNumber,
      package: pkg || null,
      status: 'REQUERIDO',
    });

    setLoading(false);

    if (res.success) {
      toast.success('Componente agregado a la lista BOM');
      setDesignator('');
      setPartNumber('');
      setPkg('');
      setShowAdd(false);
    } else {
      toast.error(res.error);
    }
  }

  async function handleStatusChange(componentId: string, status: ComponentStatus) {
    const res = await updateComponentStatus({
      componentId,
      status,
    });
    if (res.success) {
      toast.success('Estado del componente actualizado');
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <span>Lista de Materiales / BOM ({components.length})</span>
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showAdd ? 'Cerrar' : 'Agregar Componente'}</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Designador
              </label>
              <input
                type="text"
                required
                placeholder="R12, C45, U3"
                value={designator}
                onChange={(e) => setDesignator(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Part Number / Valor
              </label>
              <input
                type="text"
                required
                placeholder="LM358 / 10uF 50V"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Encapsulado
              </label>
              <input
                type="text"
                placeholder="SOIC-8, SMD 0805"
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Registrar Pieza</span>
            </button>
          </div>
        </form>
      )}

      {/* Components Table */}
      <div className="space-y-2">
        {components.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">
            No se han registrado componentes requeridos para esta placa.
          </p>
        ) : (
          components.map((c) => {
            const badge = statusBadges[c.status];
            return (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400">{c.designator}</span>
                    <span className="text-slate-300 font-medium">{c.part_number}</span>
                  </div>
                  {c.package && <p className="text-[10px] text-slate-500 mt-0.5">Encapsulado: {c.package}</p>}
                </div>

                <div className="shrink-0">
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value as ComponentStatus)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="REQUERIDO">Requerido</option>
                    <option value="SOLICITADO">Solicitado</option>
                    <option value="EN_STOCK">En Stock</option>
                    <option value="INSTALADO">Instalado</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
