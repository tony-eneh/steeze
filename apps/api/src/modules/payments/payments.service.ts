import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
  ) {}

  async initializePayment(userId: string, initializePaymentDto: InitializePaymentDto) {
    const { orderId } = initializePaymentDto;

    // Get order with customer details
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify the user owns this order
    if (order.customerId !== userId) {
      throw new BadRequestException('You do not have permission to pay for this order');
    }

    // Check if order is in correct status
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Order cannot be paid. Current status: ${order.status}`,
      );
    }

    // Check if payment already exists
    if (order.payment) {
      // If payment is pending, allow re-initialization
      if (order.payment.status === PaymentStatus.PENDING) {
        const reference = order.payment.externalRef;
        if (reference) {
          // Try to get existing payment URL from Paystack
          try {
            const verification = await this.paystackService.verifyTransaction(reference);
            if (verification.data.status === 'success') {
              // Payment was actually successful, update our records
              await this.handleSuccessfulPayment(order.id, reference);
              throw new BadRequestException('This order has already been paid for');
            }
          } catch (error) {
            // If verification fails, payment likely expired, create new one
            this.logger.log('Previous payment expired, creating new payment');
          }
        }
      } else {
        throw new BadRequestException('Payment already exists for this order');
      }
    }

    // Generate payment reference
    const reference = this.paystackService.generateReference(order.id);

    // Initialize Paystack transaction
    const paystackResponse = await this.paystackService.initializeTransaction(
      order.customer.email,
      Number(order.totalPrice),
      reference,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
      },
    );

    // Create or update payment record
    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        externalRef: reference,
        amount: order.totalPrice,
        currency: order.currency,
        status: PaymentStatus.PENDING,
      },
      update: {
        externalRef: reference,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      paymentId: payment.id,
      reference,
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
    };
  }

  async handleWebhook(signature: string, payload: string) {
    // Verify webhook signature
    const isValid = this.paystackService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const webhookData: PaystackWebhookDto = JSON.parse(payload);
    this.logger.log(`Received webhook event: ${webhookData.event}`);

    // Handle different webhook events
    switch (webhookData.event) {
      case 'charge.success':
        await this.handleSuccessfulPayment(
          webhookData.data.metadata.orderId,
          webhookData.data.reference,
        );
        break;
      case 'charge.failed':
        this.logger.warn(
          `Payment failed for reference: ${webhookData.data.reference}`,
        );
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${webhookData.event}`);
    }

    return { received: true };
  }

  async verifyPayment(reference: string) {
    // Verify with Paystack
    const verification = await this.paystackService.verifyTransaction(reference);

    // Get payment record
    const payment = await this.prisma.payment.findFirst({
      where: { externalRef: reference },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // If payment is successful and not already processed
    if (
      verification.data.status === 'success' &&
      payment.status === PaymentStatus.PENDING
    ) {
      await this.handleSuccessfulPayment(payment.orderId, reference);
    }

    return {
      reference,
      status: verification.data.status,
      amount: verification.data.amount / 100, // Convert from kobo
      paidAt: verification.data.paid_at,
    };
  }

  private async handleSuccessfulPayment(orderId: string, reference: string) {
    return this.prisma.$transaction(async (tx) => {
      // Get order
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Update payment status
      const payment = await tx.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.HELD_IN_ESCROW,
          paidAt: new Date(),
        },
      });

      // Create ESCROW_HOLD transaction
      await tx.walletTransaction.create({
        data: {
          userId: order.customerId,
          paymentId: payment.id,
          type: TransactionType.ESCROW_HOLD,
          amount: order.totalPrice,
          currency: order.currency,
          description: `Payment held in escrow for order ${order.orderNumber}`,
        },
      });

      // Update order status to PAID
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.PAID,
          note: `Payment successful. Reference: ${reference}`,
          changedBy: 'SYSTEM',
        },
      });

      this.logger.log(`Payment successful for order ${order.orderNumber}`);

      return payment;
    });
  }

  async releaseFunds(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Get order with payment
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          payment: true,
          designer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (!order.payment) {
        throw new BadRequestException('No payment found for this order');
      }

      if (order.payment.status !== PaymentStatus.HELD_IN_ESCROW) {
        throw new BadRequestException(
          `Funds cannot be released. Payment status: ${order.payment.status}`,
        );
      }

      // Calculate designer earnings (total - commission)
      const designerEarnings = Number(order.totalPrice) - Number(order.platformCommission);

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

      this.logger.log(
        `Funds released for order ${order.orderNumber}. Designer earnings: ${designerEarnings}`,
      );

      return {
        orderId: order.id,
        totalAmount: order.totalPrice,
        designerEarnings,
        platformCommission: order.platformCommission,
      };
    });
  }
}
