import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
@Injectable()
export class BillingService {
  constructor(private readonly ds: DataSource,private readonly alertsService: AlertsService,) {}

  // ================================================
  // Listar facturas pendientes por domain (para usuario)
  // ================================================
  async getInvoicesForUser(dto: { username: string; domain: string }) {
    const { username, domain } = dto;

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

    const { server_id } = userResult[0]; // server_id es UUID (string)

    return this.ds.query(
      `SELECT 
         id, folio, fecha, vencimiento, importe_cents, saldo_cents AS saldo, estatus, pdf_url, xml_url
       FROM portal.facturas
       WHERE server_id = $1 AND saldo_cents > 0
       ORDER BY vencimiento ASC`,
      [server_id],
    );
  }

  // ================================================
  // Subir pago por usuario (selecciona múltiples facturas)
  // ================================================
  // async uploadPaymentFromUser(dto: {
  //   username: string;
  //   domain: string;
  //   factura_ids: { [factura_id: string]: number }[]; // Ej: [{ "1": 100000 }, { "3": 250000 }]
  //   file_base64: string;
  //   filename?: string;
  //   mime_type?: string;
  //   forma_pago: string;
  //   banco?: string;
  // }) {
  //   const {
  //     username,
  //     domain,
  //     factura_ids,
  //     file_base64,
  //     mime_type = 'application/octet-stream',
  //     forma_pago,
  //     banco,
  //   } = dto;

  //   if (!factura_ids?.length) {
  //     throw new BadRequestException('Selecciona al menos una factura');
  //   }

  //   const userResult = await this.ds.query(
  //     `SELECT u.id AS user_id, s.id AS server_id
  //      FROM portal.users u 
  //      JOIN portal.servers s ON lower(u.domain) = lower(s.name)
  //      WHERE lower(u.username) = lower($1) 
  //        AND lower(u.domain) = lower($2) 
  //      LIMIT 1`,
  //     [username.trim(), domain.trim()],
  //   );

  //   if (!userResult.length) {
  //     throw new NotFoundException('Usuario o dominio no encontrado');
  //   }

  //   const { user_id, server_id } = userResult[0]; // Ambos UUID (string)
  //   const fileUrl = `data:${mime_type};base64,${file_base64}`;

  //   // Obtener IDs de facturas seleccionadas
  //   const selectedFacturaIds = factura_ids.map((obj) => parseInt(Object.keys(obj)[0], 10));

  //   // Validar que las facturas existen, pertenecen al server y tienen saldo suficiente
  //   const facturas = await this.ds.query(
  //     `SELECT id, saldo_cents AS saldo 
  //      FROM portal.facturas 
  //      WHERE server_id = $1 
  //        AND id = ANY($2::int[]) 
  //        AND saldo_cents > 0`,
  //     [server_id, selectedFacturaIds],
  //   );

  //   if (facturas.length !== selectedFacturaIds.length) {
  //     throw new BadRequestException('Alguna factura es inválida o no tiene saldo pendiente');
  //   }

  //   // Calcular importe total y validar montos
  //   let importe_cents = 0;
  //   for (const aplic of factura_ids) {
  //     const facturaId = parseInt(Object.keys(aplic)[0], 10);
  //     const monto = aplic[facturaId];

  //     const factura = facturas.find((f: any) => f.id === facturaId);
  //     if (monto > factura.saldo) {
  //       throw new BadRequestException(`El monto excede el saldo de la factura ${facturaId}`);
  //     }
  //     importe_cents += monto;
  //   }

  //   // Insertar el pago
  //   const [pago] = await this.ds.query(
  //     `INSERT INTO portal.pagos
  //        (fecha, importe_cents, forma_pago, banco, estatus, factura_ids, comprobante_url, user_id, server_id)
  //      VALUES (CURRENT_DATE, $1, $2, $3, 'Pendiente', $4::jsonb, $5, $6, $7)
  //      RETURNING id`,
  //     [
  //       importe_cents,
  //       forma_pago,
  //       banco || null,
  //       JSON.stringify(factura_ids), // [{ "1": 100000 }, { "3": 250000 }]
  //       fileUrl,
  //       user_id,
  //       server_id,
  //     ],
  //   );

  //   // Crear alerta
  //   await this.ds.query(
  //     `INSERT INTO portal.alerts 
  //        (user_id, server_id, alert_type, message, created_at, acknowledged)
  //      VALUES ($1, $2, 'payment_received', 'Pago recibido y en revisión', NOW(), false)`,
  //     [user_id, server_id],
  //   );

  //   return { pago_id: pago.id };
  // }



