import { InstagramLinkButton, InstagramSendMessagePayload } from './types';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const GRAPH_VERSION = 'v21.0';

// Token definitivo SYSTEM_USER do Business Manager (expires_at: 0, nunca expira, 15 escopos completos)
export const PERMANENT_SYSTEM_USER_TOKEN =
  'EAANBJivoFVkBS8wiSJcopuEOq3yZAGL1Rs1WoZB6T1eAwMghjvD1nNz31nUZAUR6ikG35ZCFKaKtk1onYVrOfKzc7ot7MGE6zIyElU2n1nvmXNvZBUejyqUZBYR2wPnZA1IHsaUhdy911mt0lOtEhsIhGNl5CEEqWWPceG7y3mze2d2qhGZBKlkqPkJtXiNE8AZDZD';

export const DEFAULT_IG_USER_ID = '17841449325469220';
export const DEFAULT_PAGE_ID = '107217145361448';

// Cache em memória para deduplicação instantânea (0ms)
const inMemoryProcessedMids = new Set<string>();

/**
 * Obtém o token de acesso da Meta/Instagram priorizando o token permanente SYSTEM_USER com 15 escopos.
 */
export function getInstagramAccessToken(): string {
  const envToken =
    process.env.IG_SYSTEM_USER_TOKEN_PERMANENTE ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.IG_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN;

  // Se a variável de ambiente contiver tokens antigos ou sem escopo de DM, força o token permanente atualizado
  if (
    !envToken ||
    envToken.includes('BS3Dj7FoGFHa6yOMdMiz') ||
    envToken.includes('BSmZC6jl6kbCuLc2A3R3')
  ) {
    return PERMANENT_SYSTEM_USER_TOKEN;
  }

  return envToken;
}

/**
 * Verifica se a mensagem ou comentário já foi processado recentemente (deduplicação via memória e Redis).
 */
export async function isMessageAlreadyProcessed(mid: string): Promise<boolean> {
  if (!mid) return false;

  if (inMemoryProcessedMids.has(mid)) {
    return true;
  }

  if (UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('unique-ladybird-238762')) {
    try {
      const res = await fetch(UPSTASH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', `konverops:ig:mid:${mid}`]),
        cache: 'no-store',
        signal: AbortSignal.timeout(1000),
      });
      const json = await res.json();
      if (json.result !== null && json.result !== undefined) {
        inMemoryProcessedMids.add(mid);
        return true;
      }
    } catch (err) {
      console.warn('Erro ao verificar deduplicação no Redis:', err);
    }
  }

  return false;
}

/**
 * Marca a mensagem ou comentário como processado por 72 horas no Redis e em memória (padrão OpenReply).
 */
export async function markMessageAsProcessed(mid: string): Promise<void> {
  if (!mid) return;

  inMemoryProcessedMids.add(mid);
  if (inMemoryProcessedMids.size > 4000) {
    const firstKey = inMemoryProcessedMids.values().next().value;
    if (firstKey) inMemoryProcessedMids.delete(firstKey);
  }

  if (UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('unique-ladybird-238762')) {
    try {
      await fetch(UPSTASH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', `konverops:ig:mid:${mid}`, '1', 'EX', 259200]), // 72h
        cache: 'no-store',
        signal: AbortSignal.timeout(1000),
      });
    } catch (err) {
      console.warn('Erro ao marcar mid no Redis:', err);
    }
  }
}

/**
 * Registra métricas e logs de interação no Redis (sincronizado com o Dashboard do Flow Studio).
 */
