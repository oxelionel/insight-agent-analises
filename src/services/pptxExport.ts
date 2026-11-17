/** Exporta os slides para PowerPoint (.pptx) usando pptxgenjs, no navegador. */
import type { Slide } from './presentationService';

const NAVY = '0B1733';
const BLUE = '2563EB';
const INK = '0F172A';
const MUTED = '64748B';

export async function exportPptx(slides: Slide[], company: string, topic: string) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.title = `${topic} — ${company}`;
  pptx.company = 'Insight Agent (demo)';

  slides.forEach((s, i) => {
    const sl = pptx.addSlide();
    const dark = s.kind === 'cover' || s.kind === 'conclusion';
    sl.background = { color: dark ? NAVY : 'FFFFFF' };
    sl.addText(`${i + 1}/${slides.length}`, { x: 12.2, y: 7.0, w: 1, h: 0.3, fontSize: 9, color: dark ? '8EA2C9' : 'CBD5E1', align: 'right' });

    if (s.kind === 'cover') {
      sl.addText('INSIGHT AGENT · APRESENTAÇÃO EXECUTIVA', { x: 0.7, y: 0.5, w: 10, h: 0.4, fontSize: 11, bold: true, color: '93C5FD', charSpacing: 3 });
      sl.addShape('rect', { x: 0.7, y: 3.0, w: 1.0, h: 0.06, fill: { color: '34D399' } });
      sl.addText(s.title, { x: 0.7, y: 3.15, w: 10.5, h: 1.6, fontSize: 40, bold: true, color: 'FFFFFF', valign: 'top' });
      if (s.subtitle) sl.addText(s.subtitle, { x: 0.7, y: 4.8, w: 10, h: 0.6, fontSize: 18, color: 'C7D2FE' });
      if (s.note) sl.addText(s.note, { x: 0.7, y: 6.7, w: 10, h: 0.4, fontSize: 11, color: '8EA2C9' });
      return;
    }
    if (s.kind === 'conclusion') {
      sl.addText(`${String(i + 1).padStart(2, '0')} · CONCLUSÃO`, { x: 0.7, y: 1.0, w: 8, h: 0.4, fontSize: 11, bold: true, color: '6EE7B7', charSpacing: 3 });
      sl.addText(s.title, { x: 0.7, y: 1.5, w: 11.5, h: 1.2, fontSize: 36, bold: true, color: 'FFFFFF' });
      if (s.subtitle) sl.addText(s.subtitle, { x: 0.7, y: 2.8, w: 11.5, h: 1.2, fontSize: 16, color: 'DBEAFE', valign: 'top' });
      (s.bullets ?? []).forEach((b, j) => sl.addText(b.text, { x: 0.7 + j * 5.9, y: 4.3, w: 5.6, h: 1.1, fontSize: 14, color: 'FFFFFF', fill: { color: '17284D' }, margin: 12, valign: 'middle' }));
      if (s.note) sl.addText(s.note, { x: 0.7, y: 6.3, w: 11, h: 0.5, fontSize: 16, bold: true, color: '6EE7B7' });
      return;
    }

    sl.addText(`${String(i + 1).padStart(2, '0')} · ${s.section.toUpperCase()}`, { x: 0.7, y: 0.35, w: 7, h: 0.35, fontSize: 10, bold: true, color: BLUE, charSpacing: 2 });
    sl.addText(company, { x: 7.6, y: 0.35, w: 5, h: 0.35, fontSize: 10, color: '94A3B8', align: 'right' });
    sl.addText(s.title, { x: 0.7, y: 0.8, w: 12, h: 0.9, fontSize: 28, bold: true, color: INK });
    if (s.subtitle) sl.addText(s.subtitle, { x: 0.7, y: 1.7, w: 11.8, h: 0.7, fontSize: 13, color: MUTED, valign: 'top' });
    const top = 2.6;

    if (s.kind === 'stats' && s.stats) {
      s.stats.forEach((st, j) => {
        const x = 0.7 + j * 3.0;
        sl.addShape('rect', { x, y: top, w: 2.8, h: 1.9, fill: { color: 'F8FAFC' }, line: { color: 'F8FAFC' } });
        sl.addShape('rect', { x, y: top, w: 2.8, h: 0.06, fill: { color: BLUE } });
        sl.addText(st.value, { x: x + 0.15, y: top + 0.25, w: 2.5, h: 0.9, fontSize: st.value.length > 6 ? 18 : 36, bold: true, color: INK });
        sl.addText(st.label, { x: x + 0.15, y: top + 1.2, w: 2.5, h: 0.5, fontSize: 12, color: MUTED });
      });
    }
    if (s.kind === 'problem') {
      sl.addShape('ellipse', { x: 0.9, y: top + 0.2, w: 2.6, h: 2.6, fill: { color: 'FEF2F2' }, line: { color: 'FECACA', width: 4 } });
      sl.addText(s.big ?? '', { x: 0.9, y: top + 0.2, w: 2.6, h: 2.6, fontSize: 60, bold: true, color: 'DC2626', align: 'center', valign: 'middle' });
      sl.addText((s.bullets ?? []).map((b) => ({ text: b.text, options: { bullet: true, breakLine: true } })), { x: 4.0, y: top + 0.2, w: 8.5, h: 2.8, fontSize: 16, color: '334155', paraSpaceAfter: 10 });
    }
    if (s.kind === 'quotes' && s.quotes) {
      s.quotes.forEach((q, j) => {
        const x = 0.7 + (j % 2) * 6.0;
        const y = top + Math.floor(j / 2) * 2.1;
        sl.addShape('rect', { x, y, w: 5.8, h: 1.9, fill: { color: 'F8FAFC' }, line: { color: 'F8FAFC' } });
        sl.addShape('rect', { x, y, w: 0.06, h: 1.9, fill: { color: BLUE } });
        sl.addText(`“${q.text}”`, { x: x + 0.2, y: y + 0.1, w: 5.4, h: 1.3, fontSize: 13, color: INK, valign: 'top' });
        sl.addText(q.meta, { x: x + 0.2, y: y + 1.4, w: 5.4, h: 0.4, fontSize: 10, color: '94A3B8' });
      });
    }
    if (s.kind === 'bullets' && s.bullets) {
      sl.addText(
        s.bullets.map((b) => ({ text: `${b.tag && b.tag.length > 2 ? `[${b.tag}] ` : b.tag ? `${b.tag}. ` : ''}${b.text}`, options: { breakLine: true } })),
        { x: 0.7, y: top, w: 12, h: 4.2, fontSize: 16, color: '334155', paraSpaceAfter: 12, valign: 'top' },
      );
    }
    if (s.kind === 'table' && s.table) {
      const rows = [
        s.table.head.map((h) => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: { color: NAVY } } })),
        ...s.table.rows.map((r) => r.map((c, ci) => ({ text: c, options: { color: INK, bold: ci === s.table!.highlightCol, fill: { color: ci === s.table!.highlightCol ? 'EFF6FF' : 'FFFFFF' } } }))),
      ];
      sl.addTable(rows, { x: 0.7, y: top, w: 12, fontSize: 13, border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, rowH: 0.45 });
    }
    if (s.kind === 'steps' && s.steps) {
      s.steps.forEach((st, j) => {
        const x = 0.7 + (j % 4) * 3.05;
        const y = top + Math.floor(j / 4) * 2.0;
        sl.addShape('rect', { x, y, w: 2.9, h: 1.8, fill: { color: st.done ? 'ECFDF5' : 'FFFFFF' }, line: { color: st.done ? 'A7F3D0' : 'E2E8F0' } });
        sl.addText(`Etapa ${j + 1}`, { x: x + 0.15, y: y + 0.1, w: 2.6, h: 0.35, fontSize: 10, bold: true, color: BLUE });
        sl.addText(st.title, { x: x + 0.15, y: y + 0.45, w: 2.6, h: 0.8, fontSize: 13, bold: true, color: INK, valign: 'top' });
        sl.addText(st.meta, { x: x + 0.15, y: y + 1.25, w: 2.6, h: 0.45, fontSize: 9, color: MUTED });
      });
    }
    if (s.note) sl.addText(s.note, { x: 0.7, y: 6.95, w: 9, h: 0.3, fontSize: 9, color: '94A3B8' });
  });

  const safe = topic.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  await pptx.writeFile({ fileName: `insight-agent-${safe}.pptx` });
}
