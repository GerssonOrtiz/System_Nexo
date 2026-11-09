import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { ShieldAlert, User } from 'lucide-react';

export default async function AuditLogPage() {
  await requireRole(['ADMIN_TI']);
  const supabase = await createClient();

  // RLS permite lectura de audit_logs a ADMIN_TI
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity, entity_id, diff, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  // Perfiles de los actores
  const actorIds = Array.from(new Set(logs?.map((l) => l.actor_id).filter(Boolean) as string[]));
  const { data: actors } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .in('id', actorIds);

  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ShieldAlert className="h-6 w-6 text-neon-blue" />
          Registro de Auditoría (Append-Only)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Trazabilidad inmutable de inserciones, actualizaciones y operaciones sobre el sistema
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {error && (
          <div className="p-6 text-center text-sm text-red-400">
            Error al consultar logs: {error.message}
          </div>
        )}

        {logs && logs.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            No hay registros de auditoría aún.
          </div>
        )}

        {logs && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-bg-elevated border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-5 py-3">ID / Fecha</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Acción</th>
                  <th className="px-5 py-3">Entidad</th>
                  <th className="px-5 py-3">Diff / Cambios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => {
                  const actor = log.actor_id ? actorMap.get(log.actor_id) : null;

                  return (
                    <tr key={log.id} className="hover:bg-neon-blue/5 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="font-mono text-slate-500 block">#{log.id}</span>
                        <span className="text-[11px] text-slate-400">{formatDate(log.created_at)}</span>
                      </td>
                      <td className="px-5 py-3">
                        {actor ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            <User className="h-3 w-3 text-slate-500" />
                            <span>{actor.full_name}</span>
                            <span className="text-slate-500 font-mono text-[10px]">(@{actor.username})</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Sistema / Service Role</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.action === 'INSERT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : log.action === 'UPDATE'
                              ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-300">
                        {log.entity}
                        {log.entity_id && (
                          <span className="block text-[10px] text-slate-500 truncate max-w-[120px]">
                            {log.entity_id}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 max-w-md">
                        <pre className="p-2 rounded-lg bg-bg-elevated border border-white/5 text-[10px] font-mono text-slate-400 overflow-x-auto max-h-24">
                          {JSON.stringify(log.diff, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
