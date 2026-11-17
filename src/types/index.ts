// Tipos de domínio do Insight Agent

export type SourceKey =
  | 'reclame_aqui'
  | 'instagram'
  | 'facebook'
  | 'google'
  | 'youtube'
  | 'noticias'
  | 'site_concorrente'
  | 'app_store'
  | 'forum'
  | 'interna'
  | 'manual';

export type Category =
  | 'atendimento'
  | 'preco'
  | 'qualidade'
  | 'prazo'
  | 'entrega'
  | 'comunicacao'
  | 'experiencia'
  | 'tecnologia'
  | 'acessibilidade'
  | 'seguranca'
  | 'inovacao'
  | 'pos_venda';

export type Sentiment = 'positivo' | 'negativo' | 'neutro';
export type Priority = 'baixa' | 'media' | 'alta';
export type Severity = 'baixa' | 'media' | 'alta' | 'critica';
export type ManifestationType = 'reclamacao' | 'sugestao' | 'elogio' | 'noticia' | 'concorrente' | 'neutro';
export type AnalysisStatus = 'pendente' | 'analisada';

export interface Manifestation {
  id: string;
  source: SourceKey;
  author: string;
  date: string; // ISO yyyy-mm-dd
  content: string;
  company: string; // empresa relacionada
  category: Category;
  sentiment: Sentiment;
  type: ManifestationType;
  priority: Priority;
  link?: string;
  status: AnalysisStatus;
  demo: boolean;
}

export interface Company {
  name: string;
  segment: string;
  description: string;
  products: string[];
  services: string[];
  audience: string;
  differentials: string[];
  knownIssues: string[];
  goals: string[];
  features: string[]; // chaves do catálogo de recursos
}

export type Criterion = 'atendimento' | 'preco' | 'tecnologia' | 'experiencia' | 'prazo';

export interface Competitor {
  id: string;
  name: string;
  segment: string;
  offerings: string[];
  differentials: string[];
  features: string[]; // chaves do catálogo
  rating: number; // avaliação demonstrativa 0-5
  reviews: number;
  strengths: string[];
  weaknesses: string[];
  scores: Record<Criterion, number>; // 1-5
  priceLevel: string;
  color: string;
}

export interface ProblemDefinition {
  id: string;
  name: string;
  category: Category;
  patterns: string[];
  description: string;
  cause: string;
  impact: string;
  opportunity: string;
  recommendation: string;
  impactWeight: 1 | 2 | 3;
  operationalWeight: 1 | 2 | 3;
  strategicWeight: 1 | 2 | 3;
  hypotheses: string[];
}

export interface Problem {
  id: string;
  name: string;
  category: Category;
  description: string;
  evidence: Manifestation[];
  count: number;
  sentiment: Sentiment;
  severity: Severity;
  severityScore: number;
  cause: string;
  impact: string;
  opportunity: string;
  recommendation: string;
  observed: string[];
  interpretations: string[];
  hypotheses: string[];
  sources: SourceKey[];
}

export type OpportunityType =
  | 'melhoria_operacional'
  | 'experiencia_cliente'
  | 'inovacao'
  | 'reducao_custos'
  | 'vantagem_competitiva'
  | 'retencao'
  | 'eficiencia'
  | 'novos_produtos';

export type OpportunityOrigin = 'reclamacao' | 'sugestao' | 'concorrente' | 'noticia' | 'analise';
export type OpportunityStatus = 'nova' | 'em_analise' | 'solucao_gerada' | 'descartada';
export type Level = 'baixa' | 'media' | 'alta';

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  problemId?: string;
  playbook: string;
  origin: OpportunityOrigin;
  type: OpportunityType;
  benefit: string;
  complexity: Level;
  impact: number; // 1-5
  effort: number; // 1-5
  priority: Priority;
  status: OpportunityStatus;
  createdAt: string;
  extraEvidence: string[];
}

export type Recommendation = 'implementar' | 'testar' | 'investigar' | 'descartar';

export interface Solution {
  id: string;
  opportunityId: string;
  problemId?: string;
  createdAt: string;
  title: string;
  problem: string;
  context: string[];
  analysis: string[];
  proposal: string[];
  benefits: string[];
  resources: { pessoas: string; ferramentas: string; tecnologia: string; orcamento: string };
  complexity: Level;
  timeframe: 'curto' | 'medio' | 'longo';
  kpis: string[];
  risks: string[];
  recommendation: Recommendation;
  rationale: string;
}

export type PlanStatus =
  | 'em_elaboracao'
  | 'aguardando_autorizacao'
  | 'aprovado'
  | 'reprovado'
  | 'em_execucao'
  | 'concluido'
  | 'cancelado';

export interface PlanStep {
  id: string;
  title: string;
  owner: string;
  start: string;
  due: string;
  done: boolean;
}

export interface PlanKpi {
  name: string;
  baseline: string;
  target: string;
  current: string;
}

export interface Plan {
  id: string;
  solutionId: string;
  name: string;
  problem: string;
  objective: string;
  expectedResult: string;
  owner: string;
  steps: PlanStep[];
  resources: string[];
  investment: string;
  kpis: PlanKpi[];
  risks: string[];
  status: PlanStatus;
  createdAt: string;
  approval?: {
    requestedAt?: string;
    decidedAt?: string;
    decidedBy?: string;
    note?: string;
  };
  execution?: { startedAt?: string; finishedAt?: string; log: string[] };
}

export type ActivityType =
  | 'manifestacao_cadastrada'
  | 'manifestacao_editada'
  | 'manifestacao_excluida'
  | 'analise_executada'
  | 'problema_identificado'
  | 'oportunidade_criada'
  | 'solucao_elaborada'
  | 'plano_criado'
  | 'plano_atualizado'
  | 'autorizacao_solicitada'
  | 'melhoria_aprovada'
  | 'melhoria_reprovada'
  | 'execucao_realizada'
  | 'relatorio_gerado'
  | 'apresentacao_gerada'
  | 'empresa_atualizada'
  | 'concorrente_atualizado'
  | 'sistema';

export interface Activity {
  id: string;
  timestamp: string; // ISO completo
  type: ActivityType;
  description: string;
  actor: string;
  status: 'sucesso' | 'pendente' | 'info' | 'alerta';
}

export interface ReportRecord {
  id: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  title: string;
}

export interface Settings {
  userName: string;
  userRole: string;
  animations: boolean;
}

export interface AppData {
  version: number;
  company: Company;
  competitors: Competitor[];
  manifestations: Manifestation[];
  opportunities: Opportunity[];
  solutions: Solution[];
  plans: Plan[];
  activities: Activity[];
  reports: ReportRecord[];
  slideOverrides: Record<string, { title?: string; subtitle?: string }>;
  settings: Settings;
  lastAnalysisAt?: string;
}
