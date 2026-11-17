import { useRef, useState } from 'react';
import { LuUser, LuDatabase, LuPlug, LuCpu, LuDownload, LuUpload, LuRotateCcw, LuTrash2, LuSave } from 'react-icons/lu';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { Badge, Button, Card, CardHeader, ConfirmDialog, PageHeader } from '../components/ui/primitives';
import { Field, Input } from '../components/ui/fields';
import type { PageProps } from '../components/domain';
import { activeProvider, PLANNED_CONNECTORS, PLANNED_PROVIDERS } from '../services/aiProvider';
import type { AppData } from '../types';
import { todayISO } from '../utils/format';

export default function SettingsPage(_: PageProps) {
  const { data, updateSettings, resetDemo, clearAll, importData } = useApp();
  const notify = useToast();
  const [name, setName] = useState(data.settings.userName);
  const [role, setRole] = useState(data.settings.userRole);
  const [confirm, setConfirm] = useState<'reset' | 'clear' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `insight-agent-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    notify('success', 'Backup exportado');
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const ok = importData(JSON.parse(String(reader.result)) as AppData);
        notify(ok ? 'success' : 'error', ok ? 'Dados importados' : 'Arquivo inválido', ok ? undefined : 'O arquivo não corresponde ao formato do Insight Agent.');
      } catch {
        notify('error', 'Arquivo inválido', 'Não foi possível ler o JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <PageHeader eyebrow="Sistema" title="Configurações" description="Preferências do usuário, dados locais e a arquitetura preparada para integrações futuras." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Perfil do usuário (demonstrativo)" icon={LuUser} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Cargo"><Input value={role} onChange={(e) => setRole(e.target.value)} /></Field>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={data.settings.animations} onChange={(e) => updateSettings({ animations: e.target.checked })} />
            Animações de interface
          </label>
          <Button className="mt-4" icon={LuSave} onClick={() => { updateSettings({ userName: name.trim() || 'Usuário', userRole: role }); notify('success', 'Perfil atualizado'); }}>Salvar perfil</Button>
        </Card>

        <Card>
          <CardHeader title="Dados locais" subtitle="Tudo é salvo no armazenamento local deste navegador (localStorage)" icon={LuDatabase} />
          <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
            {[['Manifestações', data.manifestations.length], ['Oportunidades', data.opportunities.length], ['Atividades', data.activities.length]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{v}</p><p className="text-[11px] text-slate-500">{k}</p></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={LuDownload} onClick={exportJson}>Exportar backup (JSON)</Button>
            <Button variant="secondary" icon={LuUpload} onClick={() => fileRef.current?.click()}>Importar backup</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
            <Button variant="secondary" icon={LuRotateCcw} onClick={() => setConfirm('reset')}>Restaurar dados demonstrativos</Button>
            <Button variant="ghost" icon={LuTrash2} className="text-red-600 hover:bg-red-50" onClick={() => setConfirm('clear')}>Apagar todos os dados</Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Motor de análise" subtitle="Camada de serviços preparada para trocar o provedor sem alterar as telas" icon={LuCpu} />
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
            <div>
              <p className="text-sm font-semibold text-emerald-900">{activeProvider.label}</p>
              <p className="text-xs text-emerald-800/80">Executa localmente, sem chaves de API e sem envio de dados.</p>
            </div>
            <Badge tone="green" dot>Ativo</Badge>
          </div>
          <div className="mt-3 space-y-2">
            {PLANNED_PROVIDERS.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5">
                <div><p className="text-sm font-medium text-slate-800">{p.label}</p><p className="text-xs text-slate-500">{p.note}</p></div>
                <Badge>Planejado</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Integrações" subtitle="Nenhuma integração externa está ativa nesta versão" icon={LuPlug} />
          <div className="space-y-2">
            {PLANNED_CONNECTORS.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5">
                <p className="text-sm font-medium text-slate-800">{c.label}</p>
                <Badge>Futuro · não conectado</Badge>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">As fontes exibidas no Monitoramento são categorias demonstrativas. O MVP não realiza scraping, não acessa contas de terceiros e não publica conteúdo.</p>
        </Card>
      </div>

      <ConfirmDialog open={confirm === 'reset'} title="Restaurar dados demonstrativos?" text="Todos os dados atuais serão substituídos pela empresa demonstrativa NovaVia Serviços." confirmLabel="Restaurar" onConfirm={() => { resetDemo(); notify('success', 'Dados demonstrativos restaurados'); }} onClose={() => setConfirm(null)} />
      <ConfirmDialog open={confirm === 'clear'} danger title="Apagar todos os dados?" text="Empresa, manifestações, oportunidades, soluções, planos e histórico serão apagados deste navegador. Exporte um backup antes, se necessário." confirmLabel="Apagar tudo" onConfirm={() => { clearAll(); notify('success', 'Dados apagados', 'Comece cadastrando sua empresa.'); }} onClose={() => setConfirm(null)} />
    </div>
  );
}
