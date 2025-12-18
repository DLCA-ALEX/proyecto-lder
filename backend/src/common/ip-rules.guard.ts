import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class IpRulesGuard implements CanActivate {
  constructor(private readonly ds: DataSource) {}

  private normalizeIp(ip?: string): string {
    if (!ip) return '';
    return ip.replace(/^::ffff:/, '').replace(/^\[|]$/g, '');
  }

  private pickClientIp(req: any): string {
    // 1) Cloudflare / proxies
    const cf = (req.headers['cf-connecting-ip'] as string) || (req.headers['true-client-ip'] as string);
    if (cf && cf.trim()) return this.normalizeIp(cf.trim());

    // 2) X-Forwarded-For (primer IP)
    const xffHeader = (req.headers['x-forwarded-for'] as string) || '';
    const xffFirst = xffHeader.split(',').map(s => s.trim()).filter(Boolean)[0];
    if (xffFirst) return this.normalizeIp(xffFirst);

    // 3) Express/Node
    const raw = (req.ip as string) || (req.socket?.remoteAddress as string) || '';
    return this.normalizeIp(raw);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const clientIp = this.pickClientIp(req);

    // log diagnóstico
    console.log('[IpRulesGuard] IPs', {
      picked: clientIp,
      cfConnectingIp: req.headers['cf-connecting-ip'],
      trueClientIp: req.headers['true-client-ip'],
      xForwardedFor: req.headers['x-forwarded-for'],
      reqIp: req.ip,
      remoteAddress: req.socket?.remoteAddress,
    });

    // guarda la IP en el request para reuso
    req.clientIp = clientIp;

    // valida en BD — prefijo protegido con el global '/api' ya aplicado en Nginx/Nest
    const path = '/api/users';
    const rows = await this.ds.query(
      'SELECT portal.is_ip_allowed_simple($1::inet, $2::text) AS ok',
      [clientIp, path],
    );
    const ok = rows?.[0]?.ok === true;
    if (!ok) throw new ForbiddenException('IP not allowed for this route');
    return true;
  }
}
