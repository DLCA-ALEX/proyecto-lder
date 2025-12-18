import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional() @IsString()
  company?: string;

  @IsOptional() @IsString()
  role_title?: string;

  @IsOptional() @IsString()
  domain?: string;
}
