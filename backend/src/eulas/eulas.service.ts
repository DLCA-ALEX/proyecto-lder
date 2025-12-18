import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateEulaDto } from './dto/create-eula.dto';
import { UpdateEulaDto } from './dto/update-eula.dto';
import { ImportEulaDto } from './dto/import-eula.dto';
import { IdOficialType } from './eula.entity';

@Injectable()
export class EulasService {
  constructor(private readonly ds: DataSource) {}

  // ----------------- Helpers -----------------
  private trimOrNull(v?: string | null) {
    const s = (v ?? '').toString().trim();
    return s.length ? s : null;
  }

  /** Toma el RAW desde server_id_raw (obligatorio, string no vacío) */
  private ensureRawFromDto(input: any) {
    const raw = this.trimOrNull(input.server_id_raw ?? null);
    if (!raw) throw new BadRequestException('server_id_raw es requerido');
    return raw; // ya NO validamos que sea numérico
  }

  /** Shape final que insertamos/actualizamos (SIEMPRE desde server_id_raw) */
  private buildPrepared(input: any): PreparedEula {
    const server_id = this.ensureRawFromDto(input);     // clave = RAW
    const server_url = this.trimOrNull(input.server_url ?? null);

    const contrato_url   = this.trimOrNull(input.contrato_url ?? null);
    const id_oficial_url = this.trimOrNull(input.id_oficial_url ?? null);
    const id_oficial: IdOficialType =
      (input.id_oficial as IdOficialType) ?? IdOficialType.SIN_ID;

    // Regla: si hay url de id, o tipo INE/PASAPORTE => identificacion_recibida=true
    const identificacion_recibida =
      !!id_oficial_url ||
      id_oficial === IdOficialType.INE ||
      id_oficial === IdOficialType.PASAPORTE ||
      !!input.identificacion_recibida;

    return {
      server_id,  // RAW (string)
      server_url, // URL (string|null)
      distribuidor: this.trimOrNull(input.distribuidor ?? null),
      cliente: this.trimOrNull(input.cliente ?? null),
      contrato_firmado: !!input.contrato_firmado,
      contrato_url,
      identificacion_recibida,
      id_oficial,
      id_oficial_url,
      fuente_archivo: this.trimOrNull(input.fuente_archivo ?? null),
    };
  }

  // ----------------- CRUD -----------------
  async findAll(params?: {
    q?: string;
    firmado?: 'true' | 'false';
    idrec?: 'true' | 'false';
    limit?: number;
    offset?: number;
  }) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = Math.max(params?.offset ?? 0, 0);

    const wh: string[] = [];
    const args: any[] = [];

    if (params?.firmado) {
      args.push(params.firmado === 'true');
      wh.push(`contrato_firmado = $${args.length}`);
    }
    if (params?.idrec) {
      args.push(params.idrec === 'true');
      wh.push(`identificacion_recibida = $${args.length}`);
    }
    if (params?.q) {
      const like = `%${params.q}%`;
      args.push(like, like, like, like);
      wh.push(
        `(server_id ILIKE $${args.length - 3} OR server_url ILIKE $${args.length - 2} OR ` +
        `cliente ILIKE $${args.length - 1} OR distribuidor ILIKE $${args.length})`,
      );
    }

    const where = wh.length ? `WHERE ${wh.join(' AND ')}` : '';

    const data = await this.ds.query(
      `SELECT id, server_id, server_url, distribuidor, cliente, contrato_firmado, contrato_url,
              identificacion_recibida, id_oficial, id_oficial_url, fuente_archivo,
              created_at, updated_at
         FROM portal.eulas
        ${where}
        ORDER BY updated_at DESC
        OFFSET $${args.push(skip)} LIMIT $${args.push(take)}`,
      args,
    );

    const [{ count }] = await this.ds.query(
      `SELECT count(*)::int AS count FROM portal.eulas ${where}`,
      args.slice(0, Math.max(0, args.length - 2)),
    );

