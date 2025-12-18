// middleware.ts  ← versión que FUNCIONA con esta plantilla exacta
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('Middleware ejecutándose en:', request.nextUrl.pathname);
  console.log('Cookies:', request.cookies.getAll().map(c => c.name));

  const token = request.cookies.get('admin_token')?.value;

  // Ruta raíz y cualquier ruta que NO sea /admin-login
  if (request.nextUrl.pathname !== '/admin-login') {
    if (!token) {
      console.log('No hay token → redirigiendo a login');
      const loginUrl = new URL('/admin-login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    } else {
      console.log('Token encontrado → permitiendo acceso');
    }
  }

  // Si está en /admin-login y tiene token → va al dashboard
  if (request.nextUrl.pathname === '/admin-login' && token) {
    console.log('Ya logueado → redirigiendo al dashboard');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a TODO excepto archivos estáticos y api routes internas
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  // solo esto basta
  ],
};