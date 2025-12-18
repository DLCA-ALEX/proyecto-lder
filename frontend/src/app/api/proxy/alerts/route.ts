import { NextResponse } from 'next/server';
import { nest } from '@/lib/api';

export async function GET() {
  const data = await nest.alerts.list();
  return NextResponse.json(data);
}
