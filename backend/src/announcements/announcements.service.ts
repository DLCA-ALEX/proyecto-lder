import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly ds: DataSource) {}

  // Helper para trim o null
  private trimOrNull(v?: string | null): string | null {
    const s = (v ?? '').trim();
    return s.length ? s : null;
  }

  /**
   * CREAR ANUNCIO
   * Ahora SOLO recibe "domain" (ej: cafesublime.mx)
   * Busca internamente el server_id → igual que hace el GET
   */
  async createAnnouncement(dto: CreateAnnouncementDto) {
    const { type, title, body, starts_at, ends_at, domain } = dto;

    // Validaciones básicas
    if (!['due_warning', 'suspension'].includes(type)) {
      throw new BadRequestException('Tipo de anuncio inválido');
    }

    if (!domain) {
      throw new BadRequestException('El campo "domain" es obligatorio');
    }

    // 1. Resolver server_id a partir del dominio
    const serverResult = await this.ds.query(
      `SELECT s.id AS server_id 
       FROM portal.servers s 
       WHERE lower(s.name) = lower($1)
       LIMIT 1`,
      [domain.trim()],
    );

    if (!serverResult.length) {
      throw new NotFoundException(`No se encontró servidor con dominio "${domain}"`);
    }

    const server_id = serverResult[0].server_id;

    // 2. Insertar el anuncio
    const result = await this.ds.query(
      `INSERT INTO portal.announcements 
         (server_id, type, title, body, starts_at, ends_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [
        server_id,
        type,
        title,
        this.trimOrNull(body),
        starts_at,
        ends_at,
      ],
    );

    return result[0];
  }

  // ===================================================================
  // EL RESTO DE MÉTODOS QUEDA EXACTAMENTE COMO YA LO TENÍAS (funcionan bien)
  // ===================================================================

  async getAnnouncements(domain: string) {
    if (!domain) throw new BadRequestException('Domain requerido');

    const server = await this.ds.query(
      `SELECT s.id FROM portal.servers s WHERE lower(s.name) = lower($1) LIMIT 1`,
      [domain],
    );

    if (!server.length) throw new NotFoundException('Servidor no encontrado');

    const announcements = await this.ds.query(
      `SELECT * FROM portal.announcements 
       WHERE server_id = $1 AND ends_at > NOW()
       ORDER BY created_at DESC`,
      [server[0].id],
    );

    return announcements;
  }

  async getAnnouncementById(id: string) {
    const [ann] = await this.ds.query(`SELECT * FROM portal.announcements WHERE id = $1`, [id]);
    if (!ann) throw new NotFoundException('Anuncio no encontrado');
    return ann;
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementDto) {
    const existing = await this.getAnnouncementById(id);
    const { type = existing.type, title = existing.title, body = existing.body, starts_at = existing.starts_at, ends_at = existing.ends_at } = dto;

    const [updated] = await this.ds.query(
      `UPDATE portal.announcements 
       SET type = $2, title = $3, body = $4, starts_at = $5, ends_at = $6, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, type, title, this.trimOrNull(body), starts_at, ends_at],
    );

    return updated;
  }

  async acknowledgeAnnouncement(domain: string, announcement_id: string) {
    if (!domain) throw new BadRequestException('Domain requerido');

    const [user] = await this.ds.query(
      `SELECT id FROM portal.users WHERE lower(domain) = lower($1) LIMIT 1`,
      [domain],
    );

    if (!user) throw new NotFoundException('Usuario no encontrado para el domain');

    const existing = await this.ds.query(
      `SELECT 1 FROM portal.announcement_acknowledgements 
       WHERE announcement_id = $1 AND user_id = $2`,
      [announcement_id, user.id],
    );

    if (existing.length) throw new BadRequestException('Anuncio ya reconocido');

    const [ack] = await this.ds.query(
      `INSERT INTO portal.announcement_acknowledgements (announcement_id, user_id, acknowledged_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [announcement_id, user.id],
    );

    return ack;
  }
}