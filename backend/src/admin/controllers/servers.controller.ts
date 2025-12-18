import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { AssignServerDto } from '../dto/assign-server.dto';

@UseGuards(AuthGuard('admin-jwt'))
@Controller('admin/servers')
export class AdminServersController {
  constructor(private readonly ds: DataSource) {}

  @Get()
  async listServers() {
    const rows = await this.ds.query(
      `select id, name, host, metadata, created_at from portal.servers order by created_at desc`,
    );
    const [{ count }] = await this.ds.query(`select count(*)::int as count from portal.servers`);

    return { data: rows,total: count  };
  }

  @Post('assign')
  async assign(@Body() dto: AssignServerDto) {
    // si existe, reemplaza; if not, inserta (este caso SÍ es upsert de asignación, no de user)
    await this.ds.query(
      `insert into portal.user_servers (user_id, server_id)
       values ($1,$2)
       on conflict (user_id) do update set server_id = excluded.server_id, assigned_at = now()`,
      [dto.user_id, dto.server_id],
    );
    return { ok: true };
  }
}
