import type {
  ActivityType, Category, Criterion, Level, ManifestationType, OpportunityOrigin, OpportunityStatus,
  OpportunityType, PlanStatus, Priority, Recommendation, Sentiment, Severity, SourceKey,
} from '../types';

export const SOURCES: Record<SourceKey, { label: string; color: string; domain: string }> = {
  reclame_aqui: { label: 'Reclame Aqui', color: '#16a34a', domain: 'reclameaqui.demo' },
  instagram: { label: 'Instagram', color: '#db2777', domain: 'instagram.demo' },
  facebook: { label: 'Facebook', color: '#2563eb', domain: 'facebook.demo' },
  google: { label: 'Google Avaliações', color: '#f59e0b', domain: 'avaliacoes.demo' },
  youtube: { label: 'YouTube', color: '#dc2626', domain: 'youtube.demo' },
  noticias: { label: 'Notícias', color: '#475569', domain: 'noticias.demo' },
  site_concorrente: { label: 'Sites de concorrentes', color: '#7c3aed', domain: 'concorrente.demo' },
  app_store: { label: 'Avaliações de aplicativos', color: '#0891b2', domain: 'lojaapps.demo' },
  forum: { label: 'Fóruns', color: '#ea580c', domain: 'forum.demo' },
  interna: { label: 'Sugestões internas', color: '#0f766e', domain: '' },
  manual: { label: 'Cadastro manual', color: '#64748b', domain: '' },
};

export const CATEGORIES: Record<Category, string> = {
  atendimento: 'Atendimento',
  preco: 'Preço',
  qualidade: 'Qualidade',
  prazo: 'Prazo',
  entrega: 'Entrega',
  comunicacao: 'Comunicação',
  experiencia: 'Experiência do usuário',
  tecnologia: 'Tecnologia',
  acessibilidade: 'Acessibilidade',
  seguranca: 'Segurança',
  inovacao: 'Inovação',
  pos_venda: 'Pós-venda',
};

export const SENTIMENTS: Record<Sentiment, { label: string; color: string }> = {
  positivo: { label: 'Positivo', color: '#16a34a' },
  neutro: { label: 'Neutro', color: '#94a3b8' },
  negativo: { label: 'Negativo', color: '#dc2626' },
};

export const MANIFESTATION_TYPES: Record<ManifestationType, string> = {
  reclamacao: 'Reclamação',
  sugestao: 'Sugestão',
  elogio: 'Avaliação positiva',
  noticia: 'Notícia de mercado',
  concorrente: 'Informação de concorrente',
  neutro: 'Comentário',
};

export const PRIORITIES: Record<Priority, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
export const LEVELS: Record<Level, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

export const SEVERITIES: Record<Severity, { label: string; tone: Tone }> = {
  baixa: { label: 'Baixa', tone: 'slate' },
  media: { label: 'Média', tone: 'amber' },
  alta: { label: 'Alta', tone: 'orange' },
  critica: { label: 'Crítica', tone: 'red' },
};

export type Tone = 'slate' | 'blue' | 'green' | 'amber' | 'orange' | 'red' | 'violet' | 'navy';

export const OPPORTUNITY_TYPES: Record<OpportunityType, string> = {
  melhoria_operacional: 'Melhoria operacional',
  experiencia_cliente: 'Experiência do cliente',
  inovacao: 'Inovação',
  reducao_custos: 'Redução de custos',
  vantagem_competitiva: 'Vantagem competitiva',
  retencao: 'Retenção de clientes',
  eficiencia: 'Aumento de eficiência',
  novos_produtos: 'Novos produtos e serviços',
};

export const OPPORTUNITY_ORIGINS: Record<OpportunityOrigin, string> = {
  reclamacao: 'Reclamações recorrentes',
  sugestao: 'Sugestões de clientes',
  concorrente: 'Inteligência competitiva',
  noticia: 'Tendência de mercado',
  analise: 'Análise do agente',
};

export const OPPORTUNITY_STATUS: Record<OpportunityStatus, { label: string; tone: Tone }> = {
  nova: { label: 'Nova', tone: 'blue' },
  em_analise: { label: 'Em análise', tone: 'amber' },
  solucao_gerada: { label: 'Solução elaborada', tone: 'green' },
  descartada: { label: 'Descartada', tone: 'slate' },
};

export const PLAN_STATUS: Record<PlanStatus, { label: string; tone: Tone }> = {
  em_elaboracao: { label: 'Em elaboração', tone: 'slate' },
  aguardando_autorizacao: { label: 'Aguardando autorização', tone: 'amber' },
  aprovado: { label: 'Aprovado', tone: 'blue' },
  reprovado: { label: 'Reprovado', tone: 'red' },
  em_execucao: { label: 'Em execução demonstrativa', tone: 'violet' },
  concluido: { label: 'Concluído', tone: 'green' },
  cancelado: { label: 'Cancelado', tone: 'slate' },
};

