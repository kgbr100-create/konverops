import { AutomationRule } from './types';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_RULES_KEY = 'konverops:instagram:rules';

export const DEFAULT_PUBLIC_REPLY_VARIATIONS: string[] = [
  'Acabei de te enviar no Direct! 💙 Dá uma olhadinha na sua caixa de mensagens!',
  'Enviado no seu Direct com muito carinho! ✨ Olha lá na sua caixa de entrada!',
  'Te mandei agora mesmo no Direct! 💙 Se não aparecer na aba principal, confere nas Solicitações de Mensagem!',
  'Prontinho! Acabei de mandar o material no seu Direct! 💙✨',
];

export const DEFAULT_FOLLOW_GATE_TEXT =
  'Oi{nome}! 💙 Vi que você ainda não segue o @kit.autismo!\n\nSiga nosso perfil rapidinho e toque no botão abaixo para eu liberar seu Guia gratuitamente aqui no Direct:';

export const DEFAULT_TWO_STEP_PROMPT_TEXT =
  'Oi{nome}! 💙 Separei o material que você pediu no nosso post!\n\nToque no botão abaixo para eu liberar o acesso completo aqui no seu Direct:';

/** Regras padrão pré-configuradas para o ecossistema Kit Autismo / Konverops (Motor OpenReply + ChatbotX) */
export const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'regra-enquete-story-a',
    name: 'Enquete Story [Opção A] — Crise na Transição / Parar de Brincar',
    keywords: ['a', 'letra a', 'opcao a'],
    exactMessageMatch: true,
    replyText: `Olá! Eu te entendo demais! 💙 A transição (parar de brincar para tomar banho ou sair) é um dos momentos que mais sobrecarrega o cérebro autista, porque o aviso falado ("daqui a pouco") parece um abismo sem chão.\n\nQuando você mostra a transição visualmente com 2 figurinhas (Primeiro: Brincar ➡️ Depois: Banho), o alarme cerebral desliga em segundos.\n\nToque no botão abaixo para acessar o nosso Quadro Visual de Rotina e Previsibilidade:`,
    linkUrl: 'https://kitautismo.com/rotina',
    buttonTitle: 'Ver Quadro de Rotina',
    secondaryButtonTitle: 'Kit Completo TEA',
    secondaryLinkUrl: 'https://kitautismo.com',
    publicReplyEnabled: true,
    publicReplyVariations: DEFAULT_PUBLIC_REPLY_VARIATIONS,
    requireFollow: false,
    twoStepCommentOptIn: false,
    humanTypingDelay: true,
    active: true,
    priority: 1,
  },
  {
    id: 'regra-enquete-story-b',
    name: 'Enquete Story [Opção B] — Hora das Refeições / Seletividade',
    keywords: ['b', 'letra b', 'opcao b'],
    exactMessageMatch: true,
    replyText: `Olá! A hora da refeição exige tanta energia emocional, né? 💙 No autismo, a seletividade alimentar nunca é "frescura" — é o sistema sensorial tentando se proteger de texturas, cheiros e temperaturas imprevisíveis.\n\nSeparamos o nosso Guia Prático de Transição Suave e Previsibilidade na Mesa para você aplicar sem forçar e sem choro.\n\nToque no botão abaixo para acessar agora:`,
    linkUrl: 'https://kitautismo.com/alimentacao',
    buttonTitle: 'Guia de Alimentação',
    secondaryButtonTitle: 'Kit Completo TEA',
    secondaryLinkUrl: 'https://kitautismo.com',
    publicReplyEnabled: true,
    publicReplyVariations: DEFAULT_PUBLIC_REPLY_VARIATIONS,
    requireFollow: false,
    twoStepCommentOptIn: false,
    humanTypingDelay: true,
    active: true,
    priority: 1,
  },
  {
    id: 'regra-enquete-story-c',
    name: 'Enquete Story [Opção C] — Hora de Dormir / Agitação Noturna',
    keywords: ['c', 'letra c', 'opcao c'],
    exactMessageMatch: true,
    replyText: `Olá! A agitação noturna acontece porque o sistema nervoso da criança acumula estímulos o dia inteiro e não consegue "desligar a chave" sozinho à noite. 💙\n\nO segredo é criar um ritual visual de descompressão de 3 passos antes de ir para a cama, dando previsibilidade total ao cérebro.\n\nToque no botão abaixo para acessar o nosso Kit de Rotina Noturna e Previsibilidade:`,
    linkUrl: 'https://kitautismo.com/rotina',
    buttonTitle: 'Ver Ritual do Sono',
    secondaryButtonTitle: 'Kit Completo TEA',
    secondaryLinkUrl: 'https://kitautismo.com',
    publicReplyEnabled: true,
    publicReplyVariations: DEFAULT_PUBLIC_REPLY_VARIATIONS,
    requireFollow: false,
    twoStepCommentOptIn: false,
    humanTypingDelay: true,
    active: true,
    priority: 1,
  },
  {
    id: 'regra-rotina',
    name: 'Rotinas Visuais & Previsibilidade (AuDHD / TEA)',
    keywords: [
      'rotina',
      'rotinas',
      'audhd',
      'tdah',
      'previsibilidade',
      'crise',
      'quadro',
      'visual',
      'transicao',
    ],
    replyText: `Olá! Dar previsibilidade visual para a criança autista é a forma mais gentil e neurocientífica de reduzir crises de transição no dia a dia. 💙\n\nAqui está o nosso modelo prático de Quadro de Rotina Visual para organizar a semana sem sobrecarga sensorial:`,
    linkUrl: 'https://kitautismo.com/rotina',
    buttonTitle: 'Acessar Guia Rotina',
    secondaryButtonTitle: 'Ver Kit Completo',
    secondaryLinkUrl: 'https://kitautismo.com',
    publicReplyEnabled: true,
    publicReplyVariations: DEFAULT_PUBLIC_REPLY_VARIATIONS,
    requireFollow: true,
    followGateText: DEFAULT_FOLLOW_GATE_TEXT,
    followGateButtonTitle: '✅ Já segui! Liberar',
    twoStepCommentOptIn: true,
    twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
    twoStepButtonTitle: '🔓 Liberar meu Guia',
    humanTypingDelay: true,
    active: true,
    priority: 2,
  },
  {
    id: 'regra-link-geral',
    name: 'Link Geral / Materiais & Kit Autismo',
    keywords: [
      'link',
      'guia',
      'material',
      'materiais',
      'ebook',
      'quero',
      'eu quero',
      'acessar',
      'kit',
      'escola',
      'pei',
      'fobia',
    ],
    replyText: `Olá! Que alegria ter você por aqui no Kit Autismo. 💙\n\nPreparamos o acesso direto aos nossos materiais práticos, atividades adaptadas e guias visuais para apoiar o desenvolvimento no seu dia a dia:`,
    linkUrl: 'https://kitautismo.com',
    buttonTitle: 'Acessar Kit Autismo',
    secondaryButtonTitle: 'Quadros de Rotina',
    secondaryLinkUrl: 'https://kitautismo.com/rotina',
    publicReplyEnabled: true,
    publicReplyVariations: DEFAULT_PUBLIC_REPLY_VARIATIONS,
    requireFollow: true,
    followGateText: DEFAULT_FOLLOW_GATE_TEXT,
    followGateButtonTitle: '✅ Já segui! Liberar',
    twoStepCommentOptIn: true,
    twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
    twoStepButtonTitle: '🔓 Liberar Material',
    humanTypingDelay: true,
    active: true,
    priority: 2,
  },
  {
    id: 'regra-direitos',
    name: 'Direitos, Escola & Planos de Saúde (ANS / SUS)',
    keywords: [
      'direito',
      'direitos',
      'ans',
      'plano',
      'justica',
      'lei',
      'laudo',
      'liminar',
      'terapia',
      'terapias',
      'bpc',
      'ciptea',
    ],
    replyText: `Olá! Sabemos o quanto a luta pelos direitos terapêuticos e escolares é desgastante para as famílias atípicas. 💙\n\nPreparamos um guia prático com orientações claras sobre cobertura de planos (ANS), SUS e direitos na escola:`,
    linkUrl: 'https://kitautismo.com/direitos',
    buttonTitle: 'Guia de Direitos',
    secondaryButtonTitle: 'Acessar Kit Autismo',
    secondaryLinkUrl: 'https://kitautismo.com',
    publicReplyEnabled: true,
    publicReplyVariations: DEFAULT_PUBLIC_REPLY_VARIATIONS,
    requireFollow: true,
    followGateText: DEFAULT_FOLLOW_GATE_TEXT,
    followGateButtonTitle: '✅ Já segui! Liberar',
    twoStepCommentOptIn: true,
    twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
    twoStepButtonTitle: '🔓 Liberar meu Guia',
    humanTypingDelay: true,
    active: true,
    priority: 2,
  },
  {
    id: 'regra-seletividade',
    name: 'Seletividade Alimentar & Integração Sensorial',
    keywords: [
      'comida',
      'alimentacao',
      'seletividade',
      'cardapio',
      'mastigacao',
      'textura',
      'comer',
      'refeicao',
    ],
    replyText: `Olá! A seletividade alimentar no autismo não é "paladar chato" — envolve integração sensorial, tônus oral e muita sensibilidade. 💙\n\nSeparamos estratégias práticas e um modelo de transição suave para você aplicar em casa sem estresse:`,
    linkUrl: 'https://kitautismo.com/alimentacao',
    buttonTitle: 'Guia de Alimentação',
    secondaryButtonTitle: 'Acessar Kit Autismo',
    secondaryLinkUrl: 'https://kitautismo.com',
    publicReplyEnabled: true,
    publicReplyVariations: DEFAULT_PUBLIC_REPLY_VARIATIONS,
    requireFollow: true,
    followGateText: DEFAULT_FOLLOW_GATE_TEXT,
    followGateButtonTitle: '✅ Já segui! Liberar',
    twoStepCommentOptIn: true,
    twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
    twoStepButtonTitle: '🔓 Liberar meu Guia',
    humanTypingDelay: true,
    active: true,
    priority: 2,
  },
  {
    id: 'regra-saudacao',
    name: 'Saudação / Boas-vindas',
    keywords: [
      'oi',
      'ola',
      'opa',
      'bom dia',
      'boa tarde',
      'boa noite',
      'e ai',
      'fala',
      'teste',
      'testando',
      'comecar',
      'iniciar',
      'tudo bem',
    ],
    replyText: `Olá! Seja muito bem-vindo(a) ao Kit Autismo. 💙\n\nEstou aqui para te entregar nossos materiais práticos em segundos:\n\n👉 Responda "ROTINA" para os quadros visuais de previsibilidade;\n👉 Responda "ALIMENTACAO" para estratégias de seletividade alimentar;\n👉 Responda "DIREITOS" para o guia de planos de saúde e escola;\n👉 Ou toque no botão abaixo para acessar o portal completo:`,
    linkUrl: 'https://kitautismo.com',
    buttonTitle: 'Abrir Kit Autismo',
    publicReplyEnabled: false,
    requireFollow: false,
    twoStepCommentOptIn: false,
    humanTypingDelay: true,
    active: true,
    priority: 3,
  },
  {
    id: 'regra-suporte',
    name: 'Acolhimento & Suporte Humano',
    keywords: ['ajuda', 'duvida', 'contato', 'falar', 'humano', 'conversa', 'atendente'],
    replyText: `Olá! Acolhemos a sua mensagem com muito carinho. 💙\n\nNossa equipe acompanha cada conversa. Pode deixar a sua dúvida detalhada aqui que responderemos o mais rápido possível! Enquanto isso, você também pode consultar nossos guias práticos:`,
    linkUrl: 'https://kitautismo.com',
    buttonTitle: 'Ver Materiais',
    publicReplyEnabled: false,
    requireFollow: false,
    twoStepCommentOptIn: false,
    humanTypingDelay: true,
    active: true,
    priority: 3,
  },
];

