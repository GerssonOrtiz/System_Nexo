'use client';

import { logoutAction } from '@/actions/users';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Profile } from '@/lib/supabase/types';
import type { LucideIcon } from 'lucide-react';
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

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
}

export function SidebarNav({ profile }: SidebarNavProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === 'ADMIN_TI';
  const [expanded, setExpanded] = useState(false);

  const navItems: NavItem[] = [
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
    <div className="flex items-center my-auto px-3 py-6 shrink-0 self-stretch">
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`vision-sidebar-capsule flex flex-col h-full max-h-[88vh] transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'w-56' : 'w-[72px]'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
            NX
          </div>
          {expanded && (
            <div className="leading-tight whitespace-nowrap overflow-hidden">
              <span className="font-bold text-slate-100 tracking-wide text-sm block">NEXO TI</span>
              <span className="text-[10px] text-neon-blue tracking-wider uppercase font-semibold">Cabelab Lab</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {!expanded && (
            <div className="px-2 py-2 text-[9px] font-semibold text-slate-600 uppercase tracking-wider text-center">···</div>
          )}
          {expanded && (
            <div className="px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Módulos
            </div>
          )}
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`vision-item-bubble flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-neon-blue/10 text-neon-blue shadow-sm shadow-neon-blue/10 border border-neon-blue/20'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-neon-blue' : 'text-slate-500'}`}
                  />
                  {expanded && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <div className={`flex items-center gap-3 mb-2 ${expanded ? 'px-1' : 'justify-center'}`}>
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-300">
                <UserCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-bg-forge-mid animate-pulse" />
            </div>
            {expanded && (
              <div className="overflow-hidden flex-1 whitespace-nowrap">
                <p className="text-xs font-semibold text-slate-200 truncate">{profile.full_name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-slate-500 font-mono truncate">@{profile.username}</span>
                  <span className="text-[8px] px-1 py-0.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple font-bold">
                    {profile.is_superadmin ? 'SA' : profile.role === 'ADMIN_TI' ? 'ADM' : 'SOL'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Cerrar sesión"
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all ${
                expanded ? 'justify-start' : 'justify-center'
              }`}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {expanded && <span>Cerrar sesión</span>}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
