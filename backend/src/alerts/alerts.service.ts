import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AlertsService {
  constructor(private readonly ds: DataSource) {}

  async listVisible() {
    // RLS aplicará visibilidad (propias, server propio, monitor/admin)
    const rows= this.ds.query(
      `select id, alert_type, user_id, server_id, message, created_at, acknowledged
         from portal.alerts
        order by created_at desc
        limit 200`,
    );
    const [{ count }] = await this.ds.query(`select count(*)::int as count from portal.alerts`);

    return { data: rows,total: count  };

  }
  async listForAdmin(dto: {
    offset: number;
    limit: number;
    type?: string;
    q?: string;
  }) {
    const { offset, limit, type, q } = dto;
  
    let sql = `
      SELECT 
        a.id, a.alert_type, a.message, a.created_at, a.acknowledged,
        u.username, u.email,
        s.name AS domain
      FROM portal.alerts a
      LEFT JOIN portal.users u ON u.id = a.user_id
      LEFT JOIN portal.servers s ON s.id = a.server_id
      WHERE 1=1
    `;
  
    const params: any[] = [];
  
    if (type) {
      sql += ` AND a.alert_type = $${params.length + 1}`;
      params.push(type);
    }
  
    if (q) {
      sql += ` AND (
        a.message ILIKE $${params.length + 1} OR
        u.username ILIKE $${params.length + 1} OR
        s.name ILIKE $${params.length + 1}
      )`;
      params.push(`%${q}%`);
    }
  
    // Total
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) AS count FROM');
    const countResult = await this.ds.query(countSql, params);
    const total = parseInt(countResult[0]?.count || '0', 10);
  
    // Datos
    sql += ` ORDER BY a.created_at DESC`;
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
  
    const data = await this.ds.query(sql, params);
  
    return { data, total };
  }
  async generateAnnouncementsForServer(serverId: string) {
    const [server] = await this.ds.query(
      `SELECT dias_vencimiento FROM portal.servers WHERE id = $1 LIMIT 1`,
      [serverId],
    );
  
    if (!server) throw new NotFoundException('Servidor no encontrado');
  
    const diasGracia = server.dias_vencimiento || 5; // Ej: 5 días
  
    const facturasPend = await this.ds.query(
      `SELECT vencimiento, saldo_cents 
       FROM portal.facturas 
       WHERE server_id = $1 AND saldo_cents > 0 
       ORDER BY vencimiento ASC`,
      [serverId],
    );
  
    // Desbloqueo automático si no hay saldo pendiente
    if (facturasPend.length === 0) {
      await this.ds.query(
        `UPDATE portal.announcements
         SET status = 'archived', ends_at = NOW()
         WHERE server_id = $1 AND status = 'active'`,
        [serverId],
      );
      return { message: 'Saldo al corriente. Anuncios archivados.' };
    }
  
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
  
    let hasProximoVencer = false;
    let hasVencido = false;
    let hasSuspension = false;
  
    for (const fac of facturasPend) {
      const hoy = new Date(); // today's date
      const vencDate = new Date(fac.vencimiento); 
  
      const diasHastaVenc = Math.floor((vencDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      const diasVencidos = Math.floor((hoy.getTime() - vencDate.getTime()) / (1000 * 60 * 60 * 24));
  
      if (diasHastaVenc > 0 && diasHastaVenc <= diasGracia) {
        // 1 a 5 días antes del vencimiento
        hasProximoVencer = true;
      } else if (diasVencidos > 0 && diasVencidos <= diasGracia) {
        // 1 a 5 días después del vencimiento (vencido pero en gracia)
        hasVencido = true;
      } else if (diasVencidos > diasGracia) {
        // Más de 5 días después → suspensión
        hasSuspension = true;
      }
    }
  
    // Limpiar anuncios viejos para evitar duplicados
    await this.ds.query(
      `DELETE FROM portal.announcements 
       WHERE server_id = $1 AND type IN ('due_warning', 'suspension', 'proximo_vencer')`,
      [serverId],
    );
  
    // Anuncio: Próximo a vencer
    if (hasProximoVencer) {
      await this.ds.query(
        `INSERT INTO portal.announcements 
         (server_id, type, title, body, starts_at, ends_at, status)
         VALUES ($1, 'due_warning', 'Próximo a vencer', 
                 'Tu factura vence pronto. Por favor realiza tu pago antes del ${new Date().toLocaleDateString('es-MX')}.', 
                 NOW(), NOW() + INTERVAL '10 days', 'active')`,
        [serverId],
      );
    }
  
    // Anuncio: Vencido (pero en período de gracia)
    if (hasVencido && !hasSuspension) {
      await this.ds.query(
        `INSERT INTO portal.announcements 
         (server_id, type, title, body, starts_at, ends_at, status)
         VALUES ($1, 'due_warning', 'Factura vencida', 
                 'Tu factura ha vencido. Regulariza tu pago antes del ${new Date(new Date().getTime() + diasGracia * 86400000).toLocaleDateString('es-MX')} para evitar suspensión.', 
                 NOW(), NOW() + INTERVAL '10 days', 'active')`,
        [serverId],
      );
    }
  
    // Anuncio: Suspensión
    if (hasSuspension) {
      await this.ds.query(
        `INSERT INTO portal.announcements 
         (server_id, type, title, body, starts_at, ends_at, status)
         VALUES ($1, 'suspension', 'Servicio suspendido', 
                 'Tu servicio ha sido suspendido por falta de pago. Sube tu comprobante para reactivarlo.', 
                 NOW(), NOW() + INTERVAL '30 days', 'active')`,
        [serverId],
      );
    }
  
    return { hasProximoVencer, hasVencido, hasSuspension };
  }

}
