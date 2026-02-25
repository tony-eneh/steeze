import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrderTasksService {
  private readonly logger = new Logger(OrderTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
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
          const result = await this.autoConfirmOrder(order.id);

          await this.notificationsService.notifyOrderUpdate(
            result.customerId,
            result.orderId,
            result.orderNumber,
            OrderStatus.AUTO_CONFIRMED,
          );

          await this.notificationsService.notifyOrderUpdate(
            result.designerUserId,
            result.orderId,
            result.orderNumber,
            OrderStatus.AUTO_CONFIRMED,
          );

          if (result.releasedAmount !== null) {
            await this.notificationsService.notifyPaymentUpdate(
              result.designerUserId,
              result.orderId,
              result.orderNumber,
              'released',
              result.releasedAmount,
            );
          }

          this.logger.log(`Auto-confirmed order ${order.orderNumber}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to auto-confirm order ${order.orderNumber}:`,
            message,
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
        include: {
          designer: {
            include: {
              user: true,
            },
          },
          payment: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status to AUTO_CONFIRMED
      const updatedOrder = await tx.order.update({
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

      let releasedAmount: number | null = null;

      // Release funds to designer
      if (
        order.payment &&
        order.payment.status === PaymentStatus.HELD_IN_ESCROW
      ) {
        const designerEarnings =
          Number(order.totalPrice) - Number(order.platformCommission);
        releasedAmount = designerEarnings;

        // Update payment status
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: PaymentStatus.RELEASED,
            releasedAt: new Date(),
          },
        });

        // Create ESCROW_RELEASE transaction for designer
        await tx.walletTransaction.create({
          data: {
            userId: order.designer.userId,
            paymentId: order.payment.id,
            type: TransactionType.ESCROW_RELEASE,
            amount: designerEarnings,
            currency: order.currency,
            description: `Earnings released for order ${order.orderNumber}`,
          },
        });

        // Create COMMISSION_DEDUCTION transaction (for record keeping)
        await tx.walletTransaction.create({
          data: {
            userId: order.designer.userId,
            paymentId: order.payment.id,
            type: TransactionType.COMMISSION_DEDUCTION,
            amount: order.platformCommission,
            currency: order.currency,
            description: `Platform commission for order ${order.orderNumber}`,
          },
        });
      }

      return {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerId: order.customerId,
        designerUserId: order.designer.userId,
        releasedAmount,
      };
    });
  }
}
