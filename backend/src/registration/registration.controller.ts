import { Body, Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RlsInterceptor } from '../common/rls.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsInterceptor)
@Controller('registration')
export class RegistrationController {
  constructor(private readonly svc: RegistrationService) {}

  @Get()
  async getMine(@Req() req: any) {
    return this.svc.get(req.user.user_id);
  }

  @Post()
  async save(@Req() req: any, @Body() payload: RegistrationDto) {
    await this.svc.save(req.user.user_id, payload);
    return { ok: true };
  }
}
