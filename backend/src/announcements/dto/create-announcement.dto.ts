// dto/create-announcement.dto.ts
import { IsIn, IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsIn(['due_warning', 'suspension'])
  type: 'due_warning' | 'suspension';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsDateString()
  starts_at: string;

  @IsDateString()
  ends_at: string;

  @IsString()
  @IsNotEmpty()
  domain: string;  // ← ¡Esto es lo que querías!
}