import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, ListNotificationsDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new notification
   */
  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
      },
    });
  }

  /**
   * Get notifications for a user with filters and pagination
   */
  async findAll(userId: string, dto: ListNotificationsDto) {
    const { type, isRead, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single notification by ID
   */
  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only access your own notifications',
      );
    }

    return notification;
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string) {
    // First verify ownership
    await this.findOne(id, userId);

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    };
  }

  // ===== Helper methods for creating notifications =====

  /**
   * Create notification for order status update
   */
  async notifyOrderUpdate(
    userId: string,
    orderId: string,
    orderNumber: string,
    newStatus: string,
  ) {
    const statusMessages: Record<string, string> = {
      PAID: 'Your payment has been received and is being processed.',
      ACCEPTED: 'Your order has been accepted by the designer.',
      REJECTED: 'Your order has been rejected by the designer.',
      IN_PROGRESS: 'The designer is working on your order.',
      READY_FOR_PICKUP: 'Your order is ready and will be picked up soon.',
      PICKED_UP: 'Your order has been picked up by the courier.',
      IN_TRANSIT: 'Your order is on its way to you.',
      DELIVERED: 'Your order has been delivered. Please confirm receipt.',
      CONFIRMED: 'Thank you for confirming your order!',
      AUTO_CONFIRMED: 'Your order has been auto-confirmed.',
      RETURN_REQUESTED: 'A return has been requested for your order.',
      RETURN_PICKUP: 'Courier is on the way to pick up the return.',
      RETURN_IN_TRANSIT: 'The return is on its way back to the designer.',
      RETURNED: 'The return has been completed.',
      CANCELLED: 'Your order has been cancelled.',
    };

    const body =
      statusMessages[newStatus] || `Order status updated to ${newStatus}`;

    await this.create({
      userId,
      type: NotificationType.ORDER_UPDATE,
      title: `Order ${orderNumber} Updated`,
      body,
      data: {
        orderId,
        orderNumber,
        status: newStatus,
      },
    });
  }

  /**
   * Create notification for payment event
   */
  async notifyPaymentUpdate(
    userId: string,
    orderId: string,
    orderNumber: string,
    event: 'success' | 'failed' | 'released' | 'refunded',
    amount?: number,
  ) {
    const eventMessages = {
      success: `Payment of ${amount ? `₦${amount.toLocaleString()}` : ''} received successfully.`,
      failed: 'Payment failed. Please try again.',
      released: `Funds of ${amount ? `₦${amount.toLocaleString()}` : ''} have been released.`,
      refunded: `Refund of ${amount ? `₦${amount.toLocaleString()}` : ''} has been processed.`,
    };

    await this.create({
      userId,
      type: NotificationType.PAYMENT_UPDATE,
      title: 'Payment Update',
      body: eventMessages[event],
      data: {
        orderId,
        orderNumber,
        event,
        amount,
      },
    });
  }

  /**
   * Create notification for new rating received
   */
  async notifyRatingReceived(
    userId: string,
    orderId: string,
    orderNumber: string,
    score: number,
    raterName: string,
  ) {
    const stars = '⭐'.repeat(score);

    await this.create({
      userId,
      type: NotificationType.RATING_RECEIVED,
      title: 'New Rating Received',
      body: `${raterName} rated you ${stars} (${score}/5) for order ${orderNumber}`,
      data: {
        orderId,
        orderNumber,
        score,
        raterName,
      },
    });
  }

  /**
   * Create notification for return request update
   */
  async notifyReturnUpdate(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    message: string,
  ) {
    await this.create({
      userId,
      type: NotificationType.RETURN_UPDATE,
      title: `Return Update - Order ${orderNumber}`,
      body: message,
      data: {
        orderId,
        orderNumber,
        status,
      },
    });
  }

  /**
   * Create system notification
   */
  async notifySystem(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    await this.create({
      userId,
      type: NotificationType.SYSTEM,
      title,
      body,
      data: data || {},
    });
  }
}
