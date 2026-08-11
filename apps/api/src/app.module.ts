import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DesignersModule } from './modules/designers/designers.module';
import { DesignsModule } from './modules/designs/designs.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MeasurementsModule } from './modules/measurements/measurements.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { configValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 120 },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DesignersModule,
    DesignsModule,
    OrdersModule,
    MeasurementsModule,
    PaymentsModule,
    ReturnsModule,
    RatingsModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
