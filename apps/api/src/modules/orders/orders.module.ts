import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderTasksService } from './order-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MeasurementsModule } from '../measurements/measurements.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, MeasurementsModule, forwardRef(() => PaymentsModule)],
  controllers: [OrdersController],
  providers: [OrdersService, OrderTasksService],
  exports: [OrdersService],
})
export class OrdersModule {}
