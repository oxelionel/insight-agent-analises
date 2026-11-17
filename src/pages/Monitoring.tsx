import { useMemo, useState } from 'react';
import { LuPlus, LuBrainCircuit, LuPencil, LuTrash2, LuSearch, LuFilterX, LuLink } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, ConfirmDialog, DemoTag, EmptyState, IconButton, PageHeader } from '../components/ui/primitives';
import { Input, Select } from '../components/ui/fields';
import { SentimentBadge, SourceBadge, type PageProps } from '../components/domain';
import { ManifestationForm } from '../components/ManifestationForm';
import { AnalysisRunner } from '../components/AnalysisRunner';
import { CATEGORIES, MANIFESTATION_TYPES, PRIORITIES, SENTIMENTS, SOURCES } from '../data/catalog';
import type { Manifestation, SourceKey } from '../types';
import { formatDate, normalizeSearch } from '../utils/format';

interface Filters { q: string; source: string; from: string; to: string; category: string; sentiment: string; priority: string; status: string; type: string }

export default function Monitoring({ params }: PageProps) {
  const { data, deleteManifestation, stats } = useApp();
  const notify = useToast();
  const empty: Filters = { q: '', source: '', from: '', to: '', category: '', sentiment: '', priority: '', status: '', type: '' };
  const [f, setF] = useState<Filters>({ ...empty, q: params.q ?? '', type: params.tipo ?? '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Manifestation | null>(null);
  const [toDelete, setToDelete] = useState<Manifestation | null>(null);
  const [running, setRunning] = useState(false);

  const set = (k: keyof Filters, v: string) => setF((s) => ({ ...s, [k]: v }));
  const active = Object.values(f).some(Boolean);

  const list = useMemo(() => {
    const q = normalizeSearch(f.q);
    return data.manifestations
      .filter((m) => (!q || normalizeSearch(`${m.content} ${m.author} ${m.company}`).includes(q))
        && (!f.source || m.source === f.source)
        && (!f.from || m.date >= f.from)
        && (!f.to || m.date <= f.to)
        && (!f.category || m.category === f.category)
        && (!f.sentiment || m.sentiment === f.sentiment)
        && (!f.priority || m.priority === f.priority)
        && (!f.status || m.status === f.status)
        && (!f.type || m.type === f.type))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.manifestations, f]);

  const bySource = useMemo(() => {
    const map = new Map<SourceKey, number>();
    data.manifestations.forEach((m) => map.set(m.source, (map.get(m.source) || 0) + 1));
    return map;
  }, [data.manifestations]);

  return (
    <div>
      <PageHeader
        eyebrow="Escutar"
        title="Monitoramento de mercado"
        description="Central de manifestações: reclamações, sugestões, avaliações, notícias e informações de concorrentes. Nesta versão, as fontes são categorias demonstrativas — não há coleta automática nem acesso real às plataformas."
        actions={
          <>
            <Button variant="secondary" icon={LuPlus} onClick={() => { setEditing(null); setFormOpen(true); }}>Adicionar manifestação</Button>
            <Button icon={LuBrainCircuit} onClick={() => setRunning(true)}>
              Analisar manifestações {stats.pending > 0 && <span className="rounded-full bg-white/25 px-1.5 text-[11px]">{stats.pending}</span>}
            </Button>
          </>
        }
      />

      {/* Fontes */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-11">
        {(Object.keys(SOURCES) as SourceKey[]).map((k) => {
          const on = f.source === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => set('source', on ? '' : k)}
              className={`rounded-xl border p-2.5 text-left transition ${on ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: SOURCES[k].color }} />
                <span className="truncate text-[11px] font-medium text-slate-600">{SOURCES[k].label}</span>
              </span>
              <span className="mt-1 block text-lg font-bold text-slate-900">{bySource.get(k) ?? 0}</span>
            </button>
          );
        })}
      </div>

      <Card padded={false}>
        <div className="grid gap-2 border-b border-slate-100 p-4 md:grid-cols-4 xl:grid-cols-8">
          <div className="relative md:col-span-2">
            <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar no conteúdo…" value={f.q} onChange={(e) => set('q', e.target.value)} aria-label="Buscar manifestações" />
          </div>
          <Select value={f.category} onChange={(e) => set('category', e.target.value)} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={f.sentiment} onChange={(e) => set('sentiment', e.target.value)} aria-label="Sentimento">
            <option value="">Todos os sentimentos</option>
            {Object.entries(SENTIMENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Select value={f.priority} onChange={(e) => set('priority', e.target.value)} aria-label="Prioridade">
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={f.status} onChange={(e) => set('status', e.target.value)} aria-label="Status">
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="analisada">Analisada</option>
          </Select>
          <Input type="date" value={f.from} onChange={(e) => set('from', e.target.value)} aria-label="Data inicial" title="Data inicial" />
          <Input type="date" value={f.to} onChange={(e) => set('to', e.target.value)} aria-label="Data final" title="Data final" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-slate-500">
          <span>
            {list.length} de {data.manifestations.length} manifestações
            {f.type && <> · tipo: <b>{MANIFESTATION_TYPES[f.type as keyof typeof MANIFESTATION_TYPES]}</b></>}
          </span>
          {active && <Button size="sm" variant="ghost" icon={LuFilterX} onClick={() => setF(empty)}>Limpar filtros</Button>}
        </div>

        {list.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Nenhuma manifestação encontrada" text="Ajuste os filtros ou adicione uma nova manifestação." action={<Button size="sm" icon={LuPlus} onClick={() => setFormOpen(true)}>Adicionar</Button>} />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((m) => (
              <li key={m.id} className="group flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50/70 md:flex-row md:items-start">
                <div className="w-24 shrink-0 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">{formatDate(m.date)}</p>
                  <p className="mt-0.5">{m.id}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-slate-800">{m.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <SourceBadge source={m.source} />
                    <SentimentBadge sentiment={m.sentiment} />
                    <Badge>{CATEGORIES[m.category]}</Badge>
                    <Badge tone="blue">{MANIFESTATION_TYPES[m.type]}</Badge>
                    <Badge tone={m.priority === 'alta' ? 'red' : m.priority === 'media' ? 'amber' : 'slate'}>Prioridade {PRIORITIES[m.priority].toLowerCase()}</Badge>
                    {m.company !== data.company.name && <Badge tone="violet">{m.company}</Badge>}
                    {m.demo && <DemoTag />}
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400">
                    <span>{m.author}</span>
                    {m.link && <span className="inline-flex items-center gap-1" title="Link demonstrativo — não aponta para uma página real"><LuLink className="h-3 w-3" />{m.link}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-end">
                  {m.status === 'pendente' ? <Badge tone="amber" dot>Pendente</Badge> : <Badge tone="green" dot>Analisada</Badge>}
                  <div className="flex">
                    <IconButton icon={LuPencil} label="Editar" onClick={() => { setEditing(m); setFormOpen(true); }} />
                    <IconButton icon={LuTrash2} label="Excluir" tone="danger" onClick={() => setToDelete(m)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ManifestationForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <AnalysisRunner open={running} onClose={() => setRunning(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir manifestação?"
        danger
        confirmLabel="Excluir"
        text={<>A manifestação <b>“{toDelete?.content.slice(0, 80)}”</b> será removida e as análises serão recalculadas. Esta ação não pode ser desfeita.</>}
        onConfirm={() => {
          if (toDelete) {
            deleteManifestation(toDelete.id);
            notify('success', 'Manifestação excluída');
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
