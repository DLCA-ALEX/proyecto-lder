import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly ds: DataSource) {}

  async mine(userId: string) {
    const rows = await this.ds.query(
      `select plan_code, starts_at, expires_at
         from portal.subscriptions
        where user_id = $1
        order by starts_at desc
        limit 5`,
      [userId],
    );
    return rows;
  }

  async createAsAdmin(userId: string, rolesCsv: string, dto: any) {
    if (!rolesCsv.split(',').includes('admin')) {
      throw new ForbiddenException('Admin only');
    }
    await this.ds.query(
      `insert into portal.subscriptions (user_id, plan_code, starts_at, expires_at)
       values ($1,$2,$3,$4)`,
      [dto.user_id, dto.plan_code, dto.starts_at, dto.expires_at],
    );
  }
}
