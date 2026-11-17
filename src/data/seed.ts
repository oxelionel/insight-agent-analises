import type { AppData, Company, Competitor, Manifestation, Opportunity, Plan } from '../types';
import { SOURCES } from './catalog';
import { computeProblems } from '../services/analysisEngine';
import { buildPlanFromSolution, generateSolution } from '../services/solutionEngine';

/*
 * DADOS DEMONSTRATIVOS
 * Todas as empresas, pessoas, avaliações e notícias abaixo são fictícias e
 * existem apenas para demonstrar o funcionamento do Insight Agent.
 */

export const DEMO_COMPANY: Company = {
  name: 'NovaVia Serviços',
  segment: 'Prestação de serviços',
  description:
    'Empresa fictícia de manutenção residencial e predial que atende por aplicativo, site e WhatsApp, com técnicos próprios para elétrica, hidráulica, climatização e pequenas reformas.',
  products: ['Aplicativo NovaVia', 'Kit de manutenção preventiva', 'Contrato para condomínios'],
  services: ['Elétrica residencial', 'Hidráulica e vazamentos', 'Instalação e limpeza de ar-condicionado', 'Pintura e pequenas reformas'],
  audience: 'Famílias de classe média, pequenos comércios e síndicos de condomínios em regiões metropolitanas.',
  differentials: ['Técnicos certificados e uniformizados', 'Garantia de 30 dias em todos os serviços', 'Agendamento online em poucos passos'],
  knownIssues: ['Volume alto de mensagens no fim da tarde', 'Agenda de técnicos montada manualmente'],
  goals: ['Elevar a nota média de avaliação para 4,5', 'Reduzir o tempo de primeira resposta para menos de 10 minutos', 'Crescer 20% em contratos recorrentes em 2027'],
  features: ['agendamento_online', 'tecnicos_certificados', 'garantia_30', 'pix_cartao', 'app_proprio'],
};

export const DEMO_COMPETITORS: Competitor[] = [
  {
    id: 'c-orbe',
    name: 'Orbe Reparos',
    segment: 'Manutenção residencial',
    offerings: ['Elétrica', 'Hidráulica', 'Montagem de móveis'],
    differentials: ['Acompanhamento do técnico em tempo real', 'Avaliação do técnico após o serviço'],
    features: ['agendamento_online', 'rastreamento', 'avaliacao_tecnico', 'app_proprio', 'pix_cartao', 'parcelamento'],
    rating: 4.3,
    reviews: 1840,
    strengths: ['Aplicativo moderno e estável', 'Transparência sobre a chegada do técnico'],
    weaknesses: ['Preço acima da média', 'Não atende climatização'],
    scores: { atendimento: 3.8, preco: 3.1, tecnologia: 4.6, experiencia: 4.2, prazo: 4.1 },
    priceLevel: 'Premium',
    color: '#eb6834',
  },
  {
    id: 'c-prisma',
    name: 'Prisma Manutenção',
    segment: 'Manutenção residencial e predial',
    offerings: ['Elétrica', 'Hidráulica', 'Emergências 24h', 'Condomínios'],
    differentials: ['Atendimento 24h com assistente virtual', 'Plantão para emergências noturnas'],
    features: ['atendimento_24h', 'emergencia', 'tecnicos_certificados', 'garantia_90', 'pix_cartao'],
    rating: 4.1,
    reviews: 1320,
    strengths: ['Disponibilidade 24 horas', 'Garantia de 90 dias'],
    weaknesses: ['Aplicativo com poucos recursos', 'Agendamento online limitado'],
    scores: { atendimento: 4.4, preco: 3.0, tecnologia: 3.5, experiencia: 3.9, prazo: 3.7 },
    priceLevel: 'Intermediário-alto',
    color: '#1baf7a',
  },
  {
    id: 'c-vertice',
    name: 'Vértice Casa',
    segment: 'Reformas e manutenção',
    offerings: ['Pequenas reformas', 'Pintura', 'Manutenção preventiva por assinatura'],
    differentials: ['Plano de manutenção por assinatura', 'Orçamento digital com aprovação prévia'],
    features: ['assinatura', 'orcamento_digital', 'parcelamento', 'agendamento_online', 'garantia_30'],
    rating: 3.9,
    reviews: 960,
    strengths: ['Preço competitivo', 'Orçamentos claros e aprovados pelo cliente'],
    weaknesses: ['Atendimento lento em picos', 'Cobertura geográfica menor'],
    scores: { atendimento: 3.3, preco: 4.4, tecnologia: 3.2, experiencia: 3.6, prazo: 3.4 },
    priceLevel: 'Acessível',
    color: '#eda100',
  },
];

