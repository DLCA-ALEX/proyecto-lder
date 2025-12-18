import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { nest } from '@/lib/api';
import { canAccessPanel } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  console.log("es el req",req)
  if (!email || !password) return NextResponse.json({ error:'Missing' }, { status:400 });

  try {
    const { user } = await nest.auth.login(email, password);
    console.log(user)
    if (!user || !canAccessPanel(user.roles || [])) {
      return NextResponse.json({ error:'Unauthorized' }, { status:401 });
    }
    const s = await getSession();
    s.user = user;
    await s.save();
    return NextResponse.json({ ok:true, user });
  } catch (e:any) {
    return NextResponse.json({ error:'Invalid' }, { status:401 });
  }
}
