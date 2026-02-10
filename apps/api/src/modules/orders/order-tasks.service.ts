import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderTasksService {
  private readonly logger = new Logger(OrderTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async autoConfirmDeliveredOrders() {
    this.logger.log('Running auto-confirmation task for delivered orders...');

    try {
      // Get auto_confirm_days setting
      const setting = await this.prisma.platformSetting.findUnique({
        where: { key: 'auto_confirm_days' },
      });
      const autoConfirmDays = setting ? parseInt(setting.value) : 2;

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - autoConfirmDays);

      // Find orders that should be auto-confirmed
      const ordersToConfirm = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            lte: cutoffDate,
          },
        },
      });

      this.logger.log(`Found ${ordersToConfirm.length} orders to auto-confirm`);

      // Process each order
      for (const order of ordersToConfirm) {
        try {
          await this.autoConfirmOrder(order.id);
          this.logger.log(`Auto-confirmed order ${order.orderNumber}`);
        } catch (error) {
          this.logger.error(
            `Failed to auto-confirm order ${order.orderNumber}:`,
            error.message,
          );
        }
      }

      this.logger.log('Auto-confirmation task completed');
    } catch (error) {
      this.logger.error('Error in auto-confirmation task:', error);
    }
  }

  private async autoConfirmOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status to AUTO_CONFIRMED
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.AUTO_CONFIRMED,
          confirmedAt: new Date(),
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.AUTO_CONFIRMED,
          note: `Order auto-confirmed after ${
            order.autoConfirmDeadline && order.deliveredAt
              ? Math.round(
                  (new Date().getTime() - order.deliveredAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : '2'
          } days`,
          changedBy: 'SYSTEM',
        },
      });

      // Release funds to designer
      try {
        await this.paymentsService.releaseFunds(orderId);
      } catch (error) {
        this.logger.error(`Error releasing funds for order ${orderId}:`, error.message);
        throw error;
      }
    });
  }
}