type RawManifestation = [string, Manifestation['source'], string, string, Manifestation['category'], Manifestation['sentiment'], Manifestation['type'], Manifestation['priority'], ('pendente' | 'analisada')?, string?];

// [data, fonte, autor, conteúdo, categoria, sentimento, tipo, prioridade, status?, empresa?]
const RAW: RawManifestation[] = [
  ['2026-06-05', 'reclame_aqui', 'Cliente R.M.', 'O técnico não apareceu no horário marcado e ninguém avisou. Perdi o dia de trabalho.', 'prazo', 'negativo', 'reclamacao', 'alta'],
  ['2026-06-12', 'reclame_aqui', 'Cliente A.P.', 'Demoram muito para responder no chat. Fiquei mais de 40 minutos esperando e desisti do agendamento.', 'atendimento', 'negativo', 'reclamacao', 'alta'],
  ['2026-06-18', 'reclame_aqui', 'Cliente J.S.', 'O orçamento passado por telefone era R$ 180 e cobraram R$ 320 no final, sem explicar o motivo.', 'preco', 'negativo', 'reclamacao', 'alta'],
  ['2026-06-22', 'google', 'Usuário Google #2231', 'Técnico muito educado e pontual. Resolveu o problema elétrico rapidamente. Recomendo!', 'qualidade', 'positivo', 'elogio', 'baixa'],
  ['2026-06-28', 'google', 'Usuário Google #1187', 'Tive um vazamento no sábado à noite e não havia ninguém para atender. Tive que chamar outra empresa.', 'atendimento', 'negativo', 'reclamacao', 'alta'],
  ['2026-07-03', 'google', 'Usuário Google #3310', 'Fiquei horas esperando atendimento pelo WhatsApp para alterar o endereço da visita.', 'atendimento', 'negativo', 'reclamacao', 'media'],
  ['2026-07-08', 'app_store', 'Avaliação do app #88', 'Não dá para acompanhar onde está o técnico. Fico ligando para saber a previsão de chegada.', 'comunicacao', 'negativo', 'reclamacao', 'media'],
  ['2026-07-11', 'site_concorrente', 'Monitoramento demonstrativo', 'Orbe Reparos (fictícia) lança acompanhamento do técnico em tempo real no aplicativo.', 'tecnologia', 'neutro', 'concorrente', 'media', 'analisada', 'Orbe Reparos'],
  ['2026-07-14', 'app_store', 'Avaliação do app #102', 'O aplicativo trava na tela de confirmação e não consigo concluir o agendamento.', 'tecnologia', 'negativo', 'reclamacao', 'media'],
  ['2026-07-19', 'reclame_aqui', 'Cliente L.F.', 'Só consigo falar com a NovaVia em horário comercial. Para emergência elétrica isso não funciona.', 'atendimento', 'negativo', 'reclamacao', 'alta'],
  ['2026-07-25', 'google', 'Usuário Google #4120', 'Chegou duas horas depois da janela de horário combinada, sem nenhum aviso.', 'prazo', 'negativo', 'reclamacao', 'media'],
  ['2026-07-30', 'instagram', '@perfil_demo_01', 'Excelente serviço de limpeza do ar-condicionado, preço justo e equipe caprichosa.', 'qualidade', 'positivo', 'elogio', 'baixa'],
  ['2026-08-04', 'reclame_aqui', 'Cliente C.T.', 'O problema no disjuntor voltou a acontecer uma semana depois e não consigo acionar a garantia.', 'pos_venda', 'negativo', 'reclamacao', 'alta'],
  ['2026-08-11', 'google', 'Usuário Google #5021', 'Valor final bem diferente do combinado. Fiquei com uma surpresa nada agradável.', 'preco', 'negativo', 'reclamacao', 'media'],
  ['2026-08-16', 'interna', 'Equipe comercial (demo)', 'Equipe comercial relata pedidos frequentes de parcelamento em instalações de climatização.', 'preco', 'neutro', 'sugestao', 'media'],
  ['2026-08-21', 'facebook', 'Perfil demonstrativo F.', 'Ninguém retorna minhas mensagens. Mandei três vezes e só visualizaram.', 'atendimento', 'negativo', 'reclamacao', 'alta'],
  ['2026-08-25', 'noticias', 'Portal setorial (demo)', 'Estudo setorial demonstrativo aponta crescimento da procura por planos de manutenção preventiva por assinatura em residências.', 'inovacao', 'neutro', 'noticia', 'media'],
  ['2026-08-30', 'instagram', '@perfil_demo_02', 'Gostaria de acompanhar o status do serviço pelo celular, como faço com entregas.', 'comunicacao', 'neutro', 'sugestao', 'media'],
  ['2026-09-03', 'facebook', 'Perfil demonstrativo G.', 'Gostei muito do acabamento da pintura. Equipe organizada e eficiente.', 'qualidade', 'positivo', 'elogio', 'baixa'],
  ['2026-09-07', 'instagram', '@perfil_demo_03', 'Tentei agendar no domingo e o chat só abre segunda. Poderiam ter atendimento no fim de semana.', 'atendimento', 'neutro', 'sugestao', 'media'],
  ['2026-09-14', 'facebook', 'Perfil demonstrativo H.', 'Terceira vez que remarcam minha instalação de ar-condicionado.', 'prazo', 'negativo', 'reclamacao', 'alta'],
  ['2026-09-18', 'site_concorrente', 'Monitoramento demonstrativo', 'Prisma Manutenção (fictícia) passa a oferecer atendimento 24h com assistente virtual.', 'atendimento', 'neutro', 'concorrente', 'media', 'analisada', 'Prisma Manutenção'],
  ['2026-09-22', 'app_store', 'Avaliação do app #131', 'Erro ao fazer login depois da última atualização.', 'tecnologia', 'negativo', 'reclamacao', 'media'],
  ['2026-09-29', 'facebook', 'Perfil demonstrativo K.', 'Depois do serviço ninguém entrou em contato para saber se ficou tudo certo. O vazamento voltou.', 'pos_venda', 'negativo', 'reclamacao', 'media'],
  ['2026-10-02', 'instagram', '@perfil_demo_04', 'Atendimento educado, mas a resposta demora demais. Precisa melhorar.', 'atendimento', 'negativo', 'reclamacao', 'media'],
  ['2026-10-09', 'instagram', '@perfil_demo_05', 'Vocês poderiam parcelar a reforma do banheiro em mais vezes?', 'preco', 'neutro', 'sugestao', 'baixa'],
  ['2026-10-12', 'noticias', 'Portal de consumo (demo)', 'Reportagem demonstrativa: consumidores querem acompanhar serviços domésticos em tempo real, como já fazem com entregas.', 'inovacao', 'neutro', 'noticia', 'media'],
  ['2026-10-15', 'forum', 'Usuário de fórum (demo)', 'Alguém conhece empresa de manutenção com atendimento depois das 18h? A NovaVia só atende em horário comercial.', 'atendimento', 'negativo', 'reclamacao', 'media'],
  ['2026-10-20', 'google', 'Usuário Google #6604', 'Nenhuma atualização sobre a peça que o técnico precisava encomendar. Não sei quando vão voltar.', 'comunicacao', 'negativo', 'reclamacao', 'media'],
  ['2026-10-24', 'google', 'Usuário Google #6710', 'Atendimento presencial excelente, o técnico explicou tudo com paciência.', 'atendimento', 'positivo', 'elogio', 'baixa'],
  ['2026-10-28', 'reclame_aqui', 'Cliente P.V.', 'Técnico atrasou e ainda cobrou taxa de visita integral.', 'prazo', 'negativo', 'reclamacao', 'alta'],
  ['2026-10-30', 'site_concorrente', 'Monitoramento demonstrativo', 'Vértice Casa (fictícia) anuncia plano de manutenção por assinatura com visitas trimestrais.', 'inovacao', 'neutro', 'concorrente', 'media', 'pendente', 'Vértice Casa'],
  ['2026-11-02', 'forum', 'Usuário de fórum (demo)', 'Site caiu bem na hora de confirmar a visita. Tive que ligar para a central.', 'tecnologia', 'negativo', 'reclamacao', 'media', 'pendente'],
  ['2026-11-04', 'reclame_aqui', 'Cliente E.N.', 'Abri chamado há dois dias e ainda estou sem resposta da central.', 'atendimento', 'negativo', 'reclamacao', 'alta', 'pendente'],
  ['2026-11-06', 'youtube', 'Canal de reviews (demo)', 'Review: a NovaVia tem técnicos certificados e garantia, recomendo para pequenas reformas.', 'qualidade', 'positivo', 'elogio', 'baixa'],
  ['2026-11-09', 'app_store', 'Avaliação do app #156', 'Seria bom ter um assistente virtual para tirar dúvidas de madrugada.', 'atendimento', 'neutro', 'sugestao', 'media', 'pendente'],
  ['2026-11-11', 'google', 'Usuário Google #7022', 'Pedi retorno do técnico pela garantia e me deram prazo de 15 dias.', 'pos_venda', 'negativo', 'reclamacao', 'media', 'pendente'],
  ['2026-11-13', 'interna', 'Equipe de operações (demo)', 'Sugestão da equipe: oferecer pacote anual de manutenção preventiva para condomínios.', 'inovacao', 'neutro', 'sugestao', 'media', 'pendente'],
];

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');

