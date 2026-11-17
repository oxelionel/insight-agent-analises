import { useEffect, useState } from 'react';

export type PageKey =
  | 'dashboard'
  | 'empresa'
  | 'monitoramento'
  | 'analise'
  | 'concorrentes'
  | 'oportunidades'
  | 'solucoes'
  | 'planos'
  | 'relatorios'
  | 'apresentacoes'
  | 'historico'
  | 'configuracoes';

export interface Route { page: PageKey; params: Record<string, string> }

const PAGES: PageKey[] = ['dashboard', 'empresa', 'monitoramento', 'analise', 'concorrentes', 'oportunidades', 'solucoes', 'planos', 'relatorios', 'apresentacoes', 'historico', 'configuracoes'];

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [path, query = ''] = clean.split('?');
  const page = (PAGES.includes(path as PageKey) ? path : 'dashboard') as PageKey;
  const params: Record<string, string> = {};
  new URLSearchParams(query).forEach((v, k) => (params[k] = v));
  return { page, params };
}

export function navigate(page: PageKey, params?: Record<string, string>) {
  const q = params && Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
  window.location.hash = `#/${page}${q}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