  async uploadPaymentFromUser(dto: {
    username: string;
    domain: string;
    factura_ids: { [factura_id: string]: number }[]; // Ej: [{ "1": 100000 }, { "3": 250000 }]
    importe_cents: number; // Nuevo campo: el valor total del pago proporcionado por el usuario
    file_base64: string;
    filename?: string;
    mime_type?: string;
    forma_pago: string;
    banco?: string;
  }) {
    const {
      username,
      domain,
      factura_ids,
      importe_cents,
      file_base64,
      mime_type = 'application/octet-stream',
      forma_pago,
      banco,
    } = dto;

    if (!factura_ids?.length) {
      throw new BadRequestException('Selecciona al menos una factura');
    }

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

    const { user_id, server_id } = userResult[0]; // Ambos UUID (string)
    const fileUrl = `data:${mime_type};base64,${file_base64}`;

    // Obtener IDs de facturas seleccionadas
    const selectedFacturaIds = factura_ids.map((obj) => parseInt(Object.keys(obj)[0], 10));

    // Validar que las facturas existen, pertenecen al server y tienen saldo suficiente
    const facturas = await this.ds.query(
      `SELECT id, saldo_cents AS saldo 
       FROM portal.facturas 
       WHERE server_id = $1 
         AND id = ANY($2::int[]) 
         AND saldo_cents > 0`,
      [server_id, selectedFacturaIds],
    );

    if (facturas.length !== selectedFacturaIds.length) {
      throw new BadRequestException('Alguna factura es inválida o no tiene saldo pendiente');
    }

    // Calcular importe total basado en los montos proporcionados y validar contra el importe_cents del DTO
    let calculated_importe_cents = 0;
    for (const aplic of factura_ids) {
      const facturaId = parseInt(Object.keys(aplic)[0], 10);
      const monto = aplic[facturaId];

      const factura = facturas.find((f: any) => f.id === facturaId);
      if (monto > factura.saldo) {
        throw new BadRequestException(`El monto excede el saldo de la factura ${facturaId}`);
      }
      calculated_importe_cents += monto;
    }

    // Validar que la suma de los montos balancee exactamente con el valor del pago proporcionado
    if (calculated_importe_cents !== importe_cents) {
      throw new BadRequestException('La suma de los montos aplicados no coincide con el importe total del pago');
    }

    // Insertar el pago usando el importe_cents proporcionado (ya validado)
    const [pago] = await this.ds.query(
      `INSERT INTO portal.pagos
         (fecha, importe_cents, forma_pago, banco, estatus, factura_ids, comprobante_url, user_id, server_id)
       VALUES (CURRENT_DATE, $1, $2, $3, 'Pendiente', $4::jsonb, $5, $6, $7)
       RETURNING id`,
      [
        importe_cents,
        forma_pago,
        banco || null,
        JSON.stringify(factura_ids), // [{ "1": 100000 }, { "3": 250000 }]
        fileUrl,
        user_id,
        server_id,
      ],
    );

    // Crear alerta
    await this.ds.query(
      `INSERT INTO portal.alerts 
         (user_id, server_id, alert_type, message, created_at, acknowledged)
       VALUES ($1, $2, 'payment_received', 'Pago recibido y en revisión', NOW(), false)`,
      [user_id, server_id],
    );

    return { pago_id: pago.id };
  }

  // ================================================
  // Validar pago por admin (Pendiente → Validado)
  // ================================================
  async validatePayment(pagoId: string, adminId: string) {
    const [pago] = await this.ds.query(
      `UPDATE portal.pagos 
         SET estatus = 'Validado', validated_by = $2, validated_at = NOW()
       WHERE id = $1 AND estatus = 'Pendiente'
       RETURNING *`,
      [pagoId, adminId],
    );

    if (!pago) {
      throw new NotFoundException('Pago no encontrado o ya no está pendiente');
    }

    return pago;
  }

  // ================================================
  // Aplicar pago por admin (Validado → Aplicado)
  // ================================================
  async applyPayment(pagoId: string, adminId: string) {
    // Obtener pago con factura_ids
    const [pago] = await this.ds.query(
      `SELECT * FROM portal.pagos WHERE id = $1 AND estatus = 'Validado'`,
      [pagoId],
    );
  
    if (!pago) {
      throw new NotFoundException('Pago no encontrado o no está validado');
    }
  
    const aplicaciones: { factura_id: number; monto: number }[] = pago.factura_ids;
  
    // Actualizar saldo y estatus de cada factura
    for (const aplic of aplicaciones) {
      const facturaId = aplic.factura_id;
      const monto = aplic.monto;
  
      await this.ds.query(
        `UPDATE portal.facturas 
         SET saldo_cents = saldo_cents - $1,
             estatus = CASE 
                         WHEN saldo_cents - $1 <= 0 THEN 'Pagada'
                         ELSE 'Parcial'
                       END
         WHERE id = $2`,
        [monto, facturaId],
      );
    }
  
    // Marcar pago como Aplicado
    await this.ds.query(
      `UPDATE portal.pagos SET estatus = 'Aplicado' WHERE id = $1`,
      [pagoId],
    );
  
    // Chequear desbloqueo automático (ya lo tienes)
    await this.checkAndUnlock(pago.server_id);
  
    // NUEVO: Regenerar anuncios automáticamente según el nuevo saldo
    // await this.alertsService.(pago.server_id);
  
    return { message: 'Pago aplicado exitosamente', pago_id: pagoId };
  }

