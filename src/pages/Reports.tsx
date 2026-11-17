import { useMemo, useState, type ReactNode } from 'react';
import { LuFileText, LuPrinter, LuFileDown, LuCalendar } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, PageHeader } from '../components/ui/primitives';
import { Field, Input } from '../components/ui/fields';
import { PlanStatusBadge, SeverityBadge, type PageProps } from '../components/domain';
import { COMPANY_COLOR, DonutChart, GroupedBarChart, HBarChart } from '../components/charts/Charts';
import { buildReport, dataPeriod } from '../services/reportService';
import { CATEGORIES, CRITERIA, OPPORTUNITY_TYPES, PRIORITIES, RECOMMENDATIONS, SENTIMENTS, SOURCES } from '../data/catalog';
import type { Criterion } from '../types';
import { formatDate, formatDateTime } from '../utils/format';

export default function Reports(_: PageProps) {
  const { data, addReport } = useApp();
  const notify = useToast();
  const period = dataPeriod(data);
  const [start, setStart] = useState(period.start);
  const [end, setEnd] = useState(period.end);
  const [generatedAt, setGeneratedAt] = useState<string | null>(data.reports[0]?.createdAt ?? null);
  const report = useMemo(() => buildReport(data, start || period.start, end || period.end), [data, start, end, period.start, period.end]);
  const crit = Object.keys(CRITERIA) as Criterion[];

  const generate = () => {
    const r = addReport({ periodStart: start, periodEnd: end, title: `${data.company.name} — ${formatDate(start)} a ${formatDate(end)}` });
    setGeneratedAt(r.createdAt);
    notify('success', 'Relatório executivo gerado', 'Use “Exportar PDF” para salvar o documento.');
  };

  const exportPdf = () => {
    if (!generatedAt) generate();
    notify('info', 'Abrindo impressão', 'Escolha “Salvar como PDF” como destino.');
    window.setTimeout(() => window.print(), 250);
  };

  return (
    <div>
      <div className="print-hide">
        <PageHeader
          eyebrow="Comunicar"
          title="Relatórios executivos"
          description="O relatório é montado com os dados atuais do sistema — manifestações, problemas, concorrentes, oportunidades, soluções e planos — para o período selecionado."
          actions={
            <>
              <Button variant="secondary" icon={LuFileText} onClick={generate}>Gerar relatório</Button>
              <Button icon={LuFileDown} onClick={exportPdf}>Exportar PDF</Button>
            </>
          }
        />
        <Card className="mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Início do período"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="Fim do período"><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
            <Button variant="ghost" icon={LuCalendar} onClick={() => { setStart(period.start); setEnd(period.end); }}>Período completo</Button>
            <div className="ml-auto text-right text-xs text-slate-500">
              {generatedAt ? <>Último relatório gerado em <b>{formatDateTime(generatedAt)}</b> · {data.reports.length} no histórico</> : 'Nenhum relatório gerado ainda.'}
            </div>
          </div>
        </Card>
      </div>

      <div className="print-area mx-auto max-w-[900px] space-y-6">
        {/* Capa */}
        <Page className="hero-grid flex min-h-[1000px] flex-col justify-between p-12 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-tight">Insight Agent</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-200/70">Relatório executivo</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Inteligência estratégica</p>
            <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight">{report.companyName}</h1>
            <p className="mt-3 text-lg text-blue-100/80">Do feedback à estratégia: diagnóstico, oportunidades e plano de ação</p>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                ['Manifestações', report.stats.analyzed],
                ['Problemas', report.problems.length],
                ['Oportunidades', report.opportunities.length],
              ].map(([k, v]) => (
                <div key={k} className="border-l-2 border-emerald-300/70 pl-3">
                  <p className="text-3xl font-bold">{v}</p>
                  <p className="text-xs text-blue-100/70">{k}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end justify-between text-xs text-blue-100/70">
            <div>
              <p>1. Empresa: <b className="text-white">{report.companyName}</b> · {report.segment}</p>
              <p className="mt-1">2. Período analisado: <b className="text-white">{formatDate(report.periodStart)} a {formatDate(report.periodEnd)}</b></p>
            </div>
            <p>Documento demonstrativo — dados simulados</p>
          </div>
        </Page>

        <Page>
          <H n="3" title="Resumo executivo" />
          <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">{report.summary.map((s) => <p key={s}>{s}</p>)}</div>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            <Kpi label="4. Manifestações" value={report.stats.analyzed} />
            <Kpi label="Reclamações" value={report.stats.complaints} />
            <Kpi label="Sugestões" value={report.stats.suggestions} />
            <Kpi label="Avaliações positivas" value={report.stats.praises} />
          </div>
          <H n="5" title="Sentimento predominante" className="mt-10" />
          <div className="grid gap-8 md:grid-cols-2">
            <DonutChart size={170} centerValue={SENTIMENTS[report.stats.predominant].label} centerLabel="predominante" data={(['negativo', 'neutro', 'positivo'] as const).map((s) => ({ label: SENTIMENTS[s].label, value: report.stats.sentiment[s], color: SENTIMENTS[s].color }))} />
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Temas mais citados</p>
              <HBarChart data={report.stats.byCategory.slice(0, 6).map((c) => ({ label: c.label, value: c.count }))} />
            </div>
          </div>
        </Page>

        <Page>
          <H n="6" title="Principais reclamações" />
          <table className="w-full text-sm">
            <thead><tr className="border-b-2 border-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-500"><th className="py-2">Problema</th><th className="py-2">Categoria</th><th className="py-2 text-right">Manifestações</th><th className="py-2 text-right">Gravidade</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {report.problems.map((p) => (
                <tr key={p.id}><td className="py-2.5 font-medium text-slate-800">{p.name}</td><td className="py-2.5 text-slate-600">{CATEGORIES[p.category]}</td><td className="py-2.5 text-right font-semibold">{p.count}</td><td className="py-2.5 text-right"><SeverityBadge severity={p.severity} /></td></tr>
              ))}
            </tbody>
          </table>
          <H n="7" title="Sugestões recorrentes" className="mt-10" />
          <ul className="space-y-2">
            {report.suggestions.map((s) => <li key={s.id} className="rounded-lg border-l-4 border-amber-400 bg-amber-50/50 px-3 py-2 text-sm text-slate-700">“{s.content}” <span className="text-xs text-slate-400">— {SOURCES[s.source].label}, {formatDate(s.date)} (demo)</span></li>)}
            {report.suggestions.length === 0 && <li className="text-sm text-slate-500">Nenhuma sugestão no período.</li>}
          </ul>
        </Page>

        <Page>
          <H n="8" title="Problemas identificados" />
          <div className="space-y-4">
            {report.problems.slice(0, 5).map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">{p.name}</p><SeverityBadge severity={p.severity} /></div>
                <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                <div className="mt-3 grid gap-3 text-xs md:grid-cols-3">
                  <p><b className="block text-slate-500">Observado</b>{p.observed[0]}</p>
                  <p><b className="block text-blue-700">Interpretação</b>{p.cause}</p>
                  <p><b className="block text-amber-700">Hipótese a validar</b>{p.hypotheses[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </Page>

        <Page>
          <H n="9" title="Análise dos concorrentes" />
          <GroupedBarChart
            categories={crit.map((c) => CRITERIA[c].split(' ')[0])}
            series={[{ label: report.companyName, color: COMPANY_COLOR, values: crit.map((c) => report.scores[c]) }, ...data.competitors.map((c) => ({ label: c.name, color: c.color, values: crit.map((k) => c.scores[k]) }))]}
          />
          <p className="mt-2 text-[11px] text-slate-400">Concorrentes fictícios com notas demonstrativas. Nota da empresa calculada a partir das manifestações.</p>
          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">O que os concorrentes oferecem e a empresa ainda não</p>
          <ul className="space-y-2 text-sm">
            {report.gaps.map((g) => <li key={g.feature} className="flex gap-3 rounded-lg bg-violet-50/60 p-3"><b className="w-64 shrink-0 text-slate-800">{g.label}</b><span className="text-slate-600">{g.competitors.join(', ')} · {g.recommendation}</span></li>)}
          </ul>
        </Page>

        <Page>
          <H n="10" title="Oportunidades" />
          <H n="12" title="Priorização" small />
          <table className="w-full text-sm">
            <thead><tr className="border-b-2 border-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-500"><th className="py-2">#</th><th className="py-2">Oportunidade</th><th className="py-2">Tipo</th><th className="py-2 text-center">Impacto</th><th className="py-2 text-center">Esforço</th><th className="py-2 text-right">Prioridade</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {report.opportunities.map((o, i) => (
                <tr key={o.id}><td className="py-2.5 font-bold text-slate-400">{i + 1}</td><td className="py-2.5 font-medium text-slate-800">{o.title}</td><td className="py-2.5 text-xs text-slate-600">{OPPORTUNITY_TYPES[o.type]}</td><td className="py-2.5 text-center">{o.impact}/5</td><td className="py-2.5 text-center">{o.effort}/5</td><td className="py-2.5 text-right"><Badge tone={o.priority === 'alta' ? 'red' : 'amber'}>{PRIORITIES[o.priority]}</Badge></td></tr>
              ))}
            </tbody>
          </table>
          <H n="11" title="Soluções recomendadas" className="mt-10" />
          <div className="grid gap-3 md:grid-cols-2">
            {report.solutions.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4">
                <Badge tone={RECOMMENDATIONS[s.recommendation].tone}>{RECOMMENDATIONS[s.recommendation].label}</Badge>
                <p className="mt-2 font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.proposal[0]}</p>
                <p className="mt-2 text-[11px] text-slate-500">{s.resources.orcamento}</p>
              </div>
            ))}
          </div>
        </Page>

        <Page>
          <H n="13" title="Planos de ação" />
          <div className="space-y-4">
            {report.plans.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">{p.name}</p><PlanStatusBadge status={p.status} /></div>
                <p className="mt-1 text-sm text-slate-600">{p.objective}</p>
                <p className="mt-2 text-xs text-slate-500">{p.steps.filter((s) => s.done).length}/{p.steps.length} etapas concluídas · Responsável: {p.owner} · {p.investment}</p>
                <div className="mt-2 flex flex-wrap gap-1">{p.kpis.map((k) => <Badge key={k.name} tone="blue">{k.name}: {k.baseline} → {k.target}</Badge>)}</div>
              </div>
            ))}
          </div>
          <H n="14" title="Conclusão estratégica" className="mt-10" />
          <div className="rounded-2xl bg-[#0b1733] p-6 text-[15px] leading-relaxed text-blue-50">
            {report.conclusion.map((c) => <p key={c} className="mb-2 last:mb-0">{c}</p>)}
          </div>
          <p className="mt-8 border-t border-slate-200 pt-3 text-[11px] text-slate-400">
            Gerado pelo Insight Agent (motor demonstrativo local) {generatedAt ? `em ${formatDateTime(generatedAt)}` : ''}. Todos os dados, empresas e avaliações são fictícios.
          </p>
        </Page>
      </div>
      <div className="print-hide mt-6 flex justify-center">
        <Button icon={LuPrinter} variant="secondary" onClick={exportPdf}>Exportar PDF</Button>
      </div>
    </div>
  );
}

function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`print-page rounded-2xl border border-slate-200 bg-white p-10 shadow-sm ${className}`}>{children}</section>;
}
function H({ n, title, className = '', small }: { n: string; title: string; className?: string; small?: boolean }) {
  return (
    <div className={`mb-5 flex items-baseline gap-3 ${className}`}>
      <span className="text-sm font-bold text-blue-600">{n.padStart(2, '0')}</span>
      <h2 className={small ? 'text-sm font-semibold uppercase tracking-wider text-slate-500' : 'text-2xl font-bold tracking-tight text-slate-900'}>{title}</h2>
    </div>
  );
}
function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-t-2 border-slate-900 pt-2">
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
