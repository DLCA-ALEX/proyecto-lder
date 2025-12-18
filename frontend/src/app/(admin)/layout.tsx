// ESTE ARCHIVO ES UN SERVER COMPONENT (NO TIENE 'use client')
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import ClientLayout from './ClientLayout';
export const dynamic = 'force-dynamic'; // necesario para que cookies() funcione

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    redirect('/auth/admin-login');
  }

  // Validar expiración
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      redirect('/auth/admin-login');
    }
  } catch {
    redirect('/auth/admin-login');
  }

  // Renderizamos el layout CLIENT con los children
  return <ClientLayout>{children}</ClientLayout>;
}