import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { AlertsService } from '../alerts/alerts.service';
@Module({
  providers: [BillingService,AlertsService],
  controllers: [BillingController],
  exports: [BillingService], // Si otros módulos lo necesitan
})
export class BillingModule {}