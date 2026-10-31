import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_IG_USER_ID, getInstagramAccessToken } from '@/lib/instagram/messenger';

export async function GET(request: NextRequest) {
  try {
    const token = getInstagramAccessToken();
    const igUserId =
      process.env.INSTAGRAM_USER_ID || process.env.IG_USER_ID || DEFAULT_IG_USER_ID;

    const { searchParams } = new URL(request.url);
    const afterCursor = searchParams.get('after') || '';
    const loadAll = searchParams.get('all') === 'true';
    const requestedLimit = Math.min(
      Math.max(Number(searchParams.get('limit') || '50'), 12),
      100
    );

    const fields =
      'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count';

    const mediaList: any[] = [];
    let nextCursor: string | null = null;

    if (loadAll) {
      // Pagina até 250 publicações (padrão OpenReply getAllUserMedia)
      let cursor = afterCursor;
      for (let page = 0; page < 5; page++) {
        const pageUrl: string = `https://graph.facebook.com/v21.0/${igUserId}/media?fields=${fields}&limit=50${
          cursor ? `&after=${encodeURIComponent(cursor)}` : ''
        }`;
        const res = await fetch(pageUrl, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        const json = await res.json();
        if (!res.ok || json.error || !Array.isArray(json.data)) break;
        mediaList.push(...json.data);
        const nextAfter = json.paging?.cursors?.after;
        if (!nextAfter || !json.paging?.next) {
          nextCursor = null;
          break;
        }
        cursor = nextAfter;
        nextCursor = nextAfter;
      }
    } else {
      const url = `https://graph.facebook.com/v21.0/${igUserId}/media?fields=${fields}&limit=${requestedLimit}${
        afterCursor ? `&after=${encodeURIComponent(afterCursor)}` : ''
      }`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        return NextResponse.json(
          {
            success: false,
            error: json.error?.message || 'Erro ao buscar publicações do Instagram',
            media: [],
            stories: [],
            nextCursor: null,
          },
          { status: 200 }
        );
      }
      if (Array.isArray(json.data)) {
        mediaList.push(...json.data);
      }
      nextCursor = json.paging?.next ? json.paging?.cursors?.after || null : null;
    }

    // Busca também os Stories ativos nas últimas 24h (se for a 1ª página)
    let activeStories: any[] = [];
    if (!afterCursor) {
      try {
        const storiesUrl = `https://graph.facebook.com/v21.0/${igUserId}/stories?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp&limit=25`;
        const sRes = await fetch(storiesUrl, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(3500),
        });
        const sJson = await sRes.json();
        if (sRes.ok && Array.isArray(sJson.data)) {
          activeStories = sJson.data;
        }
      } catch {
        // Silencia falha opcional de stories
      }
    }

    return NextResponse.json({
      success: true,
      media: mediaList,
      stories: activeStories,
      nextCursor,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro interno ao listar posts',
        media: [],
        stories: [],
        nextCursor: null,
      },
      { status: 200 }
    );
  }
}
