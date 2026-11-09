'use client';

import { logoutAction } from '@/actions/users';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Profile } from '@/lib/supabase/types';
import {
  Ticket,
  Cpu,
  BookOpen,
  Users,
  ShieldAlert,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface SidebarNavProps {
  profile: Profile;
}

export function SidebarNav({ profile }: SidebarNavProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === 'ADMIN_TI';

  const navItems = [
    {
      href: '/tickets',
      label: 'Mesa de Ayuda',
      icon: Ticket,
      show: true,
    },
    {
      href: '/taller',
      label: 'Taller de Tarjetas',
      icon: Cpu,
      show: isAdmin,
    },
    {
      href: '/kb',
      label: 'Base de Conocimiento',
      icon: BookOpen,
      show: true,
    },
    {
      href: '/admin/usuarios',
      label: 'Gestión de Usuarios',
      icon: Users,
      show: isAdmin,
    },
    {
      href: '/admin/auditoria',
      label: 'Auditoría',
      icon: ShieldAlert,
      show: isAdmin,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 border-b border-slate-800 flex items-center px-6 gap-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-sm">
          NX
        </div>
        <div className="leading-tight">
          <span className="font-bold text-slate-100 tracking-wide text-sm block">NEXO TI</span>
          <span className="text-[10px] text-indigo-400 tracking-wider uppercase font-semibold">Cabelab Lab</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos
        </div>
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-slate-200 truncate">{profile.full_name}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-mono truncate">@{profile.username}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 font-bold">
                {profile.is_superadmin ? 'SUPERADMIN' : profile.role}
              </span>
            </div>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
