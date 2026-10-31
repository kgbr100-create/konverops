import { AutomationRule, KeywordMatchMode, TriggerChannel } from './types';

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
  'Oi{nome}! 💙 Vi que você ainda não segue o @kit.autismo!\n\nSiga nosso perfil rapidinho e toque no botão abaixo para eu liberar seu acesso gratuitamente aqui no Direct:';

export const DEFAULT_FOLLOW_GATE_RETRY_TEXT =
  'Oi{nome}! 💙 Ainda não apareceu aqui pra mim que você seguiu o @kit.autismo.\n\nToque em "Abrir @kit.autismo", clique em Seguir lá no perfil e depois toque no botão de confirmação abaixo:';

export const DEFAULT_TWO_STEP_PROMPT_TEXT =
  'Oi{nome}! 💙 Separei o conteúdo que você pediu no nosso post!\n\nToque no botão abaixo para eu liberar o acesso completo aqui no seu Direct:';

/** Templates rápidos de 2 Etapas (Opening DM) para não ficar engessado em "Guia" */
export const TWO_STEP_TEMPLATES = [
  {
    id: 'material',
    label: '🎁 Material / Kit Prático',
    promptText:
      'Oi{nome}! 💙 Separei o material prático que você pediu no nosso post!\n\nToque no botão abaixo para receber o acesso completo aqui no seu Direct:',
    buttonTitle: '🎁 Liberar Material',
  },
  {
    id: 'tutorial',
    label: '🎬 Tutorial / Passo a Passo',
    promptText:
      'Oi{nome}! 💙 Preparei o tutorial passo a passo que você comentou no post!\n\nToque no botão abaixo para assistir e aplicar hoje mesmo:',
    buttonTitle: '🎬 Ver Tutorial',
  },
  {
    id: 'guia',
    label: '📄 Guia / PDF Visual',
    promptText:
      'Oi{nome}! 💙 Seu Guia Visual já está separado aqui pra você!\n\nToque no botão abaixo para abrir o guia completo no seu Direct:',
    buttonTitle: '📄 Abrir meu Guia',
  },
  {
    id: 'aula',
    label: '▶️ Aula / Vídeo Exclusivo',
    promptText:
      'Oi{nome}! 💙 Que bom ver seu comentário! Separei o link da aula exclusiva pra você.\n\nToque no botão abaixo para liberar o vídeo:',
    buttonTitle: '▶️ Assistir Aula',
  },
  {
    id: 'link',
    label: '🔗 Link Direto / Ferramenta',
    promptText:
      'Oi{nome}! 💙 Aqui está o acesso que você pediu nos comentários!\n\nToque no botão abaixo para eu te enviar o link oficial:',
    buttonTitle: '🔗 Receber o Link',
  },
];

const LEGACY_POLL_IDS = new Set([
  'regra-enquete-story-a',
  'regra-enquete-story-b',
  'regra-enquete-story-c',
]);

