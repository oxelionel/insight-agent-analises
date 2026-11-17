import { useState } from 'react';
import { LuSave, LuRotateCcw, LuBuilding2, LuTarget, LuPackage, LuUsers } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, CardHeader, DemoTag, PageHeader } from '../components/ui/primitives';
import { Field, Input, TagInput, Textarea } from '../components/ui/fields';
import type { PageProps } from '../components/domain';
import { FEATURES } from '../data/catalog';
import type { Company } from '../types';
import { navigate } from '../utils/router';

export default function CompanyPage(_: PageProps) {
  const { data, updateCompany } = useApp();
  const notify = useToast();
  const [form, setForm] = useState<Company>(data.company);
  const dirty = JSON.stringify(form) !== JSON.stringify(data.company);
  const set = <K extends keyof Company>(k: K, v: Company[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) {
      notify('error', 'Informe o nome da empresa');
      return;
    }
    updateCompany({ ...form, name: form.name.trim() });
    notify('success', 'Dados da empresa salvos', 'As análises foram atualizadas com o novo contexto.');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Contexto estratégico"
        title="Minha empresa"
        description="O contexto da empresa orienta o agente na interpretação das manifestações, na comparação com concorrentes e na proposta de soluções."
        actions={
          <>
            <Button variant="secondary" icon={LuRotateCcw} disabled={!dirty} onClick={() => setForm(data.company)}>Descartar</Button>
            <Button icon={LuSave} disabled={!dirty} onClick={save}>Salvar alterações</Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Identificação" icon={LuBuilding2} action={<DemoTag />} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome da empresa" required><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <Field label="Segmento"><Input value={form.segment} onChange={(e) => set('segment', e.target.value)} placeholder="Ex.: Educação, Saúde, Varejo…" /></Field>
              <Field label="Descrição" className="md:col-span-2"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
              <Field label="Público-alvo" className="md:col-span-2"><Textarea className="min-h-[60px]" value={form.audience} onChange={(e) => set('audience', e.target.value)} /></Field>
            </div>
          </Card>
          <Card>
            <CardHeader title="Oferta" icon={LuPackage} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Produtos"><TagInput value={form.products} onChange={(v) => set('products', v)} /></Field>
              <Field label="Serviços"><TagInput value={form.services} onChange={(v) => set('services', v)} /></Field>
              <Field label="Principais diferenciais"><TagInput value={form.differentials} onChange={(v) => set('differentials', v)} /></Field>
              <Field label="Principais dificuldades conhecidas"><TagInput value={form.knownIssues} onChange={(v) => set('knownIssues', v)} /></Field>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-slate-700">Recursos oferecidos (usados na comparação competitiva)</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FEATURES).map(([k, f]) => {
                  const on = form.features.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => set('features', on ? form.features.filter((x) => x !== k) : [...form.features, k])}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${on ? 'bg-blue-600 text-white ring-blue-600' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'}`}
                      aria-pressed={on}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Objetivos estratégicos" icon={LuTarget} />
            <TagInput value={form.goals} onChange={(v) => set('goals', v)} placeholder="Adicione um objetivo e pressione Enter" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="hero-grid border-0 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200/70">Perfil analisado</p>
            <h3 className="mt-2 text-xl font-bold">{form.name || '—'}</h3>
            <p className="text-sm text-blue-100/70">{form.segment}</p>
            <p className="mt-4 text-sm leading-relaxed text-blue-50/80">{form.description}</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                ['Serviços', form.services.length],
                ['Diferenciais', form.differentials.length],
                ['Objetivos', form.goals.length],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-white/10 p-2.5">
                  <p className="text-xl font-bold">{v}</p>
                  <p className="text-[10px] text-blue-100/70">{l}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Concorrentes cadastrados" icon={LuUsers} action={<Button size="sm" variant="ghost" onClick={() => navigate('concorrentes')}>Gerenciar</Button>} />
            <div className="space-y-2">
              {data.competitors.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <Badge>{c.segment}</Badge>
                </div>
              ))}
              {data.competitors.length === 0 && <p className="text-sm text-slate-500">Nenhum concorrente cadastrado.</p>}
            </div>
          </Card>
          <p className="px-1 text-[11px] leading-relaxed text-slate-400">
            A NovaVia Serviços e seus concorrentes são organizações fictícias criadas para a demonstração. Os dados são salvos apenas neste navegador.
          </p>
        </div>
      </div>
    </div>
  );
}
