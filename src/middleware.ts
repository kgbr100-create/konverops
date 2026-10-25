import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite acesso à tela de login e rotas públicas
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout')
  ) {
    return NextResponse.next();
  }

  // Protege todas as rotas do painel /admin
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('konverops_admin_session')?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const parts = sessionCookie.split(':');
    if (parts.length !== 3) {
      const loginUrl = new URL('/admin/login', request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('konverops_admin_session');
      return res;
    }

    const [, expiresStr] = parts;
    const expiresAt = Number(expiresStr);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      const loginUrl = new URL('/admin/login', request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('konverops_admin_session');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
