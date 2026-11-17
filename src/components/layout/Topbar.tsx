import { useEffect, useMemo, useRef, useState } from 'react';
import { LuBell, LuMenu, LuSearch, LuTriangleAlert, LuClock, LuRadar, LuChevronDown, LuLightbulb, LuListChecks, LuMessageSquare } from 'react-icons/lu';
import { useApp } from '../../store/AppContext';
import { navigate, type PageKey } from '../../utils/router';
import { NAV } from './nav';
import { normalizeSearch } from '../../utils/format';

function useOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && cb();
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, [cb]);
  return ref;
}

export function Topbar({ page, onMenu }: { page: PageKey; onMenu: () => void }) {
  const { data, problems, stats } = useApp();
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useOutside(() => setSearchOpen(false));
  const notifRef = useOutside(() => setNotifOpen(false));
  const profileRef = useOutside(() => setProfileOpen(false));
  const nav = NAV.find((n) => n.key === page)!;

  const results = useMemo(() => {
    const t = normalizeSearch(q.trim());
    if (t.length < 2) return [];
    const out: { icon: typeof LuSearch; title: string; meta: string; go: () => void }[] = [];
    NAV.filter((n) => normalizeSearch(n.label).includes(t)).forEach((n) => out.push({ icon: n.icon, title: n.label, meta: 'Página', go: () => navigate(n.key) }));
    problems.filter((p) => normalizeSearch(p.name + p.description).includes(t)).slice(0, 4).forEach((p) => out.push({ icon: LuTriangleAlert, title: p.name, meta: 'Problema identificado', go: () => navigate('analise', { p: p.id }) }));
    data.opportunities.filter((o) => normalizeSearch(o.title + o.description).includes(t)).slice(0, 4).forEach((o) => out.push({ icon: LuLightbulb, title: o.title, meta: 'Oportunidade', go: () => navigate('oportunidades', { o: o.id }) }));
    data.plans.filter((p) => normalizeSearch(p.name).includes(t)).slice(0, 3).forEach((p) => out.push({ icon: LuListChecks, title: p.name, meta: 'Plano de ação', go: () => navigate('planos', { id: p.id }) }));
    data.manifestations.filter((m) => normalizeSearch(m.content).includes(t)).slice(0, 5).forEach((m) => out.push({ icon: LuMessageSquare, title: m.content, meta: 'Manifestação', go: () => navigate('monitoramento', { q: q.trim() }) }));
    return out.slice(0, 12);
  }, [q, problems, data]);

  const notifications = useMemo(() => {
    const n: { icon: typeof LuBell; tone: string; title: string; text: string; go: () => void }[] = [];
    data.plans.filter((p) => p.status === 'aguardando_autorizacao').forEach((p) =>
      n.push({ icon: LuClock, tone: 'text-amber-600 bg-amber-50', title: 'Autorização pendente', text: p.name, go: () => navigate('planos', { id: p.id }) }),
    );
    if (stats.pending) n.push({ icon: LuRadar, tone: 'text-blue-600 bg-blue-50', title: `${stats.pending} manifestações aguardando análise`, text: 'Execute a análise no Monitoramento.', go: () => navigate('monitoramento') });
    problems.filter((p) => p.severity === 'critica').forEach((p) =>
      n.push({ icon: LuTriangleAlert, tone: 'text-red-600 bg-red-50', title: 'Problema crítico', text: p.name, go: () => navigate('analise', { p: p.id }) }),
    );
    return n;
  }, [data.plans, stats.pending, problems]);

  const initials = (data.settings.userName || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md no-print">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu">
          <LuMenu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-slate-900">{nav.label}</p>
          <p className="hidden truncate text-[11px] text-slate-500 sm:block">{nav.description}</p>
        </div>

        <div ref={searchRef} className="relative ml-auto hidden w-full max-w-sm md:block">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Buscar problemas, oportunidades, manifestações…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            aria-label="Busca global"
          />
          {searchOpen && q.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-11 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              {results.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-slate-500">Nenhum resultado para “{q}”.</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={i}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      r.go();
                      setSearchOpen(false);
                    }}
                  >
                    <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-800">{r.title}</span>
                      <span className="text-[11px] text-slate-400">{r.meta}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <div ref={notifRef} className="relative">
            <button onClick={() => setNotifOpen((v) => !v)} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Notificações">
              <LuBell className="h-5 w-5" />
              {notifications.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{notifications.length}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 pb-2 pt-1 text-xs font-semibold text-slate-500">Notificações</p>
                {notifications.length === 0 && <p className="px-2 py-4 text-center text-xs text-slate-500">Tudo em dia.</p>}
                {notifications.map((n, i) => (
                  <button key={i} onClick={() => { n.go(); setNotifOpen(false); }} className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-slate-50">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.tone}`}><n.icon className="h-4 w-4" /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">{n.title}</span>
                      <span className="block truncate text-xs text-slate-500">{n.text}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mx-2 hidden h-8 w-px bg-slate-200 sm:block" />
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Empresa</p>
            <p className="max-w-[160px] truncate text-xs font-semibold text-slate-800">{data.company.name}</p>
          </div>

          <div ref={profileRef} className="relative ml-2">
            <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100" aria-label="Perfil">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white">{initials}</span>
              <LuChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-11 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-2 pb-2.5 pt-1">
                  <p className="text-sm font-semibold text-slate-900">{data.settings.userName} <span className="text-xs font-normal text-slate-400">(demo)</span></p>
                  <p className="text-xs text-slate-500">{data.settings.userRole}</p>
                </div>
                <button onClick={() => { navigate('configuracoes'); setProfileOpen(false); }} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Configurações</button>
                <button onClick={() => { navigate('historico'); setProfileOpen(false); }} className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Minhas atividades</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
