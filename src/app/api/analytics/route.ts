import { NextRequest, NextResponse } from 'next/server';
import { getClientAnalytics, AnalyticsPeriod } from '@/lib/analytics-store';
import { getClientBySlug } from '@/lib/profiles-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const period = (searchParams.get('period') as AnalyticsPeriod) || '7d';

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro slug é obrigatório.' },
        { status: 400 }
      );
    }

    const profile = await getClientBySlug(slug);
    const registeredBanners = profile?.banners?.map((b) => ({
      id: b.id,
      title: b.title,
    }));

    const report = await getClientAnalytics(slug, period, registeredBanners);

    return NextResponse.json({
      success: true,
      profileName: profile?.name || slug,
      report,
    });
  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar estatísticas.' },
      { status: 500 }
    );
  }
}
