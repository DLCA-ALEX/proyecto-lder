import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { IdOficialType } from '../eula.entity';
import { ValidateContratoUrlIfFirmado } from './validate-contrato-url.validator';

const toNull = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    return s === '' ? null : s;
  });

export class UpdateEulaDto {
  // Ya NO imponemos regex numérica; incluso puedes omitir este campo
  @IsOptional() @IsString() @toNull()
  server_id?: string | null;

  // Donde viene la clave real (opcional en PATCH, requerido en import por el service)
  @IsOptional() @IsString() @toNull()
  server_id_raw?: string | null;

  @IsOptional() @IsString() @toNull()
  server_url?: string | null;

  @IsOptional() @IsString() @toNull()
  distribuidor?: string | null;

  @IsOptional() @IsString() @toNull()
  cliente?: string | null;

  @IsOptional() @IsBoolean()
  contrato_firmado?: boolean;

  @IsOptional() @IsString() @toNull()
  contrato_url?: string | null;

  @IsOptional() @IsBoolean()
  identificacion_recibida?: boolean;

  @IsOptional() @IsEnum(IdOficialType)
  id_oficial?: IdOficialType;

  @IsOptional() @IsString() @toNull()
  id_oficial_url?: string | null;

  @IsOptional() @IsString() @toNull()
  fuente_archivo?: string | null;

  @ValidateContratoUrlIfFirmado()
  private _rule?: unknown;
}
