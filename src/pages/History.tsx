import { useMemo, useState } from 'react';
import { LuSearch, LuHistory, LuFilterX } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui/primitives';
import { Input, Select } from '../components/ui/fields';
import type { PageProps } from '../components/domain';
import { ACTIVITY_TYPES } from '../data/catalog';
import type { Activity } from '../types';
import { formatDate, formatTime, normalizeSearch } from '../utils/format';

const STATUS: Record<Activity['status'], { label: string; tone: 'green' | 'amber' | 'blue' | 'red'; dot: string }> = {
  sucesso: { label: 'Sucesso', tone: 'green', dot: 'bg-emerald-500' },
  pendente: { label: 'Pendente', tone: 'amber', dot: 'bg-amber-500' },
  info: { label: 'Informação', tone: 'blue', dot: 'bg-blue-500' },
  alerta: { label: 'Alerta', tone: 'red', dot: 'bg-red-500' },
};

export default function History(_: PageProps) {
  const { data } = useApp();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [actor, setActor] = useState('');
  const actors = useMemo(() => Array.from(new Set(data.activities.map((a) => a.actor))), [data.activities]);

  const list = useMemo(() => {
    const t = normalizeSearch(q);
    return [...data.activities]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .filter((a) => (!t || normalizeSearch(a.description).includes(t)) && (!type || a.type === type) && (!status || a.status === status) && (!actor || a.actor === actor));
  }, [data.activities, q, type, status, actor]);

  const groups = useMemo(() => {
    const m = new Map<string, Activity[]>();
    list.forEach((a) => {
      const d = a.timestamp.slice(0, 10);
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(a);
    });
    return Array.from(m.entries());
  }, [list]);

  return (
    <div>
      <PageHeader eyebrow="Auditoria" title="Histórico de atividades" description="Linha do tempo de tudo o que foi feito na plataforma: cadastros, análises, soluções, autorizações e execuções demonstrativas." />
      <Card className="mb-6">
        <div className="grid gap-2 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar na descrição…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar atividades" />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipo de atividade">
            <option value="">Todos os tipos</option>
            {Object.entries(ACTIVITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">Todos os status</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Responsável">
            <option value="">Todos os responsáveis</option>
            {actors.map((a) => <option key={a}>{a}</option>)}
          </Select>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{list.length} de {data.activities.length} registros</span>
          {(q || type || status || actor) && <Button size="sm" variant="ghost" icon={LuFilterX} onClick={() => { setQ(''); setType(''); setStatus(''); setActor(''); }}>Limpar filtros</Button>}
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState icon={LuHistory} title="Nenhuma atividade encontrada" />
      ) : (
        <div className="space-y-8">
          {groups.map(([day, items]) => (
            <div key={day}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{formatDate(day)}</p>
              <ol className="relative ml-3 space-y-3 border-l-2 border-slate-200 pl-6">
                {items.map((a) => (
                  <li key={a.id} className="relative">
                    <span className={`absolute -left-[31px] top-4 h-3 w-3 rounded-full ring-4 ring-[#f5f7fb] ${STATUS[a.status].dot}`} />
                    <Card className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold tabular-nums text-slate-900">{formatTime(a.timestamp)}</span>
                        <Badge tone="blue">{ACTIVITY_TYPES[a.type]}</Badge>
                        <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>
                        <span className="ml-auto text-xs text-slate-500">{a.actor}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{a.description}</p>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
