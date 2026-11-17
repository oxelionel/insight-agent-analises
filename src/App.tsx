import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { useRoute } from './utils/router';
import { useApp } from './store/AppContext';
import Dashboard from './pages/Dashboard';
import CompanyPage from './pages/CompanyPage';
import Monitoring from './pages/Monitoring';
import Analysis from './pages/Analysis';
import Competitors from './pages/Competitors';
import Opportunities from './pages/Opportunities';
import Solutions from './pages/Solutions';
import Plans from './pages/Plans';
import Reports from './pages/Reports';
import Presentations from './pages/Presentations';
import History from './pages/History';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const route = useRoute();
  const { data } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.page]);

  const pages = {
    dashboard: Dashboard,
    empresa: CompanyPage,
    monitoramento: Monitoring,
    analise: Analysis,
    concorrentes: Competitors,
    oportunidades: Opportunities,
    solucoes: Solutions,
    planos: Plans,
    relatorios: Reports,
    apresentacoes: Presentations,
    historico: History,
    configuracoes: SettingsPage,
  } as const;
  const Page = pages[route.page];

  return (
    <div className={data.settings.animations ? '' : 'no-anim'}>
      <Sidebar current={route.page} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen lg:pl-[260px]">
        <Topbar page={route.page} onMenu={() => setMenuOpen(true)} />
        <main className="print-shell mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <div key={route.page} className="page-enter">
            <Page params={route.params} />
          </div>
        </main>
        <footer className="no-print px-8 pb-6 text-center text-[11px] text-slate-400">
          Insight Agent MVP 1.0 · Ambiente demonstrativo — dados simulados · Nenhuma integração externa ativa
        </footer>
      </div>
    </div>
  );
}
