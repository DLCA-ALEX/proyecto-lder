import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();
    const token = auth.slice(7);

    try {
      const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET!, {
        issuer: process.env.ADMIN_JWT_ISS || 'actualisat',
        audience: process.env.ADMIN_JWT_AUD || 'admin',
      }) as any;
      req.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
