import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ServersService {
  constructor(private readonly ds: DataSource) {}

  async mine(userId: string) {
    // RLS permite ver solo el propio/monitor/admin
    const server = await this.ds.query(
      `select s.id, s.name, s.host, s.metadata, s.created_at
         from portal.servers s
         join portal.user_servers us on us.server_id = s.id
        where us.user_id = $1
        limit 1`,
      [userId],
    );

    const programs = await this.ds.query(
      `select p.code, p.name, sp.enabled
         from portal.server_programs sp
         join portal.programs p on p.id = sp.program_id
        where sp.server_id = (select server_id from portal.user_servers where user_id = $1)
        order by p.name`,
      [userId],
    );

    return { server: server[0] || null, programs };
  }
}
