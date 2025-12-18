// src/invoices/invoices.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class InvoicesService {
  constructor(private readonly ds: DataSource) {}

  async uploadProofFromUser(dto: {
    username: string;
    domain: string;
    file_base64: string;
    filename?: string;
    mime_type?: string;
    invoice_id?: string;
  }) {
    const {
      username,
      domain,
      file_base64,
      mime_type = 'application/octet-stream',
      invoice_id: provided_invoice_id,
    } = dto;

    // Validaciones básicas
    if (!username || !domain) throw new BadRequestException('username y domain requeridos');
    if (!file_base64) throw new BadRequestException('file_base64 requerido');

    // 1. Resolver user_id y server_id
    const userResult = await this.ds.query(
      `SELECT u.id AS user_id, s.id AS server_id
       FROM portal.users u
       JOIN portal.servers s ON lower(u.domain) = lower(s.name)
       WHERE lower(u.username) = lower($1)
         AND lower(u.domain) = lower($2)
       LIMIT 1`,
      [username.trim(), domain.trim()],
    );

    if (!userResult.length) {
      throw new NotFoundException('Usuario o dominio no encontrado');
    }

    const { user_id, server_id } = userResult[0];
    const fileUrl = `data:${mime_type};base64,${file_base64}`;

    let invoice_id = provided_invoice_id;

    if (!invoice_id) {
      // CREAR nueva factura → amount_cents = 0 (es comprobante de cortesía)
      const res = await this.ds.query(
        `INSERT INTO portal.invoices
         (server_id, user_id, uploaded_by, status, file_url, amount_cents, currency, uploaded_at)
         VALUES ($1, $2, $2, 'pending', $3, 0, 'MXN', NOW())
         RETURNING id`,
        [server_id, user_id, fileUrl],
      );
      invoice_id = res[0].id;
    } else {
      // ACTUALIZAR existente
      const res = await this.ds.query(
        `UPDATE portal.invoices
         SET status = 'pending',
             uploaded_by = $1,
             file_url = $2,
             uploaded_at = NOW()
         WHERE id = $3 AND server_id = $4
         RETURNING id`,
        [user_id, fileUrl, invoice_id, server_id],
      );

      if (!res.length) {
        throw new ForbiddenException('Factura no encontrada o no pertenece a tu servidor');
      }
    }

    // Alerta
    await this.ds.query(
      `INSERT INTO portal.alerts 
         (user_id, server_id, alert_type, message, created_at, acknowledged)
       VALUES 
         ($1, $2, 'payment_received', 'Comprobante de pago recibido y en revisión', NOW(), false)`,
      [user_id, server_id],
    );

    return { invoice_id };
  }

  // Resto de métodos (sin cambios importantes)
  async getPendingForAdmin() {
    return this.ds.query(`
      SELECT 
        i.id, i.server_id, i.status, i.uploaded_at, i.file_url,
        u.username, u.email, s.name AS domain
      FROM portal.invoices i
      LEFT JOIN portal.users u ON u.id = i.uploaded_by
      LEFT JOIN portal.servers s ON s.id = i.server_id
      WHERE i.status = 'pending'
      ORDER BY i.uploaded_at DESC
    `);
  }

  async validateInvoice(invoiceId: string, adminId: string) {
    const result = await this.ds.query(
      `UPDATE portal.invoices
       SET status = 'validated', validated_by = $2, validated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING server_id`,
      [invoiceId, adminId],
    );

    if (!result.length) throw new ForbiddenException('Factura no encontrada o ya procesada');

    await this.ds.query(
      `UPDATE portal.announcements
       SET status = 'archived', ends_at = NOW()
       WHERE server_id = $1 AND type = 'suspension' AND status = 'active'`,
      [result[0].server_id],
    );
  }

  async rejectInvoice(invoiceId: string, adminId: string, reason?: string) {
    await this.ds.query(
      `UPDATE portal.invoices
       SET status = 'rejected', validated_by = $2, validated_at = NOW()
       WHERE id = $1 AND status = 'pending'`,
      [invoiceId, adminId],
    );
  }


  async getAllForAdmin(dto: {
    offset: number;
    limit: number;
    status?: 'pending' | 'validated' | 'rejected';
    q?: string;
  }) {
    const { offset, limit, status, q } = dto;
  
    let sql = `
      SELECT 
        i.id, i.status, i.uploaded_at, i.validated_at, i.file_url, i.amount_cents,
        u.username, u.email, s.name AS domain
      FROM portal.invoices i
      LEFT JOIN portal.users u ON u.id = i.uploaded_by
      LEFT JOIN portal.servers s ON s.id = i.server_id
      WHERE 1=1
    `;
  
    const params: any[] = [];
  
    if (status) {
      sql += ` AND i.status = $${params.length + 1}`;
      params.push(status);
    }
  
    if (q) {
      sql += ` AND (
        lower(u.username) LIKE lower($${params.length + 1}) OR
        lower(u.email) LIKE lower($${params.length + 1}) OR
        lower(s.name) LIKE lower($${params.length + 1})
      )`;
      params.push(`%${q}%`);
    }
  
    // ← CORREGIDO: conteo correcto con TypeORM
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) AS count FROM');
    const countResult = await this.ds.query(countSql, params);
    const total = parseInt(countResult[0]?.count || '0', 10);
  
    // Datos paginados
    sql += ` ORDER BY i.uploaded_at DESC`;
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
  
    const data = await this.ds.query(sql, params);
  
    return { data, total };
  }
}