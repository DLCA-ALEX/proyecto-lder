import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';

// Opcional: guarda para admin, lo agregas después
// import { AdminGuard } from '../auth/admin.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Listar facturas pendientes del usuario
  @Post('invoices')
  async getInvoices(@Body() dto: { username: string; domain: string }) {
    return this.billingService.getInvoicesForUser(dto);
  }

  // Subir pago desde el portal
  @Post('upload-payment')
  async uploadPayment(@Body() dto: any) {
    return this.billingService.uploadPaymentFromUser(dto);
  }

  // Validar pago (solo admin)
  @Post('validate-payment/:id')
  // @UseGuards(AdminGuard)
  async validatePayment(@Param('id') id: string, @Body() { adminId }: { adminId: string }) {
    return this.billingService.validatePayment(id, adminId);
  }

  // Aplicar pago (solo admin)
  @Post('apply-payment/:id')
  // @UseGuards(AdminGuard)
  async applyPayment(@Param('id') id: string, @Body() { adminId }: { adminId: string }) {
    return this.billingService.applyPayment(id, adminId);
  }


  // Subir factura (solo admin o distribuidor)
  @Post('create-invoice')
  // @UseGuards(AdminGuard)  // Descomenta cuando tengas guard de admin
  async createInvoice(@Body() dto: any) {
    return this.billingService.createInvoiceFromAdmin(dto);
  }


  @Post('admin/all-invoices')
  // @UseGuards(AdminGuard)
  async getAllInvoices(@Body() dto: any) {
    return this.billingService.getAllInvoicesAdmin(dto);
  }

  // Obtener dominios disponibles para subir factura
  @Post('admin/domains')
  // @UseGuards(AdminGuard)
  async getDomains() {
    return this.billingService.getDomainsForInvoice();
  }
  @Post('admin/all-payments')
  // @UseGuards(AdminGuard)
  async getAllPayments(@Body() dto: any) {
    return this.billingService.getAllPaymentsAdmin(dto);
  }
}