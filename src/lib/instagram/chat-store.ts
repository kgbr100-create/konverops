import fs from 'fs';
import path from 'path';
import {
  AutomationRule,
  ChatMessageItem,
  InstagramConversation,
  InstagramLinkButton,
} from './types';
import {
  DEFAULT_IG_USER_ID,
  personalizeMessageText,
  sendDirectMessage,
} from './messenger';
import { DEFAULT_TWO_STEP_PROMPT_TEXT } from './constants';

const UPSTASH_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;

// Comentários cujos 2º passos já foram entregues (evita reenvio duplicado)
const PRE_DELIVERED_COMMENT_IDS = [
  '18116180747024697', // @marisaoliveira9357
  '18092144012695684', // @neuma.vitoriano
  '18145501138587787', // @okelvingonzaga
];

const g = globalThis as unknown as {
  _konverops_ig_chats_cache?: InstagramConversation[];
  _konverops_last_chat_sync?: number;
  _konverops_twostep_delivered?: Set<string>;
};

if (!g._konverops_twostep_delivered) {
  g._konverops_twostep_delivered = new Set<string>(PRE_DELIVERED_COMMENT_IDS);
}

const CHATS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'instagram-chats.json');
const TMP_CHATS_PATH = path.join('/tmp', 'instagram-chats.json');

const GRAPH_VERSION = 'v21.0';
const PERMANENT_SYSTEM_USER_TOKEN =
  'EAANBJivoFVkBS8wiSJcopuEOq3yZAGL1Rs1WoZB6T1eAwMghjvD1nNz31nUZAUR6ikG35ZCFKaKtk1onYVrOfKzc7ot7MGE6zIyElU2n1nvmXNvZBUejyqUZBYR2wPnZA1IHsaUhdy911mt0lOtEhsIhGNl5CEEqWWPceG7y3mze2d2qhGZBKlkqPkJtXiNE8AZDZD';

function getAccessToken(): string {
  const envToken =
    process.env.IG_SYSTEM_USER_TOKEN_PERMANENTE ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.IG_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN;

  if (
    !envToken ||
    envToken.includes('BS3Dj7FoGFHa6yOMdMiz') ||
    envToken.includes('BSmZC6jl6kbCuLc2A3R3')
  ) {
    return PERMANENT_SYSTEM_USER_TOKEN;
  }
  return envToken;
}

