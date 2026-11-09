'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBoard } from '@/actions/taller';
import { toast } from 'sonner';
import { Cpu, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NewBoardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('');
  const [ownerName, setOwnerName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await createBoard({
      model,
      ownerName,
    });

    setLoading(false);

    if (res.success) {
      toast.success('Tarjeta creada con correlativo TRJ anual asignado');
      router.push(`/taller/${res.data.id}`);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href="/taller"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver al taller</span>
      </Link>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Ingreso de Tarjeta Electrónica</h1>
            <p className="text-xs text-slate-400">El número de serie TRJ-{new Date().getFullYear()}-NNN se autogenerará</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Modelo / Identificador de la placa
            </label>
            <input
              type="text"
              required
              placeholder="ej. PLC Siemens S7-1200 / Mainboard Inversor v2.1"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Cliente / Propietario / Área
            </label>
            <input
              type="text"
              required
              placeholder="ej. Planta 1 - Línea de Envasado"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generando correlativo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Crear Tarjeta y Asignar Serial</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
