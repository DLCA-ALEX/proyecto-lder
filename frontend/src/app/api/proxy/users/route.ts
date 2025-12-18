import { NextResponse } from 'next/server';
import { nest } from '@/lib/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || undefined;
  const data = await nest.users.list(q);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { action, userId, serverId } = await req.json();
  if (action === 'assignServer' && userId && serverId) {
    const data = await nest.users.assignServer(userId, serverId);
    return NextResponse.json(data);
  }
  return NextResponse.json({ error:'Bad request' }, { status:400 });
}
