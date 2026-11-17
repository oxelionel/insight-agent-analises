/**
 * Camada de provedores — ponto de extensão para versões futuras.
 *
 * No MVP, o único provedor ativo é o motor demonstrativo local (regras +
 * base de conhecimento). Integrações reais (LLMs, APIs de redes sociais,
 * Reclame Aqui, CRMs) devem implementar estas interfaces sem alterar as telas.
 */
import type { Manifestation, Opportunity, Problem, Solution } from '../types';
import { classifyCategory, classifySentiment, classifyType, computeProblems } from './analysisEngine';
import { generateSolution, type SolutionContext } from './solutionEngine';

export interface AnalysisProvider {
  id: string;
  label: string;
  classify(m: Pick<Manifestation, 'content' | 'source' | 'company'>, companyName: string): Pick<Manifestation, 'sentiment' | 'category' | 'type'>;
  detectProblems(manifestations: Manifestation[], companyName: string): Problem[];
  proposeSolution(opp: Opportunity, ctx: SolutionContext): Solution;
}

export interface SourceConnector {
  id: string;
  label: string;
  /** Futuro: buscar manifestações de uma fonte externa autorizada. */
  fetch?: () => Promise<Manifestation[]>;
  status: 'demonstrativo' | 'planejado';
}

export const localDemoProvider: AnalysisProvider = {
  id: 'local-demo',
  label: 'Motor demonstrativo local (regras + base de conhecimento)',
  classify(m, companyName) {
    const sentiment = classifySentiment(m.content);
    return { sentiment, category: classifyCategory(m.content), type: classifyType(m.content, m.source, m.company, companyName, sentiment) };
  },
  detectProblems: computeProblems,
  proposeSolution: generateSolution,
};

export const PLANNED_PROVIDERS = [
  { id: 'llm', label: 'Modelo de linguagem externo (LLM)', note: 'Classificação semântica e redação de soluções.' },
  { id: 'embeddings', label: 'Agrupamento semântico por embeddings', note: 'Recorrência sem depender de palavras-chave.' },
];

export const PLANNED_CONNECTORS: SourceConnector[] = [
  { id: 'reclame_aqui', label: 'Reclame Aqui', status: 'planejado' },
  { id: 'meta', label: 'Instagram e Facebook', status: 'planejado' },
  { id: 'google', label: 'Google Avaliações', status: 'planejado' },
  { id: 'news', label: 'Agregador de notícias', status: 'planejado' },
  { id: 'crm', label: 'CRM / Helpdesk interno', status: 'planejado' },
];

export const activeProvider: AnalysisProvider = localDemoProvider;
