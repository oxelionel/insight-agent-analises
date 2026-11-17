import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  LuShieldCheck, LuRocket, LuSend, LuCircleX, LuBan, LuListChecks, LuCalendar, LuGauge, LuTriangleAlert, LuWallet, LuInfo,
  LuCircleCheck, LuLoaderCircle, LuTrash2, LuUndo2,
} from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Modal, PageHeader, ProgressBar, Tabs } from '../components/ui/primitives';
import { Field, Input, Textarea } from '../components/ui/fields';
import { PlanStatusBadge, type PageProps } from '../components/domain';
import { PLAN_STATUS } from '../data/catalog';
import type { Plan, PlanStep } from '../types';
import { navigate } from '../utils/router';
import { cn, formatDate, formatDateTime, todayISO } from '../utils/format';

export const AUTH_TEXT = 'Confirmo que revisei a proposta e autorizo sua execução demonstrativa.';

const progressOf = (p: Plan) => (p.steps.length ? Math.round((p.steps.filter((s) => s.done).length / p.steps.length) * 100) : 0);

export default function Plans({ params }: PageProps) {
  const { data, setPlanStatus, updatePlan, deletePlan } = useApp();
  const notify = useToast();
  const [selectedId, setSelectedId] = useState(params.id ?? data.plans[0]?.id);
  const [view, setView] = useState<'checklist' | 'cronograma'>('checklist');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [execOpen, setExecOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Plan | null>(null);
  useEffect(() => { if (params.id) setSelectedId(params.id); }, [params.id]);
  const plan = data.plans.find((p) => p.id === selectedId) ?? data.plans[0];
  const solution = plan && data.solutions.find((s) => s.id === plan.solutionId);

  const updateStep = (stepId: string, patch: Partial<PlanStep>, logText?: string) => {
    if (!plan) return;
    updatePlan(plan.id, { steps: plan.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }, logText);
  };

  const editable = plan && !['concluido', 'cancelado', 'em_execucao'].includes(plan.status);

  return (
    <div>
      <PageHeader
        eyebrow="Planejar · Autorizar · Executar"
        title="Planos de implementação"
        description="Planos com etapas, responsáveis, prazos e indicadores. O agente recomenda e planeja, mas nenhuma melhoria é executada sem autorização humana explícita."
      />
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <LuInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <p><b>Execução simulada.</b> Nesta versão, “executar” apenas atualiza status e histórico. Nenhuma alteração é feita em sistemas externos, nenhuma mensagem é enviada e nenhum conteúdo é publicado.</p>
      </div>

      {data.plans.length === 0 ? (
        <EmptyState icon={LuListChecks} title="Nenhum plano de ação" text="Gere uma solução e crie o plano de implementação a partir dela." action={<Button onClick={() => navigate('solucoes')}>Ir para soluções</Button>} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            {data.plans.map((p) => (
              <button key={p.id} onClick={() => setSelectedId(p.id)} className={cn('w-full rounded-xl border bg-white p-4 text-left transition', plan?.id === p.id ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300')}>
                <PlanStatusBadge status={p.status} />
                <p className="mt-2 text-sm font-semibold leading-snug text-slate-900">{p.name}</p>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={progressOf(p)} tone={p.status === 'concluido' ? 'green' : 'blue'} />
                  <span className="text-xs font-semibold tabular-nums text-slate-600">{progressOf(p)}%</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">{p.steps.filter((s) => s.done).length}/{p.steps.length} etapas · {p.owner}</p>
              </button>
            ))}
          </div>

          {plan && (
            <div className="space-y-6">
              <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <PlanStatusBadge status={plan.status} />
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">{plan.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{plan.problem}</p>
                    <ApprovalTrail plan={plan} />
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {plan.status === 'em_elaboracao' && <Button icon={LuSend} onClick={() => setReviewOpen(true)}>Solicitar autorização</Button>}
                    {plan.status === 'aguardando_autorizacao' && <Button variant="success" icon={LuShieldCheck} onClick={() => setReviewOpen(true)}>Revisar e autorizar</Button>}
                    {plan.status === 'aprovado' && <Button variant="navy" icon={LuRocket} onClick={() => setExecOpen(true)}>Executar melhoria (demonstração)</Button>}
                    {plan.status === 'reprovado' && <Button variant="secondary" icon={LuUndo2} onClick={() => { setPlanStatus(plan.id, 'em_elaboracao'); notify('info', 'Plano retornou para elaboração'); }}>Revisar proposta</Button>}
                    {!['concluido', 'cancelado', 'em_execucao'].includes(plan.status) && (
                      <Button variant="ghost" icon={LuBan} onClick={() => { setPlanStatus(plan.id, 'cancelado'); notify('info', 'Plano cancelado'); }}>Cancelar</Button>
                    )}
                    {plan.status === 'cancelado' && <Button variant="secondary" icon={LuUndo2} onClick={() => setPlanStatus(plan.id, 'em_elaboracao')}>Reabrir</Button>}
                    <Button variant="ghost" icon={LuTrash2} className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(plan)}>Excluir</Button>
                  </div>
                </div>

                <StatusFlow status={plan.status} />

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Objetivo', plan.objective],
                    ['Resultado esperado', plan.expectedResult],
                    ['Estimativa de investimento', plan.investment],
                    ['Período', `${formatDate(plan.steps[0]?.start)} a ${formatDate(plan.steps[plan.steps.length - 1]?.due)}`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k}</p>
                      <p className="mt-1 text-sm text-slate-800">{v}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Etapas"
                  subtitle={`${progressOf(plan)}% concluído · responsável principal: ${plan.owner}`}
                  icon={LuListChecks}
                  action={<Tabs value={view} onChange={setView} items={[{ value: 'checklist', label: 'Checklist' }, { value: 'cronograma', label: 'Cronograma' }]} />}
                />
                <ProgressBar value={progressOf(plan)} tone={plan.status === 'concluido' ? 'green' : 'blue'} className="mb-4" />
                {view === 'checklist' ? (
                  <ul className="divide-y divide-slate-100">
                    {plan.steps.map((s, i) => (
                      <li key={s.id} className="grid items-center gap-3 py-3 md:grid-cols-[auto_1fr_200px_150px]">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={s.done}
                            disabled={!editable}
                            onChange={(e) => updateStep(s.id, { done: e.target.checked }, `Etapa "${s.title}" marcada como ${e.target.checked ? 'concluída' : 'pendente'} em "${plan.name}".`)}
                            className="h-[18px] w-[18px] accent-blue-600"
                            aria-label={`Concluir etapa ${s.title}`}
                          />
                          <span className="text-xs font-bold text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                        </label>
                        <span className={cn('text-sm font-medium', s.done ? 'text-slate-400 line-through' : 'text-slate-800')}>{s.title}</span>
                        <Input value={s.owner} disabled={!editable} onChange={(e) => updateStep(s.id, { owner: e.target.value })} aria-label="Responsável" className="h-8 text-xs" />
                        <Input type="date" value={s.due} disabled={!editable} onChange={(e) => e.target.value && updateStep(s.id, { due: e.target.value })} aria-label="Prazo" className="h-8 text-xs" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Gantt steps={plan.steps} />
                )}
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Indicadores de desempenho" subtitle="Atualize o valor atual para acompanhar a evolução" icon={LuGauge} />
                  <div className="space-y-3">
                    {plan.kpis.map((k, i) => (
                      <div key={k.name} className="grid grid-cols-[1fr_80px_80px_100px] items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">{k.name}</span>
                        <span className="text-xs text-slate-500" title="Linha de base">Base: {k.baseline}</span>
                        <span className="text-xs font-semibold text-emerald-700" title="Meta">Meta: {k.target}</span>
                        <Input className="h-8 text-xs" value={k.current} aria-label={`Valor atual de ${k.name}`} onChange={(e) => updatePlan(plan.id, { kpis: plan.kpis.map((x, j) => (j === i ? { ...x, current: e.target.value } : x)) })} />
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Recursos e riscos" icon={LuWallet} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recursos necessários</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-slate-700">{plan.resources.map((r) => <li key={r}>• {r}</li>)}</ul>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Riscos</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-slate-700">{plan.risks.map((r) => <li key={r} className="flex gap-2"><LuTriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />{r}</li>)}</ul>
                  {solution && <button className="mt-4 text-xs font-semibold text-blue-600" onClick={() => navigate('solucoes', { opp: solution.opportunityId })}>Ver solução de origem →</button>}
                </Card>
              </div>

              {plan.execution && (
                <Card>
                  <CardHeader title="Registro da execução demonstrativa" icon={LuRocket} />
                  <ul className="space-y-1 font-mono text-xs text-slate-600">{plan.execution.log.map((l) => <li key={l}>{l}</li>)}</ul>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {plan && <AuthorizationModal open={reviewOpen} plan={plan} onClose={() => setReviewOpen(false)} />}
      {plan && <ExecutionModal open={execOpen} plan={plan} onClose={() => setExecOpen(false)} />}
      <ConfirmDialog open={!!toDelete} danger title="Excluir plano?" confirmLabel="Excluir" text={<>O plano <b>{toDelete?.name}</b> será excluído permanentemente.</>} onConfirm={() => { if (toDelete) { deletePlan(toDelete.id); setSelectedId(data.plans.find((p) => p.id !== toDelete.id)?.id); notify('success', 'Plano excluído'); } }} onClose={() => setToDelete(null)} />
    </div>
  );
}

function ApprovalTrail({ plan }: { plan: Plan }) {
  const a = plan.approval;
  if (!a) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      {a.requestedAt && <span>Autorização solicitada em {formatDateTime(a.requestedAt)}</span>}
      {a.decidedAt && <span>Decisão em {formatDateTime(a.decidedAt)} por {a.decidedBy}</span>}
      {a.note && <span className="italic">“{a.note}”</span>}
    </div>
  );
}

const FLOW: Plan['status'][] = ['em_elaboracao', 'aguardando_autorizacao', 'aprovado', 'em_execucao', 'concluido'];
function StatusFlow({ status }: { status: Plan['status'] }) {
  const idx = FLOW.indexOf(status);
  const off = status === 'reprovado' || status === 'cancelado';
  return (
    <div className="mt-5">
      <div className="flex items-center">
        {FLOW.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold', !off && i < idx ? 'bg-emerald-500 text-white' : !off && i === idx ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400')}>
                {!off && i < idx ? <LuCircleCheck className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn('hidden w-24 text-center text-[10px] font-medium leading-tight sm:block', !off && i <= idx ? 'text-slate-700' : 'text-slate-400')}>{PLAN_STATUS[s].label}</span>
            </div>
            {i < FLOW.length - 1 && <div className={cn('mx-1 mb-5 h-0.5 flex-1 rounded sm:mb-6', !off && i < idx ? 'bg-emerald-400' : 'bg-slate-200')} />}
          </div>
        ))}
      </div>
      {off && <p className="mt-2 text-xs font-medium text-red-600">Fluxo interrompido: {PLAN_STATUS[status].label.toLowerCase()}.</p>}
    </div>
  );
}

function Gantt({ steps }: { steps: PlanStep[] }) {
  const { min, span } = useMemo(() => {
    const starts = steps.map((s) => new Date(`${s.start}T12:00:00`).getTime());
    const ends = steps.map((s) => new Date(`${s.due}T12:00:00`).getTime());
    const mn = Math.min(...starts);
    return { min: mn, span: Math.max(1, Math.max(...ends) - mn) };
  }, [steps]);
  const pos = (iso: string) => ((new Date(`${iso}T12:00:00`).getTime() - min) / span) * 100;
  const today = pos(todayISO());
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-2 flex justify-between pl-[200px] text-[10px] text-slate-400">
          <span>{formatDate(steps[0]?.start)}</span>
          <span>{formatDate(steps[steps.length - 1]?.due)}</span>
        </div>
        <div className="relative space-y-2">
          {today >= 0 && today <= 100 && (
            <div className="pointer-events-none absolute bottom-0 top-0 z-10" style={{ left: `calc(200px + (100% - 200px) * ${today / 100})` }}>
              <div className="h-full w-px bg-red-400" />
              <span className="absolute -top-4 -translate-x-1/2 rounded bg-red-500 px-1 text-[9px] font-bold text-white">hoje</span>
            </div>
          )}
          {steps.map((s) => (
            <div key={s.id} className="flex items-center">
              <span className={cn('w-[200px] shrink-0 truncate pr-3 text-xs', s.done ? 'text-slate-400' : 'text-slate-700')}>{s.title}</span>
              <div className="relative h-6 flex-1 rounded bg-slate-50">
                <div
                  className={cn('absolute top-1 h-4 rounded', s.done ? 'bg-emerald-500' : 'bg-blue-500')}
                  style={{ left: `${pos(s.start)}%`, width: `${Math.max(2, pos(s.due) - pos(s.start))}%` }}
                  title={`${s.title}: ${formatDate(s.start)} – ${formatDate(s.due)} · ${s.owner}`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 pl-[200px] text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Concluída</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />Pendente</span>
          <span className="inline-flex items-center gap-1.5"><LuCalendar className="h-3 w-3" />Linha vermelha: data atual</span>
        </div>
      </div>
    </div>
  );
}

function AuthorizationModal({ open, plan, onClose }: { open: boolean; plan: Plan; onClose: () => void }) {
  const { data, setPlanStatus } = useApp();
  const notify = useToast();
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  useEffect(() => { if (open) { setConfirmed(false); setNote(''); setRejecting(false); } }, [open]);
  const solution = data.solutions.find((s) => s.id === plan.solutionId);
  const requesting = plan.status === 'em_elaboracao';

  const rows: [string, ReactNode][] = [
    ['O que será realizado', <ul className="space-y-1">{(solution?.proposal ?? [plan.objective]).map((p) => <li key={p}>• {p}</li>)}</ul>],
    ['Por que será realizado', plan.problem],
    ['Impacto esperado', plan.expectedResult],
    ['Recursos necessários', <>{plan.resources.join(' · ')}<br /><b>Investimento:</b> {plan.investment}</>],
    ['Riscos', <ul className="space-y-1">{plan.risks.map((r) => <li key={r}>• {r}</li>)}</ul>],
    ['Responsável', plan.owner],
    ['Plano de implementação', <ol className="space-y-0.5">{plan.steps.map((s, i) => <li key={s.id}>{i + 1}. {s.title} — {s.owner} (até {formatDate(s.due)})</li>)}</ol>],
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={requesting ? 'Solicitar autorização' : 'Revisão para autorização'}
      subtitle={plan.name}
      footer={
        requesting ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button icon={LuSend} onClick={() => { setPlanStatus(plan.id, 'aguardando_autorizacao'); notify('success', 'Autorização solicitada', 'O plano aguarda revisão humana.'); onClose(); }}>Enviar para autorização</Button>
          </>
        ) : rejecting ? (
          <>
            <Button variant="secondary" onClick={() => setRejecting(false)}>Voltar</Button>
            <Button variant="danger" icon={LuCircleX} disabled={note.trim().length < 5} onClick={() => { setPlanStatus(plan.id, 'reprovado', { note: note.trim() }); notify('info', 'Melhoria reprovada', 'O motivo foi registrado no histórico.'); onClose(); }}>Confirmar reprovação</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" icon={LuCircleX} className="mr-auto text-red-600 hover:bg-red-50" onClick={() => setRejecting(true)}>Reprovar</Button>
            <Button variant="secondary" onClick={onClose}>Decidir depois</Button>
            <Button variant="success" icon={LuShieldCheck} disabled={!confirmed} onClick={() => { setPlanStatus(plan.id, 'aprovado', { note: note.trim() || undefined }); notify('success', 'Melhoria aprovada', 'Agora é possível executar a demonstração.'); onClose(); }}>Aprovar</Button>
          </>
        )
      }
    >
      <div className="space-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 rounded-xl border border-slate-100 p-3 text-sm sm:grid-cols-[180px_1fr] sm:gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k}</p>
            <div className="leading-relaxed text-slate-800">{v}</div>
          </div>
        ))}
      </div>
      {!requesting && !rejecting && (
        <div className="mt-5 space-y-3">
          <Field label="Observação da aprovação (opcional)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: iniciar por uma região piloto" /></Field>
          <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition', confirmed ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white')}>
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-emerald-600" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span className="text-sm font-medium text-slate-900">{AUTH_TEXT}</span>
          </label>
          <p className="text-[11px] text-slate-400">O botão “Aprovar” só é habilitado após a confirmação explícita.</p>
        </div>
      )}
      {rejecting && (
        <div className="mt-5">
          <Field label="Motivo da reprovação" required><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explique o que precisa mudar na proposta" /></Field>
        </div>
      )}
    </Modal>
  );
}

function ExecutionModal({ open, plan, onClose }: { open: boolean; plan: Plan; onClose: () => void }) {
  const { setPlanStatus, updatePlan } = useApp();
  const notify = useToast();
  const [progress, setProgress] = useState(-1);
  const [done, setDone] = useState(false);
  useEffect(() => { if (open) { setProgress(-1); setDone(false); } }, [open]);

  const start = () => {
    setPlanStatus(plan.id, 'em_execucao');
    setProgress(0);
    let i = 0;
    const steps = plan.steps;
    const t = window.setInterval(() => {
      i++;
      setProgress(i);
      updatePlan(plan.id, { steps: steps.map((s, j) => (j < i ? { ...s, done: true } : s)) });
      if (i >= steps.length) {
        window.clearInterval(t);
        window.setTimeout(() => {
          setPlanStatus(plan.id, 'concluido');
          setDone(true);
          notify('success', 'Execução demonstrativa concluída', 'Status atualizado e registrado no histórico.');
        }, 300);
      }
    }, 450);
  };

  return (
    <Modal
      open={open}
      onClose={progress >= 0 && !done ? () => undefined : onClose}
      title="Executar melhoria (demonstração)"
      subtitle={plan.name}
      footer={
        progress < 0 ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="navy" icon={LuRocket} onClick={start}>Iniciar execução simulada</Button>
          </>
        ) : done ? (
          <Button onClick={onClose}>Concluir</Button>
        ) : undefined
      }
    >
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
        Esta execução é <b>simulada</b>: serve para demonstrar o fluxo de autorização humana e o potencial futuro de automação. Nenhum sistema externo será alterado.
      </div>
      <ol className="space-y-2">
        {plan.steps.map((s, i) => {
          const isDone = progress > i || (progress < 0 && s.done) || done;
          const active = progress === i && !done;
          return (
            <li key={s.id} className="flex items-center gap-3 text-sm">
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', isDone ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400')}>
                {isDone ? <LuCircleCheck className="h-3.5 w-3.5" /> : active ? <LuLoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
              </span>
              <span className={isDone ? 'text-slate-800' : 'text-slate-500'}>{s.title}</span>
              <Badge className="ml-auto">{s.owner}</Badge>
            </li>
          );
        })}
      </ol>
      {done && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Melhoria concluída na demonstração. Indicadores atualizados para as metas planejadas (valores simulados).</p>}
    </Modal>
  );
}

