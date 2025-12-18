import {
  Controller, Get, Post, Body, Param, Query, Req,
  UseGuards, UseInterceptors, UsePipes, ValidationPipe, NotFoundException, Headers
} from '@nestjs/common';
import { RlsInterceptor } from '../common/rls.interceptor';
import { UsersService } from './users.service';
import { UsersLoginDto } from './dto/users-login.dto';
import { ListUsersQuery } from './dto/list-users.query';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { IpRulesGuard } from '../common/ip-rules.guard';

@UseInterceptors(RlsInterceptor)
@UseGuards(IpRulesGuard)
// IMPORTANTE: deja SOLO 'users'. Con el prefijo global 'api' => '/api/users' (sin duplicar)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async loginAndList(
    @Body() dto: UsersLoginDto,
    @Req() req: any,
    @Headers('x-forwarded-for') xff?: string,
    @Headers('x-real-ip') xri?: string,
    @Headers('cf-connecting-ip') cf?: string,
    @Headers('true-client-ip') tci?: string,
  ) {
    // Log mínimo para diagnosticar IPs/reversos (no cambia lógica)
    console.log('[UsersController] headers', {
      cf, tci, xff, xri, reqIp: req.ip, remote: req.socket?.remoteAddress
    });
    const clientIp = req.clientIp ?? req.ip ?? '';
    return this.svc.loginAndList(dto, clientIp);
  }

  @UseGuards(JwtAuthGuard) // IpRulesGuard ya se aplica arriba al controller
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async list(@Query() query: ListUsersQuery) {
    return this.svc.findAll(query);
  }

  @UseGuards(JwtAuthGuard) // IpRulesGuard ya se aplica arriba al controller
  @Get(':id')
  async get(@Param('id') id: string) {
    const row = await this.svc.findOneSafe(id);
    if (!row) throw new NotFoundException('Usuario no encontrado');
    return row;
  }
}
