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

/*
 * Roteamento por hash simples (#pagina). Parâmetros de navegação (ex.: qual
 * oportunidade abrir) ficam em memória, para que a URL permaneça limpa e
 * compatível com ambientes que só aceitam hashes simples.
 * Também aceita o formato #/pagina?chave=valor.
 */
let pendingParams: Record<string, string> = {};

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [path, query = ''] = clean.split('?');
  const page = (PAGES.includes(path as PageKey) ? path : 'dashboard') as PageKey;
  const params: Record<string, string> = { ...pendingParams };
  new URLSearchParams(query).forEach((v, k) => (params[k] = v));
  return { page, params };
}

export function navigate(page: PageKey, params?: Record<string, string>) {
  pendingParams = params ?? {};
  const target = `#${page}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      pendingParams = {};
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
