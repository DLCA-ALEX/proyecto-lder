import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SessionBootstrapInterceptor implements NestInterceptor {
  constructor(private readonly ds: DataSource) {}

  async upsertUserFromClaims(claims: any) {
    const idp = claims.idp || 'external';
    const externalId = claims.sub || claims.oid; // depende de tu IdP
    const email = (claims.email || '').toLowerCase();
    const name = claims.name || email || externalId;
    const ndaAccepted = !!claims.nda_accepted;
    const regDone = !!claims.registration_done;
    const rolesCsv = (claims.roles || '').toString();

    // UPSERT por (idp, external_id); también sincroniza email/name/flags
    const sql = `
      INSERT INTO portal.users (id, idp, external_id, email, name, nda_accepted, registration_done, updated_at, last_login_at)
      VALUES (gen_random_uuid(), $1, $2, COALESCE(NULLIF($3,''), email), $4, $5, $6, now(), now())
      ON CONFLICT (idp, external_id) DO UPDATE SET
        email = COALESCE(NULLIF(EXCLUDED.email,''), portal.users.email),
        name  = COALESCE(NULLIF(EXCLUDED.name,''), portal.users.name),
        nda_accepted = EXCLUDED.nda_accepted,
        registration_done = EXCLUDED.registration_done,
        updated_at = now(),
        last_login_at = now()
      RETURNING id;
    `;
    const res = await this.ds.query(sql, [idp, externalId, email, name, ndaAccepted, regDone]);
    const userId = res[0].id;

    // Sincroniza roles (opcional). Asume que rolesCsv es algo como "end_user,monitor"
    if (rolesCsv) {
      const roles = rolesCsv.split(',').map(r => r.trim()).filter(Boolean);
      if (roles.length) {
        await this.ds.query(`
          INSERT INTO portal.user_roles (user_id, role_id)
          SELECT $1, r.id
          FROM portal.roles r
          WHERE r.code = ANY($2::text[])
          ON CONFLICT DO NOTHING
        `, [userId, roles]);
      }
    }
    return { userId, rolesCsv, ndaAccepted, regDone };
  }

  async setRls(userId: string, rolesCsv: string) {
    await this.ds.query(`SET LOCAL "request.jwt.claims" = $1::text`, [
      JSON.stringify({ user_id: userId, roles: rolesCsv }),
    ]);
  }

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const claims = req.user; // viene del JwtStrategy
    if (!claims) return next.handle();

    const { userId, rolesCsv } = await this.upsertUserFromClaims(claims);
    // Reescribe req.user con nuestro user_id interno
    req.user = { user_id: userId, roles: rolesCsv };
    await this.setRls(userId, rolesCsv);
    return next.handle();
  }
}
