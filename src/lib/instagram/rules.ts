import { AutomationRule } from './types';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_RULES_KEY = 'konverops:instagram:rules';

/** Regras padrão pré-configuradas para o ecossistema Kit Autismo / Konverops */
export const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'regra-saudacao',
    name: 'Saudação / Início',
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
    replyText: `Olá! Seja muito bem-vindo(a) ao Kit Autismo. 💙\n\nNossa automação oficial está 100% ativa para te apoiar:\n\n👉 Responda "LINK" para receber o material completo e atividades adaptadas;\n👉 Responda "DIREITOS" para o guia de cobertura de planos e SUS;\n👉 Responda "ALIMENTACAO" para estratégias de seletividade alimentar;\n👉 Responda "ROTINA" para os quadros visuais de previsibilidade;\n\nSe você tiver uma dúvida específica, pode escrever aqui que nossa equipe acolherá com carinho!`,
    linkUrl: 'https://kitautismo.com',
    active: true,
  },
  {
    id: 'regra-link-geral',
    name: 'Link Geral / Materiais',
    keywords: ['link', 'guia', 'material', 'materiais', 'ebook', 'quero', 'acessar'],
    replyText: `Olá! Que bom ter você por aqui. 💙\n\nAqui está o link direto para acessar o nosso material completo e exclusivo:\n\n👉 https://kitautismo.com\n\nQualquer dúvida que você tiver sobre os materiais ou rotinas, é só me chamar por aqui!`,
    linkUrl: 'https://kitautismo.com',
    active: true,
  },
  {
    id: 'regra-direitos',
    name: 'Direitos & Planos de Saúde (ANS)',
    keywords: ['direito', 'direitos', 'ans', 'plano', 'justica', 'lei', 'laudo', 'liminar'],
    replyText: `Olá! Sabemos o quanto a luta pelos direitos terapêuticos é desgastante para as famílias atípicas.\n\nPreparamos um guia com orientações claras sobre cobertura de planos e SUS, baseado nas decisões mais recentes da Justiça:\n\n👉 https://kitautismo.com/direitos\n\nNenhuma criança autista deve ter seu desenvolvimento interrompido por burocracia. Estamos juntos!`,
    linkUrl: 'https://kitautismo.com/direitos',
    active: true,
  },
  {
    id: 'regra-seletividade',
    name: 'Seletividade Alimentar',
    keywords: ['comida', 'alimentacao', 'seletividade', 'cardapio', 'mastigacao', 'textura'],
    replyText: `Olá! A seletividade alimentar no autismo não é "paladar chato" — envolve integração sensorial, tônus muscular e muita sensibilidade.\n\nSeparamos estratégias práticas e um modelo de cardápio com transição suave para você aplicar em casa:\n\n👉 https://kitautismo.com/alimentacao\n\nEspero de coração que ajude o dia a dia da sua família!`,
    linkUrl: 'https://kitautismo.com/alimentacao',
    active: true,
  },
  {
    id: 'regra-rotina',
    name: 'Rotinas & AuDHD (Autismo + TDAH)',
    keywords: ['rotina', 'audhd', 'tdah', 'previsibilidade', 'crise', 'quadro'],
    replyText: `Olá! Conciliar a busca por novidade com a necessidade de previsibilidade é um dos maiores desafios do dia a dia.\n\nAqui está o modelo prático de quadro de rotina visual para imprimir e organizar a semana sem sobrecarga:\n\n👉 https://kitautismo.com/rotina\n\nConta com a gente!`,
    linkUrl: 'https://kitautismo.com/rotina',
    active: true,
  },
  {
    id: 'regra-suporte',
    name: 'Acolhimento & Suporte',
    keywords: ['ajuda', 'duvida', 'contato', 'falar', 'humano', 'conversa'],
    replyText: `Olá! Acolhemos a sua mensagem com muito carinho. 💙\n\nNossa equipe acompanha cada conversa. Pode deixar a sua dúvida ou mensagem detalhada aqui que responderemos assim que possível.\n\nSe você busca nossos materiais e guias, acesse: https://kitautismo.com`,
    linkUrl: 'https://kitautismo.com',
    active: true,
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
 * Carrega as regras ativas (do Redis se disponível e configurado, ou fallback padrão instantâneo).
 */
export async function getActiveRules(): Promise<AutomationRule[]> {
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
        signal: AbortSignal.timeout(1000),
      });
      const json = await res.json();
      if (json && json.result) {
        const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((r) => r.active);
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar regras do Redis, usando regras padrão:', err);
    }
  }
  return DEFAULT_RULES.filter((r) => r.active);
}

/**
 * Encontra a melhor regra correspondente para a mensagem recebida.
 */
export async function matchRule(rawText: string): Promise<AutomationRule | null> {
  const normalized = normalizeText(rawText);
  if (!normalized) return null;

  const words = normalized.split(' ');
  const rules = await getActiveRules();

  // 1. Busca correspondência exata de palavra-chave
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw);
      if (words.includes(normKw) || normalized === normKw) {
        return rule;
      }
    }
  }

  // 2. Busca substring se palavra tiver pelo menos 3 caracteres (ex: 'oi', 'link', 'rotina')
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw);
      if (normKw.length >= 3 && normalized.includes(normKw)) {
        return rule;
      }
    }
  }

  return null;
}