export const DEMO_MANIFESTATIONS: Manifestation[] = RAW.map((r, i) => {
  const [date, source, author, content, category, sentiment, type, priority, status = 'analisada', company = DEMO_COMPANY.name] = r;
  const domain = SOURCES[source].domain;
  return {
    id: `m-${String(i + 1).padStart(3, '0')}`,
    source,
    author,
    date,
    content,
    company,
    category,
    sentiment,
    type,
    priority,
    status,
    link: domain ? `https://${domain}/${slug(company)}/${i + 1000}` : undefined,
    demo: true,
  };
});

export const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'o-atendimento-24h',
    title: 'Atendimento automatizado 24/7',
    description: 'Assistente virtual para dúvidas frequentes, agendamento e triagem de emergências fora do horário comercial.',
    problemId: 'p-fora-horario',
    playbook: 'p-fora-horario',
    origin: 'reclamacao',
    type: 'experiencia_cliente',
    benefit: 'Captar demandas noturnas e de fim de semana e reduzir a fila do dia seguinte.',
    complexity: 'media',
    impact: 5,
    effort: 3,
    priority: 'alta',
    status: 'solucao_gerada',
    createdAt: '2026-07-22',
    extraEvidence: ['Concorrente demonstrativo Prisma Manutenção já oferece atendimento 24h.'],
  },
  {
    id: 'o-rastreamento',
    title: 'Painel de acompanhamento em tempo real',
    description: 'Acompanhamento das etapas do serviço e da chegada do técnico pelo app e por link enviado ao cliente.',
    problemId: 'p-falta-rastreio',
    playbook: 'p-falta-rastreio',
    origin: 'concorrente',
    type: 'vantagem_competitiva',
    benefit: 'Reduzir ligações de status e elevar a percepção de confiabilidade.',
    complexity: 'media',
    impact: 4,
    effort: 3,
    priority: 'alta',
    status: 'solucao_gerada',
    createdAt: '2026-08-02',
    extraEvidence: ['Orbe Reparos (fictícia) lançou recurso equivalente.', 'Notícia demonstrativa indica expectativa do consumidor por acompanhamento em tempo real.'],
  },
  {
    id: 'o-orcamento-digital',
    title: 'Orçamento digital com aprovação prévia',
    description: 'Tabela de preços padronizada e aprovação do orçamento pelo cliente no app antes de qualquer cobrança adicional.',
    problemId: 'p-preco-transparencia',
    playbook: 'p-preco-transparencia',
    origin: 'reclamacao',
    type: 'retencao',
    benefit: 'Eliminar disputas de cobrança e proteger a reputação da marca.',
    complexity: 'baixa',
    impact: 4,
    effort: 2,
    priority: 'alta',
    status: 'solucao_gerada',
    createdAt: '2026-08-19',
    extraEvidence: ['Vértice Casa (fictícia) usa orçamento digital como diferencial.'],
  },
  {
    id: 'o-agenda-inteligente',
    title: 'Gestão inteligente da agenda de técnicos',
    description: 'Roteirização automática, janelas de horário realistas e aviso proativo ao cliente em caso de atraso.',
    problemId: 'p-atraso-tecnico',
    playbook: 'p-atraso-tecnico',
    origin: 'reclamacao',
    type: 'eficiencia',
    benefit: 'Mais atendimentos por dia com menos deslocamento e menos faltas.',
    complexity: 'alta',
    impact: 5,
    effort: 4,
    priority: 'alta',
    status: 'solucao_gerada',
    createdAt: '2026-09-20',
    extraEvidence: [],
  },
  {
    id: 'o-pos-venda',
    title: 'Pós-venda ativo e garantia digital',
    description: 'Contato automático 7 dias após o serviço e acionamento da garantia em poucos cliques.',
    problemId: 'p-pos-venda',
    playbook: 'p-pos-venda',
    origin: 'reclamacao',
    type: 'retencao',
    benefit: 'Detectar falhas cedo, reduzir retrabalho e aumentar recompra.',
    complexity: 'baixa',
    impact: 3,
    effort: 2,
    priority: 'media',
    status: 'nova',
    createdAt: '2026-10-05',
    extraEvidence: ['Prisma Manutenção (fictícia) oferece garantia de 90 dias.'],
  },
  {
    id: 'o-assinatura',
    title: 'Plano de manutenção preventiva por assinatura',
    description: 'Pacote recorrente com visitas periódicas para residências e condomínios.',
    playbook: 'o-assinatura',
    origin: 'noticia',
    type: 'novos_produtos',
    benefit: 'Receita recorrente e relacionamento contínuo com o cliente.',
    complexity: 'media',
    impact: 4,
    effort: 4,
    priority: 'media',
    status: 'nova',
    createdAt: '2026-11-01',
    extraEvidence: [
      'Notícia demonstrativa aponta crescimento da procura por manutenção por assinatura.',
      'Vértice Casa (fictícia) anunciou plano trimestral.',
      'Equipe de operações sugeriu pacote anual para condomínios.',
    ],
  },
];

