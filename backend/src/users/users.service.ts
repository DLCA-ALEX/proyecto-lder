import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersLoginDto } from './dto/users-login.dto';
import { ListUsersQuery } from './dto/list-users.query';

@Injectable()
export class UsersService {
  constructor(private readonly ds: DataSource) {}

  // ========= Helpers =========

  /** Normaliza una URL o dominio a solo hostname (sin puerto ni slash) */
  private extractDomain(input?: string | null): string | null {
    if (!input) return null;
    const s = String(input).trim();
    if (!s) return null;
    try {
      const u = new URL(s.includes('://') ? s : `http://${s}`);
      return u.hostname.toLowerCase();
    } catch {
      return (
        s
          .replace(/^https?:\/\//i, '')
          .replace(/\/+$/, '')
          .toLowerCase() || null
      );
    }
  }

  /** Mapea accepted → mode */
  private mapAcceptedToMode(
    accepted?: 'yes' | 'no' | 'any',
  ): 'nda' | 'no-nda' | 'all' | null {
    if (!accepted) return null;
    if (accepted === 'yes') return 'nda';
    if (accepted === 'no') return 'no-nda';
    return 'all';
  }

  private getAuthBaseUrl(): string {
    return process.env.AUTH_BASE_URL ?? 'https://actualisat-api-dev.nlanube.mx';
  }

  /** Llama a /auth/portal-login por HTTP nativo (sin Axios). SIEMPRE manda las 4 llaves. */
  private async portalLoginViaFetch(payload: {
    username: string;
    domain: string;
    email: string;
    name: string;
  }) {
    const url = `${this.getAuthBaseUrl()}/api/auth/portal-login`;
    const res = await (global as any).fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), // ← exactamente esas 4 llaves
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      throw new ForbiddenException(data?.error ?? 'portal-login failed');
    }
    return {
      token: data.token as string,
      userId: data.user_id as string,
      rolesCsv: data.roles as string,
    };
  }

  /** Roles permitidos para listar (configurable por env) */
  private getAllowedRoles(): string[] {
    const csv = process.env.USERS_ALLOWED_ROLES ?? 'admin';
    return csv.split(',').map((r) => r.trim()).filter(Boolean);
  }

  // ========= Orquestador POST /users =========

  /**
   * Login con 4 llaves fijas (domain siempre el de login) + filtro por domainUrl si viene.
   * - accepted: 'yes' | 'no' | 'any'  (prioridad sobre mode)
   * - domainUrl: si viene, se usa SOLO como filtro; el login respeta "domain" de las 4 llaves
   * - Si NO envías `limit`, NO aplica LIMIT (devuelve TODO).
   */
  async loginAndList(dto: UsersLoginDto, clientIp: string) {
    // A) Dominio para LOGIN (siempre de las 4 llaves)
    const loginDomain = (dto.domain ?? '').trim();
    const username = dto.username?.trim();
    const email = dto.email?.trim();
    const name = dto.name?.trim();

    if (!username || !loginDomain || !email || !name) {
      type MissingKey = 'username' | 'domain' | 'email' | 'name';
      const missing: MissingKey[] = [];
      if (!username) missing.push('username');
      if (!loginDomain) missing.push('domain');
      if (!email) missing.push('email');
      if (!name) missing.push('name');

      throw new BadRequestException(
        `Missing required fields for portal-login: ${missing.join(', ')}`,
      );
    }

    // B) Dominio para FILTRO (si viene domainUrl, tiene prioridad)
    const filterDomain =
      this.extractDomain(dto.domainUrl) || this.extractDomain(dto.domain) || null;

    // 1) Login interno (mandando EXACTAMENTE esas 4 llaves del payload fijo)
    const login = await this.portalLoginViaFetch({
      username,
      domain: loginDomain,
      email,
      name,
    });

    // 2) Validar rol permitido
    const roles = (login.rolesCsv ?? '').split(',').map((s) => s.trim());
    const allowed = this.getAllowedRoles();
    const hasAllowed = roles.some((r) => allowed.includes(r));
    if (!hasAllowed) {
      throw new ForbiddenException('role admin required');
    }

    // 3) IP allow/deny desde BD
    console.log('[UsersService] IP recibida →', clientIp);
    const [{ ok }] = await this.ds.query(
      'SELECT portal.is_ip_allowed_simple($1::inet, $2::text) AS ok',
      [clientIp, '/api/users'],
    );
    if (!ok) throw new ForbiddenException('IP not allowed for this route');

    // 4) accepted → mode (si viene accepted, tiene prioridad)
    const effectiveMode =
      this.mapAcceptedToMode(dto.accepted) ?? dto.mode ?? 'all';

    // 5) Ejecuta listado (si no viene limit, devuelve TODO)
    const data = await this.findAll({
      mode: effectiveMode,
      q: dto.q ?? null,
      domain: filterDomain, // ← filtro por dominio normalizado desde domainUrl (si hay)
      offset: dto.offset,
      limit:
        (dto as any).hasOwnProperty('limit') && dto.limit !== undefined
          ? dto.limit
          : undefined,
      orderBy: dto.orderBy,
      orderDir: dto.orderDir,
    } as any);

    return {
      ok: true,
      token: login.token,
      user_id: login.userId,
      roles: login.rolesCsv,
      effectiveMode,
      normalizedLoginDomain: loginDomain.toLowerCase(),
      normalizedFilterDomain: filterDomain,
      result: data,
    };
  }

  // ========= Listado con/sin paginación =========

  async findAll(params: Omit<ListUsersQuery, 'limit'> & { limit?: number }) {
    const wh: string[] = [];
    const args: any[] = [];

    switch (params.mode) {
      case 'nda':
        wh.push(`nda_accepted = true`);
        break;
      case 'registered':
        wh.push(`registration_done = true`);
        break;
      case 'no-nda':
        wh.push(`coalesce(nda_accepted,false) = false`);
        break;
      case 'all':
      default:
        break;
    }

    if (params.domain) {
      args.push(params.domain);
      wh.push(`domain = $${args.length}`);
    }

    if (params.q) {
      const like = `%${params.q}%`;
      args.push(like, like, like, like, like);
      wh.push(
        `(email ILIKE $${args.length - 4}
          OR name ILIKE $${args.length - 3}
          OR username ILIKE $${args.length - 2}
          OR real_name ILIKE $${args.length - 1}
          OR company ILIKE $${args.length})`,
      );
    }

    const where = wh.length ? `WHERE ${wh.join(' AND ')}` : '';
    const orderBy = params.orderBy ?? 'updated_at';
    const orderDir =
      (params.orderDir ?? 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const fields = `
      id, email, username, name, real_name, company, role_title, domain,
      phone, whatsapp, nda_accepted, registration_done,
      last_login_at, created_at, updated_at
    `;

    // Con/sin paginación
    let pagingSql = '';
    const countArgs = [...args];

    if (params.limit !== undefined && params.limit !== null) {
      const take = Math.min(Number(params.limit) || 0, 200);
      const skip = Math.max(Number(params.offset) || 0, 0);
      pagingSql = ` OFFSET $${args.push(skip)} LIMIT $${args.push(take)} `;
    }

    const data = await this.ds.query(
      `
      SELECT ${fields}
      FROM portal.users
      ${where}
      ORDER BY ${orderBy} ${orderDir}, id ASC
      ${pagingSql}
      `,
      args,
    );

    const [{ count }] = await this.ds.query(
      `SELECT count(*)::int AS count FROM portal.users ${where}`,
      countArgs,
    );

    return { total: count, data };
  }

  /** Usuario por ID (campos seguros) */
  async findOneSafe(id: string) {
    const rows = await this.ds.query(
      `
      SELECT id, email, username, name, real_name, company, role_title, domain,
             phone, whatsapp, nda_accepted, registration_done,
             last_login_at, created_at, updated_at
      FROM portal.users
      WHERE id = $1
      `,
      [id],
    );
    return rows[0] ?? null;
  }
}
