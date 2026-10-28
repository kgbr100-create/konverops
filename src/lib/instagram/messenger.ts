import { InstagramSendMessagePayload } from './types';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const GRAPH_VERSION = 'v21.0';

const DEFAULT_ACCESS_TOKEN =
  'EAANBJivoFVkBS3Dj7FoGFHa6yOMdMizWtcoIp0ZAQFl7Bl5YPoSZCCGwESqOkbuyzlwN1Slmgp0fAZANxMjRZAg77AtwSZB8m9A7szNfLzdxmHcZBqqNYK7eZAf51MjwJDNYXmZAEGy71Iict4Na1f8XA2MyRfQNzCJTvgSnq2Y9zNbXfIpXdOaqZBkETTP83BcNSzMykwI6KiC8yAxlsIN7XP6FrOVfs8Cc1W1bLNQZDZD';

const DEFAULT_IG_USER_ID = '17841449325469220';
const DEFAULT_PAGE_ID = '107217145361448';

// Cache em memória para deduplicação instantânea (0ms)
const inMemoryProcessedMids = new Set<string>();

/**
 * Obtém o token de acesso da Meta/Instagram a partir das variáveis de ambiente.
 */
export function getInstagramAccessToken(): string {
  const token =
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.IG_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    process.env.IG_USER_TOKEN ||
    DEFAULT_ACCESS_TOKEN;

  return token;
}

/**
 * Verifica se a mensagem já foi processada recentemente (deduplicação via memória e Redis).
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
      return json.result !== null;
    } catch (err) {
      console.warn('Erro ao verificar deduplicação no Redis:', err);
    }
  }

  return false;
}

/**
 * Marca a mensagem como processada por 48 horas no Redis e em memória.
 */
export async function markMessageAsProcessed(mid: string): Promise<void> {
  if (!mid) return;

  inMemoryProcessedMids.add(mid);
  if (inMemoryProcessedMids.size > 2000) {
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
        body: JSON.stringify(['SET', `konverops:ig:mid:${mid}`, '1', 'EX', 172800]), // 48h
        cache: 'no-store',
        signal: AbortSignal.timeout(1000),
      });
    } catch (err) {
      console.warn('Erro ao marcar mid no Redis:', err);
    }
  }
}

/**
 * Registra métricas e logs de interação no Redis.
 */
export async function trackInstagramInteraction(data: {
  senderId: string;
  keywordMatched?: string;
  ruleId?: string;
  isStoryReply?: boolean;
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

    if (data.keywordMatched) {
      commands.push(['INCR', `konverops:ig:metrics:${today}:kw:${data.keywordMatched}`]);
      commands.push(['ZINCRBY', `konverops:ig:ranking:keywords`, '1', data.keywordMatched]);
    }

    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      senderId: data.senderId,
      keyword: data.keywordMatched || 'unmatched',
      ruleId: data.ruleId || null,
      isStoryReply: Boolean(data.isStoryReply),
    });

    commands.push(['LPUSH', 'konverops:ig:recent_logs', logEntry]);
    commands.push(['LTRIM', 'konverops:ig:recent_logs', '0', '99']);

    await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      cache: 'no-store',
      signal: AbortSignal.timeout(1000),
    });
  } catch (err) {
    console.warn('Erro ao salvar métricas no Redis:', err);
  }
}

/**
 * Envia uma mensagem direta (DM) no Instagram usando a Graph API oficial.
 */
export async function sendDirectMessage(
  recipientId: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const token = getInstagramAccessToken();
    const igUserId =
      process.env.INSTAGRAM_USER_ID || process.env.IG_USER_ID || DEFAULT_IG_USER_ID;
    const pageId =
      process.env.FB_PAGE_ID || DEFAULT_PAGE_ID;

    const payload: InstagramSendMessagePayload = {
      recipient: { id: recipientId },
      message: { text },
    };

    console.log(`[Instagram Messenger] Enviando DM para ${recipientId}...`);

    // Tentativa 1: Endpoint canônico /{igUserId}/messages
    let res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    let json = await res.json();

    // Tentativa 2: /me/messages
    if (!res.ok || json.error) {
      console.warn(`[Instagram Messenger] /{igUserId}/messages retornou:`, json.error, `- Testando /me/messages...`);
      const fallbackRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const fallbackJson = await fallbackRes.json();
      if (fallbackRes.ok && !fallbackJson.error) {
        res = fallbackRes;
        json = fallbackJson;
      } else {
        // Tentativa 3: /{pageId}/messages
        console.warn(`[Instagram Messenger] /me/messages retornou:`, fallbackJson.error, `- Testando /{pageId}/messages...`);
        const pageRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const pageJson = await pageRes.json();
        if (pageRes.ok && !pageJson.error) {
          res = pageRes;
          json = pageJson;
        }
      }
    }

    if (!res.ok || json.error) {
      const errorMsg = json.error ? JSON.stringify(json.error) : `Status ${res.status}`;
      console.error(`[Instagram Messenger] Falha ao enviar DM para ${recipientId}:`, errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(`[Instagram Messenger] DM enviada com sucesso para ${recipientId}! ID:`, json.message_id || json.recipient_id);
    return { success: true, messageId: json.message_id || json.recipient_id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido ao enviar DM.';
    console.error(`[Instagram Messenger] Erro de rede ao despachar DM para ${recipientId}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Envia uma resposta privada no Direct a partir de um comentário no Feed/Reels.
 */
export async function sendPrivateReplyToComment(
  commentId: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const token = getInstagramAccessToken();
    const igUserId =
      process.env.INSTAGRAM_USER_ID || process.env.IG_USER_ID || DEFAULT_IG_USER_ID;

    const payload = {
      recipient: { comment_id: commentId },
      message: { text },
    };

    let res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    let json = await res.json();

    if (!res.ok || json.error) {
      const fallbackRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const fallbackJson = await fallbackRes.json();
      if (fallbackRes.ok && !fallbackJson.error) {
        res = fallbackRes;
        json = fallbackJson;
      }
    }

    if (!res.ok || json.error) {
      const errorMsg = json.error ? JSON.stringify(json.error) : `Status ${res.status}`;
      console.error(`[Instagram Messenger] Falha ao enviar resposta de comentário para ${commentId}:`, errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true, messageId: json.message_id || json.recipient_id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao responder comentário.';
    return { success: false, error: errorMsg };
  }
}
