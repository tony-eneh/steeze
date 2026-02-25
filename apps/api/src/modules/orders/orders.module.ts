import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderTasksService } from './order-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MeasurementsModule } from '../measurements/measurements.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, MeasurementsModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderTasksService],
  exports: [OrdersService],
})
export class OrdersModule {}
