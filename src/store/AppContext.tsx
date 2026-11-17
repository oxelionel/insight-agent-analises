import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Activity, AppData, Company, Competitor, Manifestation, Opportunity, Plan, PlanStatus, Problem, ReportRecord, Settings } from '../types';
import { createDemoData } from '../data/seed';
import { storage } from '../services/storage';
import { activeProvider } from '../services/aiProvider';
import { computeStats, type Stats } from '../services/analysisEngine';
import { buildPlanFromSolution } from '../services/solutionEngine';
import { getDefinition } from '../data/knowledgeBase';
import { PLAYBOOKS } from '../services/playbooks';
import { nowISO, todayISO, uid } from '../utils/format';

export type NewManifestation = Omit<Manifestation, 'id' | 'demo' | 'status' | 'type'> & { autoClassify: boolean; type?: Manifestation['type'] };

interface AppContextValue {
  data: AppData;
  problems: Problem[];
  stats: Stats;
  updateCompany: (c: Company) => void;
  addManifestation: (m: NewManifestation) => Manifestation;
  updateManifestation: (id: string, patch: Partial<Manifestation>) => void;
  deleteManifestation: (id: string) => void;
  runAnalysis: () => { analyzed: number; newProblems: string[] };
  saveCompetitor: (c: Competitor) => void;
  deleteCompetitor: (id: string) => void;
  createOpportunityFromProblem: (problemId: string) => Opportunity | undefined;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void;
  addOpportunity: (o: Omit<Opportunity, 'id' | 'createdAt' | 'status'>) => Opportunity;
  deleteOpportunity: (id: string) => void;
  generateSolutionFor: (opportunityId: string) => string | undefined;
  deleteSolution: (id: string) => void;
  createPlan: (solutionId: string) => string | undefined;
  updatePlan: (id: string, patch: Partial<Plan>, log?: string) => void;
  setPlanStatus: (id: string, status: PlanStatus, extra?: { note?: string }) => void;
  deletePlan: (id: string) => void;
  addReport: (r: Omit<ReportRecord, 'id' | 'createdAt'>) => ReportRecord;
  log: (type: Activity['type'], description: string, status?: Activity['status'], actor?: string) => void;
  setSlideOverride: (key: string, value: { title?: string; subtitle?: string }) => void;
  clearSlideOverrides: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  resetDemo: () => void;
  clearAll: () => void;
  importData: (d: AppData) => boolean;
}

const Ctx = createContext<AppContextValue | null>(null);

