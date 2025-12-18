const BASE = process.env.NEST_API_URL!;
const ADMIN_KEY = process.env.NEST_ADMIN_API_KEY!;

async function j(url: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      'X-Admin-Key': ADMIN_KEY,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  console.log(r.json())
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

// Encapsula rutas reales de Nest (ajusta paths a tus controladores)
export const nest = {
  auth: {
    // Este endpoint debe existir en tu Nest: valida credenciales y devuelve {user:{id,email,name,roles:[]}}
    login: (email: string, password: string) =>
      j(`${BASE}/admin-auth/login`, { method:'POST', body: JSON.stringify({ email, password }) }),
  },
  users: {
    list: (q?: string) => j(`${BASE}/admin/users${q?`?q=${encodeURIComponent(q)}`:''}`),
    assignServer: (userId:string, serverId:string) =>
      j(`${BASE}/admin/users/${userId}/server`, { method:'POST', body:JSON.stringify({ serverId }) }),
  },
  servers: {
    list: () => j(`${BASE}/admin/servers`),
  },
  alerts: {
    list: () => j(`${BASE}/admin/alerts`),
  }
};
