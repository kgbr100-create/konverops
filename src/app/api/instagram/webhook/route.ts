import { NextRequest, NextResponse } from 'next/server';
import {
  InstagramWebhookEvent,
  InstagramMessagingItem,
  InstagramChangeItem,
} from '@/lib/instagram/types';
import { matchRule, pickPublicReplyVariation } from '@/lib/instagram/rules';
import {
  DEFAULT_IG_USER_ID,
  DEFAULT_PAGE_ID,
  isMessageAlreadyProcessed,
  markMessageAsProcessed,
  sendDirectMessage,
  sendPrivateReplyToComment,
  sendPublicReplyToComment,
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
 * Processamento de Eventos em Tempo Real (POST) — Motor OpenReply + ChatbotX
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

    console.log('[Meta Webhook Incoming]', JSON.stringify(body));

    if (body.object !== 'instagram' && body.object !== 'page') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      const accountId = entry.id || DEFAULT_IG_USER_ID;

      // 1. Mensagens Diretas (DMs), Respostas a Stories e Postbacks de Botões
      if (Array.isArray(entry.messaging)) {
        for (const item of entry.messaging as InstagramMessagingItem[]) {
          await handleMessagingItem(item, accountId);
        }
      }

      // 2. Comentários em Publicações do Feed / Reels / Anúncios (Formato Instagram + Formato Page)
      if (Array.isArray(entry.changes)) {
        for (const change of entry.changes as InstagramChangeItem[]) {
          await handleCommentChange(change, accountId);
        }
      }
    }

    return NextResponse.json({ success: true, processed: true }, { status: 200 });
  } catch (error) {
    console.error('[Meta Webhook] Erro ao processar evento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 200 });
  }
}

/**
 * Trata mensagens diretas (DMs), respostas a Stories (incluindo enquete A/B/C) e cliques em botões postback.
 */
async function handleMessagingItem(
  item: InstagramMessagingItem,
  accountId: string
): Promise<void> {
  const senderId = item.sender?.id;
  if (!senderId) return;

  // Ignora qualquer evento disparado pela própria conta (@kit.autismo)
  if (
    senderId === accountId ||
    senderId === DEFAULT_IG_USER_ID ||
    senderId === DEFAULT_PAGE_ID
  ) {
    return;
  }

  // Caso 1: Clique em botão postback
  if (item.postback?.payload) {
    const postbackId = item.postback.mid || `pb_${senderId}_${item.timestamp || Date.now()}`;
    if (await isMessageAlreadyProcessed(postbackId)) return;
    await markMessageAsProcessed(postbackId);

    const rule = await matchRule(item.postback.payload);
    if (rule) {
      await sendDirectMessage(senderId, rule.replyText, {
        linkUrl: rule.linkUrl,
        buttonTitle: rule.buttonTitle,
      });
      await trackInstagramInteraction({
        senderId,
        keywordMatched: `postback_${rule.name}`,
        ruleId: rule.id,
      });
    }
    return;
  }

  // Caso 2: Mensagem de texto ou resposta a Story
  const msg = item.message;
  if (!msg) return;

  // Ignora echoes (mensagens enviadas por nós mesmos), exclusões e mensagens sem suporte (padrão OpenReply)
  if (msg.is_echo || msg.is_deleted || msg.is_unsupported) return;

  const mid = msg.mid;
  if (!mid) return;

  if (await isMessageAlreadyProcessed(mid)) {
    return;
  }
  await markMessageAsProcessed(mid);

  const text = (msg.text || msg.quick_reply?.payload || '').trim();
  const isStoryReply = Boolean(msg.reply_to?.story);

  if (!text) return;

  // Procura uma regra com base nas palavras-chave (inclui A, B, C, ROTINA, LINK, DIREITOS, ALIMENTACAO)
  const rule = await matchRule(text);

  if (rule) {
    const res = await sendDirectMessage(senderId, rule.replyText, {
      linkUrl: rule.linkUrl,
      buttonTitle: rule.buttonTitle,
    });
    await trackInstagramInteraction({
      senderId,
      keywordMatched: rule.name,
      ruleId: rule.id,
      isStoryReply,
      status: res.success ? 'SENT' : 'FAILED',
      errorMessage: res.error,
    });
  } else if (isStoryReply) {
    // Se respondeu a um Story com texto livre (ex: emoji ou comentário carinhoso), acolhe e entrega acesso rápido
    const fallbackText =
      'Que bom receber sua resposta no nosso Story! 💙\n\nSe você quiser receber nossos guias práticos e quadros visuais agora mesmo, responda com "ROTINA" ou toque no botão abaixo:';
    const res = await sendDirectMessage(senderId, fallbackText, {
      linkUrl: 'https://kitautismo.com',
      buttonTitle: 'Acessar Kit Autismo',
    });
    await trackInstagramInteraction({
      senderId,
      keywordMatched: 'fallback_story_reply',
      isStoryReply: true,
      status: res.success ? 'SENT' : 'FAILED',
      errorMessage: res.error,
    });
  } else {
    // Resposta padrão acolhedora com botão clicável caso nenhuma palavra-chave específica seja acionada
    const defaultReply =
      'Olá! Seja muito bem-vindo(a) ao Kit Autismo. 💙\n\nPara receber nossos materiais imediatamente aqui no Direct, responda com:\n👉 "ROTINA" para quadros visuais e previsibilidade;\n👉 "ALIMENTACAO" para seletividade alimentar;\n👉 "DIREITOS" para planos de saúde e escola;\n\nOu toque no botão abaixo para acessar tudo agora:';
    const res = await sendDirectMessage(senderId, defaultReply, {
      linkUrl: 'https://kitautismo.com',
      buttonTitle: 'Acessar Kit Autismo',
    });
    await trackInstagramInteraction({
      senderId,
      keywordMatched: 'default_welcome',
      isStoryReply: false,
      status: res.success ? 'SENT' : 'FAILED',
      errorMessage: res.error,
    });
  }
}

