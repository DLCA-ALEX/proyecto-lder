import { Body, Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RlsInterceptor } from '../common/rls.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsInterceptor)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly svc: SubscriptionsService) {}

  @Get('mine')
  async mine(@Req() req: any) {
    return this.svc.mine(req.user.user_id);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    await this.svc.createAsAdmin(req.user.user_id, req.user.roles || '', dto);
    return { ok: true };
  }
}
