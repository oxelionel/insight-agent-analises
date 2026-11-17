import { useEffect, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { Button, Modal } from './ui/primitives';
import { Field, Input, Select, Textarea } from './ui/fields';
import { CATEGORIES, MANIFESTATION_TYPES, PRIORITIES, SENTIMENTS, SOURCES } from '../data/catalog';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { activeProvider } from '../services/aiProvider';
import type { Category, Manifestation, ManifestationType, Priority, Sentiment, SourceKey } from '../types';
import { todayISO } from '../utils/format';

interface FormState {
  source: SourceKey;
  author: string;
  date: string;
  content: string;
  company: string;
  category: Category;
  sentiment: Sentiment;
  type: ManifestationType;
  priority: Priority;
  link: string;
  auto: boolean;
}

export function ManifestationForm({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Manifestation | null }) {
  const { data, addManifestation, updateManifestation } = useApp();
  const notify = useToast();
  const blank = (): FormState => ({ source: 'manual', author: 'Cliente (demo)', date: todayISO(), content: '', company: data.company.name, category: 'atendimento', sentiment: 'negativo', type: 'reclamacao', priority: 'media', link: '', auto: true });
  const [f, setF] = useState<FormState>(blank);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setF(editing ? { ...editing, link: editing.link ?? '', auto: false } : blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const preview = f.content.trim().length > 8 ? activeProvider.classify({ content: f.content, source: f.source, company: f.company }, data.company.name) : null;

  const submit = () => {
    if (f.content.trim().length < 8) return setError('Descreva a manifestação com pelo menos 8 caracteres.');
    if (!f.date) return setError('Informe a data.');
    const base = { source: f.source, author: f.author.trim() || 'Não identificado (demo)', date: f.date, content: f.content.trim(), company: f.company, category: f.category, sentiment: f.sentiment, priority: f.priority, link: f.link.trim() || undefined };
    if (editing) {
      updateManifestation(editing.id, { ...base, type: f.type });
      notify('success', 'Manifestação atualizada');
    } else {
      const m = addManifestation({ ...base, autoClassify: f.auto, type: f.auto ? undefined : f.type });
      notify('success', 'Manifestação cadastrada', `Status: pendente de análise. Classificação: ${SENTIMENTS[m.sentiment].label.toLowerCase()} · ${CATEGORIES[m.category]}.`);
    }
    onClose();
  };

  const companies = [data.company.name, ...data.competitors.map((c) => c.name)];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Editar manifestação' : 'Adicionar manifestação'}
      subtitle="Cadastro manual — nenhum dado é coletado automaticamente de plataformas externas"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>{editing ? 'Salvar' : 'Adicionar manifestação'}</Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Conteúdo" required className="md:col-span-2">
          <Textarea value={f.content} onChange={(e) => set('content', e.target.value)} placeholder="Ex.: Fiquei horas esperando atendimento e ninguém respondeu." autoFocus />
        </Field>
        <Field label="Fonte (categoria demonstrativa)">
          <Select value={f.source} onChange={(e) => set('source', e.target.value as SourceKey)}>
            {Object.entries(SOURCES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </Select>
        </Field>
        <Field label="Empresa relacionada">
          <Select value={f.company} onChange={(e) => set('company', e.target.value)}>
            {companies.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Autor (fictício ou genérico)"><Input value={f.author} onChange={(e) => set('author', e.target.value)} /></Field>
        <Field label="Data" required><Input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Prioridade">
          <Select value={f.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
            {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Link de origem (demonstrativo, opcional)"><Input value={f.link} onChange={(e) => set('link', e.target.value)} placeholder="https://exemplo.demo/..." /></Field>

        {!editing && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 md:col-span-2">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-600" checked={f.auto} onChange={(e) => set('auto', e.target.checked)} />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-blue-900"><LuSparkles className="h-4 w-4" /> Classificar automaticamente com o agente</span>
              <span className="mt-0.5 block text-xs text-blue-800/80">
                {preview
                  ? `Prévia: ${SENTIMENTS[preview.sentiment].label} · ${CATEGORIES[preview.category]} · ${MANIFESTATION_TYPES[preview.type]}`
                  : 'Sentimento, categoria e tipo serão sugeridos pelo motor demonstrativo.'}
              </span>
            </span>
          </label>
        )}

        {(!f.auto || editing) && (
          <>
            <Field label="Categoria">
              <Select value={f.category} onChange={(e) => set('category', e.target.value as Category)}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Sentimento">
              <Select value={f.sentiment} onChange={(e) => set('sentiment', e.target.value as Sentiment)}>
                {Object.entries(SENTIMENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={f.type} onChange={(e) => set('type', e.target.value as ManifestationType)}>
                {Object.entries(MANIFESTATION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
          </>
        )}
      </div>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Modal>
  );
}
