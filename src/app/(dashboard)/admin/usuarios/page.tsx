import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserManagementTable } from './user-table';
import { Users, UserPlus } from 'lucide-react';
import type { Profile } from '@/lib/supabase/types';

export default async function AdminUsersPage() {
  const currentProfile = await requireRole(['ADMIN_TI']);

  // El listado de usuarios usa supabaseAdmin para asegurar ver perfiles inactivos y datos completos
  const { data: users } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, role, is_superadmin, is_active, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-400" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administración de cuentas internas, roles y permisos de acceso
          </p>
        </div>
      </div>

      <UserManagementTable
        users={(users as Profile[]) ?? []}
        currentUserId={currentProfile.id}
        isSuperadmin={currentProfile.is_superadmin}
      />
    </div>
  );
}
