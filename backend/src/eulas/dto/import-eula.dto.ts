import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { UpdateEulaDto } from './update-eula.dto';

export class ImportEulaDto {
  // Filas que vienen del front ya normalizadas (server_id, etc.)
  @ValidateNested({ each: true })
  @Type(() => UpdateEulaDto)
  rows: UpdateEulaDto[];
}
