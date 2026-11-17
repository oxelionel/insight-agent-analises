/**
 * Gráficos SVG leves, sem dependências externas.
 * Seguem marcações finas, grade discreta, legenda para >= 2 séries e tooltip ao passar o mouse.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

export const COMPANY_COLOR = '#2a78d6';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    setW(el.clientWidth || 600);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Tooltip({ x, y, children, width }: { x: number; y: number; children: ReactNode; width: number }) {
  const left = Math.min(Math.max(x - 80, 0), width - 160);
  return (
    <div className="pointer-events-none absolute z-10 w-40 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur" style={{ left, top: Math.max(0, y - 10), transform: 'translateY(-100%)' }}>
      {children}
    </div>
  );
}

export interface SeriesDef { key: string; label: string; color: string }

/** Linhas/áreas ao longo do tempo com crosshair. */
export function LineChart({ data, series, height = 220, area = true }: { data: { label: string; values: Record<string, number> }[]; series: SeriesDef[]; height?: number; area?: boolean }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 32, r: 12, t: 12, b: 26 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] || 0))));
  const x = (i: number) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, max / 2, max];

  return (
    <div ref={ref} className="relative w-full">
      {series.length > 1 && <div className="mb-3"><Legend items={series} /></div>}
      <svg width={width} height={height} role="img" aria-label="Gráfico de linhas" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? '' : '3 4'} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={d.label} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">{d.label}</text>
        ))}
        {series.map((s) => {
          const pts = data.map((d, i) => `${x(i)},${y(d.values[s.key] || 0)}`);
          return (
            <g key={s.key}>
              {area && data.length > 1 && (
                <path d={`M${x(0)},${y(0)} L${pts.join(' L')} L${x(data.length - 1)},${y(0)} Z`} fill={s.color} opacity={series.length > 1 ? 0.06 : 0.1} />
              )}
              <polyline points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {data.map((d, i) => (
                <circle key={i} cx={x(i)} cy={y(d.values[s.key] || 0)} r={hover === i ? 4.5 : 3} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          );
        })}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#94a3b8" strokeDasharray="3 3" />}
        {data.map((_, i) => (
          <rect key={i} x={x(i) - iw / Math.max(1, data.length - 1) / 2} y={pad.t} width={iw / Math.max(1, data.length - 1)} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && data[hover] && (
        <Tooltip x={x(hover)} y={pad.t + 30} width={width}>
          <p className="mb-1 font-semibold text-slate-900">{data[hover].label}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center justify-between gap-2 text-slate-600">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <span className="font-semibold text-slate-900">{data[hover].values[s.key] || 0}</span>
            </p>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

/** Rosca para composição (poucas fatias). */
export function DonutChart({ data, size = 180, centerValue, centerLabel }: { data: { label: string; value: number; color: string }[]; size?: number; centerValue?: string; centerLabel?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2 - 10;
  const stroke = 22;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Gráfico de rosca">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {data.map((d, i) => {
            const len = (d.value / total) * C;
            const gap = data.filter((x) => x.value > 0).length > 1 ? 2 : 0;
            const el = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={hover === i ? stroke + 4 : stroke}
                strokeDasharray={`${Math.max(0, len - gap)} ${C}`}
                strokeDashoffset={-acc}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-width .15s' }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
            acc += len;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-900">{hover !== null ? data[hover].value : centerValue}</span>
          <span className="text-[11px] text-slate-500">{hover !== null ? data[hover].label : centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="ml-auto pl-4 font-semibold text-slate-900">{d.value}</span>
            <span className="w-10 text-right text-xs text-slate-400">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Barras horizontais ordenadas (categorias). */
export function HBarChart({ data, color = COMPANY_COLOR, onSelect }: { data: { label: string; value: number }[]; color?: string; onSelect?: (label: string) => void }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <button key={d.label} type="button" onClick={() => onSelect?.(d.label)} className="group grid grid-cols-[130px_1fr_32px] items-center gap-3 text-left" title={`${d.label}: ${d.value}`}>
          <span className="truncate text-xs text-slate-600 group-hover:text-slate-900">{d.label}</span>
          <span className="h-3.5 rounded-r bg-slate-50">
            <span className="block h-full rounded-r transition-all duration-500 group-hover:opacity-80" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </span>
          <span className="text-right text-xs font-semibold text-slate-800">{d.value}</span>
        </button>
      ))}
    </div>
  );
}

/** Barras agrupadas: critérios x empresas (escala 0-5). */
export function GroupedBarChart({ categories, series, max = 5, height = 240 }: { categories: string[]; series: { label: string; color: string; values: number[] }[]; max?: number; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ c: number; s: number } | null>(null);
  const pad = { l: 28, r: 8, t: 10, b: 30 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const groupW = iw / categories.length;
  const barW = Math.min(18, (groupW * 0.72) / series.length - 2);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  return (
    <div ref={ref} className="relative w-full">
      <div className="mb-3"><Legend items={series} /></div>
      <svg width={width} height={height} role="img" aria-label="Comparativo por critério">
        {[0, 1, 2, 3, 4, 5].filter((t) => t <= max).map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? '' : '3 4'} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{t}</text>
          </g>
        ))}
        {categories.map((c, ci) => {
          const gx = pad.l + ci * groupW + (groupW - series.length * (barW + 2)) / 2;
          return (
            <g key={c}>
              {series.map((s, si) => {
                const v = s.values[ci] ?? 0;
                const h = Math.max(1, (v / max) * ih);
                const bx = gx + si * (barW + 2);
                return (
                  <path
                    key={s.label}
                    d={`M${bx},${y(0)} V${y(0) - h + 3} Q${bx},${y(0) - h} ${bx + 3},${y(0) - h} H${bx + barW - 3} Q${bx + barW},${y(0) - h} ${bx + barW},${y(0) - h + 3} V${y(0)} Z`}
                    fill={s.color}
                    opacity={hover && (hover.c !== ci || hover.s !== si) ? 0.45 : 1}
                    onMouseEnter={() => setHover({ c: ci, s: si })}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
              <text x={pad.l + ci * groupW + groupW / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{c}</text>
            </g>
          );
        })}
      </svg>
      {hover && (
        <Tooltip x={pad.l + hover.c * groupW + groupW / 2} y={y(series[hover.s].values[hover.c])} width={width}>
          <p className="font-semibold text-slate-900">{series[hover.s].label}</p>
          <p className="text-slate-600">{categories[hover.c]}: <b className="text-slate-900">{series[hover.s].values[hover.c].toFixed(1)}</b> / 5</p>
        </Tooltip>
      )}
    </div>
  );
}

/** Matriz Impacto x Esforço. */
export function ImpactEffortMatrix({ items, onSelect, height = 320 }: { items: { id: string; label: string; impact: number; effort: number; color: string }[]; onSelect?: (id: string) => void; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);
  const pad = { l: 40, r: 16, t: 16, b: 36 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const x = (e: number) => pad.l + ((e - 0.5) / 5) * iw;
  const y = (i: number) => pad.t + ih - ((i - 0.5) / 5) * ih;
  // Espalha pontos sobrepostos
  const seen = new Map<string, number>();
  const placed = items.map((it) => {
    const k = `${it.impact}-${it.effort}`;
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    return { ...it, dx: (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 18, dy: n ? -8 : 0 };
  });
  const quad = [
    { label: 'Ganhos rápidos', x: pad.l, y: pad.t, fill: '#ecfdf5', color: '#047857' },
    { label: 'Projetos estratégicos', x: pad.l + iw / 2, y: pad.t, fill: '#eff6ff', color: '#1d4ed8' },
    { label: 'Ajustes pontuais', x: pad.l, y: pad.t + ih / 2, fill: '#f8fafc', color: '#475569' },
    { label: 'Reavaliar', x: pad.l + iw / 2, y: pad.t + ih / 2, fill: '#fff7ed', color: '#c2410c' },
  ];
  const hv = placed.find((p) => p.id === hover);
  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label="Matriz impacto x esforço">
        {quad.map((q) => (
          <g key={q.label}>
            <rect x={q.x} y={q.y} width={iw / 2} height={ih / 2} fill={q.fill} stroke="#fff" strokeWidth={2} rx={6} />
            <text x={q.x + 10} y={q.y + 18} fontSize="11" fontWeight={600} fill={q.color}>{q.label}</text>
          </g>
        ))}
        <text x={pad.l + iw / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="#64748b">Esforço →</text>
        <text x={12} y={pad.t + ih / 2} textAnchor="middle" fontSize="11" fill="#64748b" transform={`rotate(-90 12 ${pad.t + ih / 2})`}>Impacto →</text>
        {placed.map((p) => (
          <g key={p.id} style={{ cursor: onSelect ? 'pointer' : 'default' }} onClick={() => onSelect?.(p.id)} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}>
            <circle cx={x(p.effort) + p.dx} cy={y(p.impact) + p.dy} r={hover === p.id ? 12 : 10} fill={p.color} stroke="#fff" strokeWidth={2} />
            <text x={x(p.effort) + p.dx} y={y(p.impact) + p.dy + 4} textAnchor="middle" fontSize="10" fontWeight={700} fill="#fff">{items.indexOf(items.find((i) => i.id === p.id)!) + 1}</text>
          </g>
        ))}
      </svg>
      {hv && (
        <Tooltip x={x(hv.effort) + hv.dx} y={y(hv.impact) + hv.dy - 12} width={width}>
          <p className="font-semibold text-slate-900">{hv.label}</p>
          <p className="text-slate-600">Impacto {hv.impact}/5 · Esforço {hv.effort}/5</p>
        </Tooltip>
      )}
    </div>
  );
}

/** Barra de pontuação simples 0-5. */
export function ScoreBar({ value, color, max = 5 }: { value: number; color: string; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="w-7 text-right text-xs font-semibold tabular-nums text-slate-700">{value.toFixed(1)}</span>
    </div>
  );
}
