import { LuX } from 'react-icons/lu';
import { NAV } from './nav';
import { navigate, type PageKey } from '../../utils/router';
import { useApp } from '../../store/AppContext';
import { cn } from '../../utils/format';

export function Logo({ light = true }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill={light ? '#1e3a8a' : '#0f1e3d'} />
        <circle cx="16" cy="16" r="7" fill="none" stroke="#60a5fa" strokeWidth="2.4" />
        <circle cx="16" cy="16" r="2.6" fill="#34d399" />
        <path d="M16 4.5v3.5M16 24v3.5M4.5 16H8M24 16h3.5" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="leading-tight">
        <p className={cn('text-[15px] font-bold tracking-tight', light ? 'text-white' : 'text-slate-900')}>Insight Agent</p>
        <p className={cn('text-[10px] font-medium uppercase tracking-[0.14em]', light ? 'text-blue-200/70' : 'text-slate-500')}>Strategic Intelligence</p>
      </div>
    </div>
  );
}

export function Sidebar({ current, open, onClose }: { current: PageKey; open: boolean; onClose: () => void }) {
  const { stats, data } = useApp();
  const badges: Partial<Record<PageKey, number>> = {
    monitoramento: stats.pending,
    planos: stats.awaiting,
  };
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <>
      <div className={cn('fixed inset-0 z-40 bg-slate-900/40 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} />
      <aside
        className={cn(
          'sidebar fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#0b1733] text-slate-300 transition-transform duration-200 lg:translate-x-0 no-print',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <Logo />
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <LuX className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((g) => (
            <div key={g} className="mt-3">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{g}</p>
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = n.key === current;
                const b = badges[n.key];
                return (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => {
                      navigate(n.key);
                      onClose();
                    }}
                    className={cn(
                      'group relative mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition',
                      active ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-blue-400" />}
                    <n.icon className={cn('h-[18px] w-[18px]', active ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300')} />
                    <span className="flex-1">{n.label}</span>
                    {b ? <span className="rounded-full bg-amber-400/90 px-1.5 text-[10px] font-bold text-slate-900">{b}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="m-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Empresa monitorada</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{data.company.name}</p>
          <p className="truncate text-xs text-slate-400">{data.company.segment || 'Segmento não informado'}</p>
          <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-amber-300/90">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Ambiente demonstrativo — dados simulados
          </p>
        </div>
      </aside>
    </>
  );
}
