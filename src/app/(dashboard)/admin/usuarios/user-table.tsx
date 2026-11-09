'use client';

import { useState } from 'react';
import { createUser, resetUserPassword, setUserActive } from '@/actions/users';
import { toast } from 'sonner';
import type { Profile, UserRole } from '@/lib/supabase/types';
import { formatDate } from '@/lib/utils';
import {
  UserPlus,
  KeyRound,
  ShieldCheck,
  Power,
  PowerOff,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Props {
  users: Profile[];
  currentUserId: string;
  isSuperadmin: boolean;
}

export function UserManagementTable({ users, currentUserId, isSuperadmin }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Formulario nuevo usuario
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('SOLICITANTE');
  const [tempPassword, setTempPassword] = useState('');

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await createUser({
      username,
      fullName,
      role,
      tempPassword,
    });

    setLoading(false);

    if (res.success) {
      toast.success(`Usuario @${username} creado exitosamente`);
      setUsername('');
      setFullName('');
      setRole('SOLICITANTE');
      setTempPassword('');
      setShowCreateModal(false);
    } else {
      toast.error(res.error);
    }
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    if (!isSuperadmin) return;
    const nextState = !currentActive;

    const res = await setUserActive({
      userId,
      active: nextState,
    });

    if (res.success) {
      toast.success(nextState ? 'Cuenta de usuario activada' : 'Cuenta de usuario desactivada');
    } else {
      toast.error(res.error);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetModalUserId || !isSuperadmin) return;

    setLoading(true);
    const res = await resetUserPassword({
      userId: resetModalUserId,
      newPassword,
    });
    setLoading(false);

    if (res.success) {
      toast.success('Contraseña restablecida con éxito');
      setResetModalUserId(null);
      setNewPassword('');
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 text-neon-blue font-medium text-sm transition-all shadow-lg shadow-neon-blue/5"
        >
          <UserPlus className="h-4 w-4" />
          <span>Crear Usuario</span>
        </button>
      </div>

      {/* Users List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-bg-elevated border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha Alta</th>
                {isSuperadmin && <th className="px-6 py-4 text-right">Acciones Superadmin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => {
                const isMe = u.id === currentUserId;

                return (
                  <tr key={u.id} className="hover:bg-neon-blue/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-neon-blue font-bold">
                      @{u.username}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {u.full_name} {isMe && <span className="text-xs text-slate-500">(Tú)</span>}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_superadmin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                          <ShieldCheck className="h-3 w-3" /> SUPERADMIN
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            u.role === 'ADMIN_TI'
                              ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                          <XCircle className="h-3.5 w-3.5" /> Desactivado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(u.created_at)}</td>

                    {isSuperadmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setResetModalUserId(u.id)}
                            title="Restablecer Contraseña"
                            className="p-1.5 rounded-lg bg-bg-elevated hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-white/5"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>

                          {!isMe && (
                            <button
                              onClick={() => handleToggleActive(u.id, u.is_active)}
                              title={u.is_active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                u.is_active
                                  ? 'bg-red-950/30 text-red-400 border-red-900/40 hover:bg-red-900/50'
                                  : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/50'
                              }`}
                            >
                              {u.is_active ? (
                                <PowerOff className="h-3.5 w-3.5" />
                              ) : (
                                <Power className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario — OPACO bg-bg-elevated */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-bg-elevated border border-white/10 p-6 space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-neon-blue" />
              <span>Alta de Usuario Interno</span>
            </h4>
            <p className="text-xs text-slate-400">
              Se creará la cuenta en Supabase Auth con dominio interno cabelab.local
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre de Usuario (Username)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. jsmith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 bg-bg-forge-mid border border-white/10 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neon-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Juan Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-forge-mid border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-neon-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Rol en el sistema
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-bg-forge-mid border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-neon-blue"
                >
                  <option value="SOLICITANTE">SOLICITANTE (Mesa de ayuda y consulta de KB)</option>
                  <option value="ADMIN_TI">ADMIN_TI (Acceso completo a taller, tickets y auditoría)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Contraseña Temporal
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-forge-mid border border-white/10 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neon-blue"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 text-neon-blue font-medium text-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restablecer Contraseña (Superadmin) — OPACO bg-bg-elevated */}
      {resetModalUserId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-bg-elevated border border-white/10 p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-400" />
              <span>Restablecer Contraseña</span>
            </h4>
            <p className="text-xs text-slate-400">
              Escribe la nueva contraseña para el usuario seleccionado.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="password"
                required
                placeholder="Nueva contraseña (min 6 car.)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-bg-forge-mid border border-white/10 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neon-blue"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalUserId(null);
                    setNewPassword('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
