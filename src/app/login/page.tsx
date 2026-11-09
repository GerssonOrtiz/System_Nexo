'use client';

import { useActionState, useState } from 'react';
import { loginAction } from '@/actions/users';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, User, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success && state.data?.redirect) {
      toast.success('Sesión iniciada correctamente');
      router.push(state.data.redirect);
      router.refresh();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 bg-bg-forge linux-grid-bg overflow-hidden">
      {/* Floating plasma orbs */}
      <div
        aria-hidden="true"
        className="animate-float-1 pointer-events-none absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float-2 pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float-3 pointer-events-none absolute top-1/2 right-1/3 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl"
      />

      {/* Login card */}
      <div className="animate-slide-in relative w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mb-4 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nexo TI</h1>
          <p className="text-sm text-slate-400 text-center mt-1">
            Mesa de ayuda y laboratorio de tarjetas electrónicas
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          {/* Username field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Usuario de red
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="ej. venllas"
                className="w-full pl-10 pr-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {state && !state.success && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 hover:border-neon-blue/50 text-neon-blue font-medium rounded-xl text-sm transition-all shadow-lg shadow-neon-blue/5 disabled:opacity-50 disabled:cursor-not-allowed mt-2 focus-visible:ring-2 focus-visible:ring-neon-blue"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validando credenciales...</span>
              </>
            ) : (
              <>
                <span>Ingresar al sistema</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-600">
            Cabelab &bull; Acceso restringido al personal autorizado
          </p>
        </div>
      </div>
    </main>
  );
}
