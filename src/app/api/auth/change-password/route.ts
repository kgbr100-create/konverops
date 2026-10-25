import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, updateAdminPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('konverops_admin_session')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado.' },
        { status: 401 }
      );
    }

    const auth = await verifySessionToken(token);
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: 'Sessão expirada. Faça login novamente.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Senha atual e nova senha são obrigatórias.' },
        { status: 400 }
      );
    }

    const result = await updateAdminPassword(currentPassword, newPassword);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Senha de administrador atualizada com sucesso!',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar senha.' },
      { status: 500 }
    );
  }
}
