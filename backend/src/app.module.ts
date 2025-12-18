import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { NdaModule } from './nda/nda.module';
import { RegistrationModule } from './registration/registration.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ServersModule } from './servers/servers.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AlertsModule } from './alerts/alerts.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminModule } from './admin/admin.module'
import { EulasModule } from './eulas/eulas.module';
import { UsersModule } from './users/users.module';
import { AnnouncementsModule } from './announcements/announcements.module';  // <-- Importar AnnouncementsModule
import { BillingModule } from './billing/billing.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: Number(cfg.get<string>('DB_PORT', '5432')),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASS') ?? '',   // <-- siempre string
        database: cfg.get<string>('DB_NAME'),
        synchronize: false,
        ssl: false,
      }),
    }),
    AuthModule,
    NdaModule,
    RegistrationModule,
    InvoicesModule,
    ServersModule,
    SubscriptionsModule,
    AlertsModule,
    AdminAuthModule,
    AdminModule,
    EulasModule,
    UsersModule,
    AnnouncementsModule,
    BillingModule
  ],
})
export class AppModule {}