/**
 * Normaliza o texto removendo acentos, pontuação excessiva, emojis e convertendo para minúsculas.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^\w\s]/gi, ' ') // substitui pontuação por espaço
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Carrega todas as regras (ativas e inativas) mesclando o Redis com os novos campos do motor OpenReply + ChatbotX.
 */
export async function getAllRules(): Promise<AutomationRule[]> {
  if (UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('unique-ladybird-238762')) {
    try {
      const res = await fetch(UPSTASH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', REDIS_RULES_KEY]),
        cache: 'no-store',
        signal: AbortSignal.timeout(1200),
      });
      const json = await res.json();
      if (json && json.result) {
        const parsed: AutomationRule[] =
          typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((r) => r.id));
          return [
            ...DEFAULT_RULES.filter((d) => !existingIds.has(d.id)),
            ...parsed.map((r) => {
              const def = DEFAULT_RULES.find((d) => d.id === r.id);
              return {
                ...def,
                ...r,
                buttonTitle: r.buttonTitle || def?.buttonTitle || 'Acessar Material',
                publicReplyVariations:
                  r.publicReplyVariations ||
                  def?.publicReplyVariations ||
                  DEFAULT_PUBLIC_REPLY_VARIATIONS,
                humanTypingDelay: r.humanTypingDelay ?? def?.humanTypingDelay ?? true,
              };
            }),
          ];
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar regras do Redis, usando regras padrão:', err);
    }
  }
  return DEFAULT_RULES;
}

