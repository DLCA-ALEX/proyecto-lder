import { SessionOptions, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: process.env.IRON_SESSION_COOKIE_NAME || 'nladmin.sid',
  cookieOptions: { secure: process.env.NODE_ENV === 'production' },
};

export type SessionUser = { id: string; email: string; name: string; roles: string[] };
export type SessionData = { user?: SessionUser };

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}