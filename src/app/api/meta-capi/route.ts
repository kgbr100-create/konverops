import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pixelId,
      accessToken,
      testEventCode,
      eventName,
      eventId,
      sourceUrl,
      customData,
    } = body;

    if (!pixelId || !eventName) {
      return NextResponse.json(
        { success: false, error: 'pixelId e eventName são obrigatórios.' },
        { status: 400 }
      );
    }

    // Identificação de rede e cabeçalhos para o User Data da Meta
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Extração dos cookies de rastreamento nativos da Meta (_fbp e _fbc)
    const cookieHeader = request.headers.get('cookie') || '';
    const fbpMatch = cookieHeader.match(/_fbp=([^;]+)/);
    const fbcMatch = cookieHeader.match(/_fbc=([^;]+)/);
    const fbp = fbpMatch ? fbpMatch[1] : undefined;
    const fbc = fbcMatch ? fbcMatch[1] : undefined;

    const tokenToUse =
      accessToken || process.env.META_ACCESS_TOKEN || process.env.META_CAPI_TOKEN;

    // Se houver token de acesso à Meta Graph API, envia o evento server-side (CAPI)
    if (tokenToUse) {
      const payload: Record<string, any> = {
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId, // ID idêntico ao disparado no navegador para deduplicação 100% perfeita
            event_source_url: sourceUrl || 'https://www.konverops.tech',
            action_source: 'website',
            user_data: {
              ...(clientIp ? { client_ip_address: clientIp } : {}),
              ...(userAgent ? { client_user_agent: userAgent } : {}),
              ...(fbp ? { fbp } : {}),
              ...(fbc ? { fbc } : {}),
            },
            custom_data: customData || {},
          },
        ],
      };

      if (testEventCode) {
        payload.test_event_code = testEventCode;
      }

      const metaRes = await fetch(
        `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${tokenToUse}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const metaJson = await metaRes.json();
      return NextResponse.json({
        success: true,
        capiDispatched: true,
        metaResponse: metaJson,
      });
    }

    // Se não tiver token CAPI cadastrado, o evento do navegador (Pixel fbq) já foi disparado
    return NextResponse.json({
      success: true,
      capiDispatched: false,
      message: 'Evento capturado no navegador; token CAPI de servidor não configurado.',
    });
  } catch (error) {
    console.error('Meta CAPI Dispatch Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao despachar evento Meta CAPI.' },
      { status: 500 }
    );
  }
}
