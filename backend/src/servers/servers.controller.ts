import { Controller, Get, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ServersService } from './servers.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RlsInterceptor } from '../common/rls.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsInterceptor)
@Controller('servers')
export class ServersController {
  constructor(private readonly svc: ServersService) {}

  @Get('mine')
  async mine(@Req() req: any) {
    return this.svc.mine(req.user.user_id);
  }
}
