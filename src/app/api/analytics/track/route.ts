import { NextResponse } from 'next/server';
import { trackPageView, trackBannerClick } from '@/lib/analytics-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, slug, bannerId, bannerTitle, visitorId } = body;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug é obrigatório.' }, { status: 400 });
    }

    // Extração de dados de geolocalização e IP fornecidos pelo Edge da Vercel
    const country = request.headers.get('x-vercel-ip-country') || 'BR';
    const region = request.headers.get('x-vercel-ip-country-region') || 'SP';
    let city = request.headers.get('x-vercel-ip-city') || 'São Paulo';
    try {
      city = decodeURIComponent(city);
    } catch {
      // Ignora erro de decoding
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const geoInfo = {
      country,
      region,
      city,
      ip: clientIp,
    };

    if (type === 'view') {
      await trackPageView(slug, visitorId, geoInfo);
      return NextResponse.json({ success: true, tracked: 'view' });
    }

    if (type === 'click') {
      if (!bannerId) {
        return NextResponse.json(
          { success: false, error: 'bannerId é obrigatório para cliques.' },
          { status: 400 }
        );
      }
      await trackBannerClick(slug, bannerId, bannerTitle, visitorId, geoInfo);
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