export async function trackInstagramInteraction(data: {
  senderId: string;
  senderUsername?: string;
  keywordMatched?: string;
  ruleId?: string;
  isStoryReply?: boolean;
  isCommentReply?: boolean;
  publicReplySent?: boolean;
  status?: 'SENT' | 'FAILED';
  errorMessage?: string;
}): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN || UPSTASH_URL.includes('unique-ladybird-238762')) {
    return;
  }

  try {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const commands: (string | number)[][] = [
      ['INCR', `konverops:ig:metrics:${today}:total`],
      ['INCR', `konverops:ig:metrics:all_time:total`],
    ];

    if (data.isStoryReply) {
      commands.push(['INCR', `konverops:ig:metrics:${today}:story_replies`]);
    }
    if (data.isCommentReply) {
      commands.push(['INCR', `konverops:ig:metrics:${today}:comment_replies`]);
    }

    if (data.keywordMatched) {
      commands.push(['INCR', `konverops:ig:metrics:${today}:kw:${data.keywordMatched}`]);
      commands.push(['ZINCRBY', `konverops:ig:ranking:keywords`, '1', data.keywordMatched]);
    }

    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      senderId: data.senderId,
      senderUsername: data.senderUsername || null,
      keyword: data.keywordMatched || 'unmatched',
      ruleId: data.ruleId || null,
      isStoryReply: Boolean(data.isStoryReply),
      isCommentReply: Boolean(data.isCommentReply),
      publicReplySent: Boolean(data.publicReplySent),
      status: data.status || 'SENT',
      error: data.errorMessage || null,
    });

    // Salva nas duas chaves para compatibilidade total com qualquer rota do painel
    commands.push(['LPUSH', 'konverops:ig:logs:recent', logEntry]);
    commands.push(['LTRIM', 'konverops:ig:logs:recent', '0', '99']);
    commands.push(['LPUSH', 'konverops:ig:recent_logs', logEntry]);
    commands.push(['LTRIM', 'konverops:ig:recent_logs', '0', '99']);

    await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
  } catch (err) {
    console.warn('Erro ao salvar métricas no Redis:', err);
  }
}

/**
 * Constrói o payload de mensagem com Botão Clicável Nativo (padrão OpenReply) ou Texto Puro.
 */
function buildMessagePayload(
  recipient: { id?: string; comment_id?: string },
  text: string,
  buttons?: InstagramLinkButton[]
): InstagramSendMessagePayload {
  const validButtons = (buttons || []).filter((b) => b.url && b.title);

  if (validButtons.length > 0) {
    return {
      recipient,
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            // Meta limita texto de Button Template a 640 caracteres
            text: text.slice(0, 640),
            buttons: validButtons.slice(0, 3).map((b) => ({
              type: 'web_url',
              title: b.title.slice(0, 20),
              url: b.url,
            })),
          },
        },
      },
    };
  }

  return {
    recipient,
    message: { text },
  };
}

/**
 * Constrói o texto de fallback completo (incluindo o link no corpo) caso a Meta rejeite o Button Template (código 100).
 */
function buildPlainTextFallback(text: string, buttons?: InstagramLinkButton[]): string {
  const validButtons = (buttons || []).filter((b) => b.url);
  if (validButtons.length === 0) return text;

  const missingUrls = validButtons.filter((b) => !text.includes(b.url));
  if (missingUrls.length === 0) return text;

  const linksBlock = missingUrls.map((b) => `👉 ${b.title}: ${b.url}`).join('\n');
  return `${text}\n\n${linksBlock}`;
}

/**
 * Dispara um payload de mensagem tentando os endpoints da Graph API em cascata (IG Node -> Page Node -> /me).
 * Resolve a Trap #10 documentada no ChatbotX onde tokens de Business Manager exigem /{pageId}/messages para Private Reply.
 */
