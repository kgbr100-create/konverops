export interface InstagramWebhookEvent {
  object: 'instagram' | 'page';
  entry: InstagramWebhookEntry[];
}

export interface InstagramWebhookEntry {
  id: string; // Page ID or Instagram Business Account ID
  time: number;
  messaging?: InstagramMessagingItem[];
  changes?: InstagramChangeItem[];
}

export interface InstagramMessagingItem {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    is_deleted?: boolean;
    is_unsupported?: boolean;
    quick_reply?: { payload: string };
    reply_to?: {
      mid?: string;
      story?: {
        url?: string;
        id?: string;
      };
    };
    attachments?: Array<{
      type: string;
      payload?: { url?: string };
    }>;
  };
  postback?: {
    mid?: string;
    title?: string;
    payload: string;
  };
  read?: {
    watermark?: number;
    seq?: number;
  };
}

export interface InstagramChangeItem {
  field: string;
  value: {
    id?: string; // Instagram Graph API comment ID
    comment_id?: string; // Legacy / Page feed comment ID
    item?: string;
    verb?: string;
    created_time?: number;
    text?: string;
    post_id?: string;
    parent_id?: string;
    media_id?: string;
    from?: {
      id?: string;
      username?: string;
    };
    media?: {
      id?: string;
      original_media_id?: string;
      ad_id?: string;
      media_product_type?: string;
    };
  };
}

export interface InstagramUserProfile {
  id: string;
  name?: string;
  firstName?: string;
  username?: string;
  isUserFollowBusiness?: boolean;
  isBusinessFollowUser?: boolean;
}

export interface InstagramLinkButton {
  type?: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
}

/** Canais de entrada de um fluxo (inspirado no ManyChat + OpenReply + ChatbotX) */
export type TriggerChannel = 'comment' | 'story_reply' | 'dm';

/** Escopo de publicações para gatilho de Comentário (OpenReply TriggerScope) */
export type PostScopeType = 'specific' | 'any' | 'next';

/** Escopo de Stories para gatilho de Resposta ao Story */
export type StoryScopeType = 'specific' | 'any';

/** Modo de correspondência de palavras-chave (OpenReply + ChatbotX ReplyToField) */
export type KeywordMatchMode = 'whole_word' | 'contains' | 'exact' | 'any';

/** Opção/Ramificação dentro de uma Enquete Interativa de Story ou Post (ex: Opção A, B, C) */
export interface StoryPollBranch {
  id: string;
  label: string;
  keywords: string[];
  replyText: string;
  buttonTitle?: string;
  linkUrl?: string;
  secondaryButtonTitle?: string;
  secondaryLinkUrl?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  /** Canal principal do fluxo ('comment' = Comentário em Post/Reel, 'story_reply' = Resposta de Story, 'dm' = Mensagem no Direct) */
  triggerType?: TriggerChannel;
  /** Lista explícita de canais onde esta regra pode disparar (isola Stories, Comentários e DM) */
  triggerChannels?: TriggerChannel[];
  /** Escopo de publicações quando 'comment' está ativo: 'specific' | 'any' | 'next' */
  postScope?: PostScopeType;
  /** Escopo de Stories quando 'story_reply' está ativo: 'specific' | 'any' */
  storyScope?: StoryScopeType;
  /** IDs de publicações/Reels específicos vinculados a esta regra */
  targetMediaIds?: string[];
  /** IDs de Stories específicos vinculados a esta regra */
  targetStoryIds?: string[];
  /** Modo de correspondência das palavras-chave ('whole_word' | 'contains' | 'exact' | 'any') */
  matchMode?: KeywordMatchMode;
  keywords: string[];
  /** Palavras negativas / excluídas (ChatbotX ExcludeKeywordsField): se presentes, bloqueiam o disparo */
  excludeKeywords?: string[];
  /** Enquete Interativa Ramificada (ex: Opções A, B, C reunidas em um único fluxo organizado) */
  isInteractivePoll?: boolean;
  pollBranches?: StoryPollBranch[];
  /** Data/hora ISO opcional de expiração automática (ideal para Stories temporários não conflitarem semanas depois) */
  expiresAt?: string | null;
  replyText: string;
  linkUrl?: string;
  buttonTitle?: string;
  secondaryButtonTitle?: string;
  secondaryLinkUrl?: string;
  thirdButtonTitle?: string;
  thirdLinkUrl?: string;
  buttons?: InstagramLinkButton[];
  publicReplyEnabled?: boolean;
  publicReplyVariations?: string[];
  wholeWordMatch?: boolean;
  exactMessageMatch?: boolean;
  /** Follow-Gate (OpenReply + ChatbotX): exige que a pessoa siga @kit.autismo antes de liberar o material */
  requireFollow?: boolean;
  followGateText?: string;
  followGateButtonTitle?: string;
  followGateRetryText?: string;
  /** Fluxo de 2 Etapas / Opening DM (OpenReply + ChatbotX): envia convite com botão personalizável antes do link */
  twoStepCommentOptIn?: boolean;
  twoStepPromptText?: string;
  twoStepButtonTitle?: string;
  /** Mensagem extra de fechamento/agradecimento após o envio do link (OpenReply followUpEnabled) */
  followUpEnabled?: boolean;
  followUpText?: string;
  /** Status Humanizado (OpenReply): envia Visto (mark_seen) + Digitando... (typing_on) antes da resposta */
  humanTypingDelay?: boolean;
  active: boolean;
  priority?: number;
}

export interface InstagramSendMessagePayload {
  recipient: { id?: string; comment_id?: string };
  sender_action?: 'mark_seen' | 'typing_on' | 'typing_off';
  message?: {
    text?: string;
    attachment?: {
      type: 'template';
      payload: {
        template_type: 'button';
        text: string;
        buttons: Array<
          | { type: 'web_url'; title: string; url: string }
          | { type: 'postback'; title: string; payload: string }
        >;
      };
    };
    quick_replies?: Array<{
      content_type: 'text';
      title: string;
      payload: string;
    }>;
  };
}