/** Regras padrão pré-configuradas para o ecossistema Kit Autismo / Konverops (Motor OpenReply + ChatbotX v3.0) */
export const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'regra-enquete-story-abc',
    name: 'Enquete Interativa dos Stories (Opções A, B ou C)',
    triggerType: 'story_reply',
    triggerChannels: ['story_reply'],
    storyScope: 'any',
    targetStoryIds: [],
    matchMode: 'exact',
    exactMessageMatch: true,
    isInteractivePoll: true,
    keywords: ['a', 'b', 'c', 'letra a', 'letra b', 'letra c', 'opcao a', 'opcao b', 'opcao c'],
    pollBranches: [
      {
        id: 'opcao-a',
        label: 'Opção A — Crise na Transição / Parar de Brincar',
        keywords: ['a', 'letra a', 'opcao a'],
        replyText: `Olá! Eu te entendo demais! 💙 A transição (parar de brincar para tomar banho ou sair) é um dos momentos que mais sobrecarrega o cérebro autista, porque o aviso falado ("daqui a pouco") parece um abismo sem chão.\n\nQuando você mostra a transição visualmente com 2 figurinhas (Primeiro: Brincar ➡️ Depois: Banho), o alarme cerebral desliga em segundos.\n\nToque no botão abaixo para acessar o nosso Quadro Visual de Rotina e Previsibilidade:`,
        buttonTitle: 'Ver Quadro de Rotina',
        linkUrl: 'https://kitautismo.com/rotina',
        secondaryButtonTitle: 'Kit Completo TEA',
        secondaryLinkUrl: 'https://kitautismo.com',
      },
      {
        id: 'opcao-b',
        label: 'Opção B — Hora das Refeições / Seletividade',
        keywords: ['b', 'letra b', 'opcao b'],
        replyText: `Olá! A hora da refeição exige tanta energia emocional, né? 💙 No autismo, a seletividade alimentar nunca é "frescura" — é o sistema sensorial tentando se proteger de texturas, cheiros e temperaturas imprevisíveis.\n\nSeparamos o nosso Guia Prático de Transição Suave e Previsibilidade na Mesa para você aplicar sem forçar e sem choro.\n\nToque no botão abaixo para acessar agora:`,
        buttonTitle: 'Guia de Alimentação',
        linkUrl: 'https://kitautismo.com/alimentacao',
        secondaryButtonTitle: 'Kit Completo TEA',
        secondaryLinkUrl: 'https://kitautismo.com',
      },
      {
        id: 'opcao-c',
        label: 'Opção C — Hora de Dormir / Agitação Noturna',
        keywords: ['c', 'letra c', 'opcao c'],
        replyText: `Olá! A agitação noturna acontece porque o sistema nervoso da criança acumula estímulos o dia inteiro e não consegue "desligar a chave" sozinho à noite. 💙\n\nO segredo é criar um ritual visual de descompressão de 3 passos antes de ir para a cama, dando previsibilidade total ao cérebro.\n\nToque no botão abaixo para acessar o nosso Kit de Rotina Noturna e Previsibilidade:`,
        buttonTitle: 'Ver Ritual do Sono',
        linkUrl: 'https://kitautismo.com/rotina',
        secondaryButtonTitle: 'Kit Completo TEA',
        secondaryLinkUrl: 'https://kitautismo.com',
      },
    ],
    replyText: `Olá! Recebi sua resposta na enquete do nosso Story! 💙\n\nToque no botão abaixo para acessar o material recomendado para a sua rotina:`,
    linkUrl: 'https://kitautismo.com/rotina',
    buttonTitle: 'Ver Quadro de Rotina',
    secondaryButtonTitle: 'Kit Completo TEA',
    secondaryLinkUrl: 'https://kitautismo.com',
    publicReplyEnabled: false,
    requireFollow: false,
    twoStepCommentOptIn: false,
    humanTypingDelay: true,
    active: true,
    priority: 1,
  },
  {
    id: 'regra-rotina',
    name: 'Rotinas Visuais & Previsibilidade (AuDHD / TEA)',
    triggerType: 'comment',
    triggerChannels: ['comment', 'story_reply', 'dm'],
    postScope: 'any',
    storyScope: 'any',
    matchMode: 'whole_word',
    wholeWordMatch: true,
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
    excludeKeywords: [],
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
    followGateRetryText: DEFAULT_FOLLOW_GATE_RETRY_TEXT,
    twoStepCommentOptIn: true,
    twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
    twoStepButtonTitle: '🎁 Liberar Material',
    humanTypingDelay: true,
    active: true,
    priority: 2,
  },
  {
    id: 'regra-link-geral',
    name: 'Link Geral / Materiais & Kit Autismo',
    triggerType: 'comment',
    triggerChannels: ['comment', 'story_reply', 'dm'],
    postScope: 'any',
    storyScope: 'any',
    matchMode: 'whole_word',
    wholeWordMatch: true,
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
    excludeKeywords: [],
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
    followGateRetryText: DEFAULT_FOLLOW_GATE_RETRY_TEXT,
    twoStepCommentOptIn: true,
    twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
    twoStepButtonTitle: '🎁 Liberar Material',
    humanTypingDelay: true,
    active: true,
    priority: 2,
  },
  {
    id: 'regra-direitos',
    name: 'Direitos, Escola & Planos de Saúde (ANS / SUS)',
    triggerType: 'comment',
    triggerChannels: ['comment', 'story_reply', 'dm'],
    postScope: 'any',
    storyScope: 'any',
    matchMode: 'whole_word',
    wholeWordMatch: true,
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
    excludeKeywords: [],
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
    followGateRetryText: DEFAULT_FOLLOW_GATE_RETRY_TEXT,
    twoStepCommentOptIn: true,
    twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
    twoStepButtonTitle: '📄 Abrir Guia Direitos',
    humanTypingDelay: true,
    active: true,
    priority: 2,
  },
  {
    id: 'regra-seletividade',
    name: 'Seletividade Alimentar & Integração Sensorial',
    triggerType: 'comment',
    triggerChannels: ['comment', 'story_reply', 'dm'],
    postScope: 'any',
    storyScope: 'any',
    matchMode: 'whole_word',
    wholeWordMatch: true,
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
    excludeKeywords: [],
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
    followGateRetryText: DEFAULT_FOLLOW_GATE_RETRY_TEXT,
    twoStepCommentOptIn: true,
    twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
    twoStepButtonTitle: '🎁 Liberar Estratégias',
    humanTypingDelay: true,
    active: true,
    priority: 2,
  },
  {
    id: 'regra-saudacao',
    name: 'Saudação / Menu Inicial no Direct',
    triggerType: 'dm',
    triggerChannels: ['dm'],
    matchMode: 'whole_word',
    wholeWordMatch: true,
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
    name: 'Acolhimento & Suporte Humano no Direct',
    triggerType: 'dm',
    triggerChannels: ['dm'],
    matchMode: 'whole_word',
    wholeWordMatch: true,
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
 * Normaliza e hidrata campos de uma regra vinda do Redis ou de versões anteriores.
 */
export function hydrateRule(r: AutomationRule, def?: AutomationRule): AutomationRule {
  const merged: AutomationRule = {
    ...def,
    ...r,
  };

  // Define canais explícitos se ausentes
  if (!Array.isArray(merged.triggerChannels) || merged.triggerChannels.length === 0) {
    if (merged.triggerType === 'story_reply' || merged.exactMessageMatch || merged.isInteractivePoll) {
      merged.triggerType = 'story_reply';
      merged.triggerChannels = ['story_reply'];
    } else if (merged.triggerType === 'dm') {
      merged.triggerChannels = ['dm'];
    } else if (merged.triggerType === 'comment') {
      merged.triggerChannels = ['comment'];
    } else {
      merged.triggerType = def?.triggerType || 'comment';
      merged.triggerChannels = def?.triggerChannels || ['comment', 'story_reply', 'dm'];
    }
  } else if (!merged.triggerType) {
    merged.triggerType = merged.triggerChannels[0] || 'comment';
  }

  // Escopo de Posts e Stories
  if (!merged.postScope) {
    merged.postScope =
      Array.isArray(merged.targetMediaIds) && merged.targetMediaIds.length > 0
        ? 'specific'
        : 'any';
  }
  if (!merged.storyScope) {
    merged.storyScope =
      Array.isArray(merged.targetStoryIds) && merged.targetStoryIds.length > 0
        ? 'specific'
        : 'any';
  }

  // Modo de Match
  if (!merged.matchMode) {
    if (merged.exactMessageMatch) {
      merged.matchMode = 'exact';
    } else if (merged.wholeWordMatch) {
      merged.matchMode = 'whole_word';
    } else {
      merged.matchMode = 'contains';
    }
  }

  merged.buttonTitle = merged.buttonTitle || def?.buttonTitle || 'Acessar Material';
  merged.publicReplyVariations =
    merged.publicReplyVariations && merged.publicReplyVariations.length > 0
      ? merged.publicReplyVariations
      : def?.publicReplyVariations || DEFAULT_PUBLIC_REPLY_VARIATIONS;
  merged.followGateText = merged.followGateText || def?.followGateText || DEFAULT_FOLLOW_GATE_TEXT;
  merged.followGateButtonTitle =
    merged.followGateButtonTitle || def?.followGateButtonTitle || '✅ Já segui! Liberar';
  merged.followGateRetryText =
    merged.followGateRetryText || def?.followGateRetryText || DEFAULT_FOLLOW_GATE_RETRY_TEXT;
  merged.twoStepPromptText =
    merged.twoStepPromptText || def?.twoStepPromptText || DEFAULT_TWO_STEP_PROMPT_TEXT;
  merged.twoStepButtonTitle =
    merged.twoStepButtonTitle || def?.twoStepButtonTitle || '🎁 Liberar Material';
  merged.humanTypingDelay = merged.humanTypingDelay ?? def?.humanTypingDelay ?? true;

  return merged;
}

/**
 * Carrega todas as regras (ativas e inativas) mesclando o Redis com a arquitetura v3.0 (OpenReply + ChatbotX).
 * Migra automaticamente as 3 regras antigas soltas (A, B, C) para o fluxo único de Enquete de Story.
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
          // Remove as 3 regras legadas soltas de Story A/B/C para substituir pelo fluxo unificado
          const filteredParsed = parsed.filter((r) => !LEGACY_POLL_IDS.has(r.id));
          const existingIds = new Set(filteredParsed.map((r) => r.id));

          return [
            ...DEFAULT_RULES.filter((d) => !existingIds.has(d.id)).map((d) => hydrateRule(d, d)),
            ...filteredParsed.map((r) => {
              const def = DEFAULT_RULES.find((d) => d.id === r.id);
              return hydrateRule(r, def);
            }),
          ];
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar regras do Redis, usando regras padrão:', err);
    }
  }
  return DEFAULT_RULES.map((d) => hydrateRule(d, d));
}

/**
 * Carrega apenas as regras ativas e dentro da validade (`expiresAt`).
 */
export async function getActiveRules(): Promise<AutomationRule[]> {
  const all = await getAllRules();
  const now = Date.now();
  return all.filter((r) => {
    if (!r.active) return false;
    if (r.expiresAt) {
      const exp = Date.parse(r.expiresAt);
      if (!Number.isNaN(exp) && exp < now) return false;
    }
    return true;
  });
}

/**
 * Busca uma regra específica pelo ID (suporta também IDs compostos de ramificação `regraId__branchId` usados em postbacks).
 */
export async function getRuleById(ruleId: string): Promise<AutomationRule | null> {
  if (!ruleId) return null;
  const rules = await getActiveRules();

  if (ruleId.includes('__')) {
    const [baseId, branchId] = ruleId.split('__');
    const parent = rules.find((r) => r.id === baseId);
    if (!parent) return null;
    const branch = parent.pollBranches?.find((b) => b.id === branchId);
    if (!branch) return parent;
    return {
      ...parent,
      id: ruleId,
      name: `${parent.name} [${branch.label}]`,
      replyText: branch.replyText,
      buttonTitle: branch.buttonTitle || parent.buttonTitle,
      linkUrl: branch.linkUrl || parent.linkUrl,
      secondaryButtonTitle: branch.secondaryButtonTitle ?? parent.secondaryButtonTitle,
      secondaryLinkUrl: branch.secondaryLinkUrl ?? parent.secondaryLinkUrl,
    };
  }

  return rules.find((r) => r.id === ruleId) || null;
}

/**
 * Avalia se uma lista de keywords bate com o texto segundo o `matchMode` especificado.
 */
function matchesKeywordList(
  keywords: string[],
  normalized: string,
  words: string[],
  mode: KeywordMatchMode
): boolean {
  if (mode === 'any') {
    return normalized.length > 0;
  }

  for (const kw of keywords || []) {
    const normKw = normalizeText(kw);
    if (!normKw) continue;

    if (mode === 'exact') {
      if (normalized === normKw) return true;
    } else if (mode === 'whole_word') {
      if (words.includes(normKw) || normalized === normKw) return true;
      // Se for uma frase composta (ex: "eu quero"), verifica presença com bordas de palavra
      if (normKw.includes(' ') && ` ${normalized} `.includes(` ${normKw} `)) return true;
    } else if (mode === 'contains') {
      if (
        words.includes(normKw) ||
        normalized === normKw ||
        (normKw.length >= 3 && normalized.includes(normKw))
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Verifica se a mensagem contém alguma palavra negativa/excluída (ChatbotX ExcludeKeywordsField).
 */
function hasExcludedKeyword(rule: AutomationRule, normalized: string, words: string[]): boolean {
  if (!Array.isArray(rule.excludeKeywords) || rule.excludeKeywords.length === 0) return false;
  for (const ex of rule.excludeKeywords) {
    const normEx = normalizeText(ex);
    if (!normEx) continue;
    if (words.includes(normEx) || normalized === normEx || normalized.includes(normEx)) {
      return true;
    }
  }
  return false;
}

/**
 * Verifica se um conjunto de regras possui correspondência com o texto informado,
 * respeitando a hierarquia: 1) Enquetes / Match Exato -> 2) Palavra Inteira -> 3) Contém -> 4) Qualquer Comentário ('any').
 */
function findMatchingRuleInSet(
  rules: AutomationRule[],
  normalized: string,
  words: string[]
): AutomationRule | null {
  const validRules = rules.filter((r) => !hasExcludedKeyword(r, normalized, words));

  // 0. Verifica primeiro Enquetes Interativas Ramificadas (ex: A, B, C)
  for (const rule of validRules) {
    if (rule.isInteractivePoll && Array.isArray(rule.pollBranches) && rule.pollBranches.length > 0) {
      const branchMode: KeywordMatchMode = rule.matchMode === 'any' ? 'exact' : rule.matchMode || 'exact';
      for (const branch of rule.pollBranches) {
        if (matchesKeywordList(branch.keywords, normalized, words, branchMode)) {
          return {
            ...rule,
            id: `${rule.id}__${branch.id}`,
            name: `${rule.name} (${branch.label})`,
            replyText: branch.replyText,
            buttonTitle: branch.buttonTitle || rule.buttonTitle,
            linkUrl: branch.linkUrl || rule.linkUrl,
            secondaryButtonTitle: branch.secondaryButtonTitle ?? rule.secondaryButtonTitle,
            secondaryLinkUrl: branch.secondaryLinkUrl ?? rule.secondaryLinkUrl,
          };
        }
      }
    }
  }

  // 1. Regras de mensagem exata ('exact')
  for (const rule of validRules) {
    if (rule.isInteractivePoll && (rule.pollBranches?.length || 0) > 0) continue;
    const mode = rule.matchMode || (rule.exactMessageMatch ? 'exact' : 'whole_word');
    if (mode !== 'exact') continue;
    if (matchesKeywordList(rule.keywords, normalized, words, 'exact')) {
      return rule;
    }
  }

  // 2. Regras de palavra inteira ('whole_word')
  for (const rule of validRules) {
    if (rule.isInteractivePoll && (rule.pollBranches?.length || 0) > 0) continue;
    const mode = rule.matchMode || (rule.exactMessageMatch ? 'exact' : 'whole_word');
    if (mode !== 'whole_word') continue;
    if (matchesKeywordList(rule.keywords, normalized, words, 'whole_word')) {
      return rule;
    }
  }

  // 3. Regras de substring ('contains') ou fallback de palavra longa (>= 4 chars)
  for (const rule of validRules) {
    if (rule.isInteractivePoll && (rule.pollBranches?.length || 0) > 0) continue;
    const mode = rule.matchMode || (rule.exactMessageMatch ? 'exact' : 'whole_word');
    if (mode === 'exact' || mode === 'any') continue;
    if (mode === 'contains' && matchesKeywordList(rule.keywords, normalized, words, 'contains')) {
      return rule;
    }
    if (!rule.wholeWordMatch) {
      for (const kw of rule.keywords) {
        const normKw = normalizeText(kw);
        if (normKw.length >= 4 && normalized.includes(normKw)) {
          return rule;
        }
      }
    }
  }

  // 4. Regras de "Qualquer palavra / qualquer comentário" ('any' — OpenReply matchAnyWord)
  for (const rule of validRules) {
    if (rule.matchMode === 'any') {
      return rule;
    }
  }

  return null;
}

export interface MatchRuleContext {
  channel?: TriggerChannel;
  mediaId?: string;
}

/**
 * Encontra a melhor regra correspondente para a mensagem, resposta de Story ou comentário recebido.
 * Isola estritamente os canais (`comment` vs `story_reply` vs `dm`) e prioriza regras vinculadas ao post/Story específico!
 */
export async function matchRule(
  rawText: string,
  contextOrMediaId?: string | MatchRuleContext
): Promise<AutomationRule | null> {
  const normalized = normalizeText(rawText);
  if (!normalized) return null;

  const context: MatchRuleContext =
    typeof contextOrMediaId === 'string'
      ? { mediaId: contextOrMediaId }
      : contextOrMediaId || {};

  const words = normalized.split(' ');
  const allActive = await getActiveRules();

  // Filtra apenas regras que permitem disparar neste canal específico (Comentário vs Story vs DM)
  const channelRules = allActive.filter((r) => {
    if (!context.channel) return true;
    const channels =
      Array.isArray(r.triggerChannels) && r.triggerChannels.length > 0
        ? r.triggerChannels
        : ['comment', 'story_reply', 'dm'];
    return channels.includes(context.channel);
  });

  // Se for Comentário em Post/Reel:
  if (context.channel === 'comment' || (!context.channel && context.mediaId)) {
    // Prioridade 1: Regras vinculadas especificamente a este post/Reel (`postScope === 'specific'` ou `targetMediaIds`)
    if (context.mediaId) {
      const specificPostRules = channelRules.filter(
        (r) => Array.isArray(r.targetMediaIds) && r.targetMediaIds.includes(context.mediaId!)
      );
      if (specificPostRules.length > 0) {
        const match = findMatchingRuleInSet(specificPostRules, normalized, words);
        if (match) return match;
      }
    }

    // Prioridade 2: Regras que valem para qualquer publicação (`postScope !== 'specific'` e sem `targetMediaIds` restritivos)
    const anyPostRules = channelRules.filter(
      (r) =>
        r.postScope !== 'specific' &&
        (!Array.isArray(r.targetMediaIds) || r.targetMediaIds.length === 0)
    );
    return findMatchingRuleInSet(anyPostRules, normalized, words);
  }

  // Se for Resposta a um Story:
  if (context.channel === 'story_reply') {
    // Prioridade 1: Regras vinculadas especificamente a este Story ativo (`targetStoryIds` ou `targetMediaIds`)
    if (context.mediaId) {
      const specificStoryRules = channelRules.filter(
        (r) =>
          (Array.isArray(r.targetStoryIds) && r.targetStoryIds.includes(context.mediaId!)) ||
          (Array.isArray(r.targetMediaIds) && r.targetMediaIds.includes(context.mediaId!))
      );
      if (specificStoryRules.length > 0) {
        const match = findMatchingRuleInSet(specificStoryRules, normalized, words);
        if (match) return match;
      }
    }

    // Prioridade 2: Regras para qualquer Story (`storyScope !== 'specific'`)
    const anyStoryRules = channelRules.filter(
      (r) =>
        r.storyScope !== 'specific' &&
        (!Array.isArray(r.targetStoryIds) || r.targetStoryIds.length === 0)
    );
    return findMatchingRuleInSet(anyStoryRules, normalized, words);
  }

  // Se for Mensagem Direta na DM (sem vir de comentário nem de Story):
  const dmRules = channelRules.filter(
    (r) =>
      r.postScope !== 'specific' &&
      (!Array.isArray(r.targetMediaIds) || r.targetMediaIds.length === 0)
  );
  return findMatchingRuleInSet(dmRules, normalized, words);
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
      ? rule.publicReplyVariations.filter((v) => v && v.trim().length > 0)
      : DEFAULT_PUBLIC_REPLY_VARIATIONS;

  const list = variations.length > 0 ? variations : DEFAULT_PUBLIC_REPLY_VARIATIONS;
  const chosen = list[Math.floor(Math.random() * list.length)];
  if (commenterUsername && !chosen.includes('@')) {
    return `@${commenterUsername.replace(/^@/, '')} ${chosen}`;
  }
  return chosen;
}
