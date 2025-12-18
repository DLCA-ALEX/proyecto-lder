// import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
// import { AnnouncementsService } from './announcements.service';
// import { CreateAnnouncementDto } from './dto/create-announcement.dto';
// import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
// import { AuthGuard } from '@nestjs/passport';

// @Controller('announcements')
// export class AnnouncementsController {
//   constructor(private readonly service: AnnouncementsService) {}

//   // Crear un anuncio de corte o suspensión
//   @Post()
//   @UseGuards(AuthGuard('jwt'))
//   createAnnouncement(@Body() dto: CreateAnnouncementDto) {
//     return this.service.createAnnouncement(dto);
//   }

//   // Obtener todos los anuncios de corte o suspensión para un usuario
//   @Get()
//   @UseGuards(AuthGuard('jwt'))
//   getAnnouncements(@Param('user_id') user_id: string) {
//     return this.service.getAnnouncements(user_id);
//   }

//   // Obtener un anuncio por ID
//   @Get(':id')
//   @UseGuards(AuthGuard('jwt'))
//   getAnnouncementById(@Param('id') id: string) {
//     return this.service.getAnnouncementById(id);
//   }

//   // Actualizar un anuncio existente
//   @Post(':id')
//   @UseGuards(AuthGuard('jwt'))
//   updateAnnouncement(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
//     return this.service.updateAnnouncement(id, dto);
//   }

//   // Reconocer el anuncio (cuando el usuario sube el comprobante)
//   @Post(':id/acknowledge')
//   @UseGuards(AuthGuard('jwt'))
//   acknowledgeAnnouncement(@Param('id') id: string, @Body('user_id') user_id: string) {
//     return this.service.acknowledgeAnnouncement(user_id, id);
//   }
// }

import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('announcements')
// @UseGuards(AuthGuard('jwt'))  // Protección JWT para todas las rutas
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  // Crear un anuncio (body infiere server_id via created_by email)
  @Post()
  createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.service.createAnnouncement(dto);
  }

  // Obtener anuncios por domain (usando query param, sin path en URL)
  @Get()
  getAnnouncements(@Query('domain') domain: string) {
    return this.service.getAnnouncements(domain);
  }

  // Obtener un anuncio por ID
  @Get(':id')
  getAnnouncementById(@Param('id') id: string) {
    return this.service.getAnnouncementById(id);
  }

  // Actualizar un anuncio
  @Post(':id')
  updateAnnouncement(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.updateAnnouncement(id, dto);
  }

  // Reconocer anuncio (acknowledge, usa domain en body para inferir user_id)
  @Post(':id/acknowledge')
  acknowledgeAnnouncement(@Param('id') id: string, @Body('domain') domain: string) {
    return this.service.acknowledgeAnnouncement(domain, id);
  }
}