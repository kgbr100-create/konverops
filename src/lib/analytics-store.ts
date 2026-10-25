const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL || 'https://unique-ladybird-238762.upstash.io';
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  'gQAAAAAAA6SqAQIgcDJhNWRkZTM5N2E1ODQ0NTIxYmM4YjA0ZjgzNDU3NTc2YQ';

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
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDateLabel(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  } catch {
    return dateStr;
  }
}

// Dicionário de Países com bandeiras
const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  BR: { name: 'Brasil', flag: '🇧🇷' },
  US: { name: 'Estados Unidos', flag: '🇺🇸' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
  ES: { name: 'Espanha', flag: '🇪🇸' },
  AR: { name: 'Argentina', flag: '🇦🇷' },
  GB: { name: 'Reino Unido', flag: '🇬🇧' },
  DE: { name: 'Alemanha', flag: '🇩🇪' },
  FR: { name: 'França', flag: '🇫🇷' },
  IT: { name: 'Itália', flag: '🇮🇹' },
  CA: { name: 'Canadá', flag: '🇨🇦' },
  CL: { name: 'Chile', flag: '🇨🇱' },
  UY: { name: 'Uruguai', flag: '🇺🇾' },
  PY: { name: 'Paraguai', flag: '🇵🇾' },
  CO: { name: 'Colômbia', flag: '🇨🇴' },
  MX: { name: 'México', flag: '🇲🇽' },
};

// Dicionário de Estados do Brasil
const BRAZIL_STATES: Record<string, string> = {
  SP: 'São Paulo',
  RJ: 'Rio de Janeiro',
  MG: 'Minas Gerais',
  PR: 'Paraná',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  BA: 'Bahia',
  PE: 'Pernambuco',
  CE: 'Ceará',
  GO: 'Goiás',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  AM: 'Amazonas',
  PA: 'Pará',
  MA: 'Maranhão',
  RN: 'Rio Grande do Norte',
  PB: 'Paraíba',
  AL: 'Alagoas',
  SE: 'Sergipe',
  PI: 'Piauí',
  TO: 'Tocantins',
  RO: 'Rondônia',
  AC: 'Acre',
  AP: 'Amapá',
  RR: 'Roraima',
};

export interface GeoLocationInput {
  country?: string;
  region?: string;
  city?: string;
  ip?: string;
}

export async function trackPageView(
  slug: string,
  visitorId?: string,
  geo?: GeoLocationInput
): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase().trim();
  const today = getTodayDateString();

  const country = (geo?.country || 'BR').toUpperCase();
  const region = (geo?.region || 'SP').toUpperCase();
  const city = geo?.city || 'São Paulo';
  const ip = geo?.ip || '127.0.0.1';

  const commands: (string | number)[][] = [
    ['INCR', `analytics:${normalizedSlug}:views:total`],
    ['INCR', `analytics:${normalizedSlug}:views:${today}`],
    ['SADD', 'analytics:all_slugs', normalizedSlug],
    ['SADD', `analytics:${normalizedSlug}:dates`, today],
    ['ZINCRBY', `analytics:${normalizedSlug}:geo:countries`, 1, country],
    ['ZINCRBY', `analytics:${normalizedSlug}:geo:regions`, 1, `${country}:${region}`],
    ['ZINCRBY', `analytics:${normalizedSlug}:geo:cities`, 1, `${city} (${region})`],
    ['ZINCRBY', `analytics:${normalizedSlug}:sec:ips:${today}`, 1, ip],
    ['EXPIRE', `analytics:${normalizedSlug}:sec:ips:${today}`, 604800], // 7 dias
  ];

  if (visitorId) {
    const safeVid = visitorId.trim();
    commands.push(['SADD', `analytics:${normalizedSlug}:uv:total`, safeVid]);
    commands.push(['SADD', `analytics:${normalizedSlug}:uv:${today}`, safeVid]);
  }

  await redisPipeline(commands);
  return true;
}

