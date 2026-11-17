import type { IconType } from 'react-icons';
import { LuEar, LuBrainCircuit, LuCrosshair, LuSwords, LuWandSparkles, LuListChecks, LuShieldCheck, LuRocket, LuArrowRight, LuTrendingUp } from 'react-icons/lu';
import type { Manifestation, PlanStatus, Sentiment, Severity, SourceKey } from '../types';
import { MANIFESTATION_TYPES, PLAN_STATUS, SENTIMENTS, SEVERITIES, SOURCES } from '../data/catalog';
import { Badge, DemoTag } from './ui/primitives';
import { navigate, type PageKey } from '../utils/router';
import { cn, formatDate } from '../utils/format';

export interface PageProps { params: Record<string, string> }

export function SourceBadge({ source }: { source: SourceKey }) {
  const s = SOURCES[source];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const tone = sentiment === 'positivo' ? 'green' : sentiment === 'negativo' ? 'red' : 'slate';
  return <Badge tone={tone} dot>{SENTIMENTS[sentiment].label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge tone={SEVERITIES[severity].tone}>Gravidade {SEVERITIES[severity].label.toLowerCase()}</Badge>;
}

export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  return <Badge tone={PLAN_STATUS[status].tone} dot>{PLAN_STATUS[status].label}</Badge>;
}

export function EvidenceQuote({ m, compact }: { m: Manifestation; compact?: boolean }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-slate-50/70', compact ? 'p-3' : 'p-3.5')}>
      <p className="text-sm leading-relaxed text-slate-700">“{m.content}”</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <SourceBadge source={m.source} />
        <span>{m.author}</span>
        <span>·</span>
        <span>{formatDate(m.date)}</span>
        <span>·</span>
        <span>{MANIFESTATION_TYPES[m.type]}</span>
        {m.demo && <DemoTag />}
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'blue', hint, onClick }: { label: string; value: number | string; icon: IconType; tone?: 'blue' | 'red' | 'green' | 'amber' | 'violet' | 'slate' | 'orange'; hint?: string; onClick?: () => void }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <button type="button" onClick={onClick} className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <LuArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </button>
  );
}

export const CYCLE: { key: string; label: string; icon: IconType; page: PageKey; text: string }[] = [
  { key: 'escutar', label: 'Escutar', icon: LuEar, page: 'monitoramento', text: 'Reúne manifestações de várias fontes' },
  { key: 'analisar', label: 'Analisar', icon: LuBrainCircuit, page: 'analise', text: 'Sentimento, temas e gravidade' },
  { key: 'identificar', label: 'Identificar', icon: LuCrosshair, page: 'analise', text: 'Agrupa recorrências em problemas' },
  { key: 'comparar', label: 'Comparar', icon: LuSwords, page: 'concorrentes', text: 'Confronta com concorrentes' },
  { key: 'propor', label: 'Propor', icon: LuWandSparkles, page: 'solucoes', text: 'Estrutura soluções' },
  { key: 'planejar', label: 'Planejar', icon: LuListChecks, page: 'planos', text: 'Plano com etapas e KPIs' },
  { key: 'autorizar', label: 'Autorizar', icon: LuShieldCheck, page: 'planos', text: 'Aprovação humana explícita' },
  { key: 'executar', label: 'Executar', icon: LuRocket, page: 'planos', text: 'Execução demonstrativa' },
];

export function CycleFlow({ counts, dark }: { counts?: Partial<Record<string, number | string>>; dark?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
      {CYCLE.map((c, i) => (
        <button
          key={c.key}
          type="button"
          onClick={() => navigate(c.page)}
          className={cn(
            'group relative flex flex-col items-start rounded-xl p-3 text-left transition',
            dark ? 'bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.12]' : 'bg-white ring-1 ring-slate-200 hover:ring-blue-300',
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', dark ? 'bg-blue-400/20 text-blue-200' : 'bg-blue-50 text-blue-600')}>
              <c.icon className="h-4 w-4" />
            </span>
            <span className={cn('text-[10px] font-bold', dark ? 'text-blue-200/60' : 'text-slate-300')}>0{i + 1}</span>
          </div>
          <p className={cn('mt-2 text-[11px] font-bold uppercase tracking-wider', dark ? 'text-white' : 'text-slate-900')}>{c.label}</p>
          <p className={cn('mt-0.5 text-[11px] leading-snug', dark ? 'text-blue-100/60' : 'text-slate-500')}>{c.text}</p>
          {counts?.[c.key] !== undefined && <p className={cn('mt-1.5 text-sm font-bold tabular-nums', dark ? 'text-emerald-300' : 'text-blue-600')}>{counts[c.key]}</p>}
        </button>
      ))}
    </div>
  );
}

export function TrendHint({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
      <LuTrendingUp className="h-3.5 w-3.5" /> {text}
    </span>
  );
}