export const RECOMMENDATIONS: Record<Recommendation, { label: string; tone: Tone; hint: string }> = {
  implementar: { label: 'Implementar', tone: 'green', hint: 'Evidências fortes e retorno claro.' },
  testar: { label: 'Testar (piloto)', tone: 'blue', hint: 'Validar em escala reduzida antes de expandir.' },
  investigar: { label: 'Investigar', tone: 'amber', hint: 'Coletar mais dados antes de decidir.' },
  descartar: { label: 'Descartar', tone: 'slate', hint: 'Baixo retorno frente ao esforço.' },
};

export const CRITERIA: Record<Criterion, string> = {
  atendimento: 'Atendimento',
  preco: 'Preço',
  tecnologia: 'Tecnologia',
  experiencia: 'Experiência',
  prazo: 'Prazo e pontualidade',
};

/** Categorias de manifestação que compõem cada critério competitivo. */
export const CRITERIA_CATEGORIES: Record<Criterion, Category[]> = {
  atendimento: ['atendimento', 'comunicacao', 'pos_venda'],
  preco: ['preco'],
  tecnologia: ['tecnologia'],
  experiencia: ['experiencia', 'qualidade', 'acessibilidade'],
  prazo: ['prazo', 'entrega'],
};

export interface FeatureInfo {
  label: string;
  recommendation: string;
  playbook?: string;
}

/** Catálogo de recursos usados para comparar empresa x concorrentes. */
export const FEATURES: Record<string, FeatureInfo> = {
  agendamento_online: { label: 'Agendamento online', recommendation: 'Manter e simplificar o fluxo de agendamento.' },
  tecnicos_certificados: { label: 'Técnicos certificados', recommendation: 'Comunicar a certificação como diferencial.' },
  garantia_30: { label: 'Garantia de 30 dias', recommendation: 'Avaliar ampliação do prazo de garantia.' },
  garantia_90: { label: 'Garantia de 90 dias', recommendation: 'Considerar garantia estendida como argumento de retenção.', playbook: 'p-pos-venda' },
  pix_cartao: { label: 'Pagamento via Pix e cartão', recommendation: 'Manter.' },
  parcelamento: { label: 'Parcelamento sem juros', recommendation: 'Avaliar parcelamento para serviços acima de R$ 500.', playbook: 'p-pagamento' },
  rastreamento: { label: 'Acompanhamento do técnico em tempo real', recommendation: 'Considerar a implementação de um painel de acompanhamento para reduzir dúvidas dos clientes e melhorar a experiência de contratação.', playbook: 'p-falta-rastreio' },
  atendimento_24h: { label: 'Atendimento 24h com assistente virtual', recommendation: 'Implantar atendimento automatizado para cobrir noites e fins de semana.', playbook: 'p-fora-horario' },
  orcamento_digital: { label: 'Orçamento digital com aprovação prévia', recommendation: 'Padronizar orçamentos digitais com aprovação do cliente antes da execução.', playbook: 'p-preco-transparencia' },
  assinatura: { label: 'Plano de manutenção por assinatura', recommendation: 'Estudar um plano recorrente de manutenção preventiva.', playbook: 'o-assinatura' },
  emergencia: { label: 'Atendimento emergencial noturno', recommendation: 'Avaliar uma escala de plantão para emergências.', playbook: 'p-fora-horario' },
  avaliacao_tecnico: { label: 'Avaliação do técnico após o serviço', recommendation: 'Coletar nota após cada atendimento para alimentar o monitoramento.' },
  app_proprio: { label: 'Aplicativo próprio', recommendation: 'Manter e estabilizar o aplicativo.' },
};

export const ACTIVITY_TYPES: Record<ActivityType, string> = {
  manifestacao_cadastrada: 'Manifestação cadastrada',
  manifestacao_editada: 'Manifestação editada',
  manifestacao_excluida: 'Manifestação excluída',
  analise_executada: 'Análise executada',
  problema_identificado: 'Problema identificado',
  oportunidade_criada: 'Oportunidade criada',
  solucao_elaborada: 'Solução elaborada',
  plano_criado: 'Plano de ação criado',
  plano_atualizado: 'Plano atualizado',
  autorizacao_solicitada: 'Autorização solicitada',
  melhoria_aprovada: 'Melhoria aprovada',
  melhoria_reprovada: 'Melhoria reprovada',
  execucao_realizada: 'Execução demonstrativa',
  relatorio_gerado: 'Relatório gerado',
  apresentacao_gerada: 'Apresentação gerada',
  empresa_atualizada: 'Empresa atualizada',
  concorrente_atualizado: 'Concorrente atualizado',
  sistema: 'Sistema',
};
