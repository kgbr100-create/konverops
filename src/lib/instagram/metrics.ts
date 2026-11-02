import fs from 'fs';
import path from 'path';

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

const g = globalThis as unknown as { _konverops_ig_metrics_cache?: InstagramMetricsData };

const METRICS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'instagram-metrics.json');
const TMP_METRICS_PATH = path.join('/tmp', 'instagram-metrics.json');

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
