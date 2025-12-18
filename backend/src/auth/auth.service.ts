// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly ds: DataSource) {}

  private signJwt(payload: any) {
    const secret = process.env.JWT_SECRET!;
    return jwt.sign(payload, secret, {
      issuer: process.env.JWT_ISS || 'actualisat',
      audience: process.env.JWT_AUD || 'portal',
      expiresIn: '8h',
    });
  }

  /**
   * Clave estable = (idp, domain, external_id)
   * - idp fijo: 'nlanube'
   * - domain en minúsculas ('' permitido)
   * - external_id = username en minúsculas
   * - email = dto.email || `${external}@${domain||'local'}`
   */
  async portalLogin(dto: { username: string; domain?: string; email?: string; name?: string }) {
    const idp      = 'nlanube';

    const username = (dto.username || '').trim();
    if (!username) throw new Error('username requerido');

    const domain   = (dto.domain ?? '').trim().toLowerCase();         // puede ser ''
    const external = username.toLowerCase();

    const email    = (dto.email
      ? String(dto.email).trim().toLowerCase()
      : (domain ? `${external}@${domain}` : `${external}@local`));

    const display  = (dto.name || username).trim();

    // Upsert SIN depender de constraint ni ON CONFLICT:
    // 1) updated: intenta actualizar si ya existe (match normalizado)
    // 2) inserted: inserta solo si NO existe
    // 3) regresa el id (de updated o inserted)
    const rows = await this.ds.query(
      `
      with incoming as (
        select
          $1::text as idp,
          $2::text as domain,
          $3::text as external_id,
          $4::text as email,
          $5::text as name
      ),
      updated as (
        update portal.users u
           set /* email      = coalesce(i.email, u.email),  -- ← QUITADO para no pisar correo en login */
               name       = coalesce(nullif(i.name, ''), u.name),
               updated_at = now()
          from incoming i
         where lower(u.idp) = lower(i.idp)
           and lower(coalesce(u.domain, '')) = lower(coalesce(i.domain, ''))
           and lower(coalesce(u.external_id, '')) = lower(coalesce(i.external_id, ''))
      returning u.id
      ),
      inserted as (
        insert into portal.users (id, idp, domain, external_id, email, name, created_at, updated_at)
        select gen_random_uuid(), i.idp, i.domain, i.external_id, i.email, i.name, now(), now()
          from incoming i
         where not exists (
                select 1 from portal.users u
                 where lower(u.idp) = lower(i.idp)
                   and lower(coalesce(u.domain, '')) = lower(coalesce(i.domain, ''))
                   and lower(coalesce(u.external_id, '')) = lower(coalesce(i.external_id, ''))
               )
        returning id
      )
      select id from updated
      union all
      select id from inserted
      limit 1
      `,
      [idp, domain, external, email, display],
    );

    const userId: string = rows[0]?.id;
    if (!userId) throw new Error('No se pudo obtener el id del usuario');

    // Asegurar rol por defecto
    await this.ds.query(
      `insert into portal.user_roles (user_id, role_id)
         select $1, r.id
           from portal.roles r
          where r.code = 'end_user'
      on conflict do nothing`,
      [userId],
    );

    const rolesRows = await this.ds.query(
      `select coalesce(string_agg(r.code, ','), 'end_user') as roles
         from portal.user_roles ur
         join portal.roles r on r.id = ur.role_id
        where ur.user_id = $1`,
      [userId],
    );

    const rolesCsv = rolesRows[0]?.roles || 'end_user';
    const token    = this.signJwt({ user_id: userId, roles: rolesCsv });

    return { token, userId, rolesCsv };
  }
}

