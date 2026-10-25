const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL || 'https://unique-ladybird-238762.upstash.io';
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  'gQAAAAAAA6SqAQIgcDJhNWRkZTM5N2E1ODQ0NTIxYmM4YjA0ZjgzNDU3NTc2YQ';

async function redisCommand(command: (string | number)[]): Promise<any> {
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });
    const json = await res.json();
    return json.result;
  } catch (error) {
    console.error('Redis Command Error:', error);
    return null;
  }
}

async function redisPipeline(commands: (string | number)[][]): Promise<any[]> {
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      cache: 'no-store',
    });
    const json = await res.json();
    return Array.isArray(json) ? json.map((item) => item.result) : [];
  } catch (error) {
    console.error('Redis Pipeline Error:', error);
    return [];
  }
}

// Retorna data no fuso horário de São Paulo (YYYY-MM-DD)
export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() - offsetDays);
  }
  // pt-BR formata YYYY-MM-DD via Intl
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  return parts;
}

// Formata label curto para exibição (ex: "24 Out" ou "Hoje")
export function formatDateLabel(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  } catch {
    return dateStr;
  }
}

export async function trackPageView(slug: string): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase().trim();
  const today = getTodayDateString();

  const commands = [
    ['INCR', `analytics:${normalizedSlug}:views:total`],
    ['INCR', `analytics:${normalizedSlug}:views:${today}`],
    ['SADD', 'analytics:all_slugs', normalizedSlug],
    ['SADD', `analytics:${normalizedSlug}:dates`, today],
  ];

  await redisPipeline(commands);
  return true;
}

export async function trackBannerClick(
  slug: string,
  bannerId: string,
  bannerTitle?: string
): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase().trim();
  const safeBannerId = bannerId.trim();
  const today = getTodayDateString();

  const commands = [
    ['INCR', `analytics:${normalizedSlug}:clicks:total`],
    ['INCR', `analytics:${normalizedSlug}:clicks:${today}`],
    ['INCR', `analytics:${normalizedSlug}:banner:${safeBannerId}:total`],
    ['INCR', `analytics:${normalizedSlug}:banner:${safeBannerId}:${today}`],
    ['SADD', 'analytics:all_slugs', normalizedSlug],
    ['SADD', `analytics:${normalizedSlug}:banners`, safeBannerId],
    ['SADD', `analytics:${normalizedSlug}:dates`, today],
  ];

  if (bannerTitle) {
    commands.push(['SET', `analytics:${normalizedSlug}:banner_title:${safeBannerId}`, bannerTitle]);
  }

  await redisPipeline(commands);
  return true;
}

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'all';

export interface DailyDataPoint {
  date: string;
  label: string;
  views: number;
  clicks: number;
  ctr: number;
}

export interface BannerMetrics {
  bannerId: string;
  title: string;
  clicks: number;
  percentage: number;
  ctr: number;
}

export interface AnalyticsReport {
  slug: string;
  period: AnalyticsPeriod;
  totalViews: number;
  totalClicks: number;
  ctr: number;
  topBanner: {
    bannerId: string;
    title: string;
    clicks: number;
  } | null;
  daily: DailyDataPoint[];
  banners: BannerMetrics[];
}

