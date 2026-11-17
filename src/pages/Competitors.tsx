import { useMemo, useState } from 'react';
import { LuPlus, LuPencil, LuTrash2, LuStar, LuSwords, LuLightbulb, LuShieldCheck, LuCircleCheck, LuCircleMinus } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, CardHeader, ConfirmDialog, DemoTag, EmptyState, IconButton, Modal, PageHeader } from '../components/ui/primitives';
import { Field, Input, TagInput } from '../components/ui/fields';
import { COMPANY_COLOR, GroupedBarChart, ScoreBar } from '../components/charts/Charts';
import type { PageProps } from '../components/domain';
import { companyAdvantages, companyScores, competitorGaps } from '../services/analysisEngine';
import { CRITERIA, FEATURES } from '../data/catalog';
import { getDefinition } from '../data/knowledgeBase';
import { PLAYBOOKS } from '../services/playbooks';
import type { Competitor, Criterion } from '../types';
import { navigate } from '../utils/router';
import { uid } from '../utils/format';

const PALETTE = ['#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];

export default function Competitors(_: PageProps) {
  const { data, saveCompetitor, deleteCompetitor, addOpportunity } = useApp();
  const notify = useToast();
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [toDelete, setToDelete] = useState<Competitor | null>(null);
  const criteria = Object.keys(CRITERIA) as Criterion[];
  const scores = useMemo(() => companyScores(data.manifestations, data.company.name), [data.manifestations, data.company.name]);
  const gaps = useMemo(() => competitorGaps(data.company, data.competitors), [data.company, data.competitors]);
  const advantages = useMemo(() => companyAdvantages(data.company, data.competitors), [data.company, data.competitors]);
  const cols = data.competitors.slice(0, 4);

  const newCompetitor = (): Competitor => ({
    id: uid('c'), name: '', segment: data.company.segment, offerings: [], differentials: [], features: [], rating: 4, reviews: 0, strengths: [], weaknesses: [],
    scores: { atendimento: 3, preco: 3, tecnologia: 3, experiencia: 3, prazo: 3 }, priceLevel: 'Intermediário', color: PALETTE[data.competitors.length % PALETTE.length],
  });

  const createGapOpportunity = (g: (typeof gaps)[number]) => {
    const existing = data.opportunities.find((o) => o.playbook === g.playbook || o.title === g.label);
    if (existing) return navigate('oportunidades', { o: existing.id });
    const pb = g.playbook ? PLAYBOOKS[g.playbook] : undefined;
    const def = g.playbook ? getDefinition(g.playbook) : undefined;
    const o = addOpportunity({
      title: pb?.title ?? g.label,
      description: g.recommendation,
      problemId: def?.id,
      playbook: g.playbook ?? 'p-demora-atendimento',
      origin: 'concorrente',
      type: 'vantagem_competitiva',
      benefit: `Eliminar a desvantagem frente a ${g.competitors.join(' e ')}.`,
      complexity: pb?.complexity ?? 'media',
      impact: 3 + Math.min(2, g.competitors.length),
      effort: pb ? { baixa: 2, media: 3, alta: 4 }[pb.complexity] : 3,
      priority: g.competitors.length > 1 ? 'alta' : 'media',
      extraEvidence: [`Concorrentes demonstrativos que oferecem ${g.label.toLowerCase()}: ${g.competitors.join(', ')}.`],
    });
    notify('success', 'Oportunidade competitiva criada', o.title);
    navigate('oportunidades', { o: o.id });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Comparar"
        title="Inteligência competitiva"
        description="Compare a empresa com concorrentes e descubra recursos que o mercado já oferece. Concorrentes, notas e avaliações são fictícios e demonstrativos."
        actions={<Button icon={LuPlus} onClick={() => setEditing(newCompetitor())}>Cadastrar concorrente</Button>}
      />

      {data.competitors.length === 0 ? (
        <EmptyState icon={LuSwords} title="Nenhum concorrente cadastrado" text="Cadastre concorrentes para habilitar a comparação." action={<Button onClick={() => setEditing(newCompetitor())}>Cadastrar</Button>} />
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.competitors.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: c.color }}>{c.name.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">{c.name} <DemoTag /></p>
                      <p className="text-xs text-slate-500">{c.segment} · {c.priceLevel}</p>
                    </div>
                  </div>
                  <div className="flex">
                    <IconButton icon={LuPencil} label="Editar" onClick={() => setEditing({ ...c })} />
                    <IconButton icon={LuTrash2} label="Excluir" tone="danger" onClick={() => setToDelete(c)} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-sm">
                  <LuStar className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <b>{c.rating.toFixed(1)}</b>
                  <span className="text-xs text-slate-400">· {c.reviews.toLocaleString('pt-BR')} avaliações demonstrativas</span>
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recursos identificados</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.features.map((f) => <Badge key={f} tone={data.company.features.includes(f) ? 'slate' : 'violet'}>{FEATURES[f]?.label ?? f}</Badge>)}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="mb-1 font-semibold text-emerald-700">Pontos fortes</p>
                    {c.strengths.map((s) => <p key={s} className="text-slate-600">+ {s}</p>)}
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-red-700">Pontos fracos</p>
                    {c.weaknesses.map((s) => <p key={s} className="text-slate-600">− {s}</p>)}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-3" padded={false}>
              <div className="p-5 pb-3"><CardHeader title="Tabela comparativa" subtitle={`Nota da ${data.company.name} calculada a partir do sentimento das manifestações; concorrentes com notas demonstrativas.`} /></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2.5 font-semibold">Critério</th>
                      <th className="px-3 py-2.5 font-semibold text-blue-700">{data.company.name}</th>
                      {cols.map((c) => <th key={c.id} className="px-3 py-2.5 font-semibold">{c.name}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criteria.map((k) => {
                      const best = Math.max(scores[k], ...cols.map((c) => c.scores[k]));
                      return (
                        <tr key={k}>
                          <td className="px-5 py-3 font-medium text-slate-700">{CRITERIA[k]}</td>
                          <td className={`px-3 py-3 ${scores[k] === best ? 'bg-emerald-50/50' : ''}`}><ScoreBar value={scores[k]} color={COMPANY_COLOR} /></td>
                          {cols.map((c) => <td key={c.id} className={`px-3 py-3 ${c.scores[k] === best ? 'bg-emerald-50/50' : ''}`}><ScoreBar value={c.scores[k]} color={c.color} /></td>)}
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="px-5 py-3 align-top font-medium text-slate-700">Diferenciais</td>
                      <td className="px-3 py-3 align-top text-xs text-slate-600">{data.company.differentials.slice(0, 2).join(' · ') || '—'}</td>
                      {cols.map((c) => <td key={c.id} className="px-3 py-3 align-top text-xs text-slate-600">{c.differentials.join(' · ')}</td>)}
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-medium text-slate-700">Avaliação média</td>
                      <td className="px-3 py-3 text-xs text-slate-500">Ver dashboard</td>
                      {cols.map((c) => <td key={c.id} className="px-3 py-3 text-xs font-semibold text-slate-700">★ {c.rating.toFixed(1)}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="px-5 py-3 text-[11px] text-slate-400">Destaque verde: melhor nota do critério. Todos os concorrentes são fictícios.</p>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader title="Comparativo visual" subtitle="Notas de 1 a 5 por critério" />
              <GroupedBarChart
                categories={criteria.map((c) => CRITERIA[c].split(' ')[0])}
                series={[{ label: data.company.name, color: COMPANY_COLOR, values: criteria.map((c) => scores[c]) }, ...cols.map((c) => ({ label: c.name, color: c.color, values: criteria.map((k) => c.scores[k]) }))]}
              />
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="O que os concorrentes oferecem e minha empresa ainda não oferece?" subtitle="Lacunas competitivas detectadas pela comparação de recursos" icon={LuLightbulb} />
              {gaps.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma lacuna identificada — a empresa oferece todos os recursos mapeados nos concorrentes.</p>
              ) : (
                <div className="space-y-3">
                  {gaps.map((g) => (
                    <div key={g.feature} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{g.label}</p>
                          <Badge tone="violet">{g.competitors.length} concorrente(s)</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Concorrentes demonstrativos ({g.competitors.join(', ')}) apresentam {g.label.toLowerCase()}, enquanto a {data.company.name} ainda não possui esse recurso.
                        </p>
                        <p className="mt-1.5 text-sm text-blue-800"><b>Recomendação:</b> {g.recommendation}</p>
                      </div>
                      <Button size="sm" variant="secondary" icon={LuLightbulb} onClick={() => createGapOpportunity(g)}>
                        {data.opportunities.some((o) => o.playbook === g.playbook || o.title === g.label) ? 'Ver oportunidade' : 'Criar oportunidade'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <CardHeader title="Vantagens da empresa" subtitle="Recursos raros entre os concorrentes" icon={LuShieldCheck} />
              <div className="space-y-2">
                {advantages.map((a) => <p key={a} className="flex items-center gap-2 text-sm text-slate-700"><LuCircleCheck className="h-4 w-4 text-emerald-600" /> {a}</p>)}
                {advantages.length === 0 && <p className="text-sm text-slate-500">Nenhuma vantagem exclusiva mapeada.</p>}
              </div>
              <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Matriz de recursos</p>
              <div className="space-y-1">
                {Array.from(new Set([...data.company.features, ...data.competitors.flatMap((c) => c.features)])).filter((f) => FEATURES[f]).map((f) => (
                  <div key={f} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-slate-600">{FEATURES[f].label}</span>
                    <span className="flex gap-1">
                      {[{ id: 'me', color: COMPANY_COLOR, has: data.company.features.includes(f), name: data.company.name }, ...cols.map((c) => ({ id: c.id, color: c.color, has: c.features.includes(f), name: c.name }))].map((x) =>
                        x.has ? <LuCircleCheck key={x.id} className="h-4 w-4" style={{ color: x.color }} aria-label={`${x.name}: sim`} /> : <LuCircleMinus key={x.id} className="h-4 w-4 text-slate-200" aria-label={`${x.name}: não`} />,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      <CompetitorForm value={editing} onClose={() => setEditing(null)} onSave={(c) => { saveCompetitor(c); notify('success', 'Concorrente salvo', c.name); setEditing(null); }} />
      <ConfirmDialog open={!!toDelete} danger title="Excluir concorrente?" confirmLabel="Excluir" text={<>O concorrente <b>{toDelete?.name}</b> será removido das comparações.</>} onConfirm={() => { if (toDelete) { deleteCompetitor(toDelete.id); notify('success', 'Concorrente excluído'); } }} onClose={() => setToDelete(null)} />
    </div>
  );
}

function CompetitorForm({ value, onClose, onSave }: { value: Competitor | null; onClose: () => void; onSave: (c: Competitor) => void }) {
  const [c, setC] = useState<Competitor | null>(value);
  const [err, setErr] = useState('');
  if (value && (!c || c.id !== value.id)) { setC(value); setErr(''); }
  if (!value || !c) return null;
  const set = <K extends keyof Competitor>(k: K, v: Competitor[K]) => setC({ ...c, [k]: v });
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={c.name ? `Editar ${c.name}` : 'Cadastrar concorrente'}
      subtitle="Use apenas dados fictícios ou públicos e verificados — esta é uma demonstração"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={() => (c.name.trim() ? onSave({ ...c, name: c.name.trim() }) : setErr('Informe o nome.'))}>Salvar</Button></>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome" required><Input value={c.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Segmento"><Input value={c.segment} onChange={(e) => set('segment', e.target.value)} /></Field>
        <Field label="Produtos e serviços"><TagInput value={c.offerings} onChange={(v) => set('offerings', v)} /></Field>
        <Field label="Diferenciais"><TagInput value={c.differentials} onChange={(v) => set('differentials', v)} /></Field>
        <Field label="Pontos fortes"><TagInput value={c.strengths} onChange={(v) => set('strengths', v)} /></Field>
        <Field label="Pontos fracos"><TagInput value={c.weaknesses} onChange={(v) => set('weaknesses', v)} /></Field>
        <Field label="Avaliação demonstrativa (0–5)"><Input type="number" min={0} max={5} step={0.1} value={c.rating} onChange={(e) => set('rating', Math.min(5, Math.max(0, Number(e.target.value))))} /></Field>
        <Field label="Nível de preço"><Input value={c.priceLevel} onChange={(e) => set('priceLevel', e.target.value)} /></Field>
        <div className="md:col-span-2">
          <p className="mb-2 text-xs font-semibold text-slate-700">Notas por critério (1–5)</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {(Object.keys(CRITERIA) as Criterion[]).map((k) => (
              <Field key={k} label={CRITERIA[k]}>
                <Input type="number" min={1} max={5} step={0.1} value={c.scores[k]} onChange={(e) => set('scores', { ...c.scores, [k]: Math.min(5, Math.max(1, Number(e.target.value))) })} />
              </Field>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="mb-2 text-xs font-semibold text-slate-700">Recursos identificados</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(FEATURES).map(([k, f]) => {
              const on = c.features.includes(k);
              return (
                <button key={k} type="button" aria-pressed={on} onClick={() => set('features', on ? c.features.filter((x) => x !== k) : [...c.features, k])} className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${on ? 'bg-violet-600 text-white ring-violet-600' : 'bg-white text-slate-600 ring-slate-200'}`}>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
    </Modal>
  );
}
