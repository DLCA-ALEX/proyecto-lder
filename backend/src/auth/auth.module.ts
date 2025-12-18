// auth/auth.module.ts
import { Module, Global, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Global() // opcional, pero ayuda a que la estrategia esté disponible en todos los módulos
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: {
        issuer: process.env.JWT_ISS || 'actualisat',
        audience: process.env.JWT_AUD || 'portal',
        expiresIn: '8h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [
    PassportModule,
    JwtModule,
    JwtStrategy,
  ],
})
export class AuthModule {}
