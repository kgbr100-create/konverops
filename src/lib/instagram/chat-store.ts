import fs from 'fs';
import path from 'path';
import {
  AutomationRule,
  ChatMessageItem,
  InstagramConversation,
  InstagramLinkButton,
} from './types';
import { personalizeMessageText } from './messenger';
import { DEFAULT_TWO_STEP_PROMPT_TEXT } from './constants';

const g = globalThis as unknown as {
  _konverops_ig_chats_cache?: InstagramConversation[];
  _konverops_last_chat_sync?: number;
};

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
  userKey: string; // username ou senderId
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

    conv.lastMessageText = params.text;
    conv.lastMessageAt = nowIso;

    if (params.sender === 'user') {
      conv.lastUserInteractionAt = nowIso;
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
    (c) => c.id.toLowerCase() === conversationId.toLowerCase() || c.username.toLowerCase() === conversationId.toLowerCase()
  );
  if (!conv) return null;
  conv.unreadCount = 0;
  saveStoredConversations(conversations);
  return conv;
}

/**
 * Sincroniza automaticamente comentários de todos os posts monitorados na Meta Graph API
 * para que qualquer novo seguidor que interagir apareça no Live Chat em tempo real.
 */
export async function syncLiveConversationsFromInstagram(
  rules: AutomationRule[]
): Promise<InstagramConversation[]> {
  const now = Date.now();
  if (g._konverops_last_chat_sync && now - g._konverops_last_chat_sync < 12000 && g._konverops_ig_chats_cache) {
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
          `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}/comments?fields=id,text,username,timestamp,replies{id,text,username,timestamp}&limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(3500),
          }
        );

        if (!res.ok) continue;
        const json = await res.json();
        if (!Array.isArray(json.data)) continue;

        const lowerKws = (rule.keywords || []).map((k) => k.toLowerCase().trim());

        for (const comment of json.data) {
          const username = (comment.username || '').trim();
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
              { id: username, username }
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
          }
        }
      } catch (err) {
        console.warn(`Erro ao sincronizar conversas do post ${mediaId}:`, err);
      }
    }
  }

  return getStoredConversations();
}
