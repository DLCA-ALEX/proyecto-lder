import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  } from 'typeorm';
  
  export enum IdOficialType {
    INE = 'INE',
    PASAPORTE = 'PASAPORTE',
    SIN_ID = 'Sin identificación',
    OTRA = 'OTRA',
  }
  
  @Entity({ schema: 'portal', name: 'eulas' })
export class Eula {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RAW numérico (clave de negocio)
  @Column({ type: 'text' })
  server_id: string;

  // NUEVA: URL del server
  @Column({ type: 'text', nullable: true })
  server_url: string | null;

  @Column({ type: 'text', nullable: true })
  distribuidor: string | null;

  @Column({ type: 'text', nullable: true })
  cliente: string | null;

  @Column({ type: 'boolean', default: false })
  contrato_firmado: boolean;

  @Column({ type: 'text', nullable: true })
  contrato_url: string | null;

  @Column({ type: 'boolean', default: false })
  identificacion_recibida: boolean;

  @Column({
    type: 'enum',
    enum: IdOficialType,
    enumName: 'id_oficial_type',
    default: IdOficialType.SIN_ID,
  })
  id_oficial: IdOficialType;

  @Column({ type: 'text', nullable: true })
  id_oficial_url: string | null;

  @Column({ type: 'text', nullable: true })
  fuente_archivo: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}