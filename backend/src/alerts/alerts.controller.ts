import { Controller, Get, UseGuards, UseInterceptors,Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RlsInterceptor } from '../common/rls.interceptor';
import { AuthGuard } from '@nestjs/passport';

// @UseGuards(JwtAuthGuard)
// @UseInterceptors(RlsInterceptor)
@UseGuards(AuthGuard('admin-jwt'))

@Controller('alerts')
export class AlertsController {
  constructor(private readonly svc: AlertsService) {}

  @Get()
  async list() {
    return this.svc.listVisible();
  }
  @Get('admin')
async listForAdmin(
  @Query('offset') offset = '0',
  @Query('limit') limit = '50',
  @Query('type') type?: string,
  @Query('q') q?: string,
) {
  return this.svc.listForAdmin({
    offset: +offset,
    limit: +limit,
    type,
    q,
  });
}
}
