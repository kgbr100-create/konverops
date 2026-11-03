import fs from 'fs';
import path from 'path';
import { AutomationRule } from './types';

export interface InstagramMetricsData {
  totalAllTime: number;
  followGateTotal: number;
  byRule: Record<string, number>;
  recentLogs: Array<{
    timestamp: string;
    senderId: string;
    senderUsername?: string | null;
    keyword: string;
    ruleId?: string | null;
    isStoryReply?: boolean;
    isCommentReply?: boolean;
    publicReplySent?: boolean;
    followGateTriggered?: boolean;
    twoStepTriggered?: boolean;
    status?: 'SENT' | 'FAILED';
    error?: string | null;
  }>;
}

const g = globalThis as unknown as {
  _konverops_ig_metrics_cache?: InstagramMetricsData;
  _konverops_last_live_sync?: number;
};

const METRICS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'instagram-metrics.json');
const TMP_METRICS_PATH = path.join('/tmp', 'instagram-metrics.json');

const GRAPH_VERSION = 'v21.0';
const PERMANENT_SYSTEM_USER_TOKEN =
  'EAANBJivoFVkBS8wiSJcopuEOq3yZAGL1Rs1WoZB6T1eAwMghjvD1nNz31nUZAUR6ikG35ZCFKaKtk1onYVrOfKzc7ot7MGE6zIyElU2n1nvmXNvZBUejyqUZBYR2wPnZA1IHsaUhdy911mt0lOtEhsIhGNl5CEEqWWPceG7y3mze2d2qhGZBKlkqPkJtXiNE8AZDZD';

function getAccessToken(): string {
  const envToken =
    process.env.IG_SYSTEM_USER_TOKEN_PERMANENTE ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.IG_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN;

  if (
    !envToken ||
    envToken.includes('BS3Dj7FoGFHa6yOMdMiz') ||
    envToken.includes('BSmZC6jl6kbCuLc2A3R3')
  ) {
    return PERMANENT_SYSTEM_USER_TOKEN;
  }
  return envToken;
}

export function getLocalMetrics(): InstagramMetricsData {
  if (g._konverops_ig_metrics_cache) {
    return g._konverops_ig_metrics_cache;
  }

  // 1. Tenta carregar do /tmp (onde lambdas serverless do Vercel podem gravar)
  try {
    if (fs.existsSync(TMP_METRICS_PATH)) {
      const raw = fs.readFileSync(TMP_METRICS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalAllTime === 'number') {
        g._konverops_ig_metrics_cache = parsed;
        return parsed;
      }
    }
  } catch {
    // ignora
  }

  // 2. Tenta carregar de src/data (incluído no build da aplicação)
  try {
    if (fs.existsSync(METRICS_FILE_PATH)) {
      const raw = fs.readFileSync(METRICS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalAllTime === 'number') {
        g._konverops_ig_metrics_cache = parsed;
        return parsed;
      }
    }
  } catch {
    // ignora
  }

  const initial: InstagramMetricsData = {
    totalAllTime: 0,
    followGateTotal: 0,
    byRule: {},
    recentLogs: [],
  };
  g._konverops_ig_metrics_cache = initial;
  return initial;
}