export function createDemoData(): AppData {
  const manifestations = DEMO_MANIFESTATIONS.map((m) => ({ ...m }));
  const company = { ...DEMO_COMPANY };
  const competitors = DEMO_COMPETITORS.map((c) => ({ ...c }));
  const problems = computeProblems(manifestations, company.name);
  const opportunities = DEMO_OPPORTUNITIES.map((o) => ({ ...o }));
  const ctx = { company, competitors, manifestations, problems };

  const solutionDates = ['2026-08-05', '2026-08-20', '2026-09-02', '2026-10-01'];
  const solutions = opportunities.slice(0, 4).map((o, i) => ({
    ...generateSolution(o, ctx),
    id: `s-${o.id.slice(2)}`,
    createdAt: solutionDates[i],
  }));

  const plan1: Plan = {
    ...buildPlanFromSolution(solutions[0], opportunities[0], '2026-11-03'),
    id: 'pl-atendimento-24h',
    name: 'Implantação de atendimento automatizado',
    status: 'aguardando_autorizacao',
    approval: { requestedAt: '2026-11-14T15:20:00' },
  };
  plan1.steps[0].done = true;

  const plan2: Plan = {
    ...buildPlanFromSolution(solutions[1], opportunities[1], '2026-11-10'),
    id: 'pl-rastreamento',
    status: 'aprovado',
    approval: {
      requestedAt: '2026-11-10T10:00:00',
      decidedAt: '2026-11-12T16:45:00',
      decidedBy: 'Diretoria de Operações (demo)',
      note: 'Aprovado para execução demonstrativa com piloto em uma região.',
    },
  };

  const actor = 'Insight Agent';
  const activities: AppData['activities'] = [
    { id: 'a-01', timestamp: '2026-07-22T09:12:00', type: 'oportunidade_criada', description: 'Oportunidade "Atendimento automatizado 24/7" criada a partir de reclamações recorrentes.', actor, status: 'sucesso' },
    { id: 'a-02', timestamp: '2026-08-05T14:30:00', type: 'solucao_elaborada', description: 'Solução estratégica elaborada para "Atendimento automatizado 24/7".', actor, status: 'sucesso' },
    { id: 'a-03', timestamp: '2026-08-20T11:05:00', type: 'solucao_elaborada', description: 'Solução estratégica elaborada para "Painel de acompanhamento em tempo real".', actor, status: 'sucesso' },
    { id: 'a-04', timestamp: '2026-10-01T16:40:00', type: 'analise_executada', description: 'Análise de 32 manifestações demonstrativas concluída: 8 problemas identificados.', actor, status: 'sucesso' },
    { id: 'a-05', timestamp: '2026-11-03T10:00:00', type: 'plano_criado', description: 'Plano "Implantação de atendimento automatizado" criado.', actor: 'Ana Ribeiro (demo)', status: 'sucesso' },
    { id: 'a-06', timestamp: '2026-11-10T10:00:00', type: 'autorizacao_solicitada', description: 'Autorização solicitada para "Painel de acompanhamento do serviço em tempo real".', actor: 'Ana Ribeiro (demo)', status: 'pendente' },
    { id: 'a-07', timestamp: '2026-11-12T16:45:00', type: 'melhoria_aprovada', description: 'Melhoria "Painel de acompanhamento do serviço em tempo real" aprovada pela Diretoria de Operações (demo).', actor: 'Diretoria de Operações (demo)', status: 'sucesso' },
    { id: 'a-08', timestamp: '2026-11-14T15:20:00', type: 'autorizacao_solicitada', description: 'Autorização solicitada para "Implantação de atendimento automatizado".', actor: 'Ana Ribeiro (demo)', status: 'pendente' },
  ];

  return {
    version: 1,
    company,
    competitors,
    manifestations,
    opportunities,
    solutions,
    plans: [plan1, plan2],
    activities: activities.reverse(),
    reports: [],
    slideOverrides: {},
    settings: { userName: 'Ana Ribeiro', userRole: 'Gerente de Experiência do Cliente (demo)', animations: true },
    lastAnalysisAt: '2026-10-01T16:40:00',
  };
}
