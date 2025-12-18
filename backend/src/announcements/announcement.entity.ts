import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'portal', name: 'announcements' })
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  server_id: string;  // Relacionado con el servidor (inferido via join)

  @Column({ type: 'text' })
  type: string;  // Tipo de anuncio: 'due_warning' o 'suspension'

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'timestamptz' })
  starts_at: Date;

  @Column({ type: 'timestamptz' })
  ends_at: Date;

  @Column({ type: 'text', default: 'active' })
  status: string;  // Estado: 'active', 'warning', 'suspended', 'expired', 'archived' (preparado para n8n)

  @Column({ type: 'jsonb', default: '{}' })
  storage_meta: Record<string, any>;  // e.g., { s3_key, mime, size } para archivos

  @Column({ type: 'uuid', nullable: true })
  created_by: string;  // UUID del usuario que creó (referencia a users.id)

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}