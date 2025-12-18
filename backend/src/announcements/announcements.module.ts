import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from './announcement.entity';
import { AuthModule } from '../auth/auth.module'; // Suponiendo que tienes un módulo de autenticación

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]),  // Incluir la entidad de anuncios
    AuthModule,  // Si necesitas verificar autenticación (JWT o similar)
  ],
  providers: [AnnouncementsService],
  controllers: [AnnouncementsController],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
