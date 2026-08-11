import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { notificationEmail } from '../mail/mail.templates';
import { PushService } from './push.service';
import {
  CreateNotificationDto,
  ListNotificationsDto,
  RegisterDeviceDto,
} from './dto';

// Order and payment events are worth an email; the rest stay in-app and push.
const EMAILED_TYPES: NotificationType[] = [
  NotificationType.ORDER_UPDATE,
  NotificationType.PAYMENT_UPDATE,
  NotificationType.RETURN_UPDATE,
];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly pushService: PushService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Create a new notification and fan it out to push and email. Delivery
   * failures are logged rather than thrown: the in-app record is the source of
   * truth and the caller is usually mid order-transition.
   */
  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
      },
    });

    await this.dispatch(notification.id, dto);

    return notification;
  }

  private async dispatch(notificationId: string, dto: CreateNotificationDto) {
    const data = (dto.data ?? {}) as Record<string, unknown>;

    try {
      await this.pushService.sendToUser(dto.userId, {
        title: dto.title,
        body: dto.body,
        data: {
          notificationId,
          type: dto.type,
          ...Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, String(value)]),
          ),
        },
      });
    } catch (error) {
      this.logger.warn(`Push dispatch failed: ${describe(error)}`);
    }

    if (!EMAILED_TYPES.includes(dto.type)) {
      return;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { email: true },
      });

      if (!user) {
        return;
      }

      const orderId = typeof data.orderId === 'string' ? data.orderId : null;
      const platformUrl = (
        this.config.get<string>('PLATFORM_URL') ?? 'https://steeze.com'
      ).replace(/\/$/, '');

      const { subject, html } = notificationEmail({
        platformName: this.config.get<string>('PLATFORM_NAME') ?? 'Steeze',
        title: dto.title,
        body: dto.body,
        actionUrl: orderId ? `${platformUrl}/orders/${orderId}` : undefined,
      });

      this.mailService.queue({ to: user.email, subject, html });
    } catch (error) {
      this.logger.warn(`Email dispatch failed: ${describe(error)}`);
    }
  }

  /**
   * Register (or refresh) a device token for push delivery. Tokens move
   * between accounts when a device is handed over, so an existing token is
   * reassigned rather than rejected.
   */
  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const device = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { userId, platform: dto.platform, lastSeenAt: new Date() },
      create: { userId, token: dto.token, platform: dto.platform },
    });

    return { id: device.id, platform: device.platform };
  }

  async unregisterDevice(userId: string, token: string) {
    const result = await this.prisma.deviceToken.deleteMany({
      where: { token, userId },
    });

    return { removed: result.count };
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

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