/**
 * Carrega apenas as regras ativas.
 */
export async function getActiveRules(): Promise<AutomationRule[]> {
  const all = await getAllRules();
  return all.filter((r) => r.active);
}

/**
 * Busca uma regra específica pelo ID (usado nos cliques de postback do Follow-Gate e Fluxo de 2 Etapas).
 */
export async function getRuleById(ruleId: string): Promise<AutomationRule | null> {
  if (!ruleId) return null;
  const rules = await getActiveRules();
  return rules.find((r) => r.id === ruleId) || null;
}

/**
 * Verifica se um conjunto de regras possui correspondência com o texto informado.
 */
function findMatchingRuleInSet(
  rules: AutomationRule[],
  normalized: string,
  words: string[]
): AutomationRule | null {
  // 0. Verifica primeiro regras de mensagem exata curta (ex.: Enquete de Story "A", "B", "C")
  for (const rule of rules) {
    if (!rule.exactMessageMatch) continue;
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw);
      if (normalized === normKw) {
        return rule;
      }
    }
  }

  // 1. Busca correspondência exata de palavra inteira ou frase (whole-word match do OpenReply)
  for (const rule of rules) {
    if (rule.exactMessageMatch) continue;
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw);
      if (!normKw) continue;
      if (words.includes(normKw) || normalized === normKw) {
        return rule;
      }
    }
  }

  // 2. Busca substring se a palavra-chave tiver pelo menos 4 caracteres (ex: 'rotina', 'direito', 'link')
  for (const rule of rules) {
    if (rule.exactMessageMatch || rule.wholeWordMatch) continue;
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw);
      if (normKw.length >= 4 && normalized.includes(normKw)) {
        return rule;
      }
    }
  }

  return null;
}

