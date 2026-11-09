'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  createUserSchema,
  loginSchema,
  resetPasswordSchema,
  setActiveSchema,
  INTERNAL_DOMAIN,
} from '@/lib/validators/users';
import type { ActionResult } from '@/lib/types';

export async function loginAction(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ redirect: string }>> {
  const username = formData.get('username');
  const password = formData.get('password');

  const parsed = loginSchema.safeParse({ username, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos de inicio de sesión inválidos',
    };
  }

  const email = `${parsed.data.username.toLowerCase()}@${INTERNAL_DOMAIN}`;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  }

  // Verificar estado del perfil en la base de datos
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active, deleted_at')
    .eq('id', data.user.id)
    .single();

  if (!profile || !profile.is_active || profile.deleted_at !== null) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: 'La cuenta está desactivada o no tiene acceso al sistema',
    };
  }

  return { success: true, data: { redirect: '/tickets' } };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function createUser(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }
  const { username, fullName, role, tempPassword } = parsed.data;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `${username.toLowerCase()}@${INTERNAL_DOMAIN}`,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { username: username.toLowerCase(), full_name: fullName },
  });

  if (error || !data.user) {
    return {
      success: false,
      error: error?.message || 'No se pudo crear el usuario en el sistema',
    };
  }

  // Si se solicitó ADMIN_TI, actualizar el rol asignado por el trigger
  if (role === 'ADMIN_TI') {
    const { error: roleError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', data.user.id);

    if (roleError) {
      return {
        success: false,
        error: 'Usuario creado pero no se pudo asignar el rol de ADMIN_TI',
      };
    }
  }

  // Registro de auditoría
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: me.id,
    action: 'INSERT',
    entity: 'profiles',
    entity_id: data.user.id,
    diff: { created_by_admin: true, username, role },
  });

  revalidatePath('/admin/usuarios');
  return { success: true, data: { id: data.user.id } };
}

export async function setUserActive(
  input: unknown
): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (!me?.is_superadmin) {
    return { success: false, error: 'No autorizado. Solo el superadmin puede modificar el estado.' };
  }

  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' };
  }
  const { userId, active } = parsed.data;

  if (userId === me.id) {
    return { success: false, error: 'No puedes desactivarte a ti mismo' };
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: active })
    .eq('id', userId);

  if (error) {
    return { success: false, error: 'No se pudo actualizar el estado del usuario' };
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: me.id,
    action: 'UPDATE',
    entity: 'profiles',
    entity_id: userId,
    diff: { is_active: { after: active } },
  });

  revalidatePath('/admin/usuarios');
  return { success: true, data: null };
}

export async function resetUserPassword(
  input: unknown
): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (!me?.is_superadmin) {
    return { success: false, error: 'No autorizado. Solo el superadmin puede restablecer contraseñas.' };
  }

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos de contraseña inválidos' };
  }
  const { userId, newPassword } = parsed.data;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { success: false, error: 'Error al restablecer la contraseña en Auth' };
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: me.id,
    action: 'UPDATE',
    entity: 'profiles',
    entity_id: userId,
    diff: { password_reset_by_superadmin: true },
  });

  revalidatePath('/admin/usuarios');
  return { success: true, data: null };
}
