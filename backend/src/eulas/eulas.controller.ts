// src/eulas/eulas.controller.ts
import {
    Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { EulasService } from './eulas.service';
  import { CreateEulaDto } from './dto/create-eula.dto';
  import { UpdateEulaDto } from './dto/update-eula.dto';
  
  @UseGuards(AuthGuard('jwt'))        // ← TODAS las rutas de /eulas requieren Bearer token
  @Controller('eulas')
  export class EulasController {
    constructor(private readonly service: EulasService) {}
  
    @Get()
    list(
      @Query('q') q?: string,
      @Query('firmado') firmado?: 'true' | 'false',
      @Query('idrec') idrec?: 'true' | 'false',
      @Query('limit') limit?: string,
      @Query('offset') offset?: string,
    ) {
      return this.service.findAll({
        q, firmado, idrec,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
    }
  
    @Get(':id')
    get(@Param('id') id: string) {
      return this.service.findOne(id);
    }
  
    @Post()
    create(@Body() dto: CreateEulaDto) {
      return this.service.create(dto);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateEulaDto) {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.service.remove(id);
    }
  
    @Post('import')
    bulk(@Body() payload: any, @Query('ci') ci?: 'true' | 'false') {
      const caseInsensitive = ci === 'true';
      const isArray = Array.isArray(payload);
      const rows = isArray ? payload : (payload?.rows ?? []);
      return this.service.import({ rows }, caseInsensitive);
    }
  }
  