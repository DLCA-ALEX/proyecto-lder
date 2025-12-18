import { Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { NdaService } from './nda.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RlsInterceptor } from '../common/rls.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsInterceptor)
@Controller('nda')
export class NdaController {
  constructor(private readonly svc: NdaService) {}

  @Get('status')
  async status(@Req() req: any) {
    const accepted = await this.svc.isAccepted(req.user.user_id);
    return { accepted };
  }

  @Post('accept')
  async accept(@Req() req: any) {
    await this.svc.accept(req.user.user_id, req.ip, req.headers['user-agent']);
    return { ok: true };
  }
}
