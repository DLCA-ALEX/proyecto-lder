// src/admin-auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type AdminJwtPayload = {
  admin_id: string;
  role: 'admin' | 'billing' | 'monitor' | 'reader';
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ADMIN_JWT_SECRET || 'changeme-admin', // <— fallback
      issuer: process.env.ADMIN_JWT_ISS || 'actualisat',
      audience: process.env.ADMIN_JWT_AUD || 'admin',
    });
  }

  validate(payload: AdminJwtPayload) {
    return { admin_id: payload.admin_id, role: payload.role };
  }
}
