import { InstagramSendMessagePayload } from './types';

const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL || 'https://unique-ladybird-238762.upstash.io';
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  'gQAAAAAAA6SqAQIgcDJhNWRkZTM5N2E1ODQ0NTIxYmM4YjA0ZjgzNDU3NTc2YQ';

const GRAPH_VERSION = 'v21.0';

const DEFAULT_ACCESS_TOKEN =
  'EAANBJivoFVkBSmZC6jl6kbCuLc2A3R3SexqcCORViedC8wy3zf9UJaZA64oYKecjj10sZAE9W8FwDRuy5M3XfvF99x812BCUTldGtGmW8RnBgkfZCcbl3eqfJJ0b9UBe4waqk8LtKZCfKPtXYk6jD0ZCNUn5hOkK7DNc5ykCtOdcYVpSrPUz4LqB91RODcrwZDZD';

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
 * Verifica se a mensagem já foi processada recentemente (deduplicação via Redis).
 */
export async function isMessageAlreadyProcessed(mid: string): Promise<boolean> {
  if (!mid) return false;
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['GET', `konverops:ig:mid:${mid}`]),
      cache: 'no-store',
    });
    const json = await res.json();
    return json.result !== null;
  } catch (err) {
    console.warn('Erro ao verificar deduplicação no Redis:', err);
    return false;
  }
}

/**
 * Marca a mensagem como processada por 48 horas no Redis.
 */
export async function markMessageAsProcessed(mid: string): Promise<void> {
  if (!mid) return;
  try {
    await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', `konverops:ig:mid:${mid}`, '1', 'EX', 172800]), // 48h
      cache: 'no-store',
    });
  } catch (err) {
    console.warn('Erro ao marcar mid no Redis:', err);
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
    }

    // Registra evento no histórico recente (mantém últimos 100)
    const logItem = JSON.stringify({
      timestamp: Date.now(),
      senderId: data.senderId,
      ruleId: data.ruleId,
      keywordMatched: data.keywordMatched,
      isStoryReply: !!data.isStoryReply,
    });
    commands.push(['LPUSH', 'konverops:ig:logs:recent', logItem]);
    commands.push(['LTRIM', 'konverops:ig:logs:recent', 0, 99]);

    await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      cache: 'no-store',
    });
  } catch (err) {
    console.warn('Erro ao registrar métricas de automação no Redis:', err);
  }
}

/**
 * Envia uma mensagem direta (DM) no Instagram para o destinatário especificado.
 */
export async function sendDirectMessage(
  recipientId: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const token = getInstagramAccessToken();
    const payload: InstagramSendMessagePayload = {
      recipient: { id: recipientId },
      message: { text },
    };

    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || json.error) {
      const errorMsg = json.error ? JSON.stringify(json.error) : `Status ${res.status}`;
      console.error(`Falha ao enviar DM para ${recipientId}:`, errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true, messageId: json.message_id || json.recipient_id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido ao enviar DM.';
    console.error(`Erro ao despachar DM para ${recipientId}:`, errorMsg);
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
    const payload = {
      recipient: { comment_id: commentId },
      message: { text },
    };

    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || json.error) {
      const errorMsg = json.error ? JSON.stringify(json.error) : `Status ${res.status}`;
      console.error(`Falha ao enviar resposta de comentário para ${commentId}:`, errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true, messageId: json.message_id || json.recipient_id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao responder comentário.';
    return { success: false, error: errorMsg };
  }
}
