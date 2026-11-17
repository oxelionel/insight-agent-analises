/**
 * Motor de análise demonstrativo (local, determinístico).
 * Não há chamada a modelos externos: a lógica usa regras, léxicos e a base de
 * conhecimento em data/knowledgeBase.ts. A interface pública (funções abaixo)
 * foi pensada para ser trocada por um provedor de IA real no futuro
 * (ver services/aiProvider.ts).
 */
import type {
  Category, Company, Competitor, Criterion, Manifestation, ManifestationType, Opportunity, Problem,
  Sentiment, Severity, SourceKey,
} from '../types';
import { PROBLEM_DEFINITIONS } from '../data/knowledgeBase';
import { CATEGORIES, CRITERIA_CATEGORIES, FEATURES, SOURCES } from '../data/catalog';

export const normalize = (t: string) =>
  ` ${t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')} `;

const POSITIVE = ['otim', 'excelente', 'rapid', 'educad', 'recomendo', 'parabens', 'resolveu', 'gostei', 'eficiente', 'pontual', 'satisfeit', 'caprich', 'adorei', 'perfeito', 'paciencia', 'justo', 'nota 10'];
const NEGATIVE = ['demor', 'pessim', 'absurd', 'ninguem', 'nunca', 'nao apareceu', 'atras', 'erro', 'trava', 'caro', 'decepcion', 'horrivel', 'ruim', 'insatisf', 'cobraram', 'sem resposta', 'desisti', 'perdi', 'nao consigo', 'caiu', 'surpresa', 'voltou', 'pior', 'reclam', 'nao funciona', 'precisa melhorar', 'esperando', 'sem nenhum aviso', 'sem aviso', 'terceira vez', 'so atende', 'remarcam', 'nao havia ninguem'];
const SUGGESTION = ['poderiam', 'seria bom', 'seria otimo', 'sugiro', 'sugestao', 'gostaria', 'deveriam', 'que tal', 'podiam', 'poderia'];

const CATEGORY_KEYWORDS: [Category, string[]][] = [
  ['pos_venda', ['garantia', 'pos-venda', 'pos venda', 'depois do servico', 'voltou']],
  ['prazo', ['atras', 'prazo', 'pontual', 'horario marcado', 'remarc', 'janela']],
  ['preco', ['preco', 'valor', 'cobr', 'caro', 'orcamento', 'parcel', 'taxa', 'pagamento']],
  ['tecnologia', ['app', 'aplicativo', 'site', 'login', 'sistema', 'trava', 'bug']],
  ['comunicacao', ['status', 'acompanhar', 'aviso', 'avisou', 'informacao', 'atualizacao', 'previsao']],
  ['atendimento', ['atendimento', 'atender', 'atende', 'chat', 'whatsapp', 'responder', 'central', 'telefone', 'falar com', 'mensagens', 'assistente virtual']],
  ['seguranca', ['seguranc', 'dados', 'golpe', 'fraude']],
  ['acessibilidade', ['acessib', 'idoso', 'deficien', 'libras']],
  ['inovacao', ['assinatura', 'inovac', 'tendencia', 'novo servico']],
  ['entrega', ['entrega', 'peca', 'material']],
  ['experiencia', ['experiencia', 'facil', 'dificil', 'confuso']],
  ['qualidade', ['servico', 'acabamento', 'qualidade', 'tecnico']],
];

export function classifySentiment(text: string): Sentiment {
  const n = normalize(text);
  if (SUGGESTION.some((w) => n.includes(w))) {
    const neg = NEGATIVE.filter((w) => n.includes(w)).length;
    return neg >= 2 ? 'negativo' : 'neutro';
  }
  const pos = POSITIVE.filter((w) => n.includes(w)).length;
  const neg = NEGATIVE.filter((w) => n.includes(w)).length + (n.includes(' nao ') ? 0.5 : 0);
  if (pos === 0 && neg === 0) return 'neutro';
  if (pos > neg) return 'positivo';
  if (neg > pos) return 'negativo';
  return 'neutro';
}

