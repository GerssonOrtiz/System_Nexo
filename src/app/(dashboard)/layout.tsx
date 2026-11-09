import { requireAuth } from '@/lib/auth';
import { SidebarNav } from '@/components/sidebar-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <SidebarNav profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-400">Sistema Conectado</span>
          </div>
          <div className="text-xs text-slate-400">
            Organización: <span className="text-slate-200 font-semibold">Cabelab TI</span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
