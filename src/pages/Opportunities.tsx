import { useEffect, useMemo, useState } from 'react';
import { LuWandSparkles, LuTrash2, LuBan, LuRadar, LuGrid2X2 } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Modal, PageHeader, Tabs } from '../components/ui/primitives';
import { Select } from '../components/ui/fields';
import { EvidenceQuote, SeverityBadge, type PageProps } from '../components/domain';
import { ImpactEffortMatrix } from '../components/charts/Charts';
import { LEVELS, OPPORTUNITY_ORIGINS, OPPORTUNITY_STATUS, OPPORTUNITY_TYPES, PRIORITIES } from '../data/catalog';
import { opportunityScore, rankOpportunities } from '../services/analysisEngine';
import type { Opportunity, OpportunityStatus, OpportunityType } from '../types';
import { navigate } from '../utils/router';
import { formatDate } from '../utils/format';

const TYPE_COLORS: Record<OpportunityType, string> = {
  experiencia_cliente: '#2a78d6',
  vantagem_competitiva: '#eb6834',
  retencao: '#1baf7a',
  eficiencia: '#eda100',
  novos_produtos: '#e87ba4',
  inovacao: '#008300',
  melhoria_operacional: '#6366f1',
  reducao_custos: '#64748b',
};

export default function Opportunities({ params }: PageProps) {
  const { data, problems, updateOpportunity, deleteOpportunity } = useApp();
  const notify = useToast();
  const [status, setStatus] = useState<'todas' | OpportunityStatus>('todas');
  const [type, setType] = useState('');
  const [openId, setOpenId] = useState<string | null>(params.o ?? null);
  const [toDelete, setToDelete] = useState<Opportunity | null>(null);
  useEffect(() => { if (params.o) setOpenId(params.o); }, [params.o]);

  const ranked = useMemo(() => rankOpportunities(data.opportunities, problems), [data.opportunities, problems]);
  const all = useMemo(() => [...ranked, ...data.opportunities.filter((o) => o.status === 'descartada')], [ranked, data.opportunities]);
  const list = all.filter((o) => (status === 'todas' || o.status === status) && (!type || o.type === type));
  const open = data.opportunities.find((o) => o.id === openId);
  const openProblem = problems.find((p) => p.id === open?.problemId);
  const hasSolution = (id: string) => data.solutions.some((s) => s.opportunityId === id);

  return (
    <div>
      <PageHeader
        eyebrow="Identificar oportunidades"
        title="Radar de oportunidades"
        description="Oportunidades nascem de reclamações recorrentes, sugestões de clientes, movimentos de concorrentes e tendências de mercado. A priorização combina impacto, esforço, gravidade e recorrência."
      />

      <div className="mb-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Matriz de impacto x esforço" subtitle="Clique em um ponto para abrir a oportunidade · números seguem a ordem de prioridade" icon={LuGrid2X2} />
          <ImpactEffortMatrix
            items={ranked.map((o) => ({ id: o.id, label: o.title, impact: o.impact, effort: o.effort, color: TYPE_COLORS[o.type] }))}
            onSelect={setOpenId}
          />
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Ranking de prioridade" subtitle="Pontuação do agente" icon={LuRadar} />
          <ol className="space-y-2">
            {ranked.map((o, i) => (
              <li key={o.id}>
                <button onClick={() => setOpenId(o.id)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/40">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: TYPE_COLORS[o.type] }}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{o.title}</span>
                    <span className="text-[11px] text-slate-500">{OPPORTUNITY_TYPES[o.type]}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums text-slate-700">{opportunityScore(o, problems).toFixed(1)}</span>
                </button>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={status}
          onChange={setStatus}
          items={[
            { value: 'todas', label: 'Todas', count: data.opportunities.length },
            ...(Object.keys(OPPORTUNITY_STATUS) as OpportunityStatus[]).map((s) => ({ value: s, label: OPPORTUNITY_STATUS[s].label, count: data.opportunities.filter((o) => o.status === s).length })),
          ]}
        />
        <div className="w-56"><Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipo">
          <option value="">Todos os tipos</option>
          {Object.entries(OPPORTUNITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select></div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Nenhuma oportunidade neste filtro" text="Gere oportunidades a partir dos problemas na Análise inteligente ou das lacunas em Concorrentes." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((o) => {
            const p = problems.find((x) => x.id === o.problemId);
            return (
              <Card key={o.id} className={o.status === 'descartada' ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={OPPORTUNITY_STATUS[o.status].tone} dot>{OPPORTUNITY_STATUS[o.status].label}</Badge>
                  <Badge tone={o.priority === 'alta' ? 'red' : o.priority === 'media' ? 'amber' : 'slate'}>Prioridade {PRIORITIES[o.priority].toLowerCase()}</Badge>
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{o.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{o.description}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 p-2"><p className="text-sm font-bold text-slate-900">{o.impact}/5</p><p className="text-[10px] text-slate-500">Impacto</p></div>
                  <div className="rounded-lg bg-slate-50 p-2"><p className="text-sm font-bold text-slate-900">{o.effort}/5</p><p className="text-[10px] text-slate-500">Esforço</p></div>
                  <div className="rounded-lg bg-slate-50 p-2"><p className="text-sm font-bold text-slate-900">{LEVELS[o.complexity]}</p><p className="text-[10px] text-slate-500">Complexidade</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-500"><span className="font-semibold text-slate-700">Origem:</span> {OPPORTUNITY_ORIGINS[o.origin]} · <span className="font-semibold text-slate-700">Tipo:</span> {OPPORTUNITY_TYPES[o.type]}</p>
                <p className="mt-1 text-xs text-slate-500"><span className="font-semibold text-slate-700">Problema:</span> {p ? `${p.name} (${p.count} evidências)` : 'Sinal de mercado'}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setOpenId(o.id)}>Abrir</Button>
                  <Button size="sm" icon={LuWandSparkles} disabled={o.status === 'descartada'} onClick={() => navigate('solucoes', { opp: o.id })}>{hasSolution(o.id) ? 'Ver solução' : 'Solicitar solução'}</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!open}
        onClose={() => setOpenId(null)}
        size="lg"
        title={open?.title ?? ''}
        subtitle={open ? `${OPPORTUNITY_TYPES[open.type]} · criada em ${formatDate(open.createdAt)}` : ''}
        footer={
          open && (
            <>
              <Button variant="ghost" icon={LuTrash2} className="mr-auto text-red-600 hover:bg-red-50" onClick={() => setToDelete(open)}>Excluir</Button>
              {open.status !== 'descartada' ? (
                <Button variant="secondary" icon={LuBan} onClick={() => { updateOpportunity(open.id, { status: 'descartada' }); notify('info', 'Oportunidade descartada'); }}>Descartar</Button>
              ) : (
                <Button variant="secondary" onClick={() => updateOpportunity(open.id, { status: 'nova' })}>Reativar</Button>
              )}
              <Button icon={LuWandSparkles} disabled={open.status === 'descartada'} onClick={() => navigate('solucoes', { opp: open.id })}>{hasSolution(open.id) ? 'Ver solução' : 'Solicitar elaboração de solução'}</Button>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-5 text-sm">
            <p className="leading-relaxed text-slate-700">{open.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Problema relacionado', openProblem?.name ?? 'Não se aplica (sinal de mercado)'],
                ['Origem', OPPORTUNITY_ORIGINS[open.origin]],
                ['Benefício esperado', open.benefit],
                ['Complexidade estimada', LEVELS[open.complexity]],
                ['Impacto potencial', `${open.impact}/5`],
                ['Prioridade', PRIORITIES[open.priority]],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k}</p>
                  <p className="mt-1 text-slate-800">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Status:</span>
              <div className="w-52"><Select value={open.status} onChange={(e) => updateOpportunity(open.id, { status: e.target.value as OpportunityStatus })}>
                {Object.entries(OPPORTUNITY_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select></div>
              {openProblem && <SeverityBadge severity={openProblem.severity} />}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Evidências</p>
              <div className="space-y-2">
                {open.extraEvidence.map((e) => <p key={e} className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-slate-700">{e}</p>)}
                {openProblem?.evidence.slice(0, 4).map((m) => <EvidenceQuote key={m.id} m={m} compact />)}
                {!openProblem && open.extraEvidence.length === 0 && <p className="text-slate-500">Sem evidências registradas.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!toDelete} danger title="Excluir oportunidade?" confirmLabel="Excluir" text={<>A oportunidade <b>{toDelete?.title}</b> será removida. Soluções já elaboradas permanecem no sistema.</>} onConfirm={() => { if (toDelete) { deleteOpportunity(toDelete.id); setOpenId(null); notify('success', 'Oportunidade excluída'); } }} onClose={() => setToDelete(null)} />
    </div>
  );
}
