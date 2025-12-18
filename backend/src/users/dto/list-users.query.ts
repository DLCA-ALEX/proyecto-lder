// src/users/dto/list-users.query.ts
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const toNull = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    return s === '' ? null : s;
  });

export class ListUsersQuery {
  /**
   * Banderas/mode:
   * - nda (default): solo con NDA aceptado
   * - all: todos
   * - registered: solo con registro inicial hecho
   * - no-nda: solo los que NO han aceptado NDA
   */
  @IsOptional()
  @IsIn(['nda', 'all', 'registered', 'no-nda'])
  mode: 'nda' | 'all' | 'registered' | 'no-nda' = 'nda';

  // Texto libre: busca en email, name, username, real_name, company
  @IsOptional() @IsString() @toNull()
  q?: string | null;

  // Filtro exacto por dominio (ej. web742087.nlanube.mx). Si quieres ILIKE, ver nota en service.
  @IsOptional() @IsString() @toNull()
  domain?: string | null;

  // Paginación
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(0)
  offset?: number = 0;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  limit?: number = 50;

  // Orden
  @IsOptional() @IsIn(['created_at','updated_at','last_login_at','email'])
  orderBy?: 'created_at' | 'updated_at' | 'last_login_at' | 'email' = 'updated_at';

  @IsOptional() @IsIn(['asc','desc'])
  orderDir?: 'asc' | 'desc' = 'desc';
}
