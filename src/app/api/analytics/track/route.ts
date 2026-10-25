import { NextResponse } from 'next/server';
import { trackPageView, trackBannerClick } from '@/lib/analytics-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, slug, bannerId, bannerTitle } = body;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug é obrigatório.' }, { status: 400 });
    }

    if (type === 'view') {
      await trackPageView(slug);
      return NextResponse.json({ success: true, tracked: 'view' });
    }

    if (type === 'click') {
      if (!bannerId) {
        return NextResponse.json(
          { success: false, error: 'bannerId é obrigatório para cliques.' },
          { status: 400 }
        );
      }
      await trackBannerClick(slug, bannerId, bannerTitle);
      return NextResponse.json({ success: true, tracked: 'click' });
    }

    return NextResponse.json({ success: false, error: 'Tipo de evento inválido.' }, { status: 400 });
  } catch (error) {
    console.error('Analytics Track Error:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao registrar métrica.' },
      { status: 500 }
    );
  }
}