  // ================================================
  // Chequear si saldo total = 0 → archivar anuncio de suspensión
  // ================================================
  private async checkAndUnlock(serverId: string) {
    const [{ total_saldo }] = await this.ds.query(
      `SELECT COALESCE(SUM(saldo_cents), 0) AS total_saldo 
       FROM portal.facturas 
       WHERE server_id = $1`,
      [serverId],
    );

    if (total_saldo <= 0) {
      await this.ds.query(
        `UPDATE portal.announcements
         SET status = 'archived', ends_at = NOW()
         WHERE server_id = $1 AND type = 'suspension' AND status = 'active'`,
        [serverId],
      );
    }
  }

  // ================================================
  // Desbloqueo manual con PDF de compromiso (opcional futuro)
  // ================================================
  // async manualUnlock(...) { ... }
  async createInvoiceFromAdmin(dto: {
    server_domain: string;       // ej: "tudominio.nlanube.mx"
    folio: string;               // Número real de la factura SAT
    cfdi_uuid?: string;          // UUID del XML (opcional)
    fecha: string;               // 'YYYY-MM-DD'
    importe_cents: number;       // ej: 150000 para $1500.00
    pdf_base64: string;          // data:application/pdf;base64,...
    xml_base64?: string;         // opcional
    admin_id: string;            // UUID del admin que sube
  }) {
    const {
      server_domain,
      folio,
      cfdi_uuid,
      fecha,
      importe_cents,
      pdf_base64,
      xml_base64,
      admin_id,
    } = dto;
  
    // Buscar server_id
    const serverResult = await this.ds.query(
      `SELECT id AS server_id FROM portal.servers WHERE lower(name) = lower($1) LIMIT 1`,
      [server_domain.trim()],
    );
  
    if (!serverResult.length) {
      throw new NotFoundException('Dominio/servidor no encontrado');
    }
  
    const { server_id } = serverResult[0];
  
    // Validar que no exista ya esa factura (por folio + server)
    const existing = await this.ds.query(
      `SELECT id FROM portal.facturas WHERE folio = $1 AND server_id = $2 LIMIT 1`,
      [folio, server_id],
    );
  
    if (existing.length) {
      throw new BadRequestException(`La factura con folio ${folio} ya existe para este servidor`);
    }
  
    const pdfUrl = pdf_base64.startsWith('data:') ? pdf_base64 : `data:application/pdf;base64,${pdf_base64}`;
    const xmlUrl = xml_base64 ? (xml_base64.startsWith('data:') ? xml_base64 : `data:text/xml;base64,${xml_base64}`) : null;
  
    // Calcular la fecha de vencimiento (5 días después de la fecha de la factura)
    const fechaFactura = new Date(fecha);
    const vencimiento = new Date(fechaFactura);
    vencimiento.setDate(fechaFactura.getDate() + 5); // Sumar 5 días a la fecha de la factura
  
    // Insertar factura (el trigger copia importe_cents → saldo_cents)
    const [factura] = await this.ds.query(
      `INSERT INTO portal.facturas
         (folio, uuid, fecha, vencimiento, importe_cents, estatus, server_id, pdf_url, xml_url)
       VALUES ($1, $2, $3, $4, $5, 'Sin Pago', $6, $7, $8)
       RETURNING id, folio`,
      [folio, cfdi_uuid || null, fecha, vencimiento.toISOString().split('T')[0], importe_cents, server_id, pdfUrl, xmlUrl], // Convierte vencimiento a formato 'YYYY-MM-DD'
    );
  
    // Opcional: crear anuncio de "próximo a vencer" o alerta para admin
    await this.alertsService.generateAnnouncementsForServer(server_id);
  
    return { factura_id: factura.id, folio: factura.folio, message: 'Factura creada exitosamente' };
  }
  

  async getAllInvoicesAdmin(dto: {
    page?: number;
    limit?: number;
    search?: string;
    estatus?: string;
    orderBy?: 'fecha' | 'vencimiento' | 'importe_cents';
    order?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 50,
      search = '',
      estatus = '',
      orderBy = 'vencimiento',
      order = 'ASC',
    } = dto;
  
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Página y límite deben ser mayores a 0');
    }
  
