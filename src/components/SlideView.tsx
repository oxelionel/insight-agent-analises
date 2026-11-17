import type { Slide } from '../services/presentationService';
import { cn } from '../utils/format';

interface Props { slide: Slide; index: number; total: number; company: string; editable?: boolean; thumb?: boolean; onEdit?: (field: 'title' | 'subtitle', value: string) => void }

function Editable({ value, field, editable, onEdit, className, as: Tag = 'p' }: { value?: string; field: 'title' | 'subtitle'; editable?: boolean; onEdit?: Props['onEdit']; className: string; as?: 'p' | 'h2' | 'h1' }) {
  if (!value && !editable) return null;
  return (
    <Tag
      className={className}
      contentEditable={editable}
      suppressContentEditableWarning
      onBlur={(e) => editable && onEdit?.(field, e.currentTarget.textContent ?? '')}
    >
      {value}
    </Tag>
  );
}

export function SlideView({ slide: s, index, total, company, editable, thumb, onEdit }: Props) {
  const dark = s.kind === 'cover' || s.kind === 'conclusion';
  return (
    <div className={cn('slide relative w-full overflow-hidden', dark ? 'hero-grid text-white' : 'bg-white text-slate-900', !thumb && 'rounded-none')}>
      {/* moldura */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: '4.5cqw 5.5cqw' }}>
        {!dark && (
          <div className="s-small mb-[2cqw] flex items-center justify-between font-semibold uppercase tracking-[0.15em] text-blue-600">
            <span>{String(index + 1).padStart(2, '0')} · {s.section}</span>
            <span className="text-slate-400">{company}</span>
          </div>
        )}

        {s.kind === 'cover' && (
          <div className="flex h-full flex-col justify-between">
            <p className="s-small font-semibold uppercase tracking-[0.2em] text-blue-200/80">Insight Agent · Apresentação executiva</p>
            <div>
              <div className="mb-[2cqw] h-[0.4cqw] w-[8cqw] rounded bg-emerald-400" />
              <Editable as="h1" field="title" value={s.title} editable={editable} onEdit={onEdit} className="s-title max-w-[80%] font-bold tracking-tight" />
              <Editable field="subtitle" value={s.subtitle} editable={editable} onEdit={onEdit} className="s-sub mt-[1.5cqw] max-w-[70%] text-blue-100/80" />
            </div>
            <p className="s-small text-blue-200/60">{s.note}</p>
          </div>
        )}

        {s.kind === 'conclusion' && (
          <div className="flex h-full flex-col justify-center">
            <p className="s-small mb-[1.5cqw] font-semibold uppercase tracking-[0.2em] text-emerald-300">{String(index + 1).padStart(2, '0')} · Conclusão</p>
            <Editable as="h2" field="title" value={s.title} editable={editable} onEdit={onEdit} className="s-title font-bold tracking-tight" />
            <Editable field="subtitle" value={s.subtitle} editable={editable} onEdit={onEdit} className="s-body mt-[2cqw] max-w-[80%] text-blue-50/85" />
            <div className="mt-[3cqw] grid grid-cols-2 gap-[2cqw]">
              {s.bullets?.map((b) => <div key={b.text} className="s-body rounded-[1cqw] border border-white/15 bg-white/5 p-[1.6cqw]">{b.text}</div>)}
            </div>
            <p className="s-sub mt-auto font-semibold text-emerald-300">{s.note}</p>
          </div>
        )}

        {!dark && (
          <>
            <Editable as="h2" field="title" value={s.title} editable={editable} onEdit={onEdit} className="s-title max-w-[90%] font-bold tracking-tight text-slate-900" />
            <Editable field="subtitle" value={s.subtitle} editable={editable} onEdit={onEdit} className="s-body mt-[1cqw] max-w-[85%] text-slate-500" />
            <div className="mt-[2.5cqw] min-h-0 flex-1">
              {s.kind === 'stats' && (
                <div className="grid h-full grid-cols-4 items-start gap-[1.8cqw]">
                  {s.stats?.map((st) => (
                    <div key={st.label} className="rounded-[1.2cqw] border-t-[0.4cqw] border-blue-600 bg-slate-50 p-[1.8cqw]">
                      <p className={cn('font-bold tracking-tight text-slate-900', st.value.length > 6 ? 's-sub' : 's-big')}>{st.value}</p>
                      <p className="s-small mt-[0.8cqw] text-slate-500">{st.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {s.kind === 'problem' && (
                <div className="flex items-center gap-[4cqw]">
                  <div className="flex h-[16cqw] w-[16cqw] shrink-0 flex-col items-center justify-center rounded-full bg-red-50 ring-[0.5cqw] ring-red-100">
                    <span className="s-big font-bold text-red-600">{s.big}</span>
                  </div>
                  <ul className="space-y-[1.2cqw]">
                    {s.bullets?.map((b) => <li key={b.text} className="s-body flex gap-[1cqw] text-slate-700"><span className="mt-[0.6cqw] h-[0.7cqw] w-[0.7cqw] shrink-0 rounded-full bg-red-500" />{b.text}</li>)}
                  </ul>
                </div>
              )}
              {s.kind === 'quotes' && (
                <div className="grid grid-cols-2 gap-[1.5cqw]">
                  {s.quotes?.map((q) => (
                    <div key={q.text} className="rounded-[1cqw] border-l-[0.4cqw] border-blue-600 bg-slate-50 p-[1.5cqw]">
                      <p className="s-body text-slate-800">“{q.text}”</p>
                      <p className="s-small mt-[0.8cqw] text-slate-400">{q.meta}</p>
                    </div>
                  ))}
                </div>
              )}
              {s.kind === 'bullets' && (
                <ul className="grid gap-[1.2cqw]">
                  {s.bullets?.map((b) => (
                    <li key={b.text} className="s-body flex items-start gap-[1.4cqw] text-slate-700">
                      {b.tag && (
                        <span className={cn('s-small shrink-0 rounded-[0.5cqw] px-[0.8cqw] py-[0.3cqw] font-bold', b.tag === 'Hipótese' ? 'bg-amber-100 text-amber-800' : b.tag === 'Interpretação' ? 'bg-blue-100 text-blue-800' : b.tag === 'Dado observado' ? 'bg-slate-900 text-white' : b.tag === '✓' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white')}>
                          {b.tag}
                        </span>
                      )}
                      <span>{b.text}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.kind === 'table' && s.table && (
                <table className="s-body w-full">
                  <thead>
                    <tr className="border-b-[0.25cqw] border-slate-900 text-left">
                      {s.table.head.map((h, i) => <th key={h} className={cn('py-[0.8cqw] font-semibold', i === s.table!.highlightCol && 'text-blue-700')}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {s.table.rows.map((r) => (
                      <tr key={r[0]} className="border-b border-slate-100">
                        {r.map((c, i) => <td key={i} className={cn('py-[0.8cqw]', i === s.table!.highlightCol && 'bg-blue-50 font-bold text-blue-800', i === 0 && 'font-medium')}>{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {s.kind === 'steps' && (
                <div className="grid grid-cols-4 gap-[1.2cqw]">
                  {s.steps?.map((st, i) => (
                    <div key={st.title} className={cn('rounded-[1cqw] border p-[1.2cqw]', st.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white')}>
                      <p className="s-small font-bold text-blue-600">Etapa {i + 1}</p>
                      <p className="s-body mt-[0.4cqw] font-semibold leading-tight text-slate-900">{st.title}</p>
                      <p className="s-small mt-[0.5cqw] text-slate-500">{st.meta}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {s.note && <p className="s-small mt-[1cqw] text-slate-400">{s.note}</p>}
          </>
        )}
      </div>
      <div className={cn('s-small absolute bottom-[2cqw] right-[3cqw]', dark ? 'text-blue-200/50' : 'text-slate-300')}>{index + 1}/{total}</div>
    </div>
  );
}
