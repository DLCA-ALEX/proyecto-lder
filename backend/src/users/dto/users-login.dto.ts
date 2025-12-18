import { IsEmail, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

const toNull = () =>
  Transform(({ value }) =>
    value === undefined || value === null || String(value).trim() === '' ? null : String(value),
  );

export class UsersLoginDto {
  // --- credenciales básicas ---
  @IsString()
  username!: string;

  @IsOptional() @IsString()
  domain?: string; // sigue existiendo por compatibilidad (dominio exacto)

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  name?: string;

  // --- NUEVO: puedes mandar la URL completa del dominio (con o sin "/")
  // ej: "https://demonube.nlanube.mx/" o "http://demonube.nlanube.mx"
  @IsOptional() @IsString() @toNull()
  domainUrl?: string | null;

  // --- NUEVO: bandera simple de aceptados
  // yes = solo con NDA aceptado, no = solo sin NDA, any = todos
  @IsOptional() @IsIn(['yes','no','any'])
  accepted?: 'yes' | 'no' | 'any';

  // --- filtros de listado ---
  @IsOptional() @IsIn(['nda', 'all', 'registered', 'no-nda'])
  mode: 'nda' | 'all' | 'registered' | 'no-nda' = 'all'; // por defecto "todos"

  @IsOptional() @IsString() @toNull()
  q?: string | null;

  // OJO: domainFilter lo seguiremos poblando desde domainUrl/domain normalizado
  @IsOptional() @IsString() @toNull()
  domainFilter?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  offset: number = 0;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit: number = 50;

  @IsOptional() @IsIn(['created_at', 'updated_at', 'last_login_at', 'email'])
  orderBy: 'created_at' | 'updated_at' | 'last_login_at' | 'email' = 'updated_at';

  @IsOptional() @IsIn(['asc', 'desc'])
  orderDir: 'asc' | 'desc' = 'desc';
}
