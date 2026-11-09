import { requireAuth } from '@/lib/auth';
import { SidebarNav } from '@/components/sidebar-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();

  return (
    <div className="flex min-h-screen bg-bg-forge linux-grid-bg text-text-primary">
      <SidebarNav profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating glass navbar */}
        <header className="mx-4 mt-3 mb-0 shrink-0">
          <div className="glass-card rounded-2xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-slate-400">Sistema Conectado</span>
            </div>
            <div className="text-xs text-slate-500">
              Organización:{' '}
              <span className="text-neon-blue font-semibold">Cabelab TI</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 pt-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
