import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { BoardStepper } from './stepper';
import { BoardBomSection } from './bom-section';
import { BoardLogsSection } from './logs-section';
import { ArrowLeft, Clock, User, CheckCircle2 } from 'lucide-react';
import type { RepairStep, BoardStatus } from '@/lib/supabase/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardDetailPage({ params }: PageProps) {
  const { id } = await params;
  await requireRole(['ADMIN_TI']);
  const supabase = await createClient();

  // Consulta protegida por RLS
  const { data: board, error } = await supabase
    .from('boards')
    .select('id, serial, model, owner_name, status, current_step, created_by, created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !board) {
    notFound();
  }

  // Pasos completados
  const { data: steps } = await supabase
    .from('board_steps')
    .select('id, board_id, step, started_at, completed_at')
    .eq('board_id', id)
    .order('started_at', { ascending: true });

  // Componentes BOM
  const { data: components } = await supabase
    .from('board_components')
    .select('id, board_id, designator, part_number, package, status')
    .eq('board_id', id)
    .order('designator', { ascending: true });

  // Bitácora
  const { data: logs } = await supabase
    .from('board_logs')
    .select('id, board_id, kind, body, measurement, created_at, author_id')
    .eq('board_id', id)
    .order('created_at', { ascending: false });

  // Creador
  const { data: creator } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', board.created_by)
    .single();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link
        href="/taller"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver a tarjetas en taller</span>
      </Link>

      {/* Board Summary Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-base font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                {board.serial}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {board.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{board.model}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Cliente: <strong className="text-slate-300">{board.owner_name || 'Interno'}</strong> &bull; Ingresado por{' '}
              <strong className="text-slate-300">{creator?.full_name || 'Técnico'}</strong>
            </p>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start">
            <Clock className="h-3.5 w-3.5" />
            <span>Ingreso: {formatDate(board.created_at)}</span>
          </div>
        </div>

        {/* Pipeline Stepper */}
        <BoardStepper
          boardId={board.id}
          currentStep={board.current_step as RepairStep | null}
          status={board.status as BoardStatus}
          completedSteps={steps ?? []}
        />
      </div>

      {/* Two Column Layout: BOM & Bitácora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BoardBomSection
          boardId={board.id}
          components={components ?? []}
        />
        <BoardLogsSection
          boardId={board.id}
          logs={logs ?? []}
        />
      </div>
    </div>
  );
}
