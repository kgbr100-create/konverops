import { NextRequest, NextResponse } from 'next/server';
import {
  InstagramWebhookEvent,
  InstagramMessagingItem,
  InstagramChangeItem,
} from '@/lib/instagram/types';
import { matchRule } from '@/lib/instagram/rules';
import {
  isMessageAlreadyProcessed,
  markMessageAsProcessed,
  sendDirectMessage,
  sendPrivateReplyToComment,
  trackInstagramInteraction,
} from '@/lib/instagram/messenger';

const DEFAULT_VERIFY_TOKEN = 'konverops_ig_secret_2026';

/**
 * Validação de Webhook da Meta (Desafio GET de Inscrição)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken =
    process.env.INSTAGRAM_VERIFY_TOKEN ||
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    DEFAULT_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Meta Webhook] Inscrição verificada com sucesso!');
    return new Response(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[Meta Webhook] Tentativa de validação falhou. Token inválido.');
  return new NextResponse('Verificação falhou: Token inválido.', { status: 403 });
}

/**
 * Processamento de Eventos em Tempo Real (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body: InstagramWebhookEvent;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
    }

    if (body.object !== 'instagram') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Processa os eventos recebidos
    const entries = body.entry || [];

    for (const entry of entries) {
      // 1. Mensagens Diretas (DMs) e Respostas a Stories
      if (Array.isArray(entry.messaging)) {
        for (const item of entry.messaging as InstagramMessagingItem[]) {
          await handleMessagingItem(item);
        }
      }

      // 2. Comentários em Publicações do Feed / Reels
      if (Array.isArray(entry.changes)) {
        for (const change of entry.changes as InstagramChangeItem[]) {
          await handleCommentChange(change);
        }
      }
    }

    // Meta exige resposta 200 OK rápida
    return NextResponse.json({ success: true, processed: true }, { status: 200 });
  } catch (error) {
    console.error('[Meta Webhook] Erro ao processar evento:', error);
    // Retorna 200 para a Meta evitar desativação do webhook em caso de falha transitória
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 200 });
  }
}

/**
 * Trata mensagens diretas e respostas a stories
 */
async function handleMessagingItem(item: InstagramMessagingItem): Promise<void> {
  const msg = item.message;
  if (!msg) return;

  // Ignora mensagens enviadas pela própria página/conta (echoes)
  if (msg.is_echo) return;

  const mid = msg.mid;
  const senderId = item.sender.id;

  // Deduplicação via Redis para evitar respostas duplicadas
  if (await isMessageAlreadyProcessed(mid)) {
    return;
  }
  await markMessageAsProcessed(mid);

  const text = msg.text || msg.quick_reply?.payload || '';
  const isStoryReply = Boolean(msg.reply_to?.story);

  // Procura uma regra com base nas palavras-chave
  const rule = await matchRule(text);

  if (rule) {
    const res = await sendDirectMessage(senderId, rule.replyText);
    if (res.success) {
      await trackInstagramInteraction({
        senderId,
        keywordMatched: rule.name,
        ruleId: rule.id,
        isStoryReply,
      });
    }
  } else if (isStoryReply) {
    // Se respondeu a um Story mas não usou a palavra exata, acolhe com mensagem de direcionamento
    const fallbackText =
      'Olá! Vimos que você respondeu ao nosso Story. 💙\n\nSe você estava buscando o material ou link do post, é só me responder aqui com a palavra "LINK" que eu te envio imediatamente!';
    await sendDirectMessage(senderId, fallbackText);
    await trackInstagramInteraction({
      senderId,
      keywordMatched: 'fallback_story_reply',
      isStoryReply: true,
    });
  }
}

/**
 * Trata comentários em publicações do Feed/Reels com palavras-chave (ex: "QUERO", "LINK")
 */
async function handleCommentChange(change: InstagramChangeItem): Promise<void> {
  if (change.field !== 'comments') return;
  const val = change.value;
  if (!val || val.item !== 'comment' || !val.comment_id || !val.text) return;

  const commentId = val.comment_id;
  const commentText = val.text;

  // Deduplicação do comentário
  if (await isMessageAlreadyProcessed(commentId)) {
    return;
  }
  await markMessageAsProcessed(commentId);

  // Verifica se o comentário aciona alguma regra de palavra-chave
  const rule = await matchRule(commentText);

  if (rule) {
    // Envia resposta privada no Direct do seguidor que comentou
    const res = await sendPrivateReplyToComment(commentId, rule.replyText);
    if (res.success) {
      await trackInstagramInteraction({
        senderId: val.from?.id || 'commenter',
        keywordMatched: `comment_${rule.name}`,
        ruleId: rule.id,
      });
    }
  }
}