export function classifyCategory(text: string): Category {
  const n = normalize(text);
  let best: Category = 'qualidade';
  let bestScore = 0;
  CATEGORY_KEYWORDS.forEach(([cat, words], idx) => {
    const score = words.filter((w) => n.includes(w)).length + (CATEGORY_KEYWORDS.length - idx) * 0.01;
    if (words.some((w) => n.includes(w)) && score > bestScore) {
      best = cat;
      bestScore = score;
    }
  });
  return best;
}

export function classifyType(text: string, source: SourceKey, company: string, companyName: string, sentiment: Sentiment): ManifestationType {
  const n = normalize(text);
  if (source === 'noticias') return 'noticia';
  if (company && company !== companyName) return 'concorrente';
  if (source === 'site_concorrente') return 'concorrente';
  if (source === 'interna' || SUGGESTION.some((w) => n.includes(w))) return 'sugestao';
  if (sentiment === 'negativo') return 'reclamacao';
  if (sentiment === 'positivo') return 'elogio';
  return 'neutro';
}

/** Retorna os ids de problemas cujos padrões aparecem no texto. */
export function matchProblems(m: Pick<Manifestation, 'content' | 'type' | 'sentiment'>): string[] {
  if (!['reclamacao', 'sugestao', 'neutro'].includes(m.type)) return [];
  if (m.sentiment === 'positivo') return [];
  const n = normalize(m.content);
  return PROBLEM_DEFINITIONS.map((d) => ({ id: d.id, hits: d.patterns.filter((p) => n.includes(p)).length }))
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 2)
    .map((r) => r.id);
}

export function isAnalyzable(m: Manifestation, companyName: string) {
  return m.status === 'analisada' && m.company === companyName;
}

const SEVERITY_ORDER: Severity[] = ['baixa', 'media', 'alta', 'critica'];
export const severityRank = (s: Severity) => SEVERITY_ORDER.indexOf(s);

export function computeProblems(manifestations: Manifestation[], companyName: string): Problem[] {
  const pool = manifestations.filter((m) => isAnalyzable(m, companyName));
  const negTotal = pool.filter((m) => m.sentiment === 'negativo').length || 1;
  const result: Problem[] = [];

  for (const def of PROBLEM_DEFINITIONS) {
    const evidence = pool.filter((m) => matchProblems(m).includes(def.id));
    if (evidence.length === 0) continue;
    const count = evidence.length;
    const neg = evidence.filter((e) => e.sentiment === 'negativo').length;
    const highPriority = evidence.filter((e) => e.priority === 'alta').length;
    const sentiment: Sentiment = neg >= count / 2 ? 'negativo' : 'neutro';
    // Gravidade: recorrência + impacto no cliente + impacto operacional + relevância estratégica
    const recurrence = Math.min(count, 6) / 6 * 4; // 0-4
    const score = recurrence + def.impactWeight + def.operationalWeight * 0.5 + def.strategicWeight + highPriority * 0.4;
    const severity: Severity = score >= 9.5 ? 'critica' : score >= 7.5 ? 'alta' : score >= 5.5 ? 'media' : 'baixa';
    const sources = Array.from(new Set(evidence.map((e) => e.source)));
    const share = Math.round((neg / negTotal) * 100);
    const dates = evidence.map((e) => e.date).sort();
    const suggestions = evidence.filter((e) => e.type === 'sugestao').length;

    const observed = [
      `${count} manifestação(ões) relacionada(s) entre ${formatDateBR(dates[0])} e ${formatDateBR(dates[dates.length - 1])}.`,
      `${neg} negativa(s) — ${share}% de todas as manifestações negativas analisadas.`,
      `Fontes: ${sources.map((s) => SOURCES[s].label).join(', ')}.`,
    ];
    if (suggestions) observed.push(`${suggestions} sugestão(ões) de clientes ou equipe apontam no mesmo sentido.`);
    if (highPriority) observed.push(`${highPriority} registro(s) marcados com prioridade alta.`);

    const interpretations = [
      count >= 3
        ? `Mensagens escritas de formas diferentes descrevem o mesmo problema: ${def.name.toLowerCase()}. A recorrência indica uma falha de processo, não um caso isolado.`
        : `O tema aparece com baixa recorrência até o momento; merece acompanhamento antes de investimento elevado.`,
      `Possível causa: ${def.cause}`,
      `Impacto estimado: ${def.impact}`,
    ];

    result.push({
      id: def.id,
      name: def.name,
      category: def.category,
      description: def.description,
      evidence,
      count,
      sentiment,
      severity,
      severityScore: Math.round(score * 10) / 10,
      cause: def.cause,
      impact: def.impact,
      opportunity: def.opportunity,
      recommendation: def.recommendation,
      observed,
      interpretations,
      hypotheses: def.hypotheses,
      sources,
    });
  }
  return result.sort((a, b) => b.severityScore - a.severityScore);
}

