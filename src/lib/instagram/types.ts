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

export interface AutomationRule {
  id: string;
  name: string;
  keywords: string[];
  replyText: string;
  linkUrl?: string;
  buttonTitle?: string;
  secondaryButtonTitle?: string;
  secondaryLinkUrl?: string;
  publicReplyEnabled?: boolean;
  publicReplyVariations?: string[];
  wholeWordMatch?: boolean;
  exactMessageMatch?: boolean;
  active: boolean;
  priority?: number;
}

export interface InstagramLinkButton {
  title: string;
  url: string;
}

export interface InstagramSendMessagePayload {
  recipient: { id?: string; comment_id?: string };
  message: {
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
