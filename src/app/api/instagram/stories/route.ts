import { NextRequest, NextResponse } from 'next/server';
import { publishStory } from '@/lib/instagram/stories';

const ADMIN_SECRET =
  process.env.ADMIN_SECRET || 'konverops-admin-auth-secret-key-2026-kelvin';

export async function POST(request: NextRequest) {
  try {
    // Autenticação simples por Bearer token ou header de API key
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (token !== ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl, videoUrl, caption } = body;

    if (!imageUrl && !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Forneça imageUrl ou videoUrl para publicar.' },
        { status: 400 }
      );
    }

    const result = await publishStory({ imageUrl, videoUrl, caption });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      storyId: result.storyId,
      message: 'Story publicado com sucesso no Instagram!',
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro ao processar Story.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
