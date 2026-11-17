import { useEffect, useState } from 'react';
import { LuCheck, LuLoaderCircle, LuBrainCircuit } from 'react-icons/lu';
import { Button, Modal } from './ui/primitives';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { navigate } from '../utils/router';

const STEPS = [
  'Reunindo manifestações pendentes',
  'Classificando sentimento',
  'Identificando temas e categorias',
  'Agrupando recorrências com palavras diferentes',
  'Calculando gravidade e impacto',
  'Atualizando oportunidades e indicadores',
];

/** Executa a análise demonstrativa com feedback visual por etapas. */
export function AnalysisRunner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { runAnalysis, stats } = useApp();
  const notify = useToast();
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ analyzed: number; newProblems: string[] } | null>(null);
  const [pendingAtStart, setPendingAtStart] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setResult(null);
    setPendingAtStart(stats.pending);
    let i = 0;
    const t = window.setInterval(() => {
      i++;
      setStep(i);
      if (i >= STEPS.length) {
        window.clearInterval(t);
        const r = runAnalysis();
        setResult(r);
        notify('success', 'Análise concluída', `${r.analyzed} manifestação(ões) processada(s).${r.newProblems.length ? ` Novo problema: ${r.newProblems.join(', ')}.` : ''}`);
      }
    }, 380);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Análise inteligente demonstrativa"
      subtitle="Motor local de regras e base de conhecimento — sem conexão com modelos externos"
      footer={
        result ? (
          <>
            <Button variant="secondary" onClick={onClose}>Fechar</Button>
            <Button onClick={() => { onClose(); navigate('analise'); }}>Ver resultados</Button>
          </>
        ) : undefined
      }
    >
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-blue-50 p-3.5 text-sm text-blue-800">
        <LuBrainCircuit className="h-5 w-5 shrink-0" />
        {pendingAtStart > 0 ? `${pendingAtStart} manifestação(ões) pendente(s) serão incorporadas à análise.` : 'Nenhuma manifestação pendente: a análise será recalculada com a base atual.'}
      </div>
      <ol className="space-y-2.5">
        {STEPS.map((s, i) => {
          const done = step > i;
          const active = step === i;
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white pulse-ring' : 'bg-slate-100 text-slate-400'}`}>
                {done ? <LuCheck className="h-3.5 w-3.5" /> : active ? <LuLoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
              </span>
              <span className={done ? 'text-slate-800' : active ? 'font-medium text-slate-900' : 'text-slate-400'}>{s}</span>
            </li>
          );
        })}
      </ol>
      {result && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Análise concluída.</p>
          <p className="mt-1">{result.analyzed} nova(s) manifestação(ões) incorporada(s). {result.newProblems.length ? `Novos problemas: ${result.newProblems.join(', ')}.` : 'Nenhum problema novo; recorrências e indicadores foram atualizados.'}</p>
        </div>
      )}
    </Modal>
  );
}