    return { total: count, data };
  }

  async findOne(id: string) {
    const rows = await this.ds.query(
      `SELECT id, server_id, server_url, distribuidor, cliente, contrato_firmado, contrato_url,
              identificacion_recibida, id_oficial, id_oficial_url, fuente_archivo,
              created_at, updated_at
         FROM portal.eulas
        WHERE id = $1`,
      [id],
    );
    if (!rows.length) throw new NotFoundException('EULA no encontrada');
    return rows[0];
  }

  async create(dto: CreateEulaDto) {
    const d = this.buildPrepared(dto);

    const rows = await this.ds.query(
      `INSERT INTO portal.eulas
        (server_id, server_url, distribuidor, cliente, contrato_firmado, contrato_url,
         identificacion_recibida, id_oficial, id_oficial_url, fuente_archivo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, server_id, server_url, distribuidor, cliente, contrato_firmado, contrato_url,
                 identificacion_recibida, id_oficial, id_oficial_url, fuente_archivo,
                 created_at, updated_at`,
      [
        d.server_id,
        d.server_url,
        d.distribuidor,
        d.cliente,
        d.contrato_firmado,
        d.contrato_url,
        d.identificacion_recibida,
        d.id_oficial,
        d.id_oficial_url,
        d.fuente_archivo,
      ],
    );
    return rows[0];
  }

  async update(id: string, dto: UpdateEulaDto) {
    const current = await this.findOne(id);
    const patched = this.buildPrepared({
      ...current,
      ...dto,
      // Si no llega server_id_raw en PATCH, usamos el actual (server_id)
      server_id_raw: (dto as any).server_id_raw ?? current.server_id,
    });

    const rows = await this.ds.query(
      `UPDATE portal.eulas
          SET server_id = $2,
              server_url = $3,
              distribuidor = $4,
              cliente = $5,
              contrato_firmado = $6,
              contrato_url = $7,
              identificacion_recibida = $8,
              id_oficial = $9,
              id_oficial_url = $10,
              fuente_archivo = $11,
              updated_at = now()
        WHERE id = $1
        RETURNING id, server_id, server_url, distribuidor, cliente, contrato_firmado, contrato_url,
                  identificacion_recibida, id_oficial, id_oficial_url, fuente_archivo,
                  created_at, updated_at`,
      [
        id,
        patched.server_id,
        patched.server_url,
        patched.distribuidor,
        patched.cliente,
        patched.contrato_firmado,
        patched.contrato_url,
        patched.identificacion_recibida,
        patched.id_oficial,
        patched.id_oficial_url,
        patched.fuente_archivo,
      ],
    );
    return rows[0];
  }

  async remove(id: string) {
    await this.ds.query(`DELETE FROM portal.eulas WHERE id = $1`, [id]);
    return { ok: true };
  }

  // ----------------- Import masivo (upsert por server_id RAW) -----------------
  async import(dto: ImportEulaDto, caseInsensitive = false) {
    // Requerimos filas con server_id_raw presente
    const rows = (dto.rows ?? []).filter((r) =>
      (r as any).server_id_raw?.toString().trim().length > 0
    );
    if (!rows.length) {
      throw new BadRequestException('rows.*.server_id_raw es requerido');
    }

    const prepared: PreparedEula[] = rows.map((r) => this.buildPrepared(r));

    if (caseInsensitive) {
      try {
        let affected = 0;
        await this.ds.transaction(async (trx) => {
          const chunkSize = 500;
          for (let i = 0; i < prepared.length; i += chunkSize) {
            const chunk = prepared.slice(i, i + chunkSize);

            const valuesSql = chunk
              .map(
                (_r, idx) =>
                  `($${idx * 10 + 1},$${idx * 10 + 2},$${idx * 10 + 3},$${idx * 10 + 4},$${idx * 10 + 5},$${idx * 10 + 6},$${idx * 10 + 7},$${idx * 10 + 8},$${idx * 10 + 9},$${idx * 10 + 10})`,
              )
              .join(',');

            const args: any[] = [];
            chunk.forEach((r) => {
              args.push(
                r.server_id,
                r.server_url,
                r.distribuidor ?? null,
                r.cliente ?? null,
                r.contrato_firmado,
                r.contrato_url,
                r.identificacion_recibida,
                r.id_oficial,
                r.id_oficial_url,
                r.fuente_archivo ?? null,
              );
            });

            const sql = `
              INSERT INTO portal.eulas
                (server_id, server_url, distribuidor, cliente, contrato_firmado, contrato_url,
                 identificacion_recibida, id_oficial, id_oficial_url, fuente_archivo)
              VALUES ${valuesSql}
              ON CONFLICT ((lower(server_id))) DO UPDATE
                 SET server_url = EXCLUDED.server_url,
                     distribuidor = EXCLUDED.distribuidor,
                     cliente = EXCLUDED.cliente,
                     contrato_firmado = EXCLUDED.contrato_firmado,
                     contrato_url = EXCLUDED.contrato_url,
                     identificacion_recibida = EXCLUDED.identificacion_recibida,
                     id_oficial = EXCLUDED.id_oficial,
                     id_oficial_url = EXCLUDED.id_oficial_url,
                     fuente_archivo = EXCLUDED.fuente_archivo,
                     updated_at = now()
              RETURNING 1
            `;
            const res = await trx.query(sql, args);
            affected += res.length;
          }
        });
        return { affected };
      } catch {
        // Si no existe el UNIQUE, caemos al merge manual
      }
    }

    // -------- Merge manual --------
    type EulaLite = { id: string; server_id: string };

    let affected = 0;
    await this.ds.transaction(async (trx) => {
      const keys = prepared.map((r) => (caseInsensitive ? r.server_id.toLowerCase() : r.server_id));
      const inParams = keys.map((_, i) => `$${i + 1}`).join(',');
      const existing = (await trx.query(
        `SELECT id, server_id
           FROM portal.eulas
          WHERE ${caseInsensitive ? `lower(server_id) IN (${inParams})` : `server_id IN (${inParams})`}`,
        keys,
      )) as EulaLite[];

      const byKey = new Map<string, EulaLite>(
        existing.map((e) => [caseInsensitive ? e.server_id.toLowerCase() : e.server_id, e]),
      );

      for (const r of prepared) {
        const key = caseInsensitive ? r.server_id.toLowerCase() : r.server_id;
        const cur = byKey.get(key);

        if (cur) {
          await trx.query(
            `UPDATE portal.eulas
                SET server_url=$2,
                    distribuidor=$3, cliente=$4, contrato_firmado=$5, contrato_url=$6,
                    identificacion_recibida=$7, id_oficial=$8, id_oficial_url=$9,
                    fuente_archivo=$10, updated_at=now()
              WHERE id=$1`,
            [
              cur.id,
              r.server_url,
              r.distribuidor ?? null,
              r.cliente ?? null,
              r.contrato_firmado,
              r.contrato_url,
              r.identificacion_recibida,
              r.id_oficial,
              r.id_oficial_url,
              r.fuente_archivo ?? null,
            ],
          );
          affected++;
        } else {
          const ins = await trx.query(
            `INSERT INTO portal.eulas
               (server_id, server_url, distribuidor, cliente, contrato_firmado, contrato_url,
                identificacion_recibida, id_oficial, id_oficial_url, fuente_archivo)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING id`,
            [
              r.server_id,
              r.server_url,
              r.distribuidor ?? null,
              r.cliente ?? null,
              r.contrato_firmado,
              r.contrato_url,
              r.identificacion_recibida,
              r.id_oficial,
              r.id_oficial_url,
              r.fuente_archivo ?? null,
            ],
          );
          affected += ins.length;
        }
      }
    });

    return { affected };
  }
}

/** Estructura preparada para insert/update */
type PreparedEula = {
  server_id: string;         // = server_id_raw (string)
  server_url: string | null; // URL
  distribuidor: string | null;
  cliente: string | null;
  contrato_firmado: boolean;
  contrato_url: string | null;
  identificacion_recibida: boolean;
  id_oficial: IdOficialType;
  id_oficial_url: string | null;
  fuente_archivo: string | null;
};
