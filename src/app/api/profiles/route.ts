import { NextResponse } from 'next/server';
import { getClientsRecord, saveClientProfile, deleteClientProfile } from '@/lib/profiles-store';
import type { ClientProfile } from '@/data/profiles';

export async function GET() {
  try {
    const clientsRecord = await getClientsRecord();
    const profiles = Object.values(clientsRecord);
    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar perfis de clientes.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: ClientProfile = await request.json();

    if (!body.slug) {
      return NextResponse.json(
        { success: false, error: 'O slug (URL) da página é obrigatório.' },
        { status: 400 }
      );
    }

    // Normalização básica do slug
    const normalizedSlug = body.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');

    const profileToSave: ClientProfile = {
      ...body,
      slug: normalizedSlug,
      footerUrl: body.footerUrl || `konverops.tech/${normalizedSlug}`,
      banners: body.banners || [],
    };

    await saveClientProfile(profileToSave);

    return NextResponse.json({ success: true, profile: profileToSave });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao salvar perfil de cliente.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug não informado para exclusão.' },
        { status: 400 }
      );
    }

    if (slug === 'kelvin') {
      return NextResponse.json(
        { success: false, error: 'O perfil mestre do fundador (kelvin) não pode ser excluído.' },
        { status: 403 }
      );
    }

    const deleted = await deleteClientProfile(slug);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedSlug: slug });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Falha ao excluir perfil.' },
      { status: 500 }
    );
  }
}
