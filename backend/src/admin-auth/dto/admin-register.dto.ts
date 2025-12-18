import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class AdminRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  full_name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['admin','billing','monitor','reader'])
  role_code!: 'admin'|'billing'|'monitor'|'reader';
}
