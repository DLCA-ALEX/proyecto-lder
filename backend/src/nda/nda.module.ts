import { Module, forwardRef } from '@nestjs/common';
import { NdaController } from './nda.controller';
import { NdaService } from './nda.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [NdaController],
  providers: [NdaService],
})
export class NdaModule {}
