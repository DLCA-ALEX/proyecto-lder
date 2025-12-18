import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsOptional, IsString } from 'class-validator';

class PortalLoginDto {
  @IsString()
  username!: string;

  @IsOptional() @IsString()
  domain?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  name?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('portal-login')
  async portalLogin(@Body() dto: PortalLoginDto) {
    // OJO: ahora sí, con DTO decorado, whitelist NO borra 'username'
    if (!dto.username || !dto.username.trim()) {
      return { ok: false, error: 'username required' }; // si quieres, lanza BadRequestException
    }
    const res = await this.svc.portalLogin(dto);
    return { ok: true, token: res.token, user_id: res.userId, roles: res.rolesCsv };
  }
}
