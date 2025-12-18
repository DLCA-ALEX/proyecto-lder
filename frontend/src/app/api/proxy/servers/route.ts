import { NextResponse } from 'next/server';
import { nest } from '@/lib/api';

export async function GET() {
  const data = await nest.servers.list();
  return NextResponse.json(data);
}