async function dispatchGraphMessage(
  payload: InstagramSendMessagePayload
): Promise<{ success: boolean; messageId?: string; error?: string; code?: number }> {
  const token = getInstagramAccessToken();
  const igUserId =
    process.env.INSTAGRAM_USER_ID || process.env.IG_USER_ID || DEFAULT_IG_USER_ID;
  const pageId = process.env.FB_PAGE_ID || DEFAULT_PAGE_ID;

  // Para comment_id (Private Reply), priorizamos /{pageId}/messages e /{igUserId}/messages
  const endpoints = payload.recipient.comment_id
    ? [
        `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages`,
        `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/messages`,
        `https://graph.facebook.com/${GRAPH_VERSION}/me/messages`,
      ]
    : [
        `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/messages`,
        `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages`,
        `https://graph.facebook.com/${GRAPH_VERSION}/me/messages`,
      ];

  let lastError = '';
  let lastCode: number | undefined;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && !json.error) {
        return {
          success: true,
          messageId: json.message_id || json.recipient_id,
        };
      }

      lastCode = json.error?.code;
      lastError = json.error ? JSON.stringify(json.error) : `Status ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Erro de rede na Graph API';
    }
  }

  return { success: false, error: lastError, code: lastCode };
}

/**
 * Envia uma mensagem direta (DM) no Instagram com suporte a Botões Clicáveis Nativos (OpenReply) + Fallback Automático.
 */
export async function sendDirectMessage(
  recipientId: string,
  text: string,
  options?: {
    linkUrl?: string;
    buttonTitle?: string;
    buttons?: InstagramLinkButton[];
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const buttons: InstagramLinkButton[] = options?.buttons ? [...options.buttons] : [];
  if (options?.linkUrl && buttons.length === 0) {
    buttons.push({
      title: options.buttonTitle || 'Acessar Material',
      url: options.linkUrl,
    });
  }

  // 1. Tenta enviar com Botão Clicável Nativo (Template Button) se houver link
  if (buttons.length > 0) {
    const buttonPayload = buildMessagePayload({ id: recipientId }, text, buttons);
    const buttonResult = await dispatchGraphMessage(buttonPayload);
    if (buttonResult.success) {
      console.log(
        `[OpenReply Engine] DM com botão enviada para ${recipientId}! ID:`,
        buttonResult.messageId
      );
      return buttonResult;
    }
    console.warn(
      `[OpenReply Engine] Template de botão recusado para ${recipientId} (${buttonResult.error}). Acionando fallback em texto...`
    );
  }

  // 2. Fallback seguro em texto puro garantindo que o link vá no corpo da mensagem
  const plainText = buildPlainTextFallback(text, buttons);
  const textPayload = buildMessagePayload({ id: recipientId }, plainText);
  const textResult = await dispatchGraphMessage(textPayload);

  if (textResult.success) {
    console.log(
      `[OpenReply Engine] DM em texto enviada para ${recipientId}! ID:`,
      textResult.messageId
    );
  } else {
    console.error(
      `[OpenReply Engine] Falha ao enviar DM para ${recipientId}:`,
      textResult.error
    );
  }

  return textResult;
}

/**
 * Envia uma Resposta Privada no Direct (Private Reply) ancorada a um comentário do Feed/Reels (OpenReply + ChatbotX Trap #10).
 */
export async function sendPrivateReplyToComment(
  commentId: string,
  text: string,
  options?: {
    linkUrl?: string;
    buttonTitle?: string;
    buttons?: InstagramLinkButton[];
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const buttons: InstagramLinkButton[] = options?.buttons ? [...options.buttons] : [];
  if (options?.linkUrl && buttons.length === 0) {
    buttons.push({
      title: options.buttonTitle || 'Acessar Material',
      url: options.linkUrl,
    });
  }

  // 1. Tenta enviar Private Reply com Botão Clicável Nativo
  if (buttons.length > 0) {
    const buttonPayload = buildMessagePayload({ comment_id: commentId }, text, buttons);
    const buttonResult = await dispatchGraphMessage(buttonPayload);
    if (buttonResult.success) {
      console.log(
        `[OpenReply Engine] Private Reply com botão enviada para comentário ${commentId}! ID:`,
        buttonResult.messageId
      );
      return buttonResult;
    }
    console.warn(
      `[OpenReply Engine] Private Reply com botão recusada para comentário ${commentId} (${buttonResult.error}). Usando fallback em texto...`
    );
  }

  // 2. Fallback em texto puro com o link incluso
  const plainText = buildPlainTextFallback(text, buttons);
  const textPayload = buildMessagePayload({ comment_id: commentId }, plainText);
  const textResult = await dispatchGraphMessage(textPayload);

  if (textResult.success) {
    console.log(
      `[OpenReply Engine] Private Reply em texto enviada para comentário ${commentId}! ID:`,
      textResult.messageId
    );
  } else {
    console.error(
      `[OpenReply Engine] Falha ao enviar Private Reply para comentário ${commentId}:`,
      textResult.error
    );
  }

  return textResult;
}

/**
 * Publica uma resposta pública embaixo do comentário no post/Reel (ex: "@usuario Acabei de te enviar no Direct! 💙").
 * Função trazida do OpenReply (lib/meta/client.ts -> replyToComment).
 */
export async function sendPublicReplyToComment(
  commentId: string,
  message: string
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const token = getInstagramAccessToken();
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${commentId}/replies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      }
    );

    const json = await res.json();
    if (!res.ok || json.error) {
      const errorMsg = json.error ? JSON.stringify(json.error) : `Status ${res.status}`;
      console.warn(
        `[OpenReply Engine] Falha ao postar resposta pública no comentário ${commentId}:`,
        errorMsg
      );
      return { success: false, error: errorMsg };
    }

    console.log(
      `[OpenReply Engine] Resposta pública publicada no comentário ${commentId}! ID:`,
      json.id
    );
    return { success: true, replyId: json.id };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : 'Erro ao postar resposta pública no comentário.';
    return { success: false, error: errorMsg };
  }
}
