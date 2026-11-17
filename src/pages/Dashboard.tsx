import { useMemo } from 'react';
import {
  LuMessagesSquare, LuThumbsDown, LuLightbulb, LuRepeat, LuSparkles, LuWandSparkles, LuClock, LuRocket,
  LuArrowRight, LuBrainCircuit, LuQuote, LuShieldCheck,
} from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { Badge, Button, Card, CardHeader } from '../components/ui/primitives';
import { CycleFlow, StatCard, type PageProps } from '../components/domain';
import { COMPANY_COLOR, DonutChart, GroupedBarChart, HBarChart, LineChart } from '../components/charts/Charts';
import { companyScores, marketFindings, monthLabel, rankOpportunities } from '../services/analysisEngine';
import { CRITERIA, OPPORTUNITY_TYPES, PRIORITIES, SENTIMENTS } from '../data/catalog';
import { getDefinition } from '../data/knowledgeBase';
import { navigate } from '../utils/router';
import { formatDateTime, pct } from '../utils/format';
import type { Criterion } from '../types';

export default function Dashboard(_: PageProps) {
  const { data, problems, stats } = useApp();
  const ranked = useMemo(() => rankOpportunities(data.opportunities, problems), [data.opportunities, problems]);
  const findings = useMemo(() => marketFindings({ problems, manifestations: data.manifestations, company: data.company, competitors: data.competitors }), [problems, data]);
  const scores = useMemo(() => companyScores(data.manifestations, data.company.name), [data.manifestations, data.company.name]);
  const criteria = Object.keys(CRITERIA) as Criterion[];
  const top = ranked[0];
  const topProblem = problems.find((p) => p.id === top?.problemId);
  const topSolution = data.solutions.find((s) => s.opportunityId === top?.id);

  // Evolução acumulada de oportunidades por mês
  const oppEvolution = useMemo(() => {
    const months = Array.from(new Set([...stats.byMonth.map((m) => m.month), ...data.opportunities.map((o) => o.createdAt.slice(0, 7))])).sort();
    return months.map((m) => ({
      label: monthLabel(m),
      values: {
        total: data.opportunities.filter((o) => o.createdAt.slice(0, 7) <= m).length,
        solucoes: data.solutions.filter((s) => s.createdAt.slice(0, 7) <= m).length,
      },
    }));
  }, [stats.byMonth, data.opportunities, data.solutions]);

  const negShare = pct(stats.sentiment.negativo, stats.sentiment.negativo + stats.sentiment.positivo + stats.sentiment.neutro);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="hero-grid relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-blue-950/20 md:p-8">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge tone="navy" className="bg-white/10 ring-white/20">
              <LuSparkles className="h-3 w-3" /> Insight Agent · {data.company.name}
            </Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-[34px]">Do feedback à estratégia. Da crítica à oportunidade.</h1>
            <p className="mt-3 text-sm leading-relaxed text-blue-100/80">
              {stats.analyzed} manifestações analisadas, {stats.problems} problemas identificados e {stats.opportunities} oportunidades priorizadas.
              {stats.pending > 0 && ` ${stats.pending} novas manifestações aguardam análise.`}
            </p>
            <p className="mt-2 text-[11px] text-blue-200/60">Última análise: {formatDateTime(data.lastAnalysisAt)} · Ambiente demonstrativo — dados simulados</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20" icon={LuBrainCircuit} onClick={() => navigate('monitoramento')}>
              {stats.pending ? `Analisar ${stats.pending} novas` : 'Ver monitoramento'}
            </Button>
            <Button variant="secondary" className="border-white bg-white !text-[#0b1733] hover:bg-blue-50" icon={LuArrowRight} onClick={() => navigate('relatorios')}>
              Relatório executivo
            </Button>
          </div>
        </div>
        <div className="relative mt-7">
          <CycleFlow
            dark
            counts={{
              escutar: stats.analyzed + stats.pending,
              analisar: stats.analyzed,
              identificar: stats.problems,
              comparar: data.competitors.length,
              propor: stats.solutions,
              planejar: data.plans.length,
              autorizar: stats.awaiting ? `${stats.awaiting} pendente` : '0 pendente',
              executar: stats.implemented,
            }}
          />
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Manifestações analisadas" value={stats.analyzed} icon={LuMessagesSquare} onClick={() => navigate('monitoramento')} />
        <StatCard label="Reclamações" value={stats.complaints} icon={LuThumbsDown} tone="red" onClick={() => navigate('monitoramento', { tipo: 'reclamacao' })} />
        <StatCard label="Sugestões de melhoria" value={stats.suggestions} icon={LuLightbulb} tone="amber" onClick={() => navigate('monitoramento', { tipo: 'sugestao' })} />
        <StatCard label="Problemas recorrentes" value={stats.recurring} icon={LuRepeat} tone="orange" onClick={() => navigate('analise')} />
        <StatCard label="Oportunidades" value={stats.opportunities} icon={LuSparkles} tone="green" onClick={() => navigate('oportunidades')} />
        <StatCard label="Soluções propostas" value={stats.solutions} icon={LuWandSparkles} tone="violet" onClick={() => navigate('solucoes')} />
        <StatCard label="Aguardando autorização" value={stats.awaiting} icon={LuClock} tone="amber" onClick={() => navigate('planos')} />
        <StatCard label="Implementadas (demo)" value={stats.implemented} icon={LuRocket} tone="green" onClick={() => navigate('planos')} />
      </section>

      {/* Recomendação + mercado */}
      <section className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="O que o mercado está dizendo?" subtitle="Principais achados do agente a partir dos dados demonstrativos" icon={LuQuote} />
          <div className="space-y-3">
            {findings.map((f, i) => {
              const bar = { red: 'bg-red-500', orange: 'bg-orange-500', green: 'bg-emerald-500', blue: 'bg-blue-500', violet: 'bg-violet-500' }[f.tone];
              const kind = { observado: 'Dado observado', interpretacao: 'Interpretação do agente', competitivo: 'Inteligência competitiva', mercado: 'Notícia demonstrativa', positivo: 'Dado observado' }[f.kind];
              return (
                <div key={i} className="relative flex gap-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 p-4 pl-5">
                  <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{kind}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="relative overflow-hidden border-blue-200 bg-gradient-to-br from-white to-blue-50/60 xl:col-span-2">
          <CardHeader title="Recomendação do Insight Agent" subtitle="Prioridade calculada por impacto, esforço, gravidade e recorrência" icon={LuSparkles} />
          {top ? (
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="red">Prioridade {PRIORITIES[top.priority].toLowerCase()}</Badge>
                <Badge tone="blue">{OPPORTUNITY_TYPES[top.type]}</Badge>
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{top.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {topProblem
                  ? `${topProblem.count} manifestações, de ${topProblem.sources.length} fontes diferentes, indicam "${topProblem.name.toLowerCase()}". ${getDefinition(topProblem.id)?.impact ?? ''}`
                  : top.description}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><LuShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Impacto {top.impact}/5 com esforço {top.effort}/5</li>
                {top.extraEvidence[0] && <li className="flex gap-2"><LuShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {top.extraEvidence[0]}</li>}
                <li className="flex gap-2"><LuShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {top.benefit}</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button icon={LuWandSparkles} onClick={() => navigate('solucoes', { opp: top.id })}>{topSolution ? 'Ver solução proposta' : 'Gerar solução'}</Button>
                <Button variant="secondary" onClick={() => navigate('oportunidades', { o: top.id })}>Detalhes</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Cadastre manifestações e execute a análise para receber recomendações.</p>
          )}
        </Card>
      </section>

      {/* Gráficos */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Evolução das manifestações" subtitle="Manifestações analisadas por mês e sentimento" />
          <LineChart
            data={stats.byMonth.map((m) => ({ label: m.label, values: { negativo: m.negativo, neutro: m.neutro, positivo: m.positivo } }))}
            series={[
              { key: 'negativo', label: 'Negativas', color: SENTIMENTS.negativo.color },
              { key: 'neutro', label: 'Neutras', color: SENTIMENTS.neutro.color },
              { key: 'positivo', label: 'Positivas', color: SENTIMENTS.positivo.color },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Distribuição por sentimento" subtitle={`Sentimento predominante: ${SENTIMENTS[stats.predominant].label.toLowerCase()}`} />
          <DonutChart
            centerValue={`${negShare}%`}
            centerLabel="negativas"
            data={(['negativo', 'neutro', 'positivo'] as const).map((s) => ({ label: SENTIMENTS[s].label, value: stats.sentiment[s], color: SENTIMENTS[s].color }))}
          />
        </Card>
        <Card>
          <CardHeader title="Categorias de problemas mais frequentes" subtitle="Manifestações negativas e neutras por tema" />
          <HBarChart data={stats.byCategory.slice(0, 7).map((c) => ({ label: c.label, value: c.count }))} onSelect={() => navigate('analise')} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Empresa x concorrentes" subtitle="Nota por critério (1 a 5) — concorrentes com dados demonstrativos" action={<Button size="sm" variant="ghost" onClick={() => navigate('concorrentes')}>Ver análise</Button>} />
          <GroupedBarChart
            categories={criteria.map((c) => CRITERIA[c])}
            series={[
              { label: data.company.name, color: COMPANY_COLOR, values: criteria.map((c) => scores[c]) },
              ...data.competitors.slice(0, 3).map((c) => ({ label: c.name, color: c.color, values: criteria.map((k) => c.scores[k]) })),
            ]}
          />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Evolução das oportunidades identificadas" subtitle="Acumulado de oportunidades e soluções elaboradas" />
          <LineChart
            height={200}
            data={oppEvolution}
            series={[
              { key: 'total', label: 'Oportunidades', color: '#1baf7a' },
              { key: 'solucoes', label: 'Soluções', color: COMPANY_COLOR },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Oportunidades que merecem atenção" subtitle="Ordenadas pela priorização do agente" />
          <div className="space-y-2.5">
            {ranked.slice(0, 3).map((o) => {
              const p = problems.find((x) => x.id === o.problemId);
              return (
                <div key={o.id} className="rounded-xl border border-slate-200 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{o.title}</p>
                    <Badge tone={o.priority === 'alta' ? 'red' : o.priority === 'media' ? 'amber' : 'slate'}>{PRIORITIES[o.priority]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Problema: {p?.name ?? 'Sinal de mercado'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Impacto potencial: {o.impact}/5</p>
                  <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700" onClick={() => navigate('solucoes', { opp: o.id })}>
                    Analisar solução <LuArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
