// src/invoices/invoices.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  BadRequestException,
  UseGuards,Req
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { AuthGuard } from '@nestjs/passport';
interface RequestWithUser extends Request {
  user: {
    admin_id: string;
    role: 'admin' | 'billing' | 'monitor' | 'reader';
  };
}
// Sin guards ni interceptors de auth
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly svc: InvoicesService) {}

  // 1. Listar pendientes (solo admin/billing) — sin auth, accesible por cualquiera
  @Get('pending')
  async getPending() {
    return this.svc.getPendingForAdmin();
  }

  // 2. Subida de comprobante — ahora recibe username y domain en el body
  @Post('upload-proof')
  async uploadProof(@Body() body: {
    username: string;
    domain: string;
    file_base64: string;
    filename?: string;
    mime_type?: string;
    invoice_id?: string;
  }) {
    if (!body.username || !body.domain) {
      throw new BadRequestException('username y domain son obligatorios');
    }
    if (!body.file_base64) {
      throw new BadRequestException('file_base64 es obligatorio');
    }
  
    await this.svc.uploadProofFromUser({
      username: body.username,
      domain: body.domain,
      file_base64: body.file_base64,
      filename: body.filename,
      mime_type: body.mime_type || 'application/octet-stream',
      invoice_id: body.invoice_id,
    });
  
    return { ok: true, message: 'Comprobante recibido. En revisión.' };
  }

  // 3. Validar (admin) — sin auth, accesible por cualquiera

  @Post(':id/validate')
  @UseGuards(AuthGuard('admin-jwt'))
  async validate(@Param('id') id: string, @Req() req: RequestWithUser) {
    const admin = req.user; // Ahora TypeScript sabe que existe y tiene el tipo correcto
  
    await this.svc.validateInvoice(id, admin.admin_id);
    return { ok: true, message: 'Factura validada correctamente' };
  }
  
  @Post(':id/reject')
  @UseGuards(AuthGuard('admin-jwt'))
  async reject(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body('reason') reason?: string,
  ) {
    const admin = req.user;
  
    await this.svc.rejectInvoice(
      id,
      admin.admin_id,
      reason || 'Rechazado por administrador',
    );
    return { ok: true, message: 'Factura rechazada' };
  }


  @Get('all')
async getAllForAdmin(
  @Query('offset') offset = '0',
  @Query('limit') limit = '50',
  @Query('status') status?: 'pending' | 'validated' | 'rejected' | 'all',
  @Query('q') q?: string,
) {
  return this.svc.getAllForAdmin({
    offset: +offset,
    limit: +limit,
    status: status === 'all' ? undefined : status,
    q,
  });
}
}