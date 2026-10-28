import { getInstagramAccessToken } from './messenger';

const GRAPH_VERSION = 'v21.0';

export interface PublishStoryParams {
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
}

export interface PublishStoryResult {
  success: boolean;
  storyId?: string;
  error?: string;
}

/**
 * Publica um Story (imagem ou vídeo vertical 9:16) no Instagram via Meta Graph API.
 */
export async function publishStory(params: PublishStoryParams): Promise<PublishStoryResult> {
  const { imageUrl, videoUrl } = params;

  if (!imageUrl && !videoUrl) {
    return { success: false, error: 'É necessário fornecer imageUrl ou videoUrl para publicar o Story.' };
  }

  const userId =
    process.env.INSTAGRAM_USER_ID ||
    process.env.IG_USER_ID ||
    '17841449325469220';

  const token = getInstagramAccessToken();

  try {
    // 1. Cria o contêiner de mídia com media_type STORIES
    const containerPayload: Record<string, string> = {
      media_type: 'STORIES',
      access_token: token,
    };

    if (imageUrl) {
      containerPayload.image_url = imageUrl;
    } else if (videoUrl) {
      containerPayload.video_url = videoUrl;
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerPayload),
      }
    );

    const containerJson = await containerRes.json();

    if (!containerRes.ok || containerJson.error) {
      const errorDetail = containerJson.error
        ? JSON.stringify(containerJson.error)
        : `Status ${containerRes.status}`;
      return { success: false, error: `Falha ao criar contêiner de Story: ${errorDetail}` };
    }

    const containerId = containerJson.id;

    // 2. Aguarda processamento do contêiner pela Meta
    let status = 'IN_PROGRESS';
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${containerId}?fields=status_code&access_token=${token}`
      );
      const statusJson = await statusRes.json();

      status = statusJson.status_code || statusJson.status;
      if (status === 'FINISHED') break;
      if (status === 'ERROR') {
        return {
          success: false,
          error: `Erro durante o processamento do Story pela Meta: ${JSON.stringify(statusJson)}`,
        };
      }
    }

    // 3. Publica oficialmente o Story
    const publishRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${userId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: token,
        }),
      }
    );

    const publishJson = await publishRes.json();

    if (!publishRes.ok || publishJson.error) {
      const errorDetail = publishJson.error
        ? JSON.stringify(publishJson.error)
        : `Status ${publishRes.status}`;
      return { success: false, error: `Falha ao publicar Story: ${errorDetail}` };
    }

    return {
      success: true,
      storyId: publishJson.id,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido ao publicar Story.';
    return { success: false, error: errorMsg };
  }
}
