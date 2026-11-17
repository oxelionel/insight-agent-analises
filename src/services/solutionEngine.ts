/**
 * Agente de Soluções (demonstrativo).
 * Combina o playbook do tipo de problema com os dados atuais do sistema
 * (evidências, fontes, concorrentes) para estruturar uma solução contextualizada.
 */
import type { Company, Competitor, Manifestation, Opportunity, Plan, Problem, Solution } from '../types';
import { PLAYBOOKS } from './playbooks';
import { FEATURES, SOURCES } from '../data/catalog';
import { getDefinition } from '../data/knowledgeBase';
import { uid, todayISO, addDays } from '../utils/format';

export interface SolutionContext {
  company: Company;
  competitors: Competitor[];
  manifestations: Manifestation[];
  problems: Problem[];
}

export const hasPlaybook = (key: string) => Boolean(PLAYBOOKS[key]);

export function generateSolution(opp: Opportunity, ctx: SolutionContext): Solution {
  const pb = PLAYBOOKS[opp.playbook] ?? PLAYBOOKS['p-demora-atendimento'];
  const problem = ctx.problems.find((p) => p.id === opp.problemId);
  const def = opp.problemId ? getDefinition(opp.problemId) : undefined;
  const competitorsWith = pb.feature ? ctx.competitors.filter((c) => c.features.includes(pb.feature!)) : [];
  const companyHas = pb.feature ? ctx.company.features.includes(pb.feature) : false;

  const context: string[] = [];
  if (problem) {
    context.push(`${problem.count} manifestações analisadas tratam do tema, vindas de: ${problem.sources.map((s) => SOURCES[s].label).join(', ')}.`);
    problem.evidence.slice(0, 3).forEach((e) => context.push(`Evidência (${SOURCES[e.source].label}, demo): “${e.content}”`));
  } else {
    const signals = ctx.manifestations.filter((m) => m.status === 'analisada' && ['noticia', 'sugestao', 'concorrente'].includes(m.type)).length;
    context.push(`${signals} sinais de mercado analisados (notícias, sugestões e informações de concorrentes) compõem o contexto.`);
  }
  opp.extraEvidence.forEach((e) => context.push(e));
  if (pb.feature && competitorsWith.length && !companyHas) {
    context.push(`Concorrentes demonstrativos que já oferecem “${FEATURES[pb.feature].label}”: ${competitorsWith.map((c) => c.name).join(', ')}. A ${ctx.company.name} ainda não oferece.`);
  }

  const analysis: string[] = [];
  if (def) analysis.push(`Causa provável (interpretação do agente): ${def.cause}`);
  if (problem) analysis.push(`Gravidade classificada como ${problem.severity === 'critica' ? 'crítica' : problem.severity} (pontuação ${problem.severityScore}), considerando recorrência, impacto no cliente, impacto operacional e relevância estratégica.`);
  if (def) def.hypotheses.forEach((h) => analysis.push(`Hipótese a validar: ${h}`));
  if (!def) analysis.push('Oportunidade originada de sinais de mercado (notícias, sugestões e movimentos de concorrentes), não de uma falha atual. Requer validação de demanda.');

  const evidenceStrength = problem ? problem.count : opp.extraEvidence.length;
  let recommendation = pb.recommendation;
  if (problem && problem.count <= 1 && recommendation === 'implementar') recommendation = 'testar';

  const rationale =
    recommendation === 'implementar'
      ? `Recomendação: implementar. Há ${evidenceStrength} evidências convergentes${competitorsWith.length ? ' e pressão competitiva direta' : ''}, com complexidade ${pb.complexity} e retorno esperado alto.`
      : recommendation === 'testar'
        ? `Recomendação: testar em piloto. O problema é relevante, mas a complexidade (${pb.complexity}) ou a incerteza sobre os resultados justifica validar em escala reduzida antes de expandir.`
        : recommendation === 'investigar'
          ? 'Recomendação: investigar. Os sinais de mercado são promissores, mas ainda não há demanda comprovada entre os clientes atuais — sugere-se pesquisa antes do investimento.'
          : 'Recomendação: descartar no momento. Retorno baixo frente ao esforço.';

  return {
    id: uid('s'),
    opportunityId: opp.id,
    problemId: opp.problemId,
    createdAt: todayISO(),
    title: pb.title,
    problem: problem ? `${problem.name}: ${problem.description}` : `${opp.title}: ${opp.description}`,
    context,
    analysis,
    proposal: pb.proposal,
    benefits: [...pb.benefits, opp.benefit],
    resources: pb.resources,
    complexity: pb.complexity,
    timeframe: pb.timeframe,
    kpis: pb.kpis,
    risks: pb.risks,
    recommendation,
    rationale,
  };
}

export function buildPlanFromSolution(solution: Solution, opp: Opportunity | undefined, startDate = todayISO()): Plan {
  const pb = PLAYBOOKS[opp?.playbook ?? ''] ?? PLAYBOOKS['p-demora-atendimento'];
  const span = pb.timeframe === 'curto' ? 10 : pb.timeframe === 'medio' ? 14 : 21;
  const steps = pb.steps.map(([title, owner], i) => ({
    id: uid('st'),
    title,
    owner,
    start: addDays(startDate, i * span),
    due: addDays(startDate, (i + 1) * span - 1),
    done: false,
  }));
  return {
    id: uid('pl'),
    solutionId: solution.id,
    name: solution.title,
    problem: solution.problem,
    objective: pb.objective,
    expectedResult: pb.expectedResult,
    owner: steps[0]?.owner ?? 'Responsável (demo)',
    steps,
    resources: Object.values(pb.resources),
    investment: pb.investment,
    kpis: pb.planKpis.map((k) => ({ ...k, current: k.baseline })),
    risks: pb.risks,
    status: 'em_elaboracao',
    createdAt: startDate,
  };
}
