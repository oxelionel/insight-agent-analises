import type { IconType } from 'react-icons';
import {
  LuLayoutDashboard, LuBuilding2, LuRadar, LuBrainCircuit, LuSwords, LuLightbulb, LuWandSparkles,
  LuListChecks, LuFileText, LuPresentation, LuHistory, LuSettings,
} from 'react-icons/lu';
import type { PageKey } from '../../utils/router';

export const NAV: { key: PageKey; label: string; icon: IconType; group: string; description: string }[] = [
  { key: 'dashboard', label: 'Visão geral', icon: LuLayoutDashboard, group: 'Principal', description: 'Painel executivo' },
  { key: 'empresa', label: 'Minha empresa', icon: LuBuilding2, group: 'Principal', description: 'Cadastro e contexto' },
  { key: 'monitoramento', label: 'Monitoramento', icon: LuRadar, group: 'Escutar e analisar', description: 'Manifestações e fontes' },
  { key: 'analise', label: 'Análise inteligente', icon: LuBrainCircuit, group: 'Escutar e analisar', description: 'Problemas e recorrência' },
  { key: 'concorrentes', label: 'Concorrentes', icon: LuSwords, group: 'Escutar e analisar', description: 'Inteligência competitiva' },
  { key: 'oportunidades', label: 'Oportunidades', icon: LuLightbulb, group: 'Propor e planejar', description: 'Radar e matriz' },
  { key: 'solucoes', label: 'Soluções', icon: LuWandSparkles, group: 'Propor e planejar', description: 'Agente de soluções' },
  { key: 'planos', label: 'Planos de ação', icon: LuListChecks, group: 'Propor e planejar', description: 'Implementação e autorização' },
  { key: 'relatorios', label: 'Relatórios', icon: LuFileText, group: 'Comunicar', description: 'Relatório executivo' },
  { key: 'apresentacoes', label: 'Apresentações', icon: LuPresentation, group: 'Comunicar', description: 'Insight Presentation Builder' },
  { key: 'historico', label: 'Histórico', icon: LuHistory, group: 'Sistema', description: 'Auditoria' },
  { key: 'configuracoes', label: 'Configurações', icon: LuSettings, group: 'Sistema', description: 'Preferências e dados' },
];
