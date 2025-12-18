import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { IpRulesGuard } from '../common/ip-rules.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, IpRulesGuard],
  exports: [UsersService],
})
export class UsersModule {}
