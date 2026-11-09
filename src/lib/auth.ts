import { createClient } from './supabase/server';
import type { Profile, UserRole } from './supabase/types';
import { redirect } from 'next/navigation';

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, is_superadmin, is_active, deleted_at, created_at')
    .eq('id', user.id)
    .single();

  if (error || !profile) return null;
  if (!profile.is_active || profile.deleted_at !== null) return null;

  return profile as Profile;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect('/login');
  }
  return profile;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!allowedRoles.includes(profile.role)) {
    redirect('/tickets');
  }
  return profile;
}

export async function requireSuperadmin(): Promise<Profile> {
  const profile = await requireAuth();
  if (!profile.is_superadmin) {
    redirect('/tickets');
  }
  return profile;
}