export async function trackBannerClick(
  slug: string,
  bannerId: string,
  bannerTitle?: string,
  visitorId?: string,
  geo?: GeoLocationInput
): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase().trim();
  const safeBannerId = bannerId.trim();
  const today = getTodayDateString();

  const country = (geo?.country || 'BR').toUpperCase();
  const region = (geo?.region || 'SP').toUpperCase();
  const city = geo?.city || 'São Paulo';
  const ip = geo?.ip || '127.0.0.1';

  const commands: (string | number)[][] = [
    ['INCR', `analytics:${normalizedSlug}:clicks:total`],
    ['INCR', `analytics:${normalizedSlug}:clicks:${today}`],
    ['INCR', `analytics:${normalizedSlug}:banner:${safeBannerId}:total`],
    ['INCR', `analytics:${normalizedSlug}:banner:${safeBannerId}:${today}`],
    ['SADD', 'analytics:all_slugs', normalizedSlug],
    ['SADD', `analytics:${normalizedSlug}:banners`, safeBannerId],
    ['SADD', `analytics:${normalizedSlug}:dates`, today],
    ['ZINCRBY', `analytics:${normalizedSlug}:geo:countries`, 1, country],
    ['ZINCRBY', `analytics:${normalizedSlug}:geo:regions`, 1, `${country}:${region}`],
    ['ZINCRBY', `analytics:${normalizedSlug}:geo:cities`, 1, `${city} (${region})`],
    ['ZINCRBY', `analytics:${normalizedSlug}:sec:ips:${today}`, 1, ip],
  ];

  if (visitorId) {
    const safeVid = visitorId.trim();
    commands.push(['SADD', `analytics:${normalizedSlug}:uc:total`, safeVid]);
    commands.push(['SADD', `analytics:${normalizedSlug}:uc:${today}`, safeVid]);
    commands.push(['SADD', `analytics:${normalizedSlug}:banner:${safeBannerId}:uc:total`, safeVid]);
    commands.push(['SADD', `analytics:${normalizedSlug}:banner:${safeBannerId}:uc:${today}`, safeVid]);
  }

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
  uniqueViews: number;
  clicks: number;
  uniqueClicks: number;
  ctr: number;
}

export interface BannerMetrics {
  bannerId: string;
  title: string;
  clicks: number;
  uniqueClicks: number;
  percentage: number;
  ctr: number;
}

export interface CountryMetric {
  code: string;
  name: string;
  flag: string;
  count: number;
  percentage: number;
}

export interface RegionMetric {
  code: string;
  name: string;
  count: number;
  percentage: number;
}

export interface CityMetric {
  name: string;
  count: number;
  percentage: number;
}

export interface SecurityStatus {
  status: 'healthy' | 'warning';
  totalDistinctIps: number;
  topIps: Array<{ ip: string; count: number; isSuspicious: boolean }>;
  warningMessage: string | null;
}

export interface AnalyticsReport {
  slug: string;
  period: AnalyticsPeriod;
  totalViews: number;
  uniqueViews: number;
  totalClicks: number;
  uniqueClicks: number;
  ctrTotal: number;
  ctrUnique: number;
  topBanner: {
    bannerId: string;
    title: string;
    clicks: number;
    uniqueClicks: number;
  } | null;
  daily: DailyDataPoint[];
  banners: BannerMetrics[];
  geo: {
    countries: CountryMetric[];
    regions: RegionMetric[];
    cities: CityMetric[];
  };
  security: SecurityStatus;
}

