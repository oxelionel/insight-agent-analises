/** Monta o conteúdo do relatório executivo e da apresentação a partir dos dados do sistema. */
import type { AppData, Criterion, Manifestation, Opportunity, Problem, Solution } from '../types';
import { companyScores, competitorGaps, computeProblems, computeStats, rankOpportunities, type FeatureGap, type Stats } from './analysisEngine';
import { CRITERIA, RECOMMENDATIONS, SENTIMENTS, SEVERITIES } from '../data/catalog';
import { formatDate, pct } from '../utils/format';

export interface ReportModel {
  companyName: string;
  segment: string;
  periodStart: string;
  periodEnd: string;
  manifestations: Manifestation[];
  stats: Stats;
  problems: Problem[];
  suggestions: Manifestation[];
  scores: Record<Criterion, number>;
  gaps: FeatureGap[];
  opportunities: Opportunity[];
  solutions: Solution[];
  plans: AppData['plans'];
  summary: string[];
  conclusion: string[];
  topOpportunity?: Opportunity;
  topSolution?: Solution;
  topProblem?: Problem;
  bestCriterion: Criterion;
  worstCriterion: Criterion;
}

export function dataPeriod(data: AppData) {
  const dates = data.manifestations.map((m) => m.date).sort();
  return { start: dates[0] ?? '', end: dates[dates.length - 1] ?? '' };
}

export function buildReport(data: AppData, periodStart: string, periodEnd: string): ReportModel {
  const manifestations = data.manifestations.filter((m) => m.status === 'analisada' && m.date >= periodStart && m.date <= periodEnd);
  const problems = computeProblems(manifestations, data.company.name);
  const stats = computeStats({ manifestations, companyName: data.company.name, problems, opportunities: data.opportunities, solutionsCount: data.solutions.length, plans: data.plans });
  const scores = companyScores(manifestations, data.company.name);
  const gaps = competitorGaps(data.company, data.competitors);
  const opportunities = rankOpportunities(data.opportunities, problems);
  const topOpportunity = opportunities[0];
  const topSolution = data.solutions.find((s) => s.opportunityId === topOpportunity?.id) ?? data.solutions[0];
  const topProblem = problems[0];
  const crit = Object.keys(CRITERIA) as Criterion[];
  const bestCriterion = crit.reduce((a, b) => (scores[b] > scores[a] ? b : a));
  const worstCriterion = crit.reduce((a, b) => (scores[b] < scores[a] ? b : a));
  const total = stats.sentiment.positivo + stats.sentiment.negativo + stats.sentiment.neutro;
  const suggestions = manifestations.filter((m) => m.type === 'sugestao');
  const recurring = problems.filter((p) => p.count >= 2);

  const summary = [
    `Entre ${formatDate(periodStart)} e ${formatDate(periodEnd)}, o Insight Agent analisou ${stats.analyzed} manifestações demonstrativas sobre a ${data.company.name} e o seu mercado, provenientes de ${new Set(manifestations.map((m) => m.source)).size} categorias de fontes.`,
    `O sentimento predominante foi ${SENTIMENTS[stats.predominant].label.toLowerCase()}: ${pct(stats.sentiment.negativo, total)}% negativas, ${pct(stats.sentiment.neutro, total)}% neutras e ${pct(stats.sentiment.positivo, total)}% positivas.`,
    topProblem
      ? `Foram identificados ${problems.length} problemas, ${recurring.length} deles recorrentes. O mais grave é “${topProblem.name}” (gravidade ${SEVERITIES[topProblem.severity].label.toLowerCase()}, ${topProblem.count} manifestações).`
      : 'Não foram identificados problemas recorrentes no período.',
    gaps[0] ? `Na comparação competitiva, ${gaps.length} recursos oferecidos por concorrentes ainda não estão disponíveis na empresa — com destaque para ${gaps[0].label.toLowerCase()}.` : 'A empresa possui os principais recursos mapeados na concorrência.',
    topOpportunity ? `A oportunidade prioritária é “${topOpportunity.title}”, com impacto ${topOpportunity.impact}/5 e esforço ${topOpportunity.effort}/5.` : '',
  ].filter(Boolean);

  const conclusion = [
    `A ${data.company.name} tem um ativo claro em ${CRITERIA[bestCriterion].toLowerCase()} (nota ${scores[bestCriterion].toFixed(1)}), mas perde valor em ${CRITERIA[worstCriterion].toLowerCase()} (nota ${scores[worstCriterion].toFixed(1)}).`,
    topSolution ? `Recomenda-se priorizar “${topSolution.title}” (${RECOMMENDATIONS[topSolution.recommendation].label.toLowerCase()}), seguida das demais oportunidades de alta prioridade.` : '',
    `${data.plans.filter((p) => p.status === 'aguardando_autorizacao').length} melhoria(s) aguardam autorização humana e ${data.plans.filter((p) => p.status === 'concluido').length} foi(ram) concluída(s) na demonstração.`,
    'Hipóteses apresentadas neste relatório devem ser validadas com dados operacionais antes de decisões de investimento.',
  ].filter(Boolean);

  return {
    companyName: data.company.name,
    segment: data.company.segment,
    periodStart,
    periodEnd,
    manifestations,
    stats,
    problems,
    suggestions,
    scores,
    gaps,
    opportunities,
    solutions: data.solutions,
    plans: data.plans,
    summary,
    conclusion,
    topOpportunity,
    topSolution,
    topProblem,
    bestCriterion,
    worstCriterion,
  };
}
