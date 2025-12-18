import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class NdaService {
  constructor(private readonly ds: DataSource) {}

  async isAccepted(userId: string): Promise<boolean> {
    const r = await this.ds.query(
      'select 1 from portal.nda_acceptances where user_id = $1 limit 1',
      [userId],
    );
    return r.length > 0;
  }

  async accept(userId: string, ip?: string, ua?: string) {
    await this.ds.query(
      `insert into portal.nda_acceptances (user_id, ip, user_agent)
       values ($1,$2,$3)
       on conflict (user_id) do nothing`,
      [userId, ip ?? null, ua ?? null],
    );
  }
}
