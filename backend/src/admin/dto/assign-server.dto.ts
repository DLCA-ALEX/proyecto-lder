import { IsUUID } from 'class-validator';

export class AssignServerDto {
  @IsUUID()
  user_id!: string;

  @IsUUID()
  server_id!: string;
}
