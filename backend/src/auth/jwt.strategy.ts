// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
      ignoreExpiration: false,
      issuer: process.env.JWT_ISS || 'actualisat',
      audience: process.env.JWT_AUD || 'portal',
    });
  }

  async validate(payload: any) {
    // payload que firmaste: { user_id, roles, ... }
    // En este flujo "preauth" AÚN no existe usuario en BD (ok)
    return payload; // queda en req.user
  }
}