const emptyData = (settings: Settings): AppData => ({
  version: 1,
  company: { name: 'Minha empresa', segment: '', description: '', products: [], services: [], audience: '', differentials: [], knownIssues: [], goals: [], features: [] },
  competitors: [],
  manifestations: [],
  opportunities: [],
  solutions: [],
  plans: [],
  activities: [],
  reports: [],
  slideOverrides: {},
  settings,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => storage.load() ?? createDemoData());
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    storage.save(data);
  }, [data]);

  const problems = useMemo(() => activeProvider.detectProblems(data.manifestations, data.company.name), [data.manifestations, data.company.name]);
  const stats = useMemo(
    () =>
      computeStats({
        manifestations: data.manifestations,
        companyName: data.company.name,
        problems,
        opportunities: data.opportunities,
        solutionsCount: data.solutions.length,
        plans: data.plans,
      }),
    [data, problems],
  );

  const actor = data.settings.userName ? `${data.settings.userName} (demo)` : 'Usuário (demo)';

  const makeActivity = (type: Activity['type'], description: string, status: Activity['status'] = 'sucesso', who = actor): Activity => ({
    id: uid('a'),
    timestamp: nowISO(),
    type,
    description,
    actor: who,
    status,
  });

  const mutate = useCallback((fn: (d: AppData) => AppData) => setData((prev) => fn(prev)), []);

  const log: AppContextValue['log'] = (type, description, status = 'sucesso', who) =>
    mutate((d) => ({ ...d, activities: [makeActivity(type, description, status, who), ...d.activities] }));

  const value: AppContextValue = {
    data,
    problems,
    stats,
    log,
    updateCompany: (company) =>
      mutate((d) => {
        // Mantém as manifestações vinculadas ao nome antigo associadas ao novo nome
        const renamed = d.company.name !== company.name;
        return {
          ...d,
          company,
          manifestations: renamed ? d.manifestations.map((m) => (m.company === d.company.name ? { ...m, company: company.name } : m)) : d.manifestations,
          activities: [makeActivity('empresa_atualizada', `Cadastro da empresa "${company.name}" atualizado.`), ...d.activities],
        };
      }),

    addManifestation: (input) => {
      const { autoClassify, ...rest } = input;
      let m: Manifestation = { ...rest, id: uid('m'), demo: false, status: 'pendente', type: rest.type ?? 'neutro' };
      if (autoClassify) {
        m = { ...m, ...activeProvider.classify(m, dataRef.current.company.name) };
      } else if (!input.type) {
        m.type = activeProvider.classify(m, dataRef.current.company.name).type;
      }
      mutate((d) => ({
        ...d,
        manifestations: [m, ...d.manifestations],
        activities: [makeActivity('manifestacao_cadastrada', `Manifestação cadastrada (${m.source.replace('_', ' ')}): “${m.content.slice(0, 70)}${m.content.length > 70 ? '…' : ''}”`), ...d.activities],
      }));
      return m;
    },

    updateManifestation: (id, patch) =>
      mutate((d) => ({
        ...d,
        manifestations: d.manifestations.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        activities: [makeActivity('manifestacao_editada', `Manifestação ${id} atualizada.`, 'info'), ...d.activities],
      })),

    deleteManifestation: (id) =>
      mutate((d) => ({
        ...d,
        manifestations: d.manifestations.filter((m) => m.id !== id),
        activities: [makeActivity('manifestacao_excluida', `Manifestação ${id} excluída.`, 'alerta'), ...d.activities],
      })),

    runAnalysis: () => {
      const d0 = dataRef.current;
      const before = activeProvider.detectProblems(d0.manifestations, d0.company.name);
      const pending = d0.manifestations.filter((m) => m.status === 'pendente').length;
      const nextManifestations = d0.manifestations.map((m) => (m.status === 'pendente' ? { ...m, status: 'analisada' as const } : m));
      const after = activeProvider.detectProblems(nextManifestations, d0.company.name);
      const newProblems = after.filter((p) => !before.some((b) => b.id === p.id)).map((p) => p.name);
      const grown = after.filter((p) => {
        const b = before.find((x) => x.id === p.id);
        return b && b.count !== p.count;
      });
      const ts = nowISO();
      const acts: Activity[] = [
        { ...makeActivity('analise_executada', `Análise executada: ${pending} nova(s) manifestação(ões) processada(s); ${after.length} problemas ativos.`, 'sucesso', 'Insight Agent'), timestamp: ts },
        ...newProblems.map((n) => ({ ...makeActivity('problema_identificado', `Novo problema identificado: ${n}.`, 'alerta', 'Insight Agent'), timestamp: ts })),
        ...grown.map((p) => ({ ...makeActivity('problema_identificado', `Recorrência atualizada: "${p.name}" agora com ${p.count} manifestações.`, 'info', 'Insight Agent'), timestamp: ts })),
      ];
      setData((d) => ({ ...d, manifestations: nextManifestations, lastAnalysisAt: ts, activities: [...acts.reverse(), ...d.activities] }));
      return { analyzed: pending, newProblems };
    },

    saveCompetitor: (c) =>
      mutate((d) => {
        const exists = d.competitors.some((x) => x.id === c.id);
        return {
          ...d,
          competitors: exists ? d.competitors.map((x) => (x.id === c.id ? c : x)) : [...d.competitors, c],
          activities: [makeActivity('concorrente_atualizado', `Concorrente "${c.name}" ${exists ? 'atualizado' : 'cadastrado'}.`), ...d.activities],
        };
      }),

    deleteCompetitor: (id) =>
      mutate((d) => ({
        ...d,
        competitors: d.competitors.filter((c) => c.id !== id),
        activities: [makeActivity('concorrente_atualizado', `Concorrente removido.`, 'alerta'), ...d.activities],
      })),

    createOpportunityFromProblem: (problemId) => {
      const def = getDefinition(problemId);
      const problem = problems.find((p) => p.id === problemId);
      if (!def || !problem) return undefined;
      const existing = dataRef.current.opportunities.find((o) => o.problemId === problemId);
      if (existing) return existing;
      const pb = PLAYBOOKS[problemId];
      const sevImpact = { baixa: 2, media: 3, alta: 4, critica: 5 }[problem.severity];
      const opp: Opportunity = {
        id: uid('o'),
        title: pb?.title ?? def.opportunity,
        description: def.opportunity,
        problemId,
        playbook: problemId,
        origin: 'analise',
        type: def.category === 'tecnologia' ? 'eficiencia' : def.category === 'preco' ? 'retencao' : 'experiencia_cliente',
        benefit: pb?.expectedResult ?? 'Reduzir manifestações negativas relacionadas.',
        complexity: pb?.complexity ?? 'media',
        impact: sevImpact,
        effort: pb ? { baixa: 2, media: 3, alta: 4 }[pb.complexity] : 3,
        priority: sevImpact >= 4 ? 'alta' : sevImpact === 3 ? 'media' : 'baixa',
        status: 'nova',
        createdAt: todayISO(),
        extraEvidence: [],
      };
      mutate((d) => ({
        ...d,
        opportunities: [...d.opportunities, opp],
        activities: [makeActivity('oportunidade_criada', `Oportunidade "${opp.title}" criada a partir do problema "${problem.name}".`, 'sucesso', 'Insight Agent'), ...d.activities],
      }));
      return opp;
    },

    addOpportunity: (o) => {
      const opp: Opportunity = { ...o, id: uid('o'), createdAt: todayISO(), status: 'nova' };
      mutate((d) => ({
        ...d,
        opportunities: [...d.opportunities, opp],
        activities: [makeActivity('oportunidade_criada', `Oportunidade "${opp.title}" criada (${opp.origin === 'concorrente' ? 'inteligência competitiva' : 'cadastro manual'}).`), ...d.activities],
      }));
      return opp;
    },

    deleteOpportunity: (id) =>
      mutate((d) => ({ ...d, opportunities: d.opportunities.filter((o) => o.id !== id), activities: [makeActivity('oportunidade_criada', 'Oportunidade removida.', 'alerta'), ...d.activities] })),

    updateOpportunity: (id, patch) => mutate((d) => ({ ...d, opportunities: d.opportunities.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),

    generateSolutionFor: (opportunityId) => {
      const d0 = dataRef.current;
      const opp = d0.opportunities.find((o) => o.id === opportunityId);
      if (!opp) return undefined;
      const solution = activeProvider.proposeSolution(opp, { company: d0.company, competitors: d0.competitors, manifestations: d0.manifestations, problems });
      mutate((d) => ({
        ...d,
        solutions: [solution, ...d.solutions.filter((s) => s.opportunityId !== opportunityId || d.plans.some((p) => p.solutionId === s.id))],
        opportunities: d.opportunities.map((o) => (o.id === opportunityId ? { ...o, status: 'solucao_gerada' } : o)),
        activities: [makeActivity('solucao_elaborada', `Solução estratégica elaborada para "${opp.title}" — recomendação: ${solution.recommendation}.`, 'sucesso', 'Insight Agent'), ...d.activities],
      }));
      return solution.id;
    },

    deleteSolution: (id) => mutate((d) => ({ ...d, solutions: d.solutions.filter((s) => s.id !== id) })),

    createPlan: (solutionId) => {
      const d0 = dataRef.current;
      const sol = d0.solutions.find((s) => s.id === solutionId);
      if (!sol) return undefined;
      const existing = d0.plans.find((p) => p.solutionId === solutionId && p.status !== 'cancelado');
      if (existing) return existing.id;
      const opp = d0.opportunities.find((o) => o.id === sol.opportunityId);
      const plan = buildPlanFromSolution(sol, opp);
      mutate((d) => ({
        ...d,
        plans: [plan, ...d.plans],
        activities: [makeActivity('plano_criado', `Plano de ação "${plan.name}" criado com ${plan.steps.length} etapas.`), ...d.activities],
      }));
      return plan.id;
    },

    updatePlan: (id, patch, logText) =>
      mutate((d) => ({
        ...d,
        plans: d.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        activities: logText ? [makeActivity('plano_atualizado', logText, 'info'), ...d.activities] : d.activities,
      })),

    setPlanStatus: (id, status, extra) =>
      mutate((d) => {
        const plan = d.plans.find((p) => p.id === id);
        if (!plan) return d;
        const ts = nowISO();
        let next: Plan = { ...plan, status };
        let act: Activity;
        switch (status) {
          case 'aguardando_autorizacao':
            next.approval = { ...plan.approval, requestedAt: ts };
            act = makeActivity('autorizacao_solicitada', `Autorização solicitada para "${plan.name}".`, 'pendente');
            break;
          case 'aprovado':
            next.approval = { ...plan.approval, decidedAt: ts, decidedBy: actor, note: extra?.note };
            act = makeActivity('melhoria_aprovada', `Melhoria "${plan.name}" aprovada por ${actor} após revisão explícita.`);
            break;
          case 'reprovado':
            next.approval = { ...plan.approval, decidedAt: ts, decidedBy: actor, note: extra?.note };
            act = makeActivity('melhoria_reprovada', `Melhoria "${plan.name}" reprovada${extra?.note ? `: ${extra.note}` : '.'}`, 'alerta');
            break;
          case 'em_execucao':
            next.execution = { startedAt: ts, log: [`${ts} — Execução demonstrativa iniciada.`] };
            act = makeActivity('execucao_realizada', `Execução demonstrativa iniciada: "${plan.name}".`, 'info', 'Insight Agent');
            break;
          case 'concluido':
            next = {
              ...next,
              steps: next.steps.map((s) => ({ ...s, done: true })),
              kpis: next.kpis.map((k) => ({ ...k, current: k.target })),
              execution: { ...(plan.execution ?? { log: [] }), finishedAt: ts, log: [...(plan.execution?.log ?? []), `${ts} — Execução demonstrativa concluída (simulação).`] },
            };
            act = makeActivity('execucao_realizada', `Execução demonstrativa concluída: "${plan.name}". Nenhum sistema externo foi alterado.`, 'sucesso', 'Insight Agent');
            break;
          case 'cancelado':
            act = makeActivity('plano_atualizado', `Plano "${plan.name}" cancelado.`, 'alerta');
            break;
          default:
            act = makeActivity('plano_atualizado', `Status do plano "${plan.name}" alterado.`, 'info');
        }
        return { ...d, plans: d.plans.map((p) => (p.id === id ? next : p)), activities: [act, ...d.activities] };
      }),

    deletePlan: (id) =>
      mutate((d) => ({ ...d, plans: d.plans.filter((p) => p.id !== id), activities: [makeActivity('plano_atualizado', 'Plano de ação excluído.', 'alerta'), ...d.activities] })),

    addReport: (r) => {
      const rec: ReportRecord = { ...r, id: uid('r'), createdAt: nowISO() };
      mutate((d) => ({ ...d, reports: [rec, ...d.reports], activities: [makeActivity('relatorio_gerado', `Relatório executivo gerado (${r.title}).`), ...d.activities] }));
      return rec;
    },

    setSlideOverride: (key, value) => mutate((d) => ({ ...d, slideOverrides: { ...d.slideOverrides, [key]: { ...d.slideOverrides[key], ...value } } })),
    clearSlideOverrides: () => mutate((d) => ({ ...d, slideOverrides: {} })),
    updateSettings: (s) => mutate((d) => ({ ...d, settings: { ...d.settings, ...s } })),
    resetDemo: () => {
      const fresh = createDemoData();
      fresh.activities = [makeActivity('sistema', 'Dados demonstrativos restaurados.', 'info'), ...fresh.activities];
      setData(fresh);
    },
    clearAll: () => setData(emptyData(dataRef.current.settings)),
    importData: (d) => {
      if (!d || d.version !== 1 || !Array.isArray(d.manifestations)) return false;
      setData(d);
      return true;
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp deve ser usado dentro de AppProvider');
  return v;
}
