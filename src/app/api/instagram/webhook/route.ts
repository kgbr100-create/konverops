import { NextRequest, NextResponse } from 'next/server';
import {
  InstagramWebhookEvent,
  InstagramMessagingItem,
  InstagramChangeItem,
  AutomationRule,
  InstagramUserProfile,
} from '@/lib/instagram/types';
import {
  DEFAULT_FOLLOW_GATE_RETRY_TEXT,
  DEFAULT_FOLLOW_GATE_TEXT,
  DEFAULT_TWO_STEP_PROMPT_TEXT,
  getRuleById,
  matchRule,
  pickPublicReplyVariation,
} from '@/lib/instagram/rules';
import {
  DEFAULT_IG_USER_ID,
  DEFAULT_PAGE_ID,
  extractRuleButtons,
  getInstagramUserProfile,
  isMessageAlreadyProcessed,
  isUserInWelcomeCooldown,
  markMessageAsProcessed,
  personalizeMessageText,
  recordFollowGateAttempt,
  sendDirectMessage,
  sendPrivateReplyToComment,
  sendPublicReplyToComment,
  sendSenderAction,
  setUserWelcomeCooldown,
  simulateHumanTyping,
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
 * Processamento de Eventos em Tempo Real (POST) — Motor OpenReply + ChatbotX v3.0
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
 * Entrega a resposta final de uma regra (com até 3 botões nativos) ou aciona a Trava de Seguidor (Follow-Gate do OpenReply + ChatbotX).
 */
async function deliverRuleOrFollowGate(
  senderId: string,
  rule: AutomationRule,
  profile: InstagramUserProfile | null,
  context: { isStoryReply?: boolean; fromPostback?: string }
): Promise<void> {
  // Verifica Follow-Gate: se a regra exige seguir o perfil e a API confirma que ainda não segue
  if (rule.requireFollow && profile?.isUserFollowBusiness === false) {
    const gateText = personalizeMessageText(
      rule.followGateText || DEFAULT_FOLLOW_GATE_TEXT,
      profile
    );
    const gateBtnTitle = (rule.followGateButtonTitle || '✅ Já segui! Liberar').slice(0, 20);

    const res = await sendDirectMessage(senderId, gateText, {
      buttons: [
        {
          type: 'postback',
          title: gateBtnTitle,
          payload: `FOLLOW_GATE_VERIFY:${rule.id}`,
        },
        {
          type: 'web_url',
          title: '📲 Perfil @kit.autismo',
          url: 'https://www.instagram.com/kit.autismo/',
        },
      ],
    });

    await setUserWelcomeCooldown(senderId);
    await trackInstagramInteraction({
      senderId,
      senderUsername: profile?.username,
      keywordMatched: `follow_gate_${rule.name}`,
      ruleId: rule.id,
      isStoryReply: context.isStoryReply,
      followGateTriggered: true,
      status: res.success ? 'SENT' : 'FAILED',
      errorMessage: res.error,
    });
    return;
  }

  // Entrega a mensagem completa personalizada com até 3 botões nativos
  const finalReplyText = personalizeMessageText(rule.replyText, profile);
  const buttons = extractRuleButtons(rule);

  const res = await sendDirectMessage(senderId, finalReplyText, {
    buttons,
    linkUrl: rule.linkUrl,
    buttonTitle: rule.buttonTitle,
  });

  // Se houver mensagem complementar de Follow-Up configurada (OpenReply followUpEnabled)
  if (res.success && rule.followUpEnabled && rule.followUpText?.trim()) {
    const followUpMsg = personalizeMessageText(rule.followUpText.trim(), profile);
    await sendDirectMessage(senderId, followUpMsg);
  }

  await setUserWelcomeCooldown(senderId);
  await trackInstagramInteraction({
    senderId,
    senderUsername: profile?.username,
    keywordMatched: context.fromPostback || rule.name,
    ruleId: rule.id,
    isStoryReply: context.isStoryReply,
    status: res.success ? 'SENT' : 'FAILED',
    errorMessage: res.error,
  });
}

/**
 * Trata cliques em botões Postback (Follow-Gate, 2-Step Comment Opt-In e botões personalizados).
 */
async function handlePostbackPayload(
  senderId: string,
  payload: string,
  postbackId: string
): Promise<void> {
  if (await isMessageAlreadyProcessed(postbackId)) return;
  await markMessageAsProcessed(postbackId);

  const profile = await getInstagramUserProfile(senderId);

  // 1. Confirmação da Trava de Seguidor (Follow-Gate)
  if (payload.startsWith('FOLLOW_GATE_VERIFY:')) {
    const ruleId = payload.replace('FOLLOW_GATE_VERIFY:', '').trim();
    const rule = await getRuleById(ruleId);
    if (!rule) return;

    if (rule.humanTypingDelay !== false) {
      await simulateHumanTyping(senderId, 750);
    }

    const attempt = recordFollowGateAttempt(senderId, rule.id);
    // Se ainda não seguiu na 1ª tentativa, envia a mensagem configurável de lembrete; na 2ª tentativa ou se já seguiu, libera!
    if (profile?.isUserFollowBusiness === false && attempt <= 1) {
      const retryText = personalizeMessageText(
        rule.followGateRetryText || DEFAULT_FOLLOW_GATE_RETRY_TEXT,
        profile
      );
      const gateBtnTitle = (rule.followGateButtonTitle || '✅ Já segui! Liberar').slice(0, 20);
      await sendDirectMessage(senderId, retryText, {
        buttons: [
          {
            type: 'web_url',
            title: '📲 Abrir @kit.autismo',
            url: 'https://www.instagram.com/kit.autismo/',
          },
          {
            type: 'postback',
            title: gateBtnTitle,
            payload: `FOLLOW_GATE_VERIFY:${rule.id}`,
          },
        ],
      });
      return;
    }

    const unlockedText = personalizeMessageText(
      `Perfeito{nome}! Muito obrigado por seguir o @kit.autismo! 💙✨\n\n${rule.replyText}`,
      profile
    );
    const buttons = extractRuleButtons(rule);
    const res = await sendDirectMessage(senderId, unlockedText, {
      buttons,
      linkUrl: rule.linkUrl,
      buttonTitle: rule.buttonTitle,
    });

    if (res.success && rule.followUpEnabled && rule.followUpText?.trim()) {
      const followUpMsg = personalizeMessageText(rule.followUpText.trim(), profile);
      await sendDirectMessage(senderId, followUpMsg);
    }

    await setUserWelcomeCooldown(senderId);
    await trackInstagramInteraction({
      senderId,
      senderUsername: profile?.username,
      keywordMatched: `unlocked_${rule.name}`,
      ruleId: rule.id,
      status: res.success ? 'SENT' : 'FAILED',
      errorMessage: res.error,
    });
    return;
  }

  // 2. Desbloqueio de 2 Etapas vindo de Comentário (OpenReply 2-Step Opt-In)
  if (payload.startsWith('COMMENT_OPTIN:')) {
    const ruleId = payload.replace('COMMENT_OPTIN:', '').trim();
    const rule = await getRuleById(ruleId);
    if (!rule) return;

    if (rule.humanTypingDelay !== false) {
      await simulateHumanTyping(senderId, 750);
    }

    await deliverRuleOrFollowGate(senderId, rule, profile, {
      fromPostback: `optin_${rule.name}`,
    });
    return;
  }

  // 3. Outros postbacks por palavra-chave
  const rule = await matchRule(payload, { channel: 'dm' });
  if (rule) {
    if (rule.humanTypingDelay !== false) {
      await simulateHumanTyping(senderId, 750);
    }
    await deliverRuleOrFollowGate(senderId, rule, profile, {
      fromPostback: `postback_${rule.name}`,
    });
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
    const postbackId =
      item.postback.mid || `pb_${senderId}_${item.postback.payload}_${item.timestamp || Date.now()}`;
    await handlePostbackPayload(senderId, item.postback.payload, postbackId);
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

  // Se for clique em Quick Reply com payload especial (Follow-Gate ou Comment Opt-In)
  if (
    msg.quick_reply?.payload &&
    (msg.quick_reply.payload.startsWith('FOLLOW_GATE_VERIFY:') ||
      msg.quick_reply.payload.startsWith('COMMENT_OPTIN:'))
  ) {
    await handlePostbackPayload(senderId, msg.quick_reply.payload, `qr_${mid}`);
    return;
  }

  const text = (msg.text || msg.quick_reply?.payload || '').trim();
  const isStoryReply = Boolean(msg.reply_to?.story);
  const storyMediaId = msg.reply_to?.story?.id;

  if (!text) return;

  // Procura uma regra respeitando o canal exato ('story_reply' vs 'dm') e o ID do Story (se houver)
  const [rule, profile] = await Promise.all([
    matchRule(text, {
      channel: isStoryReply ? 'story_reply' : 'dm',
      mediaId: storyMediaId,
    }),
    getInstagramUserProfile(senderId),
  ]);

  if (rule) {
    if (rule.humanTypingDelay !== false) {
      await simulateHumanTyping(senderId, 850);
    }

    await deliverRuleOrFollowGate(senderId, rule, profile, { isStoryReply });
    return;
  }

  // Cooldown Anti-Spam (ChatbotX): se não bateu nenhuma palavra-chave e o usuário já interagiu nas últimas 24h,
  // apenas marca como "Visto" e não interrompe a conversa com menu repetitivo!
  if (await isUserInWelcomeCooldown(senderId)) {
    await sendSenderAction(senderId, 'mark_seen');
    console.log(
      `[ChatbotX Cooldown] Usuário ${senderId} enviou texto livre em conversa ativa. Menu automático silenciado por 24h.`
    );
    return;
  }

  await simulateHumanTyping(senderId, 850);
  await setUserWelcomeCooldown(senderId);

  if (isStoryReply) {
    const fallbackText = personalizeMessageText(
      'Oi{nome}! Que bom receber sua resposta no nosso Story! 💙\n\nSe você quiser receber nossos guias práticos e quadros visuais agora mesmo, responda com "ROTINA" ou toque no botão abaixo:',
      profile
    );
    const res = await sendDirectMessage(senderId, fallbackText, {
      linkUrl: 'https://kitautismo.com',
      buttonTitle: 'Acessar Kit Autismo',
    });
    await trackInstagramInteraction({
      senderId,
      senderUsername: profile?.username,
      keywordMatched: 'fallback_story_reply',
      isStoryReply: true,
      status: res.success ? 'SENT' : 'FAILED',
      errorMessage: res.error,
    });
  } else {
    const defaultReply = personalizeMessageText(
      'Olá! Seja muito bem-vindo(a) ao Kit Autismo. 💙\n\nPara receber nossos materiais imediatamente aqui no Direct, responda com:\n👉 "ROTINA" para quadros visuais e previsibilidade;\n👉 "ALIMENTACAO" para seletividade alimentar;\n👉 "DIREITOS" para planos de saúde e escola;\n\nOu toque no botão abaixo para acessar tudo agora:',
      profile
    );
    const res = await sendDirectMessage(senderId, defaultReply, {
      linkUrl: 'https://kitautismo.com',
      buttonTitle: 'Acessar Kit Autismo',
    });
    await trackInstagramInteraction({
      senderId,
      senderUsername: profile?.username,
      keywordMatched: 'default_welcome',
      isStoryReply: false,
      status: res.success ? 'SENT' : 'FAILED',
      errorMessage: res.error,
    });
  }
}

/**
 * Trata comentários em publicações do Feed/Reels (Padrão OpenReply + ChatbotX: canal isolado 'comment', escopo por post e 2 Etapas customizável)
 */
async function handleCommentChange(
  change: InstagramChangeItem,
  accountId: string
): Promise<void> {
  if (change.field !== 'comments' && change.field !== 'feed') return;
  const val = change.value;
  if (!val) return;

  if (val.item && val.item !== 'comment') return;
  if (val.verb && val.verb !== 'add') return;

  const commentId = val.id || val.comment_id;
  const commentText = (val.text || '').trim();
  const commenterId = val.from?.id;
  const commenterUsername = val.from?.username;
  const mediaId = val.media?.id || val.media_id || val.post_id;

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

  // Verifica se o comentário aciona alguma regra habilitada para o canal 'comment'
  const rule = await matchRule(commentText, { channel: 'comment', mediaId });

  if (rule) {
    const profileStub: InstagramUserProfile | null = commenterUsername
      ? { id: commenterId || 'commenter', username: commenterUsername }
      : null;

    let dmRes: { success: boolean; messageId?: string; error?: string };

    // Se o Fluxo de 2 Etapas (Opening DM) estiver ativo, envia o texto e título de botão configurados na regra!
    if (rule.twoStepCommentOptIn) {
      const optInText = personalizeMessageText(
        rule.twoStepPromptText || DEFAULT_TWO_STEP_PROMPT_TEXT,
        profileStub
      );
      const optInBtnTitle = (rule.twoStepButtonTitle || '🎁 Liberar Material').slice(0, 20);

      dmRes = await sendPrivateReplyToComment(commentId, optInText, {
        buttons: [
          {
            type: 'postback',
            title: optInBtnTitle,
            payload: `COMMENT_OPTIN:${rule.id}`,
          },
          ...(rule.linkUrl
            ? [
                {
                  type: 'web_url' as const,
                  title: (rule.buttonTitle || 'Acessar Direto').slice(0, 20),
                  url: rule.linkUrl,
                },
              ]
            : []),
        ],
        linkUrl: rule.linkUrl,
        buttonTitle: rule.buttonTitle,
      });
    } else {
      const replyText = personalizeMessageText(rule.replyText, profileStub);
      const buttons = extractRuleButtons(rule);
      dmRes = await sendPrivateReplyToComment(commentId, replyText, {
        buttons,
        linkUrl: rule.linkUrl,
        buttonTitle: rule.buttonTitle,
      });
    }

    // Publica Resposta Pública embaixo do comentário no post (OpenReply publicReplyVariations)
    let publicReplySent = false;
    if (rule.publicReplyEnabled !== false) {
      const publicText = pickPublicReplyVariation(rule, commenterUsername);
      const pubRes = await sendPublicReplyToComment(commentId, publicText);
      publicReplySent = pubRes.success;
    }

    if (commenterId) {
      await setUserWelcomeCooldown(commenterId);
    }

    await trackInstagramInteraction({
      senderId: commenterId || 'commenter',
      senderUsername: commenterUsername,
      keywordMatched: `comment_${rule.name}`,
      ruleId: rule.id,
      isCommentReply: true,
      publicReplySent,
      twoStepTriggered: Boolean(rule.twoStepCommentOptIn),
      status: dmRes.success ? 'SENT' : 'FAILED',
      errorMessage: dmRes.error,
    });
  }
}
