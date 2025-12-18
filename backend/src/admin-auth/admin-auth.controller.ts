import { Body, Controller, Post } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly svc: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    const res = await this.svc.login(dto.email, dto.password);
    return { ok: true, ...res };
  }

  // Opcional: solo para inicializar un superadmin. Podrías protegerlo con una env-flag.
  @Post('register')
  async register(@Body() dto: AdminRegisterDto) {
    const res = await this.svc.register(dto.email, dto.full_name, dto.password, dto.role_code);
    return { ok: true, admin: res };
  }
}