    const offset = (page - 1) * limit;
  
    // Validar orderBy para evitar inyección
    const validOrderColumns = ['fecha', 'vencimiento', 'importe_cents'] as const;
    const column = validOrderColumns.includes(orderBy as any) ? orderBy : 'vencimiento';
  
    // Validar dirección
    const direction = order === 'DESC' ? 'DESC' : 'ASC';
  
    let params: any[] = [];
    let paramCount = 1;
  
    const conditions: string[] = [];
  
    // Búsqueda por folio o dominio
    if (search.trim()) {
      conditions.push(`(f.folio ILIKE $${paramCount} OR s.name ILIKE $${paramCount + 1})`);
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
      paramCount += 2;
    }
  
    // Filtro por estatus
    if (estatus && ['Sin Pago', 'Parcial', 'Pagada'].includes(estatus)) {
      conditions.push(`f.estatus = $${paramCount}`);
      params.push(estatus);
      paramCount++;
    }
  
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  
    // Construir ORDER BY de forma segura (sin interpolación)
    const orderByClause = column === 'importe_cents' 
      ? 'f.importe_cents' 
      : `f.${column}`;
  
    // Agregar parámetros de paginación
    params.push(limit, offset);
  
    const facturas = await this.ds.query(
      `SELECT 
         f.id, f.folio, f.fecha, f.vencimiento, f.importe_cents, 
         f.saldo_cents AS saldo, f.estatus, f.pdf_url, f.xml_url,
         s.name AS domain
       FROM portal.facturas f
       JOIN portal.servers s ON f.server_id = s.id
       ${whereClause}
       ORDER BY ${orderByClause} ${direction}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );
  
    const countParams = params.slice(0, params.length - 2); // Quitar limit y offset para el COUNT
    const [{ total }] = await this.ds.query(
      `SELECT COUNT(*) AS total
       FROM portal.facturas f
       JOIN portal.servers s ON f.server_id = s.id
       ${whereClause}`,
      countParams
    );
  
    return {
      data: facturas,
      total: Number(total),
      page,
      limit,
      pages: Math.ceil(Number(total) / limit),
    };
  }

  // ================================================
  // Obtener lista de dominios para el selector (autocomplete)
  // ================================================
  async getDomainsForInvoice() {
    return this.ds.query(`SELECT name AS domain FROM portal.servers ORDER BY name ASC`);
  }
  async getAllPaymentsAdmin(dto: {
    page?: number;
    limit?: number;
    search?: string;      // por dominio, banco o forma_pago
    estatus?: string;     // 'Pendiente' | 'Validado' | 'Aplicado'
    orderBy?: 'fecha' | 'importe_cents';
    order?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 50,
      search = '',
      estatus = '',
      orderBy = 'fecha',
      order = 'DESC',
    } = dto;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Página y límite deben ser mayores a 0');
    }

    const offset = (page - 1) * limit;

    const validOrderColumns = ['fecha', 'importe_cents'] as const;
    const column = validOrderColumns.includes(orderBy as any) ? orderBy : 'fecha';
    const direction = order === 'ASC' ? 'ASC' : 'DESC';

    let params: any[] = [];
    let paramCount = 1;
    const conditions: string[] = [];

    // Búsqueda por dominio, banco o forma de pago
    if (search.trim()) {
      conditions.push(
        `(s.name ILIKE $${paramCount} OR p.forma_pago ILIKE $${paramCount + 1} OR p.banco ILIKE $${paramCount + 2})`
      );
      const likeTerm = `%${search.trim()}%`;
      params.push(likeTerm, likeTerm, likeTerm);
      paramCount += 3;
    }

    // Filtro por estatus
    if (estatus && ['Pendiente', 'Validado', 'Aplicado'].includes(estatus)) {
      conditions.push(`p.estatus = $${paramCount}`);
      params.push(estatus);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    params.push(limit, offset);

    const pagos = await this.ds.query(
      `SELECT 
         p.id,
         p.fecha,
         p.importe_cents,
         p.forma_pago,
         p.banco,
         p.estatus,
         p.comprobante_url,
         p.factura_ids,
         s.name AS domain
       FROM portal.pagos p
       JOIN portal.servers s ON p.server_id = s.id
       ${whereClause}
       ORDER BY p.${column} ${direction}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const [{ total }] = await this.ds.query(
      `SELECT COUNT(*) AS total
       FROM portal.pagos p
       JOIN portal.servers s ON p.server_id = s.id
       ${whereClause}`,
      countParams
    );

    return {
      data: pagos,
      total: Number(total),
      page,
      limit,
      pages: Math.ceil(Number(total) / limit),
    };
  }
}