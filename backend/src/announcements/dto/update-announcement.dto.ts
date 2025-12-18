import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsEnum(['due_warning', 'suspension'])
  @IsOptional()
  type?: string; // 'due_warning' o 'suspension'

  @IsString()
  @IsOptional()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsDateString()
  @IsOptional()
  starts_at?: Date;

  @IsDateString()
  @IsOptional()
  ends_at?: Date;
}