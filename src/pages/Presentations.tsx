import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuMaximize2, LuX, LuPencil, LuCheck, LuFileDown, LuPresentation, LuRotateCcw, LuLoaderCircle } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, PageHeader } from '../components/ui/primitives';
import { Select } from '../components/ui/fields';
import type { PageProps } from '../components/domain';
import { SlideView } from '../components/SlideView';
import { buildSlides, type Slide } from '../services/presentationService';
import { exportPptx } from '../services/pptxExport';
import { rankOpportunities } from '../services/analysisEngine';
import { cn } from '../utils/format';

export default function Presentations({ params }: PageProps) {
  const { data, problems, setSlideOverride, clearSlideOverrides, log } = useApp();
  const notify = useToast();
  const ranked = useMemo(() => rankOpportunities(data.opportunities, problems), [data.opportunities, problems]);
  const [oppId, setOppId] = useState(params.opp ?? ranked[0]?.id ?? '');
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const opp = data.opportunities.find((o) => o.id === oppId);

  const { slides: rawSlides, isPreview } = useMemo(() => buildSlides(data, problems, opp), [data, problems, opp]);
  const slides: Slide[] = useMemo(
    () => rawSlides.map((s) => {
      const o = data.slideOverrides[`${oppId}:${s.key}`];
      return o ? { ...s, title: o.title ?? s.title, subtitle: o.subtitle ?? s.subtitle } : s;
    }),
    [rawSlides, data.slideOverrides, oppId],
  );
  const slide = slides[Math.min(index, slides.length - 1)];

  const go = useCallback((d: number) => setIndex((i) => Math.max(0, Math.min(slides.length - 1, i + d))), [slides.length]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (fullscreen && e.key === ' ')) { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [go, fullscreen]);

  const onEdit = (field: 'title' | 'subtitle', value: string) => setSlideOverride(`${oppId}:${slide.key}`, { [field]: value });

  const doPptx = async () => {
    setExporting(true);
    try {
      await exportPptx(slides, data.company.name, opp?.title ?? 'Apresentação');
      log('apresentacao_gerada', `Apresentação "${opp?.title}" exportada em PPTX (${slides.length} slides).`);
      notify('success', 'Apresentação exportada', 'Arquivo .pptx baixado.');
    } catch (e) {
      notify('error', 'Não foi possível exportar o PPTX', String(e));
    } finally {
      setExporting(false);
    }
  };

  const doPdf = () => {
    const style = document.createElement('style');
    style.id = 'slides-print';
    style.textContent = '@page { size: 338.7mm 190.5mm; margin: 0; } .print-slides-only{display:block !important}';
    document.head.appendChild(style);
    document.body.classList.add('printing-slides');
    log('apresentacao_gerada', `Apresentação "${opp?.title}" exportada em PDF.`);
    window.setTimeout(() => {
      window.print();
      style.remove();
      document.body.classList.remove('printing-slides');
    }, 200);
  };

  return (
    <div>
      <div className="print-hide">
        <PageHeader
          eyebrow="Insight Presentation Builder"
          title="Apresentações executivas"
          description="Transforma a análise em uma apresentação de 12 slides no padrão de consultoria estratégica. Textos de título e subtítulo podem ser editados diretamente no slide."
          actions={
            <>
              <Button variant="secondary" icon={LuFileDown} onClick={doPdf}>Exportar PDF</Button>
              <Button variant="secondary" icon={exporting ? LuLoaderCircle : LuFileDown} disabled={exporting} onClick={doPptx}>Exportar PPTX</Button>
              <Button icon={LuMaximize2} onClick={() => setFullscreen(true)}>Apresentar</Button>
            </>
          }
        />
        <Card className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Tema da apresentação</span>
            <div className="w-full max-w-sm"><Select value={oppId} onChange={(e) => { setOppId(e.target.value); setIndex(0); }} aria-label="Oportunidade da apresentação">
              {ranked.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </Select></div>
            {isPreview && <Badge tone="amber">Prévia: solução ainda não salva</Badge>}
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant={editing ? 'success' : 'secondary'} icon={editing ? LuCheck : LuPencil} onClick={() => setEditing((v) => !v)}>{editing ? 'Concluir edição' : 'Editar textos'}</Button>
              <Button size="sm" variant="ghost" icon={LuRotateCcw} onClick={() => { clearSlideOverrides(); notify('info', 'Textos originais restaurados'); }}>Restaurar</Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_220px]">
          <div>
            <div className="overflow-hidden rounded-2xl shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
              <SlideView slide={slide} index={index} total={slides.length} company={data.company.name} editable={editing} onEdit={onEdit} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" icon={LuChevronLeft} disabled={index === 0} onClick={() => go(-1)}>Anterior</Button>
              <span className="text-sm text-slate-500"><b className="text-slate-900">{index + 1}</b> / {slides.length} · {slide.section}</span>
              <Button variant="secondary" disabled={index === slides.length - 1} onClick={() => go(1)}>Próximo <LuChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid max-h-[720px] auto-rows-max content-start grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 xl:grid-cols-1">
            {slides.map((s, i) => (
              <button key={s.key} onClick={() => setIndex(i)} className={cn('overflow-hidden rounded-lg text-left ring-2 transition', i === index ? 'ring-blue-500' : 'ring-transparent hover:ring-slate-300')} aria-label={`Slide ${i + 1}: ${s.section}`}>
                <div className="pointer-events-none"><SlideView slide={s} index={i} total={slides.length} company={data.company.name} thumb /></div>
                <p className="truncate bg-white px-2 py-1 text-[10px] font-medium text-slate-600">{i + 1}. {s.section}</p>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400"><LuPresentation className="mr-1 inline h-3.5 w-3.5" />Atalhos: ← → para navegar · Esc para sair do modo apresentação.</p>
      </div>

      {/* Conteúdo exclusivo para impressão em PDF */}
      <div className="print-slides hidden print:block">
        {slides.map((s, i) => <SlideView key={s.key} slide={s} index={i} total={slides.length} company={data.company.name} />)}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-[#050b1a] p-4 no-print" onClick={() => go(1)}>
          <div className="w-full max-w-[min(100%,calc((100vh-90px)*16/9))]" onClick={(e) => e.stopPropagation()}>
            <SlideView slide={slide} index={index} total={slides.length} company={data.company.name} />
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-400" onClick={(e) => e.stopPropagation()}>
            <button className="rounded-lg p-2 hover:bg-white/10" onClick={() => go(-1)} aria-label="Slide anterior"><LuChevronLeft className="h-5 w-5" /></button>
            <span>{index + 1} / {slides.length}</span>
            <button className="rounded-lg p-2 hover:bg-white/10" onClick={() => go(1)} aria-label="Próximo slide"><LuChevronRight className="h-5 w-5" /></button>
            <button className="ml-4 rounded-lg p-2 hover:bg-white/10" onClick={() => setFullscreen(false)} aria-label="Sair"><LuX className="h-5 w-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