export async function getClientAnalytics(
  slug: string,
  period: AnalyticsPeriod = '7d',
  registeredBanners?: Array<{ id: string; title: string }>
): Promise<AnalyticsReport> {
  const normalizedSlug = slug.toLowerCase().trim();
  const today = getTodayDateString();

  // Determina lista de datas conforme o período
  let dateList: string[] = [];
  if (period === 'today') {
    dateList = [today];
  } else if (period === '7d') {
    for (let i = 6; i >= 0; i--) {
      dateList.push(getTodayDateString(i));
    }
  } else if (period === '30d') {
    for (let i = 29; i >= 0; i--) {
      dateList.push(getTodayDateString(i));
    }
  } else {
    // 'all': timeline dos últimos 14 dias para gráfico, e totais vitalícios
    for (let i = 13; i >= 0; i--) {
      dateList.push(getTodayDateString(i));
    }
  }

  // Chaves temporárias para união de conjuntos únicos caso o período tenha múltiplos dias
  const uvTempKey = `temp:${normalizedSlug}:uv:${period}:${Date.now()}`;
  const ucTempKey = `temp:${normalizedSlug}:uc:${period}:${Date.now()}`;

  const uvDateKeys = dateList.map((d) => `analytics:${normalizedSlug}:uv:${d}`);
  const ucDateKeys = dateList.map((d) => `analytics:${normalizedSlug}:uc:${d}`);

  // 1. Pipeline primário de Views, Clicks, Totais e Dados Geográficos
  const pipelineCommands: (string | number)[][] = [
    ['GET', `analytics:${normalizedSlug}:views:total`],
    ['GET', `analytics:${normalizedSlug}:clicks:total`],
    ['SCARD', `analytics:${normalizedSlug}:uv:total`],
    ['SCARD', `analytics:${normalizedSlug}:uc:total`],
    ['SMEMBERS', `analytics:${normalizedSlug}:banners`],
    // Top 6 países
    ['ZREVRANGE', `analytics:${normalizedSlug}:geo:countries`, 0, 5, 'WITHSCORES'],
    // Top 7 regiões / estados
    ['ZREVRANGE', `analytics:${normalizedSlug}:geo:regions`, 0, 6, 'WITHSCORES'],
    // Top 7 cidades
    ['ZREVRANGE', `analytics:${normalizedSlug}:geo:cities`, 0, 6, 'WITHSCORES'],
    // Top 5 IPs recentes para auditoria de segurança
    ['ZREVRANGE', `analytics:${normalizedSlug}:sec:ips:${today}`, 0, 4, 'WITHSCORES'],
    ['ZCARD', `analytics:${normalizedSlug}:sec:ips:${today}`],
  ];

  // Cálculo de Únicos do período via SUNIONSTORE
  if (period === 'today') {
    pipelineCommands.push(['SCARD', `analytics:${normalizedSlug}:uv:${today}`]);
    pipelineCommands.push(['SCARD', `analytics:${normalizedSlug}:uc:${today}`]);
  } else if (period === 'all') {
    pipelineCommands.push(['SCARD', `analytics:${normalizedSlug}:uv:total`]);
    pipelineCommands.push(['SCARD', `analytics:${normalizedSlug}:uc:total`]);
  } else {
    // 7d ou 30d: Une os conjuntos dos dias
    pipelineCommands.push(['SUNIONSTORE', uvTempKey, ...uvDateKeys]);
    pipelineCommands.push(['SCARD', uvTempKey]);
    pipelineCommands.push(['SUNIONSTORE', ucTempKey, ...ucDateKeys]);
    pipelineCommands.push(['SCARD', ucTempKey]);
    pipelineCommands.push(['DEL', uvTempKey, ucTempKey]);
  }

  // Consultas diárias (Views totais, Views únicas, Clicks totais, Clicks únicos)
  for (const date of dateList) {
    pipelineCommands.push(['GET', `analytics:${normalizedSlug}:views:${date}`]);
    pipelineCommands.push(['SCARD', `analytics:${normalizedSlug}:uv:${date}`]);
    pipelineCommands.push(['GET', `analytics:${normalizedSlug}:clicks:${date}`]);
    pipelineCommands.push(['SCARD', `analytics:${normalizedSlug}:uc:${date}`]);
  }

  const results = await redisPipeline(pipelineCommands);

  const rawTotalViews = Number(results[0]) || 0;
  const rawTotalClicks = Number(results[1]) || 0;
  const rawTotalUniqueViews = Number(results[2]) || 0;
  const rawTotalUniqueClicks = Number(results[3]) || 0;
  const trackedBannerIds: string[] = Array.isArray(results[4]) ? results[4] : [];

  const rawCountries = Array.isArray(results[5]) ? results[5] : [];
  const rawRegions = Array.isArray(results[6]) ? results[6] : [];
  const rawCities = Array.isArray(results[7]) ? results[7] : [];
  const rawTopIps = Array.isArray(results[8]) ? results[8] : [];
  const totalDistinctIps = Number(results[9]) || 0;

  // Extrai contagem única do período
  let periodUniqueViews = 0;
  let periodUniqueClicks = 0;
  let dailyStartIndex = 10;

  if (period === 'today') {
    periodUniqueViews = Number(results[10]) || 0;
    periodUniqueClicks = Number(results[11]) || 0;
    dailyStartIndex = 12;
  } else if (period === 'all') {
    periodUniqueViews = rawTotalUniqueViews;
    periodUniqueClicks = rawTotalUniqueClicks;
    dailyStartIndex = 12;
  } else {
    // results[10] = SUNIONSTORE result
    periodUniqueViews = Number(results[11]) || 0;
    // results[12] = SUNIONSTORE result
    periodUniqueClicks = Number(results[13]) || 0;
    dailyStartIndex = 15;
  }

  // Extrai dados diários
  let periodTotalViews = 0;
  let periodTotalClicks = 0;
  const daily: DailyDataPoint[] = [];

  let rIdx = dailyStartIndex;
  for (const date of dateList) {
    const dViews = Number(results[rIdx++]) || 0;
    const dUViews = Number(results[rIdx++]) || 0;
    const dClicks = Number(results[rIdx++]) || 0;
    const dUClicks = Number(results[rIdx++]) || 0;

    periodTotalViews += dViews;
    periodTotalClicks += dClicks;

    const dayCtr = dViews > 0 ? Number(((dClicks / dViews) * 100).toFixed(1)) : 0;
    daily.push({
      date,
      label: formatDateLabel(date),
      views: dViews,
      uniqueViews: dUViews,
      clicks: dClicks,
      uniqueClicks: dUClicks,
      ctr: dayCtr,
    });
  }

  // Totais consolidados
  const totalViews = period === 'all' ? rawTotalViews : periodTotalViews;
  const uniqueViews = period === 'all' ? rawTotalUniqueViews : periodUniqueViews;
  const totalClicks = period === 'all' ? rawTotalClicks : periodTotalClicks;
  const uniqueClicks = period === 'all' ? rawTotalUniqueClicks : periodUniqueClicks;

  const ctrTotal = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;
  const ctrUnique = uniqueViews > 0 ? Number(((uniqueClicks / uniqueViews) * 100).toFixed(1)) : 0;

  // 2. Processa Dados de Geolocalização
  const countries: CountryMetric[] = [];
  let countryTotalHits = 0;
  for (let i = 0; i < rawCountries.length; i += 2) {
    countryTotalHits += Number(rawCountries[i + 1]) || 0;
  }
  for (let i = 0; i < rawCountries.length; i += 2) {
    const code = String(rawCountries[i]).toUpperCase();
    const count = Number(rawCountries[i + 1]) || 0;
    const pct = countryTotalHits > 0 ? Number(((count / countryTotalHits) * 100).toFixed(1)) : 0;
    const mapped = COUNTRY_MAP[code] || { name: code, flag: '🌐' };
    countries.push({
      code,
      name: mapped.name,
      flag: mapped.flag,
      count,
      percentage: pct,
    });
  }

  const regions: RegionMetric[] = [];
  let regionTotalHits = 0;
  for (let i = 0; i < rawRegions.length; i += 2) {
    regionTotalHits += Number(rawRegions[i + 1]) || 0;
  }
  for (let i = 0; i < rawRegions.length; i += 2) {
    const rawCode = String(rawRegions[i]);
    const count = Number(rawRegions[i + 1]) || 0;
    const pct = regionTotalHits > 0 ? Number(((count / regionTotalHits) * 100).toFixed(1)) : 0;
    const [countryCode, regionCode] = rawCode.split(':');
    const regionName =
      countryCode === 'BR' && BRAZIL_STATES[regionCode]
        ? `${BRAZIL_STATES[regionCode]} (${regionCode})`
        : rawCode;
    regions.push({
      code: regionCode || rawCode,
      name: regionName,
      count,
      percentage: pct,
    });
  }

  const cities: CityMetric[] = [];
  let cityTotalHits = 0;
  for (let i = 0; i < rawCities.length; i += 2) {
    cityTotalHits += Number(rawCities[i + 1]) || 0;
  }
  for (let i = 0; i < rawCities.length; i += 2) {
    const name = String(rawCities[i]);
    const count = Number(rawCities[i + 1]) || 0;
    const pct = cityTotalHits > 0 ? Number(((count / cityTotalHits) * 100).toFixed(1)) : 0;
    cities.push({
      name,
      count,
      percentage: pct,
    });
  }

  // 3. Monitor de Segurança e Anomalias
  let isUnderAttack = false;
  let warningMessage: string | null = null;
  const topIps: Array<{ ip: string; count: number; isSuspicious: boolean }> = [];

  for (let i = 0; i < rawTopIps.length; i += 2) {
    const rawIp = String(rawTopIps[i]);
    const count = Number(rawTopIps[i + 1]) || 0;

    // Mascara o IP para conformidade e privacidade (ex: 189.40.xxx.xxx)
    const ipParts = rawIp.split('.');
    const anonymizedIp =
      ipParts.length === 4
        ? `${ipParts[0]}.${ipParts[1]}.xxx.xxx`
        : rawIp.substring(0, 8) + '...';

    // Flag suspeita se um único IP tiver > 40 acessos e > 45% do tráfego total
    const isSuspicious = count > 40 && totalViews > 0 && count / totalViews > 0.45;
    if (isSuspicious) {
      isUnderAttack = true;
      warningMessage = `Alerta: O IP ${anonymizedIp} realizou ${count} acessos concentrados, indicando possível varredura automatizada ou bot.`;
    }

    topIps.push({
      ip: anonymizedIp,
      count,
      isSuspicious,
    });
  }

  const securityStatus: SecurityStatus = {
    status: isUnderAttack ? 'warning' : 'healthy',
    totalDistinctIps,
    topIps,
    warningMessage,
  };

  // 4. Métricas por Banner / Elemento (Totais e Únicos)
  const allBannerIds = Array.from(
    new Set([...(registeredBanners?.map((b) => b.id) || []), ...trackedBannerIds])
  );

  const bannerPipelineCommands: (string | number)[][] = [];
  for (const bId of allBannerIds) {
    if (period === 'all') {
      bannerPipelineCommands.push(['GET', `analytics:${normalizedSlug}:banner:${bId}:total`]);
      bannerPipelineCommands.push(['SCARD', `analytics:${normalizedSlug}:banner:${bId}:uc:total`]);
    } else if (period === 'today') {
      bannerPipelineCommands.push(['GET', `analytics:${normalizedSlug}:banner:${bId}:${today}`]);
      bannerPipelineCommands.push(['SCARD', `analytics:${normalizedSlug}:banner:${bId}:uc:${today}`]);
    } else {
      for (const d of dateList) {
        bannerPipelineCommands.push(['GET', `analytics:${normalizedSlug}:banner:${bId}:${d}`]);
      }
      const bUcTemp = `temp:${normalizedSlug}:banner:${bId}:uc:${Date.now()}`;
      const bUcDateKeys = dateList.map((d) => `analytics:${normalizedSlug}:banner:${bId}:uc:${d}`);
      bannerPipelineCommands.push(['SUNIONSTORE', bUcTemp, ...bUcDateKeys]);
      bannerPipelineCommands.push(['SCARD', bUcTemp]);
      bannerPipelineCommands.push(['DEL', bUcTemp]);
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
    let bUniqueClicks = 0;

    if (period === 'all' || period === 'today') {
      bClicks = Number(bannerResults[bResIdx++]) || 0;
      bUniqueClicks = Number(bannerResults[bResIdx++]) || 0;
    } else {
      for (let i = 0; i < dateList.length; i++) {
        bClicks += Number(bannerResults[bResIdx++]) || 0;
      }
      bResIdx++; // SUNIONSTORE
      bUniqueClicks = Number(bannerResults[bResIdx++]) || 0;
      bResIdx++; // DEL
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
      uniqueClicks: bUniqueClicks,
      percentage: sharePercentage,
      ctr: bannerCtr,
    });
  }

  bannerMetricsList.sort((a, b) => b.clicks - a.clicks);

  const topBanner =
    bannerMetricsList.length > 0 && bannerMetricsList[0].clicks > 0
      ? {
          bannerId: bannerMetricsList[0].bannerId,
          title: bannerMetricsList[0].title,
          clicks: bannerMetricsList[0].clicks,
          uniqueClicks: bannerMetricsList[0].uniqueClicks,
        }
      : null;

  return {
    slug: normalizedSlug,
    period,
    totalViews,
    uniqueViews,
    totalClicks,
    uniqueClicks,
    ctrTotal,
    ctrUnique,
    topBanner,
    daily,
    banners: bannerMetricsList,
    geo: {
      countries,
      regions,
      cities,
    },
    security: securityStatus,
  };
}