export function formatDateBR(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export interface Stats {
  analyzed: number;
  pending: number;
  complaints: number;
  suggestions: number;
  praises: number;
  recurring: number;
  problems: number;
  opportunities: number;
  solutions: number;
  awaiting: number;
  implemented: number;
  sentiment: Record<Sentiment, number>;
  predominant: Sentiment;
  byCategory: { category: Category; label: string; count: number }[];
  byMonth: { month: string; label: string; total: number; negativo: number; positivo: number; neutro: number }[];
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;

export function computeStats(data: {
  manifestations: Manifestation[];
  companyName: string;
  problems: Problem[];
  opportunities: Opportunity[];
  solutionsCount: number;
  plans: { status: string }[];
}): Stats {
  const own = data.manifestations.filter((m) => isAnalyzable(m, data.companyName));
  const analyzedAll = data.manifestations.filter((m) => m.status === 'analisada');
  const sentiment: Record<Sentiment, number> = { positivo: 0, negativo: 0, neutro: 0 };
  own.forEach((m) => sentiment[m.sentiment]++);
  const predominant = (Object.keys(sentiment) as Sentiment[]).sort((a, b) => sentiment[b] - sentiment[a])[0];

  const catMap = new Map<Category, number>();
  own.filter((m) => m.sentiment !== 'positivo').forEach((m) => catMap.set(m.category, (catMap.get(m.category) || 0) + 1));
  const byCategory = Array.from(catMap.entries())
    .map(([category, count]) => ({ category, label: CATEGORIES[category], count }))
    .sort((a, b) => b.count - a.count);

  const monthMap = new Map<string, Stats['byMonth'][number]>();
  analyzedAll.forEach((m) => {
    const key = m.date.slice(0, 7);
    if (!monthMap.has(key)) monthMap.set(key, { month: key, label: monthLabel(key), total: 0, negativo: 0, positivo: 0, neutro: 0 });
    const row = monthMap.get(key)!;
    row.total++;
    row[m.sentiment]++;
  });
  const byMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  return {
    analyzed: analyzedAll.length,
    pending: data.manifestations.filter((m) => m.status === 'pendente').length,
    complaints: own.filter((m) => m.type === 'reclamacao').length,
    suggestions: analyzedAll.filter((m) => m.type === 'sugestao').length,
    praises: own.filter((m) => m.type === 'elogio').length,
    recurring: data.problems.filter((p) => p.count >= 2).length,
    problems: data.problems.length,
    opportunities: data.opportunities.filter((o) => o.status !== 'descartada').length,
    solutions: data.solutionsCount,
    awaiting: data.plans.filter((p) => p.status === 'aguardando_autorizacao').length,
    implemented: data.plans.filter((p) => p.status === 'concluido').length,
    sentiment,
    predominant,
    byCategory,
    byMonth,
  };
}

/** Nota 1-5 da empresa por critério, calculada a partir do sentimento das manifestações. */
export function companyScores(manifestations: Manifestation[], companyName: string): Record<Criterion, number> {
  const own = manifestations.filter((m) => isAnalyzable(m, companyName));
  const out = {} as Record<Criterion, number>;
  (Object.keys(CRITERIA_CATEGORIES) as Criterion[]).forEach((c) => {
    const rel = own.filter((m) => CRITERIA_CATEGORIES[c].includes(m.category));
    const pos = rel.filter((m) => m.sentiment === 'positivo').length;
    const neg = rel.filter((m) => m.sentiment === 'negativo').length;
    const neu = rel.filter((m) => m.sentiment === 'neutro').length;
    const total = pos + neg + neu;
    // Suavização bayesiana para evitar notas extremas com poucos dados
    const ratio = (pos + neu * 0.5 + 1.5) / (total + 3);
    out[c] = Math.round((1 + ratio * 4) * 10) / 10;
  });
  // Experiência considera também avaliações positivas gerais de qualidade
  return out;
}

export interface FeatureGap {
  feature: string;
  label: string;
  competitors: string[];
  recommendation: string;
  playbook?: string;
}

export function competitorGaps(company: Company, competitors: Competitor[]): FeatureGap[] {
  const gaps = new Map<string, FeatureGap>();
  competitors.forEach((c) =>
    c.features.forEach((f) => {
      if (company.features.includes(f) || !FEATURES[f]) return;
      if (!gaps.has(f)) gaps.set(f, { feature: f, label: FEATURES[f].label, competitors: [], recommendation: FEATURES[f].recommendation, playbook: FEATURES[f].playbook });
      gaps.get(f)!.competitors.push(c.name);
    }),
  );
  return Array.from(gaps.values()).sort((a, b) => b.competitors.length - a.competitors.length);
}

export function companyAdvantages(company: Company, competitors: Competitor[]) {
  return company.features.filter((f) => FEATURES[f] && competitors.filter((c) => c.features.includes(f)).length <= 1).map((f) => FEATURES[f].label);
}

export function opportunityScore(o: Opportunity, problems: Problem[]) {
  const p = problems.find((x) => x.id === o.problemId);
  const sev = p ? severityRank(p.severity) + 1 : 2;
  return o.impact * 2 - o.effort + sev + (p ? Math.min(p.count, 6) * 0.3 : 0.5);
}

export function rankOpportunities(opps: Opportunity[], problems: Problem[]) {
  return opps.filter((o) => o.status !== 'descartada').sort((a, b) => opportunityScore(b, problems) - opportunityScore(a, problems));
}

export interface Finding {
  tone: 'red' | 'orange' | 'green' | 'blue' | 'violet';
  title: string;
  text: string;
  kind: 'observado' | 'interpretacao' | 'competitivo' | 'mercado' | 'positivo';
}

/** Gera os achados da seção "O que o mercado está dizendo?". */
export function marketFindings(args: {
  problems: Problem[];
  manifestations: Manifestation[];
  company: Company;
  competitors: Competitor[];
}): Finding[] {
  const { problems, manifestations, company, competitors } = args;
  const out: Finding[] = [];
  const top = problems.slice(0, 2);
  top.forEach((p, i) => {
    out.push({
      tone: p.severity === 'critica' ? 'red' : 'orange',
      kind: 'interpretacao',
      title: p.name,
      text:
        i === 0 && p.id === 'p-fora-horario'
          ? `Clientes estão relatando dificuldade para obter atendimento fora do horário comercial (${p.count} manifestações em ${p.sources.length} fontes). A recorrência desse tema sugere uma oportunidade de melhoria no suporte.`
          : `${p.count} manifestações, vindas de ${p.sources.length} fontes diferentes, apontam para ${p.name.toLowerCase()}. A recorrência sugere uma falha de processo: ${p.cause.charAt(0).toLowerCase()}${p.cause.slice(1)}`,
    });
  });
  const gaps = competitorGaps(company, competitors);
  if (gaps[0]) {
    out.push({
      tone: 'violet',
      kind: 'competitivo',
      title: 'Movimento da concorrência',
      text: `${gaps[0].competitors.join(' e ')} já oferece(m) ${gaps[0].label.toLowerCase()}, recurso que a ${company.name} ainda não possui.`,
    });
  }
  const news = manifestations.filter((m) => m.type === 'noticia' && m.status === 'analisada').sort((a, b) => b.date.localeCompare(a.date))[0];
  if (news) {
    out.push({ tone: 'blue', kind: 'mercado', title: 'Tendência de mercado', text: news.content });
  }
  const praises = manifestations.filter((m) => isAnalyzable(m, company.name) && m.sentiment === 'positivo');
  if (praises.length) {
    out.push({
      tone: 'green',
      kind: 'positivo',
      title: 'Ponto forte reconhecido',
      text: `${praises.length} avaliações positivas destacam a qualidade técnica e a educação da equipe presencial — um ativo a preservar enquanto os canais digitais são melhorados.`,
    });
  }
  return out;
}
