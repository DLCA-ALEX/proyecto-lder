// src/eulas/eulas.module.ts
import { Module } from '@nestjs/common';
import { EulasService } from './eulas.service';
import { EulasController } from './eulas.controller';

@Module({
  imports: [],               // <- sin forFeature
  providers: [EulasService],
  controllers: [EulasController],
  exports: [EulasService],
})
export class EulasModule {}
