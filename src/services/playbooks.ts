import type { Level, PlanKpi, Recommendation } from '../types';

export interface Playbook {
  title: string;
  feature?: string; // recurso do catálogo relacionado (para buscar concorrentes)
  proposal: string[];
  benefits: string[];
  resources: { pessoas: string; ferramentas: string; tecnologia: string; orcamento: string };
  complexity: Level;
  timeframe: 'curto' | 'medio' | 'longo';
  kpis: string[];
  risks: string[];
  recommendation: Recommendation;
  objective: string;
  expectedResult: string;
  investment: string;
  steps: [string, string][]; // [etapa, responsável]
  planKpis: Omit<PlanKpi, 'current'>[];
}

/** Playbooks do Agente de Soluções — conhecimento demonstrativo por tipo de problema. */
export const PLAYBOOKS: Record<string, Playbook> = {
  'p-fora-horario': {
    title: 'Atendimento automatizado 24/7 com escalonamento para plantão',
    feature: 'atendimento_24h',
    proposal: [
      'Implantar um assistente virtual no WhatsApp, site e app para responder às dúvidas mais frequentes e realizar agendamentos a qualquer hora.',
      'Criar uma triagem de urgência: vazamentos, curto-circuito e falta de energia são encaminhados a um técnico de plantão.',
      'Registrar todas as conversas fora do horário para retorno prioritário da equipe às 8h.',
    ],
    benefits: ['Captar demandas emergenciais hoje perdidas para concorrentes', 'Reduzir a fila acumulada do início da manhã', 'Disponibilidade percebida equivalente à de concorrentes 24h'],
    resources: {
      pessoas: '1 analista de atendimento (base de conhecimento) e escala de 2 técnicos de plantão',
      ferramentas: 'Plataforma de chatbot com integração ao WhatsApp',
      tecnologia: 'Integração do assistente com a agenda e o cadastro de clientes',
      orcamento: 'Estimativa demonstrativa: R$ 35 mil de implantação + R$ 4 mil/mês',
    },
    complexity: 'media',
    timeframe: 'medio',
    kpis: ['Conversas atendidas fora do horário', 'Taxa de resolução sem humano', 'Tempo de primeira resposta', 'Receita de atendimentos emergenciais'],
    risks: ['Respostas automáticas inadequadas em casos complexos', 'Custo de plantão maior que a demanda real', 'Baixa adesão se o assistente for difícil de usar'],
    recommendation: 'implementar',
    objective: 'Garantir resposta imediata 24 horas por dia e atendimento a emergências fora do horário comercial.',
    expectedResult: 'Mais de 60% das dúvidas resolvidas automaticamente e nenhuma emergência sem resposta.',
    investment: 'R$ 35.000 (implantação) + R$ 4.000/mês — valores demonstrativos',
    steps: [
      ['Mapear principais dúvidas', 'Ana Ribeiro (demo)'],
      ['Definir canais de atendimento', 'Ana Ribeiro (demo)'],
      ['Estruturar base de conhecimento', 'Bruno Lima (demo)'],
      ['Configurar atendimento automatizado', 'Equipe de TI (demo)'],
      ['Realizar testes', 'Equipe de TI (demo)'],
      ['Implantar piloto', 'Ana Ribeiro (demo)'],
      ['Avaliar indicadores', 'Carla Souza (demo)'],
      ['Expandir a solução', 'Diretoria de Operações (demo)'],
    ],
    planKpis: [
      { name: 'Tempo de primeira resposta', baseline: '42 min', target: '< 2 min' },
      { name: 'Dúvidas resolvidas sem humano', baseline: '0%', target: '60%' },
      { name: 'Emergências atendidas fora do horário', baseline: '0/mês', target: '30/mês' },
    ],
  },
  'p-demora-atendimento': {
    title: 'Triagem automática e metas de tempo de resposta',
    proposal: [
      'Classificar automaticamente as mensagens recebidas por assunto e urgência.',
      'Responder automaticamente perguntas de status e de preço, liberando a equipe para casos complexos.',
      'Definir meta de primeira resposta em até 10 minutos e painel de fila em tempo real.',
    ],
    benefits: ['Menos abandono de agendamentos', 'Equipe concentrada em casos que exigem atenção humana', 'Avaliações públicas mais positivas'],
    resources: {
      pessoas: 'Coordenador de atendimento e 1 analista de processos',
      ferramentas: 'Plataforma de atendimento omnichannel',
      tecnologia: 'Regras de roteamento e respostas rápidas',
      orcamento: 'Estimativa demonstrativa: R$ 12 mil + R$ 1,5 mil/mês',
    },
    complexity: 'baixa',
    timeframe: 'curto',
    kpis: ['Tempo médio de primeira resposta', 'Taxa de abandono no chat', 'Mensagens por atendente/dia'],
    risks: ['Classificação incorreta de mensagens urgentes', 'Resistência da equipe a novas rotinas'],
    recommendation: 'implementar',
    objective: 'Reduzir o tempo de primeira resposta para menos de 10 minutos.',
    expectedResult: 'Queda de 50% nas reclamações sobre demora em 90 dias.',
    investment: 'R$ 12.000 + R$ 1.500/mês — valores demonstrativos',
    steps: [
      ['Medir tempos atuais de resposta', 'Ana Ribeiro (demo)'],
      ['Definir categorias e regras de triagem', 'Bruno Lima (demo)'],
      ['Configurar respostas rápidas', 'Equipe de TI (demo)'],
      ['Treinar equipe', 'Carla Souza (demo)'],
      ['Monitorar indicadores', 'Ana Ribeiro (demo)'],
    ],
    planKpis: [
      { name: 'Tempo de primeira resposta', baseline: '42 min', target: '< 10 min' },
      { name: 'Abandono no chat', baseline: '18%', target: '< 8%' },
    ],
  },
  'p-falta-rastreio': {
    title: 'Painel de acompanhamento do serviço em tempo real',
    feature: 'rastreamento',
    proposal: [
      'Exibir no app e em um link enviado por WhatsApp as etapas do serviço: agendado, técnico a caminho, em execução e concluído.',
      'Mostrar a previsão de chegada do técnico com base na localização do dispositivo da equipe.',
      'Enviar notificações automáticas a cada mudança de etapa.',
    ],
    benefits: ['Redução de ligações de “onde está o técnico?”', 'Menos ansiedade no dia do atendimento', 'Paridade com o principal diferencial tecnológico da concorrência'],
    resources: {
      pessoas: '1 product owner, 2 desenvolvedores e 1 designer',
      ferramentas: 'Serviço de mapas e mensageria',
      tecnologia: 'Aplicativo do técnico com atualização de status e geolocalização',
      orcamento: 'Estimativa demonstrativa: R$ 60 mil de desenvolvimento',
    },
    complexity: 'media',
    timeframe: 'medio',
    kpis: ['Ligações de status por serviço', 'Avaliação do app', 'NPS no dia do atendimento'],
    risks: ['Baixa adesão dos técnicos à atualização de status', 'Questões de privacidade de localização'],
    recommendation: 'implementar',
    objective: 'Dar ao cliente visibilidade completa do serviço contratado.',
    expectedResult: 'Redução de 40% nos contatos de status à central.',
    investment: 'R$ 60.000 — valor demonstrativo',
    steps: [
      ['Definir etapas e mensagens do serviço', 'Ana Ribeiro (demo)'],
      ['Prototipar telas do painel', 'Designer (demo)'],
      ['Desenvolver app do técnico', 'Equipe de TI (demo)'],
      ['Integrar notificações', 'Equipe de TI (demo)'],
      ['Piloto em uma região', 'Diretoria de Operações (demo)'],
      ['Avaliar e expandir', 'Carla Souza (demo)'],
    ],
    planKpis: [
      { name: 'Contatos de status por serviço', baseline: '1,8', target: '< 1,0' },
      { name: 'Nota do aplicativo', baseline: '3,4', target: '4,3' },
    ],
  },
  'p-preco-transparencia': {
    title: 'Orçamento digital padronizado com aprovação prévia',
    feature: 'orcamento_digital',
    proposal: [
      'Publicar tabela de referência dos serviços mais comuns e informar a taxa de visita já no agendamento.',
      'Exigir que o técnico registre no app qualquer valor adicional e que o cliente aprove antes da execução.',
      'Enviar comprovante detalhado ao final do serviço.',
    ],
    benefits: ['Fim das cobranças-surpresa', 'Menos disputas e estornos', 'Confiança como argumento comercial'],
    resources: {
      pessoas: 'Coordenação comercial e técnica',
      ferramentas: 'Módulo de orçamento no app do técnico',
      tecnologia: 'Assinatura/aceite digital do cliente',
      orcamento: 'Estimativa demonstrativa: R$ 18 mil',
    },
    complexity: 'baixa',
    timeframe: 'curto',
    kpis: ['Reclamações sobre cobrança', 'Orçamentos aprovados digitalmente', 'Ticket médio'],
    risks: ['Técnicos resistirem ao registro no app', 'Tabela desatualizada gerar novas divergências'],
    recommendation: 'implementar',
    objective: 'Eliminar divergências entre valor informado e valor cobrado.',
    expectedResult: '100% dos valores adicionais aprovados pelo cliente antes da execução.',
    investment: 'R$ 18.000 — valor demonstrativo',
    steps: [
      ['Levantar serviços e preços de referência', 'Comercial (demo)'],
      ['Definir política de taxa de visita', 'Diretoria (demo)'],
      ['Desenvolver aprovação digital', 'Equipe de TI (demo)'],
      ['Treinar técnicos', 'Coordenação técnica (demo)'],
      ['Acompanhar reclamações', 'Ana Ribeiro (demo)'],
    ],
    planKpis: [
      { name: 'Reclamações sobre cobrança/mês', baseline: '3', target: '0' },
      { name: 'Orçamentos com aceite digital', baseline: '0%', target: '100%' },
    ],
  },
  'p-atraso-tecnico': {
    title: 'Gestão inteligente da agenda e aviso proativo de atraso',
    proposal: [
      'Adotar roteirização automática considerando distância, especialidade e duração média real de cada tipo de serviço.',
      'Trocar horários exatos por janelas realistas de 2 horas.',
      'Avisar o cliente automaticamente quando houver risco de atraso, oferecendo reagendamento com um toque.',
    ],
    benefits: ['Menos faltas e remarcações', 'Mais atendimentos por técnico por dia', 'Clientes avisados antes do problema'],
    resources: {
      pessoas: 'Coordenador de operações e analista de dados',
      ferramentas: 'Software de roteirização',
      tecnologia: 'Integração entre agenda, app do técnico e mensageria',
      orcamento: 'Estimativa demonstrativa: R$ 45 mil + R$ 3 mil/mês',
    },
    complexity: 'alta',
    timeframe: 'medio',
    kpis: ['Pontualidade na janela combinada', 'Taxa de não comparecimento', 'Atendimentos por técnico/dia'],
    risks: ['Dados históricos de duração imprecisos', 'Adaptação da equipe de campo', 'Custo de integração acima do previsto'],
    recommendation: 'testar',
    objective: 'Elevar a pontualidade para mais de 90% dos atendimentos.',
    expectedResult: 'Redução de 70% nas reclamações por atraso.',
    investment: 'R$ 45.000 + R$ 3.000/mês — valores demonstrativos',
    steps: [
      ['Levantar duração real por tipo de serviço', 'Analista de dados (demo)'],
      ['Selecionar ferramenta de roteirização', 'Diretoria de Operações (demo)'],
      ['Configurar janelas de horário', 'Coordenação técnica (demo)'],
      ['Ativar aviso proativo de atraso', 'Equipe de TI (demo)'],
      ['Piloto com 10 técnicos', 'Coordenação técnica (demo)'],
      ['Avaliar pontualidade', 'Carla Souza (demo)'],
    ],
    planKpis: [
      { name: 'Pontualidade', baseline: '71%', target: '> 90%' },
      { name: 'Não comparecimento', baseline: '6%', target: '< 1%' },
    ],
  },
  'p-app-instabilidade': {
    title: 'Plano de estabilização do aplicativo',
    proposal: [
      'Implantar monitoramento de erros e travamentos em produção.',
      'Priorizar correções no fluxo de agendamento e login.',
      'Criar rotina de testes antes de cada atualização.',
    ],
    benefits: ['Mais agendamentos concluídos no app', 'Menos ligações para a central', 'Melhor nota nas lojas de aplicativos'],
    resources: {
      pessoas: '2 desenvolvedores e 1 analista de qualidade',
      ferramentas: 'Ferramenta de monitoramento de erros',
      tecnologia: 'Pipeline de testes automatizados',
      orcamento: 'Estimativa demonstrativa: R$ 25 mil',
    },
    complexity: 'media',
    timeframe: 'curto',
    kpis: ['Sessões sem falha', 'Conversão do agendamento no app', 'Nota na loja'],
    risks: ['Correções gerarem novas falhas', 'Dependência de fornecedor externo'],
    recommendation: 'implementar',
    objective: 'Garantir que o agendamento pelo app funcione sem falhas.',
    expectedResult: '99,5% das sessões sem travamento.',
    investment: 'R$ 25.000 — valor demonstrativo',
    steps: [
      ['Instalar monitoramento de erros', 'Equipe de TI (demo)'],
      ['Corrigir falhas críticas', 'Equipe de TI (demo)'],
      ['Criar testes automatizados', 'QA (demo)'],
      ['Publicar nova versão', 'Equipe de TI (demo)'],
    ],
    planKpis: [{ name: 'Sessões sem falha', baseline: '96%', target: '99,5%' }],
  },
  'p-pos-venda': {
    title: 'Pós-venda ativo com garantia digital',
    feature: 'garantia_90',
    proposal: [
      'Enviar mensagem automática 7 dias após cada serviço perguntando se o problema foi resolvido.',
      'Permitir acionar a garantia diretamente pelo app, com prioridade na agenda.',
      'Analisar retornos em garantia para identificar necessidades de capacitação técnica.',
    ],
    benefits: ['Detecção precoce de falhas', 'Menos reclamações públicas', 'Maior recompra'],
    resources: {
      pessoas: 'Analista de pós-venda',
      ferramentas: 'Automação de mensagens',
      tecnologia: 'Fluxo de garantia no app',
      orcamento: 'Estimativa demonstrativa: R$ 10 mil',
    },
    complexity: 'baixa',
    timeframe: 'curto',
    kpis: ['Retornos em garantia', 'Tempo para atender garantia', 'Taxa de recompra'],
    risks: ['Aumento inicial de chamados de garantia', 'Mensagens percebidas como spam'],
    recommendation: 'testar',
    objective: 'Tornar a garantia simples e proativa.',
    expectedResult: 'Garantias atendidas em até 48 horas.',
    investment: 'R$ 10.000 — valor demonstrativo',
    steps: [
      ['Definir régua de contato pós-serviço', 'Ana Ribeiro (demo)'],
      ['Criar fluxo de garantia no app', 'Equipe de TI (demo)'],
      ['Piloto com serviços hidráulicos', 'Coordenação técnica (demo)'],
      ['Avaliar resultados', 'Carla Souza (demo)'],
    ],
    planKpis: [{ name: 'Tempo para atender garantia', baseline: '15 dias', target: '48 h' }],
  },
  'p-pagamento': {
    title: 'Parcelamento para serviços de maior valor',
    feature: 'parcelamento',
    proposal: [
      'Oferecer parcelamento sem juros em até 6 vezes para serviços acima de R$ 500.',
      'Comunicar a condição no orçamento e no agendamento online.',
    ],
    benefits: ['Conversão maior em instalações e reformas', 'Aumento do ticket médio'],
    resources: {
      pessoas: 'Financeiro e comercial',
      ferramentas: 'Gateway de pagamento com parcelamento',
      tecnologia: 'Ajuste no checkout do app',
      orcamento: 'Custo financeiro estimado de 3% a 5% por transação parcelada (demonstrativo)',
    },
    complexity: 'baixa',
    timeframe: 'curto',
    kpis: ['Conversão de orçamentos acima de R$ 500', 'Ticket médio', 'Custo financeiro'],
    risks: ['Redução de margem', 'Inadimplência em meios alternativos'],
    recommendation: 'testar',
    objective: 'Viabilizar a contratação de serviços de maior valor.',
    expectedResult: 'Conversão 15% maior em orçamentos acima de R$ 500.',
    investment: 'Custo financeiro variável — valor demonstrativo',
    steps: [
      ['Simular impacto na margem', 'Financeiro (demo)'],
      ['Configurar gateway', 'Equipe de TI (demo)'],
      ['Testar por 60 dias', 'Comercial (demo)'],
    ],
    planKpis: [{ name: 'Conversão > R$ 500', baseline: '38%', target: '44%' }],
  },
  'o-assinatura': {
    title: 'Plano de manutenção preventiva por assinatura',
    feature: 'assinatura',
    proposal: [
      'Criar dois planos: residencial (visitas semestrais) e condomínio (visitas trimestrais).',
      'Incluir checklist preventivo de elétrica, hidráulica e climatização com desconto em serviços extras.',
      'Lançar piloto com clientes que já contrataram mais de um serviço.',
    ],
    benefits: ['Receita recorrente e previsível', 'Relacionamento contínuo', 'Diferenciação frente a concorrentes que vendem apenas serviços avulsos'],
    resources: {
      pessoas: 'Gerente de produto e equipe comercial',
      ferramentas: 'Cobrança recorrente',
      tecnologia: 'Gestão de contratos e agenda preventiva',
      orcamento: 'Estimativa demonstrativa: R$ 30 mil',
    },
    complexity: 'media',
    timeframe: 'longo',
    kpis: ['Assinantes ativos', 'Receita recorrente mensal', 'Cancelamento de assinaturas'],
    risks: ['Demanda menor que a projetada', 'Capacidade da agenda para visitas preventivas'],
    recommendation: 'investigar',
    objective: 'Criar uma nova linha de receita recorrente.',
    expectedResult: '300 assinantes no primeiro ano.',
    investment: 'R$ 30.000 — valor demonstrativo',
    steps: [
      ['Pesquisar interesse com clientes', 'Comercial (demo)'],
      ['Modelar preços dos planos', 'Financeiro (demo)'],
      ['Estruturar cobrança recorrente', 'Equipe de TI (demo)'],
      ['Lançar piloto', 'Comercial (demo)'],
    ],
    planKpis: [{ name: 'Assinantes ativos', baseline: '0', target: '300' }],
  },
};
