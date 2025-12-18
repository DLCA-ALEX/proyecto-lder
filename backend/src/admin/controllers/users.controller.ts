import { Controller, Get, Post, Body, Query, ConflictException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DataSource } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { PaginationDto } from '../dto/pagination.dto';

@UseGuards(AuthGuard('admin-jwt'))
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly ds: DataSource) {}

  @Get()
  async list(@Query() q: PaginationDto) {
    const { offset = 0, limit = 20 } = q;
    const rows = await this.ds.query(
      `select id, email, name, company, role_title, domain, created_at, updated_at
         from portal.users
        order by created_at desc
        offset $1 limit $2`,
      [offset, limit],
    );
    const [{ count }] = await this.ds.query(`select count(*)::int as count from portal.users`);
    return { data: rows, total: count };
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const exists = await this.ds.query(`select 1 from portal.users where lower(email)=lower($1)`, [dto.email]);
    if (exists.length) throw new ConflictException('email already exists');

    const rows = await this.ds.query(
      `insert into portal.users (email, name, company, role_title, domain)
       values ($1,$2,$3,$4,$5)
       returning id, email, name, company, role_title, domain, created_at`,
      [dto.email, dto.name, dto.company ?? null, dto.role_title ?? null, dto.domain ?? null],
    );
    return { ok: true, user: rows[0] };
  }
}
