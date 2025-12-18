// src/admin-auth/admin-auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly ds: DataSource,
    private readonly jwt: JwtService,
  ) {}

  private sign(payload: any) {
    // Usa la config declarada en JwtModule.register(...)
    return this.jwt.sign(payload);
  }

  async login(email: string, password: string) {
    const rows = await this.ds.query(
      `select id, email, full_name, password_hash, role_code
         from portal.admin_users
        where lower(email) = lower($1)
        limit 1`,
      [email],
    );
    const u = rows[0];
    if (!u) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = this.sign({ admin_id: u.id, role: u.role_code });
    return {
      token,
      profile: { id: u.id, email: u.email, full_name: u.full_name, role: u.role_code },
    };
  }

  async register(email: string, full_name: string, password: string, role_code: string) {
    const exists = await this.ds.query(
      `select 1 from portal.admin_users where lower(email)=lower($1)`,
      [email],
    );
    if (exists.length) throw new ConflictException('Email already exists');

    const hash = await bcrypt.hash(password, 12);
    const rows = await this.ds.query(
      `insert into portal.admin_users (email, full_name, password_hash, role_code)
       values ($1,$2,$3,$4)
       returning id, email, full_name, role_code`,
      [email, full_name, hash, role_code],
    );
    return rows[0];
  }
}

