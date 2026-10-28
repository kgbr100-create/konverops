export interface InstagramWebhookEvent {
  object: 'instagram';
  entry: InstagramWebhookEntry[];
}

export interface InstagramWebhookEntry {
  id: string; // Page ID or Instagram Business Account ID
  time: number;
  messaging?: InstagramMessagingItem[];
  changes?: InstagramChangeItem[];
}

export interface InstagramMessagingItem {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    quick_reply?: { payload: string };
    reply_to?: {
      mid?: string;
      story?: {
        url: string;
        id: string;
      };
    };
    attachments?: Array<{
      type: string;
      payload: { url?: string };
    }>;
  };
  postback?: {
    mid: string;
    title: string;
    payload: string;
  };
}

export interface InstagramChangeItem {
  field: string;
  value: {
    from?: { id: string; username: string };
    item?: 'comment';
    comment_id?: string;
    created_time?: number;
    text?: string;
    post_id?: string;
    parent_id?: string;
  };
}

export interface AutomationRule {
  id: string;
  name: string;
  keywords: string[];
  replyText: string;
  linkUrl?: string;
  active: boolean;
  priority?: number;
}

export interface InstagramSendMessagePayload {
  recipient: { id: string };
  message: {
    text: string;
    quick_replies?: Array<{
      content_type: 'text';
      title: string;
      payload: string;
    }>;
  };
}