function readJsonSafe(filePath: string): InstagramConversation[] {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function mergeConversationLists(
  primary: InstagramConversation[],
  secondary: InstagramConversation[]
): InstagramConversation[] {
  const map = new Map<string, InstagramConversation>();

  for (const item of secondary) {
    const key = (item.username || item.id).toLowerCase();
    map.set(key, { ...item, messages: [...(item.messages || [])] });
  }

  for (const item of primary) {
    const key = (item.username || item.id).toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item, messages: [...(item.messages || [])] });
    } else {
      const msgIds = new Set(existing.messages.map((m) => m.id));
      const mergedMessages = [...existing.messages];
      for (const m of item.messages || []) {
        if (!msgIds.has(m.id)) {
          msgIds.add(m.id);
          mergedMessages.push(m);
        }
      }
      mergedMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const lastMsg = mergedMessages[mergedMessages.length - 1];
      map.set(key, {
        ...existing,
        ...item,
        igUserId: item.igUserId || existing.igUserId,
        commentId: item.commentId || existing.commentId,
        name: item.name || existing.name,
        lastMessageText: lastMsg ? lastMsg.text : item.lastMessageText || existing.lastMessageText,
        lastMessageAt: lastMsg ? lastMsg.timestamp : item.lastMessageAt || existing.lastMessageAt,
        lastUserInteractionAt:
          new Date(item.lastUserInteractionAt || 0).getTime() >
          new Date(existing.lastUserInteractionAt || 0).getTime()
            ? item.lastUserInteractionAt
            : existing.lastUserInteractionAt,
        triggeredRuleIds: Array.from(
          new Set([...(existing.triggeredRuleIds || []), ...(item.triggeredRuleIds || [])])
        ),
        messages: mergedMessages,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function getStoredConversations(): InstagramConversation[] {
  const diskChats = readJsonSafe(CHATS_FILE_PATH);
  const tmpChats = readJsonSafe(TMP_CHATS_PATH);
  const merged = mergeConversationLists(
    g._konverops_ig_chats_cache || [],
    mergeConversationLists(tmpChats, diskChats)
  );
  g._konverops_ig_chats_cache = merged;
  return merged;
}

export function saveStoredConversations(conversations: InstagramConversation[]): void {
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
  g._konverops_ig_chats_cache = sorted;

  try {
    fs.writeFileSync(TMP_CHATS_PATH, JSON.stringify(sorted, null, 2), 'utf-8');
  } catch {
    // ignore
  }

  try {
    const dir = path.dirname(CHATS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CHATS_FILE_PATH, JSON.stringify(sorted, null, 2), 'utf-8');
  } catch {
    // ignore read-only in production lambda
  }
}

export function appendConversationMessage(params: {
  userKey: string;
  igUserId?: string;
  commentId?: string;
  mediaId?: string;
  username?: string;
  name?: string;
  isFollower?: boolean;
  sender: 'user' | 'bot' | 'human';
  text: string;
  timestamp?: string;
  buttons?: InstagramLinkButton[];
  ruleId?: string;
  ruleName?: string;
  channel?: 'comment' | 'dm' | 'story_reply' | 'manual';
  status?: 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  messageId?: string;
}): InstagramConversation {
  const conversations = getStoredConversations();
  const normalizedUsername = (params.username || '').replace(/^@/, '').trim();
  const lookupKey = (normalizedUsername || params.igUserId || params.userKey).toLowerCase();

  let conv = conversations.find(
    (c) =>
      c.id.toLowerCase() === lookupKey ||
      c.username.toLowerCase() === lookupKey ||
      (params.igUserId && c.igUserId === params.igUserId) ||
      (params.commentId && c.commentId === params.commentId)
  );

  const nowIso = params.timestamp || new Date().toISOString();
  const msgId =
    params.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newMessage: ChatMessageItem = {
    id: msgId,
    sender: params.sender,
    text: params.text,
    timestamp: nowIso,
    buttons: params.buttons && params.buttons.length > 0 ? params.buttons : undefined,
    ruleId: params.ruleId,
    ruleName: params.ruleName,
    channel: params.channel || 'dm',
    status: params.status || 'delivered',
    errorMessage: params.errorMessage,
  };

  if (!conv) {
    conv = {
      id: normalizedUsername || params.igUserId || params.userKey,
      igUserId: params.igUserId,
      commentId: params.commentId,
      mediaId: params.mediaId,
      username: normalizedUsername || params.userKey,
      name: params.name || normalizedUsername || params.userKey,
      isFollower: params.isFollower ?? true,
      lastMessageText: params.text,
      lastMessageAt: nowIso,
      lastUserInteractionAt: params.sender === 'user' ? nowIso : nowIso,
      unreadCount: params.sender === 'user' ? 1 : 0,
      triggeredRuleIds: params.ruleId ? [params.ruleId] : [],
      messages: [newMessage],
    };
    conversations.unshift(conv);
  } else {
    if (params.igUserId) conv.igUserId = params.igUserId;
    if (params.commentId) conv.commentId = params.commentId;
    if (params.mediaId) conv.mediaId = params.mediaId;
    if (normalizedUsername && (conv.username === conv.igUserId || !conv.username)) {
      conv.username = normalizedUsername;
    }
    if (params.name) conv.name = params.name;
    if (typeof params.isFollower === 'boolean') conv.isFollower = params.isFollower;

    const alreadyExists = conv.messages.some(
      (m) =>
        m.id === msgId ||
        (m.sender === params.sender &&
          m.text === params.text &&
          Math.abs(new Date(m.timestamp).getTime() - new Date(nowIso).getTime()) < 5000)
    );

    if (!alreadyExists) {
      conv.messages.push(newMessage);
      conv.messages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }

    const latestMsg = conv.messages[conv.messages.length - 1];
    conv.lastMessageText = latestMsg ? latestMsg.text : params.text;
    conv.lastMessageAt = latestMsg ? latestMsg.timestamp : nowIso;

    if (params.sender === 'user') {
      if (new Date(nowIso).getTime() > new Date(conv.lastUserInteractionAt || 0).getTime()) {
        conv.lastUserInteractionAt = nowIso;
      }
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    } else if (params.sender === 'human') {
      conv.unreadCount = 0;
    }

    if (params.ruleId && !conv.triggeredRuleIds.includes(params.ruleId)) {
      conv.triggeredRuleIds.push(params.ruleId);
    }
  }

  saveStoredConversations(conversations);
  return conv;
}

export function markConversationRead(conversationId: string): InstagramConversation | null {
  const conversations = getStoredConversations();
  const conv = conversations.find(
    (c) =>
      c.id.toLowerCase() === conversationId.toLowerCase() ||
      c.username.toLowerCase() === conversationId.toLowerCase()
  );
  if (!conv) return null;
  conv.unreadCount = 0;
  saveStoredConversations(conversations);
  return conv;
}

/**
 * Verifica se o 2º passo já foi entregue para este commentId / igUserId.
 */
async function isTwoStepAlreadyDelivered(commentId: string, username: string): Promise<boolean> {
  if (g._konverops_twostep_delivered?.has(commentId)) return true;

  const convs = getStoredConversations();
  const conv = convs.find(
    (c) =>
      c.commentId === commentId ||
      c.username.toLowerCase() === username.toLowerCase()
  );
  if (
    conv &&
    conv.messages.some(
      (m) =>
        m.id.startsWith('bot_step2_') ||
        m.id.startsWith('user_optin_click_') ||
        m.text.includes('1️⃣ LAUDO')
    )
  ) {
    g._konverops_twostep_delivered?.add(commentId);
    return true;
  }

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(`${UPSTASH_URL}/get/konverops:ig:twostep_done:${commentId}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.result) {
          g._konverops_twostep_delivered?.add(commentId);
          return true;
        }
      }
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Adquire lock atômico para garantir que o 2º passo seja enviado apenas 1 única vez.
 */
async function claimTwoStepDeliveryLock(commentId: string): Promise<boolean> {
  if (g._konverops_twostep_delivered?.has(commentId)) return false;
  g._konverops_twostep_delivered?.add(commentId);

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(
        `${UPSTASH_URL}/set/konverops:ig:twostep_done:${commentId}/1/NX/EX/604800`,
        {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(1500),
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data?.result === 'OK';
      }
    } catch {
      // fallback to memory lock
    }
  }

  return true;
}

/**
 * Verifica na Graph API da Meta se o seguidor clicou no botão `📄 Liberar Guia`
 * (o clique no botão abre imediatamente a janela de 24h para `recipient: { id: igUserId }`)
 * e, se estiver aberta, dispara a Parte 1 e Parte 2 do fluxo automaticamente!
 */
export async function checkAndDeliverTwoStepForUser(params: {
  igUserId: string;
  commentId: string;
  mediaId?: string;
  username: string;
  rule: AutomationRule;
}): Promise<boolean> {
  const { igUserId, commentId, mediaId, username, rule } = params;
  if (!igUserId || !commentId || !rule.twoStepCommentOptIn) return false;

  if (await isTwoStepAlreadyDelivered(commentId, username)) {
    return false;
  }

  const token = getAccessToken();
  if (!token) return false;

  try {
    // Sonda não-intrusiva (mark_seen): retorna 200 OK com recipient_id somente após o seguidor clicar no botão
    const probeRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${DEFAULT_IG_USER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: igUserId },
          sender_action: 'mark_seen',
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!probeRes.ok) return false;
    const probeJson = await probeRes.json();
    if (!probeJson?.recipient_id) return false;

    // Janela de 24h aberta! O seguidor clicou no botão "📄 Liberar Guia"!
    const claimed = await claimTwoStepDeliveryLock(commentId);
    if (!claimed) return false;

    const clickTs = new Date().toISOString();
    const btnTitle = (rule.twoStepButtonTitle || '📄 Liberar Guia').slice(0, 20);

    // 1. Registra o clique do seguidor no Live Chat
    appendConversationMessage({
      userKey: username,
      igUserId,
      commentId,
      mediaId,
      username,
      sender: 'user',
      text: btnTitle,
      timestamp: clickTs,
      channel: 'dm',
      status: 'delivered',
      messageId: `user_optin_click_${commentId}`,
    });

    // 2. Dispara a Parte 1 do Guia
    const profileStub = { id: igUserId, username };
    const part1Text = personalizeMessageText(rule.replyText, profileStub);
    const buttonsPart1: InstagramLinkButton[] =
      rule.buttons && rule.buttons.length > 0
        ? rule.buttons
        : rule.linkUrl
        ? [
            {
              type: 'web_url',
              title: (rule.buttonTitle || 'Acessar Material').slice(0, 20),
              url: rule.linkUrl,
            },
          ]
        : [];

    const res1 = await sendDirectMessage(igUserId, part1Text, {
      buttons: buttonsPart1,
      linkUrl: rule.linkUrl,
      buttonTitle: rule.buttonTitle,
    });

    appendConversationMessage({
      userKey: username,
      igUserId,
      commentId,
      mediaId,
      username,
      sender: 'bot',
      text: part1Text,
      timestamp: new Date(Date.now() + 500).toISOString(),
      buttons: buttonsPart1.length > 0 ? buttonsPart1 : undefined,
      ruleId: rule.id,
      ruleName: rule.name,
      channel: 'dm',
      status: res1.success ? 'delivered' : 'failed',
      errorMessage: res1.error,
      messageId: `bot_step2_part1_${commentId}`,
    });

    // 3. Se houver Parte 2 (followUpEnabled), aguarda 650ms e dispara em sequência
    if (res1.success && rule.followUpEnabled && rule.followUpText) {
      await new Promise((r) => setTimeout(r, 650));
      const part2Text = personalizeMessageText(rule.followUpText, profileStub);
      const buttonsPart2: InstagramLinkButton[] = rule.followUpLinkUrl
        ? [
            {
              type: 'web_url',
              title: (rule.followUpButtonTitle || 'Acessar Agora').slice(0, 20),
              url: rule.followUpLinkUrl,
            },
          ]
        : [];

      const res2 = await sendDirectMessage(igUserId, part2Text, {
        buttons: buttonsPart2,
        linkUrl: rule.followUpLinkUrl,
        buttonTitle: rule.followUpButtonTitle,
      });

      appendConversationMessage({
        userKey: username,
        igUserId,
        commentId,
        mediaId,
        username,
        sender: 'bot',
        text: part2Text,
        timestamp: new Date(Date.now() + 1200).toISOString(),
        buttons: buttonsPart2.length > 0 ? buttonsPart2 : undefined,
        ruleId: rule.id,
        ruleName: rule.name,
        channel: 'dm',
        status: res2.success ? 'delivered' : 'failed',
        errorMessage: res2.error,
        messageId: `bot_step2_part2_${commentId}`,
      });
    }

    return true;
  } catch (err) {
    console.warn(`Erro ao verificar/entregar 2º passo para @${username}:`, err);
    return false;
  }
}

/**
 * Sincroniza automaticamente comentários de todos os posts monitorados na Meta Graph API
 * e verifica se algum seguidor clicou no botão de 2 passos (`📄 Liberar Guia`) para entregar o conteúdo automaticamente.
 */
export async function syncLiveConversationsFromInstagram(
  rules: AutomationRule[]
): Promise<InstagramConversation[]> {
  const now = Date.now();
  if (
    g._konverops_last_chat_sync &&
    now - g._konverops_last_chat_sync < 8000 &&
    g._konverops_ig_chats_cache
  ) {
    return g._konverops_ig_chats_cache;
  }
  g._konverops_last_chat_sync = now;

  const conversations = getStoredConversations();
  const token = getAccessToken();
  if (!token) return conversations;

  for (const rule of rules) {
    if (!rule.active) continue;
    const mediaIds = rule.targetMediaIds || [];
    if (mediaIds.length === 0) continue;

    for (const mediaId of mediaIds) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}/comments?fields=id,text,username,timestamp,from,replies{id,text,username,timestamp}&limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(4000),
          }
        );

        if (!res.ok) continue;
        const json = await res.json();
        if (!Array.isArray(json.data)) continue;

        const lowerKws = (rule.keywords || []).map((k) => k.toLowerCase().trim());

        for (const comment of json.data) {
          const username = (comment.username || comment.from?.username || '').trim();
          const igUserId = comment.from?.id;
          if (!username || username.toLowerCase() === 'kit.autismo') continue;

          const text = (comment.text || '').trim();
          const lowerText = text.toLowerCase();
          const hasKeyword = lowerKws.some((kw) => lowerText.includes(kw));
          const botReply = comment.replies?.data?.find(
            (r: any) => r.username?.toLowerCase() === 'kit.autismo'
          );

          if (!hasKeyword && !botReply) continue;

          // Registra o comentário do usuário se ainda não estiver na conversa
          appendConversationMessage({
            userKey: username,
            igUserId,
            username,
            commentId: comment.id,
            mediaId,
            sender: 'user',
            text: `💬 Comentou no Reel: "${text}"`,
            timestamp: comment.timestamp,
            channel: 'comment',
            status: 'delivered',
            messageId: `comment_${comment.id}`,
          });

          // Se houve resposta da automação, garante que o card do robô aparece na thread
          if (hasKeyword && botReply) {
            const promptText = personalizeMessageText(
              rule.twoStepCommentOptIn
                ? rule.twoStepPromptText || DEFAULT_TWO_STEP_PROMPT_TEXT
                : rule.replyText,
              { id: igUserId || username, username }
            );
            const buttons: InstagramLinkButton[] | undefined = rule.twoStepCommentOptIn
              ? [
                  {
                    type: 'postback',
                    title: (rule.twoStepButtonTitle || '📄 Liberar Guia').slice(0, 20),
                    payload: `COMMENT_OPTIN:${rule.id}`,
                  },
                ]
              : undefined;

            appendConversationMessage({
              userKey: username,
              igUserId,
              username,
              commentId: comment.id,
              mediaId,
              sender: 'bot',
              text: promptText,
              timestamp: botReply.timestamp || comment.timestamp,
              buttons,
              ruleId: rule.id,
              ruleName: rule.name,
              channel: 'comment',
              status: 'delivered',
              messageId: `bot_optin_${comment.id}`,
            });

            // Se o comentário foi feito nas últimas 48h e usa 2 passos, verifica se o seguidor clicou no botão e entrega o Guia!
            const commentAgeMs = Date.now() - new Date(comment.timestamp).getTime();
            if (igUserId && rule.twoStepCommentOptIn && commentAgeMs < 48 * 3600 * 1000) {
              await checkAndDeliverTwoStepForUser({
                igUserId,
                commentId: comment.id,
                mediaId,
                username,
                rule,
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Erro ao sincronizar conversas do post ${mediaId}:`, err);
      }
    }
  }

  return getStoredConversations();
}
