import { NextResponse } from 'next/server';
import { verifyAdminCredentials, createSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuário e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const check = await verifyAdminCredentials(username, password);
    if (!check.success) {
      return NextResponse.json(
        { success: false, error: check.error || 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // Cria token seguro de 30 dias
    const token = await createSessionToken(username);

    const response = NextResponse.json({
      success: true,
      message: 'Autenticado com sucesso.',
      user: {
        username: 'kelvin',
        name: 'Kelvin Gonzaga',
      },
    });

    // Salva cookie seguro HTTP-Only
    response.cookies.set('konverops_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 dias
    });

    return response;
  } catch (error) {
    console.error('Auth Login Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro no servidor de autenticação.' },
      { status: 500 }
    );
  }
}
