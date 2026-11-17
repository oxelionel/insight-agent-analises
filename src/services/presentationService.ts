/** Insight Presentation Builder — gera a estrutura dos slides a partir dos dados. */
import type { AppData, Criterion, Opportunity, Plan, Problem, Solution } from '../types';
import { CRITERIA, LEVELS, OPPORTUNITY_TYPES, PRIORITIES, RECOMMENDATIONS, SEVERITIES, SOURCES } from '../data/catalog';
import { companyScores, competitorGaps } from './analysisEngine';
import { activeProvider } from './aiProvider';
import { buildPlanFromSolution } from './solutionEngine';
import { formatDate } from '../utils/format';

export type SlideKind = 'cover' | 'stats' | 'bullets' | 'quotes' | 'table' | 'steps' | 'conclusion' | 'problem';

export interface Slide {
  key: string;
  section: string;
  kind: SlideKind;
  title: string;
  subtitle?: string;
  bullets?: { text: string; tag?: string }[];
  stats?: { label: string; value: string }[];
  table?: { head: string[]; rows: string[][]; highlightCol?: number };
  quotes?: { text: string; meta: string }[];
  steps?: { title: string; meta: string; done?: boolean }[];
  big?: string;
  note?: string;
}

export function buildSlides(data: AppData, problems: Problem[], opp: Opportunity | undefined): { slides: Slide[]; isPreview: boolean } {
  const problem = problems.find((p) => p.id === opp?.problemId) ?? problems[0];
  let solution: Solution | undefined = data.solutions.find((s) => s.opportunityId === opp?.id);
  let isPreview = false;
  if (!solution && opp) {
    solution = activeProvider.proposeSolution(opp, { company: data.company, competitors: data.competitors, manifestations: data.manifestations, problems });
    isPreview = true;
  }
  let plan: Plan | undefined = solution && data.plans.find((p) => p.solutionId === solution!.id && p.status !== 'cancelado');
  if (!plan && solution) plan = buildPlanFromSolution(solution, opp);

  const analyzed = data.manifestations.filter((m) => m.status === 'analisada');
  const dates = analyzed.map((m) => m.date).sort();
  const scores = companyScores(data.manifestations, data.company.name);
  const crit = Object.keys(CRITERIA) as Criterion[];
  const gaps = competitorGaps(data.company, data.competitors);
  const rec = solution ? RECOMMENDATIONS[solution.recommendation] : undefined;
  const comps = data.competitors.slice(0, 3);

  const slides: Slide[] = [
    {
      key: 'capa', section: 'Capa', kind: 'cover',
      title: opp?.title ?? `Diagnóstico estratégico — ${data.company.name}`,
      subtitle: `${data.company.name} · Proposta de melhoria elaborada pelo Insight Agent`,
      note: `Período analisado: ${formatDate(dates[0])} a ${formatDate(dates[dates.length - 1])} · Ambiente demonstrativo`,
    },
    {
      key: 'contexto', section: 'Contextualização', kind: 'stats',
      title: 'Contexto da empresa e do mercado',
      subtitle: data.company.description,
      stats: [
        { label: 'manifestações analisadas', value: String(analyzed.length) },
        { label: 'categorias de fontes', value: String(new Set(analyzed.map((m) => m.source)).size) },
        { label: 'concorrentes monitorados', value: String(data.competitors.length) },
        { label: 'problemas identificados', value: String(problems.length) },
      ],
    },
    {
      key: 'problema', section: 'Problema identificado', kind: 'problem',
      title: problem?.name ?? 'Nenhum problema identificado',
      subtitle: problem?.description,
      big: problem ? String(problem.count) : '0',
      bullets: problem
        ? [
            { text: `manifestações relacionadas, de ${problem.sources.length} fontes diferentes` },
            { text: `Gravidade ${SEVERITIES[problem.severity].label.toLowerCase()} (pontuação ${problem.severityScore})` },
            { text: problem.impact },
          ]
        : [],
    },
    {
      key: 'evidencias', section: 'Evidências', kind: 'quotes',
      title: 'Palavras diferentes, o mesmo problema',
      subtitle: 'Manifestações demonstrativas agrupadas pelo agente',
      quotes: (problem?.evidence ?? []).slice(0, 4).map((e) => ({ text: e.content, meta: `${SOURCES[e.source].label} · ${formatDate(e.date)} · demo` })),
    },
    {
      key: 'cenario', section: 'Análise do cenário', kind: 'bullets',
      title: 'O que os dados mostram — e o que ainda precisa ser validado',
      bullets: [
        ...(problem?.observed.slice(0, 2).map((t) => ({ text: t, tag: 'Dado observado' })) ?? []),
        ...(problem ? [{ text: problem.cause, tag: 'Interpretação' }] : []),
        ...(problem?.hypotheses.slice(0, 2).map((t) => ({ text: t, tag: 'Hipótese' })) ?? []),
      ],
    },
    {
      key: 'competicao', section: 'Comparação competitiva', kind: 'table',
      title: 'Como nos comparamos aos concorrentes',
      subtitle: gaps[0] ? `${gaps[0].competitors.join(' e ')} já oferece(m) ${gaps[0].label.toLowerCase()}.` : undefined,
      table: {
        head: ['Critério', data.company.name, ...comps.map((c) => c.name)],
        rows: crit.map((k) => [CRITERIA[k], scores[k].toFixed(1), ...comps.map((c) => c.scores[k].toFixed(1))]),
        highlightCol: 1,
      },
      note: 'Concorrentes fictícios · notas demonstrativas de 1 a 5',
    },
    {
      key: 'oportunidade', section: 'Oportunidade', kind: 'stats',
      title: opp?.title ?? '—',
      subtitle: opp?.description,
      stats: opp
        ? [
            { label: 'impacto potencial', value: `${opp.impact}/5` },
            { label: 'esforço estimado', value: `${opp.effort}/5` },
            { label: 'prioridade', value: PRIORITIES[opp.priority] },
            { label: 'tipo', value: OPPORTUNITY_TYPES[opp.type] },
          ]
        : [],
    },
    {
      key: 'solucao', section: 'Solução proposta', kind: 'bullets',
      title: solution?.title ?? '—',
      subtitle: solution ? `Complexidade ${LEVELS[solution.complexity].toLowerCase()} · prazo ${solution.timeframe}` : undefined,
      bullets: solution?.proposal.map((t, i) => ({ text: t, tag: String(i + 1) })) ?? [],
    },
    {
      key: 'beneficios', section: 'Benefícios esperados', kind: 'bullets',
      title: 'Benefícios esperados',
      subtitle: solution?.resources.orcamento,
      bullets: solution?.benefits.map((t) => ({ text: t, tag: '✓' })) ?? [],
    },
    {
      key: 'plano', section: 'Plano de implementação', kind: 'steps',
      title: 'Plano de implementação',
      subtitle: plan ? `${plan.steps.length} etapas · ${formatDate(plan.steps[0]?.start)} a ${formatDate(plan.steps[plan.steps.length - 1]?.due)}` : undefined,
      steps: plan?.steps.map((s) => ({ title: s.title, meta: `${s.owner} · até ${formatDate(s.due)}`, done: s.done })) ?? [],
    },
    {
      key: 'kpis', section: 'Indicadores de sucesso', kind: 'table',
      title: 'Indicadores de sucesso',
      subtitle: solution ? `Acompanhar também: ${solution.kpis.slice(0, 3).join(', ').toLowerCase()}.` : undefined,
      table: { head: ['Indicador', 'Linha de base', 'Meta'], rows: plan?.kpis.map((k) => [k.name, k.baseline, k.target]) ?? [], highlightCol: 2 },
      note: 'Valores demonstrativos',
    },
    {
      key: 'conclusao', section: 'Conclusão', kind: 'conclusion',
      title: rec ? `Recomendação: ${rec.label.toLowerCase()}` : 'Conclusão',
      subtitle: solution?.rationale,
      bullets: [
        { text: 'Próximo passo: submeter o plano à autorização humana.' },
        { text: 'Executar piloto, medir indicadores e decidir sobre a expansão.' },
      ],
      note: 'Do feedback à estratégia. Da crítica à oportunidade.',
    },
  ];
  return { slides, isPreview };
}