export async function getClientAnalytics(
  slug: string,
  period: AnalyticsPeriod = '7d',
  registeredBanners?: Array<{ id: string; title: string }>
): Promise<AnalyticsReport> {
  const normalizedSlug = slug.toLowerCase().trim();

  // Determina lista de datas conforme o período
  let dateList: string[] = [];
  if (period === 'today') {
    dateList = [getTodayDateString()];
  } else if (period === '7d') {
    for (let i = 6; i >= 0; i--) {
      dateList.push(getTodayDateString(i));
    }
  } else if (period === '30d') {
    for (let i = 29; i >= 0; i--) {
      dateList.push(getTodayDateString(i));
    }
  } else {
    // 'all': timeline dos últimos 14 dias para o gráfico, e totais vitalícios
    for (let i = 13; i >= 0; i--) {
      dateList.push(getTodayDateString(i));
    }
  }

  // 1. Pipeline para buscar views e clicks por dia + totais
  const pipelineCommands: (string | number)[][] = [
    ['GET', `analytics:${normalizedSlug}:views:total`],
    ['GET', `analytics:${normalizedSlug}:clicks:total`],
    ['SMEMBERS', `analytics:${normalizedSlug}:banners`],
  ];

  // Adiciona consultas diárias
  for (const date of dateList) {
    pipelineCommands.push(['GET', `analytics:${normalizedSlug}:views:${date}`]);
    pipelineCommands.push(['GET', `analytics:${normalizedSlug}:clicks:${date}`]);
  }

  const results = await redisPipeline(pipelineCommands);

  const rawTotalViews = Number(results[0]) || 0;
  const rawTotalClicks = Number(results[1]) || 0;
  const trackedBannerIds: string[] = Array.isArray(results[2]) ? results[2] : [];

  // Extrai dados diários
  let periodViews = 0;
  let periodClicks = 0;
  const daily: DailyDataPoint[] = [];

  let resultIdx = 3;
  for (const date of dateList) {
    const dayViews = Number(results[resultIdx++]) || 0;
    const dayClicks = Number(results[resultIdx++]) || 0;
    periodViews += dayViews;
    periodClicks += dayClicks;

    const dayCtr = dayViews > 0 ? Number(((dayClicks / dayViews) * 100).toFixed(1)) : 0;
    daily.push({
      date,
      label: formatDateLabel(date),
      views: dayViews,
      clicks: dayClicks,
      ctr: dayCtr,
    });
  }

  // Define totais do período selecionado
  const totalViews = period === 'all' ? rawTotalViews : periodViews;
  const totalClicks = period === 'all' ? rawTotalClicks : periodClicks;
  const ctr = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

  // 2. Coleta lista unificada de banners (cadastrados no perfil + os que já receberam cliques)
  const allBannerIds = Array.from(
    new Set([
      ...(registeredBanners?.map((b) => b.id) || []),
      ...trackedBannerIds,
    ])
  );

  // 3. Pipeline para buscar métricas por banner
  const bannerPipelineCommands: (string | number)[][] = [];
  for (const bId of allBannerIds) {
    if (period === 'all') {
      bannerPipelineCommands.push(['GET', `analytics:${normalizedSlug}:banner:${bId}:total`]);
    } else {
      // Para períodos parciais, busca o valor por dia
      for (const d of dateList) {
        bannerPipelineCommands.push(['GET', `analytics:${normalizedSlug}:banner:${bId}:${d}`]);
      }
    }
    bannerPipelineCommands.push(['GET', `analytics:${normalizedSlug}:banner_title:${bId}`]);
  }

  let bannerResults: any[] = [];
  if (bannerPipelineCommands.length > 0) {
    bannerResults = await redisPipeline(bannerPipelineCommands);
  }

  const bannerMetricsList: BannerMetrics[] = [];
  let bResIdx = 0;

  for (const bId of allBannerIds) {
    let bClicks = 0;
    if (period === 'all') {
      bClicks = Number(bannerResults[bResIdx++]) || 0;
    } else {
      for (let i = 0; i < dateList.length; i++) {
        bClicks += Number(bannerResults[bResIdx++]) || 0;
      }
    }
    const savedTitle = bannerResults[bResIdx++];
    const fallbackTitle =
      registeredBanners?.find((b) => b.id === bId)?.title ||
      savedTitle ||
      `Banner (${bId})`;

    const sharePercentage =
      totalClicks > 0 ? Number(((bClicks / totalClicks) * 100).toFixed(1)) : 0;
    const bannerCtr =
      totalViews > 0 ? Number(((bClicks / totalViews) * 100).toFixed(1)) : 0;

    bannerMetricsList.push({
      bannerId: bId,
      title: fallbackTitle,
      clicks: bClicks,
      percentage: sharePercentage,
      ctr: bannerCtr,
    });
  }

  // Ordena banners do mais clicado para o menos clicado
  bannerMetricsList.sort((a, b) => b.clicks - a.clicks);

  const topBanner =
    bannerMetricsList.length > 0 && bannerMetricsList[0].clicks > 0
      ? {
          bannerId: bannerMetricsList[0].bannerId,
          title: bannerMetricsList[0].title,
          clicks: bannerMetricsList[0].clicks,
        }
      : null;

  return {
    slug: normalizedSlug,
    period,
    totalViews,
    totalClicks,
    ctr,
    topBanner,
    daily,
    banners: bannerMetricsList,
  };
}
