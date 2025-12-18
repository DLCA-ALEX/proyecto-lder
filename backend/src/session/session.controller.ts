import { Controller, Get, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SessionBootstrapInterceptor } from '../auth/session-bootstrap.interceptor';
import { DataSource } from 'typeorm';

@Controller('session')
@UseGuards(JwtAuthGuard)
@UseInterceptors(SessionBootstrapInterceptor)
export class SessionController {
  constructor(private readonly ds: DataSource) {}

  @Get('bootstrap')
  async bootstrap(@Req() req: any) {
    // lee flags espejo desde nuestra BD (ya sincronizados por el interceptor)
    const row = await this.ds.query(
      `select nda_accepted, registration_done from portal.users where id=$1`, 
      [req.user.user_id]
    );
    const ndaAccepted = !!row[0]?.nda_accepted;
    const registrationDone = !!row[0]?.registration_done;

    // URLs del flujo externo (configurables por env)
    const NDA_URL = process.env.EXTERNAL_NDA_URL || '';
    const REG_URL = process.env.EXTERNAL_REG_URL || '';

    return {
      ok: true,
      ndaAccepted,
      registrationDone,
      // si falta algo, devolvemos a dónde mandarlo
      nextAction: !ndaAccepted ? 'redirectNDA' : (!registrationDone ? 'redirectRegistration' : 'ready'),
      redirectNDAUrl: !ndaAccepted && NDA_URL ? NDA_URL : null,
      redirectRegistrationUrl: ndaAccepted && !registrationDone && REG_URL ? REG_URL : null
    };
  }
}
