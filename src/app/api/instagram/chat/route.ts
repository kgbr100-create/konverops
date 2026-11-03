import { NextRequest, NextResponse } from 'next/server';
import { getAllRules, getRuleById } from '@/lib/instagram/rules';
import {
  appendConversationMessage,
  getStoredConversations,
  markConversationRead,
  syncLiveConversationsFromInstagram,
} from '@/lib/instagram/chat-store';
import {
  extractRuleButtons,
  personalizeMessageText,
  sendDirectMessage,
  sendPrivateReplyToComment,
  sendPublicReplyToComment,
  trackInstagramInteraction,
} from '@/lib/instagram/messenger';
import { verifySessionToken } from '@/lib/auth';

const ADMIN_SECRET =
  process.env.ADMIN_SECRET || 'konverops-admin-auth-secret-key-2026-kelvin';

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token === ADMIN_SECRET) return true;

  const sessionCookie = request.cookies.get('konverops_admin_session')?.value;
  if (sessionCookie) {
    const session = await verifySessionToken(sessionCookie);
    if (session.valid) return true;
  }
  return false;
}

export async function GET() {
  try {
    const rules = await getAllRules();
    const conversations = await syncLiveConversationsFromInstagram(rules);

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao carregar conversas.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, conversationId, ruleId, text, sendAsPublicComment } = body;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId é obrigatório.' },
        { status: 400 }
      );
    }

    if (action === 'mark_read') {
      const updated = markConversationRead(conversationId);
      return NextResponse.json({
        success: true,
        conversation: updated,
      });
    }

    const conversations = getStoredConversations();
    const conv = conversations.find(
      (c) =>
        c.id.toLowerCase() === String(conversationId).toLowerCase() ||
        c.username.toLowerCase() === String(conversationId).toLowerCase()
    );

    if (!conv) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada.' },
        { status: 404 }
      );
    }

    const profileStub = {
      id: conv.igUserId || conv.id,
      username: conv.username,
      name: conv.name,
      firstName: conv.name ? conv.name.split(/\s+/)[0] : conv.username,
    };

    // Ação 1: Disparar um Fluxo Cadastrado Manualmente para esta pessoa
    if (action === 'dispatch_flow') {
      if (!ruleId) {
        return NextResponse.json(
          { success: false, error: 'ruleId é obrigatório para disparar fluxo.' },
          { status: 400 }
        );
      }

      const rule = await getRuleById(ruleId);
      if (!rule) {
        return NextResponse.json(
          { success: false, error: 'Fluxo não encontrado.' },
          { status: 404 }
        );
      }

      const finalReplyText = personalizeMessageText(rule.replyText, profileStub);
      const buttons = extractRuleButtons(rule);

      let deliveryRes: {
        success: boolean;
        messageId?: string;
        recipientId?: string;
        error?: string;
      } = { success: false };

      if (conv.igUserId) {
        deliveryRes = await sendDirectMessage(conv.igUserId, finalReplyText, {
          buttons,
          linkUrl: rule.linkUrl,
          buttonTitle: rule.buttonTitle,
        });
      } else if (conv.commentId) {
        deliveryRes = await sendPrivateReplyToComment(conv.commentId, finalReplyText, {
          buttons,
          linkUrl: rule.linkUrl,
          buttonTitle: rule.buttonTitle,
        });
        if (deliveryRes.recipientId) {
          conv.igUserId = deliveryRes.recipientId;
        }
      }

      const updatedConv = appendConversationMessage({
        userKey: conv.username,
        igUserId: conv.igUserId || deliveryRes.recipientId,
        commentId: conv.commentId,
        username: conv.username,
        name: conv.name,
        sender: 'bot',
        text: finalReplyText,
        buttons,
        ruleId: rule.id,
        ruleName: `⚡ Disparo Manual: ${rule.name}`,
        channel: 'manual',
        status: deliveryRes.success ? 'delivered' : 'sent',
      });

      let finalConv = updatedConv;

      if (rule.followUpEnabled && rule.followUpText?.trim()) {
        const followUpMsg = personalizeMessageText(rule.followUpText.trim(), profileStub);
        const targetId = conv.igUserId || deliveryRes.recipientId;
        if (targetId) {
          await sendDirectMessage(targetId, followUpMsg);
        }
        finalConv = appendConversationMessage({
          userKey: conv.username,
          igUserId: targetId,
          commentId: conv.commentId,
          username: conv.username,
          name: conv.name,
          sender: 'bot',
          text: followUpMsg,
          ruleId: rule.id,
          ruleName: `⚡ Disparo Manual: ${rule.name} (Parte 2)`,
          channel: 'manual',
          status: deliveryRes.success ? 'delivered' : 'sent',
        });
      }

      await trackInstagramInteraction({
        senderId: conv.igUserId || conv.username,
        senderUsername: conv.username,
        keywordMatched: `manual_dispatch_${rule.name}`,
        ruleId: rule.id,
        status: 'SENT',
      });

      return NextResponse.json({
        success: true,
        conversation: finalConv,
        apiDelivered: deliveryRes.success,
        conversations: getStoredConversations(),
      });
    }

    // Ação 2: Enviar Mensagem de Texto Manual (Atendimento Humano ao Vivo)
    if (action === 'send_message') {
      if (!text || !String(text).trim()) {
        return NextResponse.json(
          { success: false, error: 'Digite uma mensagem para enviar.' },
          { status: 400 }
        );
      }

      const cleanText = String(text).trim();
      let deliveryRes: {
        success: boolean;
        messageId?: string;
        recipientId?: string;
        error?: string;
      } = { success: false };

      if (sendAsPublicComment && conv.commentId) {
        const pubText = cleanText.startsWith(`@${conv.username}`)
          ? cleanText
          : `@${conv.username} ${cleanText}`;
        const pubRes = await sendPublicReplyToComment(conv.commentId, pubText);
        deliveryRes = { success: pubRes.success, error: pubRes.error };
      } else if (conv.igUserId) {
        deliveryRes = await sendDirectMessage(conv.igUserId, cleanText);
      } else if (conv.commentId) {
        deliveryRes = await sendPrivateReplyToComment(conv.commentId, cleanText);
        if (deliveryRes.recipientId) {
          conv.igUserId = deliveryRes.recipientId;
        }
        // Se a Private Reply já tiver sido usada antes e o seguidor ainda não clicou no botão, responde também no comentário
        if (!deliveryRes.success) {
          const pubText = cleanText.startsWith(`@${conv.username}`)
            ? cleanText
            : `@${conv.username} ${cleanText}`;
          const pubRes = await sendPublicReplyToComment(conv.commentId, pubText);
          deliveryRes = { success: pubRes.success, error: pubRes.error };
        }
      }

      const updatedConv = appendConversationMessage({
        userKey: conv.username,
        igUserId: conv.igUserId || deliveryRes.recipientId,
        commentId: conv.commentId,
        username: conv.username,
        name: conv.name,
        sender: 'human',
        text: cleanText,
        channel: 'manual',
        status: deliveryRes.success ? 'delivered' : 'sent',
      });

      return NextResponse.json({
        success: true,
        conversation: updatedConv,
        apiDelivered: deliveryRes.success,
        conversations: getStoredConversations(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida.' },
      { status: 400 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao processar ação no chat.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
