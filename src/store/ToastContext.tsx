import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { LuCircleCheck, LuCircleAlert, LuInfo, LuX } from 'react-icons/lu';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; title: string; text?: string }

const Ctx = createContext<{ notify: (kind: ToastKind, title: string, text?: string) => void } | null>(null);
let seq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const notify = useCallback((kind: ToastKind, title: string, text?: string) => {
    const id = seq++;
    setToasts((t) => [...t, { id, kind, title, text }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, []);

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2 no-print" aria-live="polite">
        {toasts.map((t) => {
          const Icon = t.kind === 'success' ? LuCircleCheck : t.kind === 'error' ? LuCircleAlert : LuInfo;
          const color = t.kind === 'success' ? 'text-emerald-600' : t.kind === 'error' ? 'text-red-600' : 'text-blue-600';
          return (
            <div key={t.id} role="status" className="toast-in flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg shadow-slate-900/10">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.text && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.text}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Fechar">
                <LuX className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast fora do provider');
  return v.notify;
}
