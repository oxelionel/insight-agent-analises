import { useEffect, useState, type ReactNode } from 'react';
import {
  LuWandSparkles, LuListChecks, LuRefreshCw, LuTriangleAlert, LuTarget, LuUsers, LuWrench, LuCpu, LuWallet, LuGauge, LuClock,
  LuSearch, LuMicroscope, LuLightbulb, LuCircleCheck, LuLoaderCircle, LuTrash2,
} from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, ConfirmDialog, EmptyState, KindLabel, PageHeader } from '../components/ui/primitives';
import { Select } from '../components/ui/fields';
import { PlanStatusBadge, type PageProps } from '../components/domain';
import { LEVELS, OPPORTUNITY_STATUS, RECOMMENDATIONS } from '../data/catalog';
import { rankOpportunities } from '../services/analysisEngine';
import type { Solution } from '../types';
import { navigate } from '../utils/router';
import { cn, formatDate } from '../utils/format';

const GEN_STEPS = ['Lendo evidências do problema', 'Cruzando com concorrentes', 'Consultando playbooks de solução', 'Estimando recursos, prazos e riscos', 'Redigindo recomendação'];

export default function Solutions({ params }: PageProps) {
  const { data, problems, generateSolutionFor, createPlan, deleteSolution } = useApp();
  const notify = useToast();
  const ranked = rankOpportunities(data.opportunities, problems);
  const [oppId, setOppId] = useState(params.opp ?? ranked[0]?.id ?? '');
  const [generating, setGenerating] = useState(-1);
  const [toDelete, setToDelete] = useState<Solution | null>(null);
  useEffect(() => { if (params.opp) setOppId(params.opp); }, [params.opp]);

  const opp = data.opportunities.find((o) => o.id === oppId);
  const solution = data.solutions.find((s) => s.opportunityId === oppId);
  const plan = solution && data.plans.find((p) => p.solutionId === solution.id && p.status !== 'cancelado');

  const generate = () => {
    if (!opp) return;
    setGenerating(0);
    let i = 0;
    const t = window.setInterval(() => {
      i++;
      setGenerating(i);
      if (i >= GEN_STEPS.length) {
        window.clearInterval(t);
        generateSolutionFor(opp.id);
        setGenerating(-1);
        notify('success', 'Solução estratégica gerada', opp.title);
      }
    }, 320);
  };

  const makePlan = () => {
    if (!solution) return;
    const id = createPlan(solution.id);
    if (id) {
      notify('success', 'Plano de ação criado', 'Revise etapas, responsáveis e prazos.');
      navigate('planos', { id });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Propor"
        title="Agente de soluções"
        description="Selecione uma oportunidade: o agente estrutura problema, contexto, análise, solução, benefícios, recursos, complexidade, prazo, indicadores, riscos e recomendação final, sempre com base nas evidências do sistema."
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card>
            <p className="mb-2 text-xs font-semibold text-slate-700">Oportunidade analisada</p>
            <Select value={oppId} onChange={(e) => setOppId(e.target.value)} aria-label="Oportunidade">
              {ranked.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </Select>
            <Button className="mt-3 w-full" size="lg" icon={generating >= 0 ? LuLoaderCircle : solution ? LuRefreshCw : LuWandSparkles} disabled={!opp || generating >= 0} onClick={generate}>
              {generating >= 0 ? 'Gerando…' : solution ? 'Regenerar solução' : 'Gerar solução estratégica'}
            </Button>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Geração demonstrativa local: combina playbooks com os dados atuais. Não utiliza modelo de IA externo.</p>
          </Card>
          <Card>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Soluções elaboradas ({data.solutions.length})</p>
            <div className="space-y-1.5">
              {data.solutions.map((s) => {
                const o = data.opportunities.find((x) => x.id === s.opportunityId);
                return (
                  <button key={s.id} onClick={() => setOppId(s.opportunityId)} className={cn('w-full rounded-lg border p-2.5 text-left transition', s.opportunityId === oppId ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200')}>
                    <p className="text-[13px] font-medium leading-snug text-slate-800">{s.title}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge tone={RECOMMENDATIONS[s.recommendation].tone}>{RECOMMENDATIONS[s.recommendation].label}</Badge>
                      <span className="text-[10px] text-slate-400">{formatDate(s.createdAt)}</span>
                    </div>
                    {!o && <p className="mt-1 text-[10px] text-amber-600">Oportunidade removida</p>}
                  </button>
                );
              })}
              {data.solutions.length === 0 && <p className="text-sm text-slate-500">Nenhuma ainda.</p>}
            </div>
          </Card>
        </div>

        <div>
          {generating >= 0 ? (
            <Card className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <span className="pulse-ring flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white"><LuWandSparkles className="h-6 w-6" /></span>
              <p className="mt-5 text-base font-semibold text-slate-900">Insight Agent estruturando a solução…</p>
              <ol className="mt-4 space-y-1.5 text-sm">
                {GEN_STEPS.map((s, i) => (
                  <li key={s} className={cn('flex items-center gap-2', i < generating ? 'text-emerald-700' : i === generating ? 'font-medium text-slate-900' : 'text-slate-400')}>
                    {i < generating ? <LuCircleCheck className="h-4 w-4" /> : i === generating ? <LuLoaderCircle className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4" />} {s}
                  </li>
                ))}
              </ol>
            </Card>
          ) : !opp ? (
            <EmptyState icon={LuLightbulb} title="Nenhuma oportunidade disponível" text="Crie oportunidades a partir da análise ou dos concorrentes." action={<Button onClick={() => navigate('analise')}>Ir para análise</Button>} />
          ) : !solution ? (
            <Card className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><LuWandSparkles className="h-6 w-6" /></span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{opp.title}</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">{opp.description}</p>
              <Badge tone={OPPORTUNITY_STATUS[opp.status].tone} className="mt-3">{OPPORTUNITY_STATUS[opp.status].label}</Badge>
              <Button className="mt-5" size="lg" icon={LuWandSparkles} onClick={generate}>Gerar solução estratégica</Button>
            </Card>
          ) : (
            <SolutionView solution={solution} planBadge={plan ? <PlanStatusBadge status={plan.status} /> : null} onPlan={makePlan} hasPlan={!!plan} onOpenPlan={() => plan && navigate('planos', { id: plan.id })} onDelete={() => setToDelete(solution)} />
          )}
        </div>
      </div>
      <ConfirmDialog open={!!toDelete} danger title="Excluir solução?" confirmLabel="Excluir" text="A solução será removida. Planos já criados a partir dela permanecem." onConfirm={() => { if (toDelete) { deleteSolution(toDelete.id); notify('success', 'Solução excluída'); } }} onClose={() => setToDelete(null)} />
    </div>
  );
}

function Section({ icon: Icon, title, children, kind }: { icon: typeof LuTarget; title: string; children: ReactNode; kind?: 'observado' | 'interpretacao' | 'hipotese' }) {
  return (
    <div className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <Icon className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {kind && <KindLabel kind={kind} />}
      </div>
      {children}
    </div>
  );
}

function SolutionView({ solution: s, onPlan, hasPlan, onOpenPlan, planBadge, onDelete }: { solution: Solution; onPlan: () => void; hasPlan: boolean; onOpenPlan: () => void; planBadge: ReactNode; onDelete: () => void }) {
  const rec = RECOMMENDATIONS[s.recommendation];
  const tf = { curto: 'Curto prazo (até 3 meses)', medio: 'Médio prazo (3 a 6 meses)', longo: 'Longo prazo (6+ meses)' }[s.timeframe];
  return (
    <Card padded={false}>
      <div className="rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-[#0b1733] to-[#1e3a8a] p-6 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="navy" className="bg-white/10 ring-white/20">Solução estratégica</Badge>
          <span className="text-xs text-blue-200/70">Elaborada em {formatDate(s.createdAt)}</span>
          {planBadge}
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">{s.title}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" className="border-white/20 bg-white text-[#0b1733]" icon={LuListChecks} onClick={hasPlan ? onOpenPlan : onPlan}>{hasPlan ? 'Ver plano de ação' : 'Criar plano de implementação'}</Button>
          <Button variant="ghost" className="text-blue-100 hover:bg-white/10" icon={LuTrash2} onClick={onDelete}>Excluir</Button>
        </div>
      </div>
      <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
        <div className="bg-white p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Complexidade</p><p className="mt-1 flex items-center gap-1.5 text-base font-semibold text-slate-900"><LuGauge className="h-4 w-4 text-slate-400" />{LEVELS[s.complexity]}</p></div>
        <div className="bg-white p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Prazo estimado</p><p className="mt-1 flex items-center gap-1.5 text-base font-semibold text-slate-900"><LuClock className="h-4 w-4 text-slate-400" />{tf}</p></div>
        <div className="bg-white p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recomendação final</p><p className="mt-1"><Badge tone={rec.tone} className="text-xs">{rec.label}</Badge></p></div>
      </div>
      <div className="p-6">
        <Section icon={LuTriangleAlert} title="Problema identificado"><p className="text-sm leading-relaxed text-slate-700">{s.problem}</p></Section>
        <Section icon={LuSearch} title="Contexto" kind="observado">
          <ul className="space-y-1.5 text-sm text-slate-700">{s.context.map((c) => <li key={c} className="leading-relaxed">• {c}</li>)}</ul>
        </Section>
        <Section icon={LuMicroscope} title="Análise — por que isso pode estar acontecendo?" kind="interpretacao">
          <ul className="space-y-1.5 text-sm text-slate-700">
            {s.analysis.map((c) => (
              <li key={c} className={cn('leading-relaxed', c.startsWith('Hipótese') && 'rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-900')}>• {c}</li>
            ))}
          </ul>
        </Section>
        <Section icon={LuWandSparkles} title="Solução proposta — o que a empresa pode fazer?">
          <ol className="space-y-2 text-sm text-slate-700">{s.proposal.map((c, i) => <li key={c} className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{i + 1}</span><span className="leading-relaxed">{c}</span></li>)}</ol>
        </Section>
        <div className="grid gap-x-8 md:grid-cols-2">
          <Section icon={LuTarget} title="Benefícios esperados">
            <ul className="space-y-1.5 text-sm text-slate-700">{s.benefits.map((c) => <li key={c} className="flex gap-2"><LuCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{c}</li>)}</ul>
          </Section>
          <Section icon={LuGauge} title="Indicadores de sucesso">
            <div className="flex flex-wrap gap-1.5">{s.kpis.map((k) => <Badge key={k} tone="blue">{k}</Badge>)}</div>
          </Section>
        </div>
        <Section icon={LuUsers} title="Recursos necessários">
          <div className="grid gap-2 sm:grid-cols-2">
            {([['Pessoas', s.resources.pessoas, LuUsers], ['Ferramentas', s.resources.ferramentas, LuWrench], ['Tecnologia', s.resources.tecnologia, LuCpu], ['Orçamento estimado', s.resources.orcamento, LuWallet]] as const).map(([k, v, I]) => (
              <div key={k} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                <I className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k}</p><p className="mt-0.5 text-sm text-slate-800">{v}</p></div>
              </div>
            ))}
          </div>
        </Section>
        <Section icon={LuTriangleAlert} title="Riscos — o que pode dar errado?">
          <ul className="space-y-1.5 text-sm text-slate-700">{s.risks.map((c) => <li key={c} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />{c}</li>)}</ul>
        </Section>
        <div className={cn('mt-2 rounded-2xl border p-5', { green: 'border-emerald-200 bg-emerald-50', blue: 'border-blue-200 bg-blue-50', amber: 'border-amber-200 bg-amber-50', slate: 'border-slate-200 bg-slate-50' }[rec.tone as 'green'] ?? 'bg-slate-50')}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recomendação final</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{rec.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{s.rationale}</p>
        </div>
      </div>
    </Card>
  );
}