/**
 * Trata comentários em publicações do Feed/Reels (Padrão OpenReply: suporta change.value.id e change.value.comment_id)
 */
async function handleCommentChange(
  change: InstagramChangeItem,
  accountId: string
): Promise<void> {
  if (change.field !== 'comments' && change.field !== 'feed') return;
  const val = change.value;
  if (!val) return;

  // Se vier do feed de página, ignora eventos que não sejam adição de comentário
  if (val.item && val.item !== 'comment') return;
  if (val.verb && val.verb !== 'add') return;

  // No webhook oficial do Instagram (object: "instagram"), o ID do comentário vem em `val.id`
  const commentId = val.id || val.comment_id;
  const commentText = (val.text || '').trim();
  const commenterId = val.from?.id;
  const commenterUsername = val.from?.username;

  if (!commentId || !commentText) return;

  // Filtro anti-loop (OpenReply): ignora comentários feitos pelo próprio @kit.autismo
  if (
    commenterId === accountId ||
    commenterId === DEFAULT_IG_USER_ID ||
    commenterId === DEFAULT_PAGE_ID ||
    commenterUsername?.toLowerCase() === 'kit.autismo'
  ) {
    return;
  }

  // Deduplicação atômica do comentário
  if (await isMessageAlreadyProcessed(`comment_${commentId}`)) {
    return;
  }
  await markMessageAsProcessed(`comment_${commentId}`);

  // Verifica se o comentário aciona alguma regra de palavra-chave
  const rule = await matchRule(commentText);

  if (rule) {
    // 1. Envia Resposta Privada no Direct (Private Reply) com botão clicável
    const dmRes = await sendPrivateReplyToComment(commentId, rule.replyText, {
      linkUrl: rule.linkUrl,
      buttonTitle: rule.buttonTitle,
    });

    // 2. Publica Resposta Pública embaixo do comentário no post (OpenReply publicReplyVariations)
    let publicReplySent = false;
    if (rule.publicReplyEnabled !== false) {
      const publicText = pickPublicReplyVariation(rule, commenterUsername);
      const pubRes = await sendPublicReplyToComment(commentId, publicText);
      publicReplySent = pubRes.success;
    }

    await trackInstagramInteraction({
      senderId: commenterId || 'commenter',
      senderUsername: commenterUsername,
      keywordMatched: `comment_${rule.name}`,
      ruleId: rule.id,
      isCommentReply: true,
      publicReplySent,
      status: dmRes.success ? 'SENT' : 'FAILED',
      errorMessage: dmRes.error,
    });
  }
}
