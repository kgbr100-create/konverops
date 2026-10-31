import { NextResponse } from 'next/server';
import { DEFAULT_IG_USER_ID, getInstagramAccessToken } from '@/lib/instagram/messenger';

export async function GET() {
  try {
    const token = getInstagramAccessToken();
    const igUserId =
      process.env.INSTAGRAM_USER_ID || process.env.IG_USER_ID || DEFAULT_IG_USER_ID;

    const url = `https://graph.facebook.com/v21.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count&limit=12`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      return NextResponse.json(
        {
          success: false,
          error: json.error?.message || 'Erro ao buscar publicações do Instagram',
          media: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      media: Array.isArray(json.data) ? json.data : [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro interno ao listar posts',
        media: [],
      },
      { status: 200 }
    );
  }
}
