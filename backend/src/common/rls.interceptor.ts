// src/common/rls.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Observable } from 'rxjs';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(private readonly ds: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request & { user?: any }>();

    // Construye el payload que quieras propagar a PG
    const claims = JSON.stringify({
      user_id: req?.user?.user_id ?? null,
      roles: req?.user?.roles ?? null,
    });

    // IMPORTANTE: usar set_config en lugar de SET LOCAL
    // Tercer parámetro 'true' => alcance LOCAL (transacción / sentencia)
    await this.ds.query(
      `select set_config('request.jwt.claims', $1, true)`,
      [claims],
    );

    return next.handle();
  }
}