export function saveLocalMetrics(metrics: InstagramMetricsData): void {
  g._konverops_ig_metrics_cache = metrics;

  // Persiste em /tmp (sempre gravável no Vercel)
  try {
    fs.writeFileSync(TMP_METRICS_PATH, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch {
    // ignora
  }

  // Persiste em src/data em ambiente local de desenvolvimento
  try {
    const dir = path.dirname(METRICS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(METRICS_FILE_PATH, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch {
    // ignora se filesystem for somente leitura
  }
}

export function recordLocalInteraction(data: {
  senderId: string;
  senderUsername?: string;
  keywordMatched?: string;
  ruleId?: string;
  isStoryReply?: boolean;
  isCommentReply?: boolean;
  publicReplySent?: boolean;
  followGateTriggered?: boolean;
  twoStepTriggered?: boolean;
  status?: 'SENT' | 'FAILED';
  errorMessage?: string;
}): void {
  const metrics = getLocalMetrics();
  metrics.totalAllTime = (metrics.totalAllTime || 0) + 1;

  if (data.ruleId) {
    metrics.byRule[data.ruleId] = (metrics.byRule[data.ruleId] || 0) + 1;
  }
  if (data.followGateTriggered) {
    metrics.followGateTotal = (metrics.followGateTotal || 0) + 1;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    senderId: data.senderId,
    senderUsername: data.senderUsername || null,
    keyword: data.keywordMatched || 'unmatched',
    ruleId: data.ruleId || null,
    isStoryReply: Boolean(data.isStoryReply),
    isCommentReply: Boolean(data.isCommentReply),
    publicReplySent: Boolean(data.publicReplySent),
    followGateTriggered: Boolean(data.followGateTriggered),
    twoStepTriggered: Boolean(data.twoStepTriggered),
    status: data.status || 'SENT',
    error: data.errorMessage || null,
  };

  metrics.recentLogs = [logEntry, ...(metrics.recentLogs || [])].slice(0, 100);
  saveLocalMetrics(metrics);
}

/**
 * Sincroniza métricas em tempo real direto da Meta Graph API para qualquer regra de post ativo.
 * Consulta comentários reais do Instagram, atualizando a contagem de disparos automaticamente (com cache de 15s).
 */
export async function syncLiveRulesMetrics(
  rules: AutomationRule[],
  baseMetrics: InstagramMetricsData
): Promise<InstagramMetricsData> {
  const now = Date.now();
  // Throttle de 15 segundos para não sobrecarregar a Meta Graph API em cliques rápidos
  if (g._konverops_last_live_sync && now - g._konverops_last_live_sync < 15000 && g._konverops_ig_metrics_cache) {
    return g._konverops_ig_metrics_cache;
  }
  g._konverops_last_live_sync = now;

  const merged: InstagramMetricsData = {
    totalAllTime: baseMetrics.totalAllTime || 0,
    followGateTotal: baseMetrics.followGateTotal || 0,
    byRule: { ...(baseMetrics.byRule || {}) },
    recentLogs: [...(baseMetrics.recentLogs || [])],
  };

  const token = getAccessToken();
  if (!token) return merged;

  for (const rule of rules) {
    if (!rule.active) continue;
    const mediaIds = rule.targetMediaIds || [];
    if (mediaIds.length === 0) continue;

    for (const mediaId of mediaIds) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}/comments?fields=id,text,username,timestamp,replies{id,text,username,timestamp}&limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(3500),
          }
        );

        if (!res.ok) continue;
        const json = await res.json();
        if (!Array.isArray(json.data)) continue;

        const lowerKws = (rule.keywords || []).map((k) => k.toLowerCase().trim());
        let liveCount = 0;
        const liveLogs: any[] = [];

        for (const comment of json.data) {
          const text = (comment.text || '').toLowerCase().trim();
          const hasKeyword = lowerKws.some((kw) => text.includes(kw));
          const hasBotReply = comment.replies?.data?.some(
            (r: any) => r.username?.toLowerCase() === 'kit.autismo'
          );

          if (hasKeyword || hasBotReply) {
            liveCount++;
            liveLogs.push({
              timestamp: comment.timestamp,
              senderId: comment.id,
              senderUsername: comment.username,
              keyword: `comment_${rule.name}`,
              ruleId: rule.id,
              isCommentReply: true,
              publicReplySent: Boolean(hasBotReply),
              twoStepTriggered: Boolean(rule.twoStepCommentOptIn),
              status: 'SENT' as const,
              error: null,
            });
          }
        }

        if (liveCount > (merged.byRule[rule.id] || 0)) {
          merged.byRule[rule.id] = liveCount;
        }

        // Adiciona novos logs sem duplicar
        const existingKeys = new Set(
          merged.recentLogs.map((l) => `${l.senderUsername}_${l.timestamp}`)
        );
        for (const log of liveLogs) {
          const key = `${log.senderUsername}_${log.timestamp}`;
          if (!existingKeys.has(key)) {
            existingKeys.add(key);
            merged.recentLogs.unshift(log);
          }
        }
      } catch (err) {
        console.warn(`Erro ao sincronizar métricas ao vivo do post ${mediaId}:`, err);
      }
    }
  }

  merged.totalAllTime = Object.values(merged.byRule).reduce((acc, count) => acc + count, 0);
  merged.recentLogs = merged.recentLogs.slice(0, 100);

  saveLocalMetrics(merged);
  return merged;
}
