import { NextRequest, NextResponse } from 'next/server';
import { getAllRules, saveAllRules } from '@/lib/instagram/rules';
import { verifySessionToken } from '@/lib/auth';
import { getLocalMetrics, syncLiveRulesMetrics } from '@/lib/instagram/metrics';
import { syncLiveConversationsFromInstagram } from '@/lib/instagram/chat-store';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const ADMIN_SECRET =
  process.env.ADMIN_SECRET || 'konverops-admin-auth-secret-key-2026-kelvin';

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token === ADMIN_SECRET) return true;

  const sessionCookie = request.cookies.get('konverops_admin_session')?.value;
  if (sessionCookie) {
    const session = await verifySessionToken(sessionCookie);
    if (session.valid) return true;
  }
  return false;
}

export async function GET() {
  try {
    const rules = await getAllRules();

    const localMetrics = getLocalMetrics();
    // Sincroniza em tempo real com a Meta Graph API os posts monitorados e verifica cliques de 2 etapas
    const [liveMetrics] = await Promise.all([
      syncLiveRulesMetrics(rules, localMetrics),
      syncLiveConversationsFromInstagram(rules).catch(() => {}),
    ]);

    let recentLogs = liveMetrics.recentLogs || [];
    let totalAllTime = liveMetrics.totalAllTime || 0;
    let followGateTotal = liveMetrics.followGateTotal || 0;
    const byRule: Record<string, number> = { ...(liveMetrics.byRule || {}) };

    if (UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('unique-ladybird-238762')) {
      try {
        const res = await fetch(`${UPSTASH_URL}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['LRANGE', 'konverops:ig:logs:recent', 0, 29],
            ['GET', 'konverops:ig:metrics:all_time:total'],
            ['HGETALL', 'konverops:ig:metrics:by_rule'],
            ['GET', 'konverops:ig:metrics:all_time:follow_gate'],
          ]),
          cache: 'no-store',
          signal: AbortSignal.timeout(1200),
        });
        const json = await res.json();
        if (Array.isArray(json)) {
          recentLogs = (json[0]?.result || []).map((item: string) => {
            try {
              return JSON.parse(item);
            } catch {
              return item;
            }
          });
          totalAllTime = parseInt(json[1]?.result || '0', 10);

          const rawHash = json[2]?.result;
          if (Array.isArray(rawHash)) {
            for (let i = 0; i < rawHash.length; i += 2) {
              const k = String(rawHash[i]);
              const v = parseInt(String(rawHash[i + 1] || '0'), 10);
              if (k && !isNaN(v)) byRule[k] = v;
            }
          }
          followGateTotal = parseInt(json[3]?.result || '0', 10);
        }
      } catch (err) {
        console.warn('Erro ao carregar logs/métricas:', err);
      }
    }

    return NextResponse.json({
      success: true,
      rules,
      metrics: {
        totalAllTime,
        followGateTotal,
        byRule,
        recentLogs,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro ao listar regras.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rules } = body;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { success: false, error: 'O campo rules deve ser uma lista válida de regras.' },
        { status: 400 }
      );
    }

    // Persistência robusta (Memória + Disco Local + Redis)
    await saveAllRules(rules);

    return NextResponse.json({
      success: true,
      message: 'Regras de automação do Instagram atualizadas com sucesso!',
      rulesCount: rules.length,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro ao salvar regras.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
