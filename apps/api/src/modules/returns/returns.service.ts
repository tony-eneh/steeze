import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  OrderStatus,
  PaymentStatus,
  TransactionType,
  UserRole,
} from '@prisma/client';
import { subDays } from 'date-fns';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Customer requests a return within 2 days of delivery
   */
  async createReturnRequest(
    userId: string,
    orderId: string,
    dto: CreateReturnRequestDto,
  ) {
    // Find order and validate ownership
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        designer: {
          include: {
            user: true,
          },
        },
        payment: true,
        returnRequest: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is the customer
    if (order.customerId !== userId) {
      throw new ForbiddenException('You can only request returns for your own orders');
    }

    // Validate order status is DELIVERED
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Returns can only be requested for delivered orders');
    }

    // Check if return already exists
    if (order.returnRequest) {
      throw new BadRequestException('A return request already exists for this order');
    }

    // Validate within 2-day window
    if (!order.deliveredAt) {
      throw new BadRequestException('Order delivery date not recorded');
    }

    const twoDaysAgo = subDays(new Date(), 2);
    if (order.deliveredAt < twoDaysAgo) {
      throw new BadRequestException(
        'Return window has expired. Returns must be requested within 2 days of delivery',
      );
    }

    // Create return request and update order status in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create return request
      const returnRequest = await tx.returnRequest.create({
        data: {
          orderId,
          reason: dto.reason,
          status: 'PENDING',
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.RETURN_REQUESTED,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: OrderStatus.DELIVERED,
          toStatus: OrderStatus.RETURN_REQUESTED,
          note: `Return requested: ${dto.reason}`,
          changedBy: userId,
        },
      });

      return returnRequest;
    });

    return result;
  }

  /**
   * List all return requests (admin only)
   */
  async findAll(paginationDto: PaginationDto, status?: string) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [returnRequests, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
              designer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              design: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return {
      data: returnRequests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific return request
   */
  async findOne(id: string) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            designer: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            design: {
              select: {
                id: true,
                title: true,
              },
            },
            payment: true,
          },
        },
      },
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    return returnRequest;
  }

  /**
   * Admin approves return request
   */
  async approve(id: string, adminId: string, dto: UpdateReturnRequestDto) {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== 'PENDING') {
      throw new BadRequestException('Only pending return requests can be approved');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update return request status
      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminNotes: dto.adminNotes,
          updatedAt: new Date(),
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * Admin rejects return request
   */
  async reject(id: string, adminId: string, dto: UpdateReturnRequestDto) {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== 'PENDING') {
      throw new BadRequestException('Only pending return requests can be rejected');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update return request status
      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNotes: dto.adminNotes,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update order status back to DELIVERED
      await tx.order.update({
        where: { id: returnRequest.orderId },
        data: {
          status: OrderStatus.DELIVERED,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: returnRequest.orderId,
          fromStatus: OrderStatus.RETURN_REQUESTED,
          toStatus: OrderStatus.DELIVERED,
          note: `Return rejected: ${dto.adminNotes || 'No reason provided'}`,
          changedBy: adminId,
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * Mark courier dispatched for return pickup
   */
  async markPickupDispatched(
    id: string,
    adminId: string,
    dto: UpdateReturnRequestDto,
  ) {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== 'APPROVED') {
      throw new BadRequestException('Only approved return requests can be marked as dispatched');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update return request status
      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status: 'PICKUP_DISPATCHED',
          adminNotes: dto.adminNotes,
          updatedAt: new Date(),
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: returnRequest.orderId },
        data: {
          status: OrderStatus.RETURN_PICKUP,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: returnRequest.orderId,
          fromStatus: OrderStatus.RETURN_REQUESTED,
          toStatus: OrderStatus.RETURN_PICKUP,
          note: 'Courier dispatched for return pickup',
          changedBy: adminId,
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * Complete return - refund customer and deduct return fee from designer
   */
  async markReturned(id: string, adminId: string, dto: UpdateReturnRequestDto) {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== 'PICKUP_DISPATCHED') {
      throw new BadRequestException('Return must be in PICKUP_DISPATCHED status to complete');
    }

    // Get return courier fee from platform settings
    const returnFeeSettings = await this.prisma.platformSetting.findUnique({
      where: { key: 'return_courier_fee' },
    });

    const returnCourierFee = returnFeeSettings
      ? parseFloat(returnFeeSettings.value)
      : 2500; // Default NGN 2,500

    const result = await this.prisma.$transaction(async (tx) => {
      // Update return request status
      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status: 'RETURNED',
          courierFee: returnCourierFee,
          adminNotes: dto.adminNotes,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update order status
      const order = await tx.order.update({
        where: { id: returnRequest.orderId },
        data: {
          status: OrderStatus.RETURNED,
          returnedAt: new Date(),
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: returnRequest.orderId,
          fromStatus: OrderStatus.RETURN_PICKUP,
          toStatus: OrderStatus.RETURNED,
          note: 'Return completed, refund processed',
          changedBy: adminId,
        },
      });

      // Process refund if payment exists
      if (returnRequest.order.payment) {
        // Update payment status to REFUNDED
        await tx.payment.update({
          where: { id: returnRequest.order.payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt: new Date(),
          },
        });

        // Create refund transaction for customer
        await tx.walletTransaction.create({
          data: {
            userId: order.customerId,
            paymentId: returnRequest.order.payment.id,
            type: TransactionType.REFUND,
            amount: order.totalPrice,
            currency: order.currency,
            description: `Refund for order ${order.orderNumber} - Return completed`,
          },
        });

        // Deduct return courier fee from designer
        await tx.walletTransaction.create({
          data: {
            userId: returnRequest.order.designer.userId,
            paymentId: returnRequest.order.payment.id,
            type: TransactionType.RETURN_FEE_DEDUCTION,
            amount: returnCourierFee,
            currency: order.currency,
            description: `Return courier fee for order ${order.orderNumber}`,
          },
        });
      }

      return updated;
    });

    return result;
  }
}
