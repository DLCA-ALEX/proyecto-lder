import { Module } from '@nestjs/common';
import { AdminUsersController } from './controllers/users.controller';
import { AdminServersController } from './controllers/servers.controller';

@Module({
  controllers: [AdminUsersController, AdminServersController],
})
export class AdminModule {}
