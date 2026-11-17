import { useMemo, useState } from 'react';
import { LuBrainCircuit, LuLightbulb, LuWandSparkles, LuFlaskConical, LuRepeat, LuTriangleAlert, LuArrowRight } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, CardHeader, EmptyState, KindLabel, PageHeader } from '../components/ui/primitives';
import { Textarea } from '../components/ui/fields';
import { EvidenceQuote, SentimentBadge, SeverityBadge, type PageProps } from '../components/domain';
import { AnalysisRunner } from '../components/AnalysisRunner';
import { DonutChart, HBarChart } from '../components/charts/Charts';
import { CATEGORIES, MANIFESTATION_TYPES, SENTIMENTS, SEVERITIES } from '../data/catalog';
import { activeProvider } from '../services/aiProvider';
import { matchProblems } from '../services/analysisEngine';
import { getDefinition } from '../data/knowledgeBase';
import { navigate } from '../utils/router';
import { cn, formatDateTime } from '../utils/format';

export default function Analysis({ params }: PageProps) {
  const { data, problems, stats, createOpportunityFromProblem } = useApp();
  const notify = useToast();
  const [selectedId, setSelectedId] = useState(params.p ?? problems[0]?.id);
  const [running, setRunning] = useState(false);
  const [sandbox, setSandbox] = useState('Ninguém responde no chat, já estou esperando há horas.');
  const selected = problems.find((p) => p.id === selectedId) ?? problems[0];
  const opp = selected && data.opportunities.find((o) => o.problemId === selected.id);

  const sandboxResult = useMemo(() => {
    if (sandbox.trim().length < 6) return null;
    const c = activeProvider.classify({ content: sandbox, source: 'manual', company: data.company.name }, data.company.name);
    const matched = matchProblems({ content: sandbox, type: c.type, sentiment: c.sentiment }).map((id) => getDefinition(id)!.name);
    return { ...c, matched };
  }, [sandbox, data.company.name]);

  const severityCount = (['critica', 'alta', 'media', 'baixa'] as const).map((s) => ({ s, n: problems.filter((p) => p.severity === s).length }));

  return (
    <div>
      <PageHeader
        eyebrow="Analisar · Identificar"
        title="Análise inteligente"
        description="O agente classifica sentimento e tema, agrupa manifestações escritas de formas diferentes que apontam para o mesmo problema e calcula a gravidade considerando recorrência, impacto no cliente, impacto operacional e relevância estratégica."
        actions={<Button icon={LuBrainCircuit} onClick={() => setRunning(true)}>Executar análise {stats.pending ? `(${stats.pending} novas)` : ''}</Button>}
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Análise de sentimento" subtitle={`${stats.analyzed} manifestações analisadas · última análise ${formatDateTime(data.lastAnalysisAt)}`} />
          <DonutChart size={150} centerValue={String(stats.sentiment.negativo + stats.sentiment.neutro + stats.sentiment.positivo)} centerLabel="da empresa" data={(['negativo', 'neutro', 'positivo'] as const).map((s) => ({ label: SENTIMENTS[s].label, value: stats.sentiment[s], color: SENTIMENTS[s].color }))} />
        </Card>
        <Card>
          <CardHeader title="Classificação temática" subtitle="Manifestações negativas e neutras por categoria" />
          <HBarChart data={stats.byCategory.map((c) => ({ label: c.label, value: c.count }))} />
        </Card>
        <Card>
          <CardHeader title="Gravidade dos problemas" subtitle={`${problems.length} problemas · ${stats.recurring} recorrentes`} icon={LuTriangleAlert} />
          <div className="grid grid-cols-2 gap-2">
            {severityCount.map(({ s, n }) => (
              <div key={s} className={cn('rounded-xl p-3', { critica: 'bg-red-50', alta: 'bg-orange-50', media: 'bg-amber-50', baixa: 'bg-slate-50' }[s])}>
                <p className="text-2xl font-bold text-slate-900">{n}</p>
                <p className="text-xs text-slate-600">{SEVERITIES[s].label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Pontuação = recorrência (até 4) + impacto no cliente (1–3) + impacto operacional (0,5–1,5) + relevância estratégica (1–3) + registros de prioridade alta.</p>
        </Card>
      </div>

      {problems.length === 0 ? (
        <EmptyState icon={LuBrainCircuit} title="Nenhum problema identificado" text="Cadastre manifestações e execute a análise." action={<Button onClick={() => navigate('monitoramento')}>Ir ao monitoramento</Button>} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <div className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Problemas identificados</p>
            {problems.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn('w-full rounded-xl border bg-white p-3.5 text-left transition', selected?.id === p.id ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300')}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-100 px-1.5 text-xs font-bold text-slate-700" title="Manifestações relacionadas">{p.count}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <SeverityBadge severity={p.severity} />
                  <Badge>{CATEGORIES[p.category]}</Badge>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <Card className="h-fit">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={selected.severity} />
                    <SentimentBadge sentiment={selected.sentiment} />
                    <Badge>{CATEGORIES[selected.category]}</Badge>
                    <span className="text-xs text-slate-400">Pontuação de gravidade: {selected.severityScore}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{selected.name}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{selected.description}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {opp ? (
                    <Button variant="secondary" icon={LuLightbulb} onClick={() => navigate('oportunidades', { o: opp.id })}>Ver oportunidade</Button>
                  ) : (
                    <Button
                      variant="secondary"
                      icon={LuLightbulb}
                      onClick={() => {
                        const o = createOpportunityFromProblem(selected.id);
                        if (o) notify('success', 'Oportunidade criada', o.title);
                      }}
                    >
                      Gerar oportunidade
                    </Button>
                  )}
                  <Button
                    icon={LuWandSparkles}
                    onClick={() => {
                      const o = opp ?? createOpportunityFromProblem(selected.id);
                      if (o) navigate('solucoes', { opp: o.id });
                    }}
                  >
                    Elaborar solução
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 py-5 lg:grid-cols-3">
                <div>
                  <KindLabel kind="observado" />
                  <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
                    {selected.observed.map((o) => <li key={o} className="leading-relaxed">• {o}</li>)}
                  </ul>
                </div>
                <div>
                  <KindLabel kind="interpretacao" />
                  <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
                    {selected.interpretations.map((o) => <li key={o} className="leading-relaxed">• {o}</li>)}
                  </ul>
                </div>
                <div>
                  <KindLabel kind="hipotese" />
                  <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
                    {selected.hypotheses.map((o) => <li key={o} className="leading-relaxed">• {o}</li>)}
                  </ul>
                  <p className="mt-3 text-[11px] text-slate-400">Hipóteses não são fatos comprovados: exigem validação com dados operacionais.</p>
                </div>
              </div>

              <div className="grid gap-3 border-t border-slate-100 py-5 md:grid-cols-3">
                {[
                  ['Impacto para a empresa', selected.impact, 'bg-red-50/60 border-red-100'],
                  ['Oportunidade identificada', selected.opportunity, 'bg-emerald-50/60 border-emerald-100'],
                  ['Recomendação inicial', selected.recommendation, 'bg-blue-50/60 border-blue-100'],
                ].map(([t, v, c]) => (
                  <div key={t} className={cn('rounded-xl border p-3.5', c)}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{v}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <LuRepeat className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-slate-900">Evidências agrupadas ({selected.count})</p>
                  <span className="text-xs text-slate-400">— palavras diferentes, mesmo problema</span>
                </div>
                <div className="grid gap-2.5 md:grid-cols-2">
                  {selected.evidence.map((e) => <EvidenceQuote key={e.id} m={e} compact />)}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader title="Laboratório de classificação" subtitle="Digite uma manifestação e veja, em tempo real, como o motor demonstrativo a interpreta" icon={LuFlaskConical} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea value={sandbox} onChange={(e) => setSandbox(e.target.value)} aria-label="Texto para classificar" />
          {sandboxResult ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">Sentimento</p><p className="mt-1 font-semibold">{SENTIMENTS[sandboxResult.sentiment].label}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">Categoria</p><p className="mt-1 font-semibold">{CATEGORIES[sandboxResult.category]}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">Tipo</p><p className="mt-1 font-semibold">{MANIFESTATION_TYPES[sandboxResult.type]}</p></div>
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-[11px] text-blue-700">Problema relacionado</p>
                <p className="mt-1 font-semibold text-blue-900">{sandboxResult.matched.length ? sandboxResult.matched.join(' · ') : 'Nenhum padrão conhecido'}</p>
              </div>
              <button className="col-span-2 inline-flex items-center gap-1 text-left text-xs font-semibold text-blue-600" onClick={() => navigate('monitoramento')}>
                Para incluir na análise, cadastre a manifestação no Monitoramento <LuArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Digite ao menos 6 caracteres.</p>
          )}
        </div>
      </Card>

      <AnalysisRunner open={running} onClose={() => setRunning(false)} />
    </div>
  );
}
