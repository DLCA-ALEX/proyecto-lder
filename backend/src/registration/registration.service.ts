// src/registration/registration.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

type RegistrationPayload = {
  username?: string;      // usuario de sesión (portal)
  real_name?: string;     // nombre real capturado en el form
  email?: string;         // capturado (obligatorio)
  company?: string;
  role?: string;
  domain?: string;
  phone?: string;
  whatsapp?: string;
  ndaAccepted?: boolean;  // true desde el form
};

@Injectable()
export class RegistrationService {
  constructor(private readonly ds: DataSource) {}

  async get(userId: string) {
    const rows = await this.ds.query(
      `select payload
         from portal.user_registrations
        where user_id=$1
        order by created_at desc
        limit 1`,
      [userId],
    );
    return rows[0] ? { data: rows[0].payload } : { data: null };
  }

  async save(userIdFromJwt: string, payload: RegistrationPayload) {
    return this.ds.transaction(async (trx) => {
      try {
        // 1) UPSERT a users (primero): resolver por (email, domain)
        const upsertRows = await trx.query(
          `
          with incoming as (
            select
              lower(nullif(($1::jsonb)->>'email','')) as email_l,
              nullif(($1::jsonb)->>'real_name','')     as real_name,
              nullif(($1::jsonb)->>'company','')       as company,
              nullif(($1::jsonb)->>'role','')          as role_title,
              nullif(($1::jsonb)->>'domain','')        as domain,
              nullif(($1::jsonb)->>'phone','')         as phone,
              nullif(($1::jsonb)->>'whatsapp','')      as whatsapp,
              nullif(($1::jsonb)->>'username','')      as username,
              (($1::jsonb)->>'ndaAccepted')::boolean   as nda_accepted
          ),
          resolved as (
            select
              coalesce(
                -- 👉 ahora resolvemos SOLO si coincide email + domain (mismo server)
                (select u.id
                   from portal.users u
                   join incoming i
                     on lower(u.email) = i.email_l
                    and coalesce(u.domain,'') = coalesce(i.domain,'')
                 limit 1),
                $2::uuid
              ) as id
          ),
          upsert as (
            insert into portal.users (
              id, email,
              name,
              username,
              real_name,
              company, role_title, domain, phone, whatsapp,
              idp, external_id, nda_accepted, registration_done,
              created_at, updated_at
            )
            select
              (select id from resolved),
              (select email_l  from incoming),
              coalesce( (select username  from incoming), 'usuario' ),   -- name = username
              (select username  from incoming),
              (select real_name from incoming),
              (select company   from incoming),
              (select role_title from incoming),
              (select domain    from incoming),
              (select phone     from incoming),
              (select whatsapp  from incoming),
              'nlanube',
              (select username  from incoming),   -- external_id = username
              (select nda_accepted from incoming),
              true,
              now(), now()
            on conflict (id) do update set
              email             = coalesce(EXCLUDED.email, portal.users.email),
              name              = coalesce(nullif(EXCLUDED.name,''), portal.users.name),
              username          = coalesce(nullif(EXCLUDED.username,''), portal.users.username),
              real_name         = coalesce(nullif(EXCLUDED.real_name,''), portal.users.real_name),
              company           = coalesce(nullif(EXCLUDED.company,''), portal.users.company),
              role_title        = coalesce(nullif(EXCLUDED.role_title,''), portal.users.role_title),
              domain            = coalesce(nullif(EXCLUDED.domain,''), portal.users.domain),
              phone             = coalesce(nullif(EXCLUDED.phone,''), portal.users.phone),
              whatsapp          = coalesce(nullif(EXCLUDED.whatsapp,''), portal.users.whatsapp),
              idp               = coalesce(EXCLUDED.idp, portal.users.idp),
              external_id       = coalesce(nullif(EXCLUDED.external_id,''), portal.users.external_id),
              nda_accepted      = coalesce(EXCLUDED.nda_accepted, portal.users.nda_accepted),
              registration_done = true,
              updated_at        = now()
            returning id
          )
          select id from upsert
          `,
          [payload, userIdFromJwt],
        );

        const [{ id: userId }] = upsertRows;

        // 2) Bitácora DESPUÉS del upsert (evita FK)
        await trx.query(
          `insert into portal.user_registrations (user_id, payload)
           values ($1, $2::jsonb)`,
          [userId, payload],
        );

        return { id: userId };
      } catch (e: any) {
        // Unicidad global (si por accidente siguiera activa)
        if (e?.code === '23505' && (e?.constraint === 'users_email_lower_uidx' || e?.constraint === 'users_email_key')) {
          const correo = payload.email || 'este correo';
          throw new ConflictException(`El correo ${correo} ya existe de forma global. Quita esa unicidad y usa (domain, lower(email)).`);
        }
      
        // Unicidad por server: (domain, lower(email))
        if (e?.code === '23505' && e?.constraint === 'users_domain_email_uidx') {
          const server = payload.domain || 'este servidor';
          const correo = payload.email || 'este correo';
          throw new ConflictException(`El correo ${correo} ya está en uso en ${server}.`);
        }
      
        // Unicidad de identidad por server: (idp, domain, external_id=username)
        if (
          e?.code === '23505' &&
          (e?.constraint === 'users_idp_domain_external_uidx' || e?.constraint === 'users_idp_domain_external_uniq')
        ) {
          const correo = payload.email || 'este correo';

          const server = payload.domain || 'este servidor';
          const user   = payload.username || 'este usuario';
          throw new ConflictException(
            `El correo "${correo}" ya existe en ${server}. Inicia sesión con ese usuario o elige otro correo.`
          );
        }
      
        // Cualquier otro error -> 500
        throw e;
      }
    });
  }
}
