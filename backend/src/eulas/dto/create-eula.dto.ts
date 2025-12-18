import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { IdOficialType } from '../eula.entity';
import { ValidateContratoUrlIfFirmado } from './validate-contrato-url.validator';

const toNull = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    return s === '' ? null : s;
  });

export class CreateEulaDto {
  // CLAVE REAL: server_id_raw (string requerido, SIN regex numérica)
  @IsString() @IsNotEmpty()
  server_id_raw: string;

  // Si llega, se ignora como clave (opcional y sin regex)
  @IsOptional() @IsString() @toNull()
  server_id?: string | null;

  @IsOptional() @IsString() @toNull()
  server_url?: string | null;

  @IsOptional() @IsString() @toNull()
  distribuidor?: string | null;

  @IsOptional() @IsString() @toNull()
  cliente?: string | null;

  @IsOptional() @IsBoolean()
  contrato_firmado?: boolean = false;

  @IsOptional() @IsString() @toNull()
  contrato_url?: string | null;

  @IsOptional() @IsBoolean()
  identificacion_recibida?: boolean = false;

  @IsOptional() @IsEnum(IdOficialType)
  id_oficial?: IdOficialType = IdOficialType.SIN_ID;

  @IsOptional() @IsString() @toNull()
  id_oficial_url?: string | null;

  @IsOptional() @IsString() @toNull()
  fuente_archivo?: string | null;

  @ValidateContratoUrlIfFirmado()
  private _rule?: unknown;
}