/**
 * Encontra a melhor regra correspondente para a mensagem ou comentário recebido (Motor OpenReply + ChatbotX).
 * Se `mediaId` for informado (ex: comentário em post ou resposta a Story específico), prioriza regras vinculadas àquele post!
 */
export async function matchRule(
  rawText: string,
  mediaId?: string
): Promise<AutomationRule | null> {
  const normalized = normalizeText(rawText);
  if (!normalized) return null;

  const words = normalized.split(' ');
  const rules = await getActiveRules();

  // Prioridade 1: Regras vinculadas especificamente a esta publicação (mediaId) — Padrão OpenReply
  if (mediaId) {
    const postSpecificRules = rules.filter(
      (r) => Array.isArray(r.targetMediaIds) && r.targetMediaIds.includes(mediaId)
    );
    if (postSpecificRules.length > 0) {
      const postMatch = findMatchingRuleInSet(postSpecificRules, normalized, words);
      if (postMatch) return postMatch;
    }
  }

  // Prioridade 2: Regras Globais (que não estão restritas a outros posts específicos)
  const globalRules = rules.filter(
    (r) => !Array.isArray(r.targetMediaIds) || r.targetMediaIds.length === 0
  );
  return findMatchingRuleInSet(globalRules, normalized, words);
}

/**
 * Escolhe uma variação de resposta pública para comentário, personalizando com @username quando disponível.
 */
export function pickPublicReplyVariation(
  rule: AutomationRule,
  commenterUsername?: string
): string {
  const variations =
    rule.publicReplyVariations && rule.publicReplyVariations.length > 0
      ? rule.publicReplyVariations
      : DEFAULT_PUBLIC_REPLY_VARIATIONS;

  const chosen = variations[Math.floor(Math.random() * variations.length)];
  if (commenterUsername && !chosen.includes('@')) {
    return `@${commenterUsername.replace(/^@/, '')} ${chosen}`;
  }
  return chosen;
}
