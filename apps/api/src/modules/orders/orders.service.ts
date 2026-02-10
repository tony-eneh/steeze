import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { OpenTailorService } from '../measurements/open-tailor.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly openTailorService: OpenTailorService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    // Validate design exists and is published
    const design = await this.prisma.design.findUnique({
      where: { id: createOrderDto.designId },
      include: {
        designer: true,
        fabricOptions: true,
        addOns: true,
        sizePricings: true,
      },
    });

    if (!design || !design.isPublished || !design.isActive) {
      throw new NotFoundException('Design not found or not available');
    }

    // Validate delivery address belongs to user
    const address = await this.prisma.address.findFirst({
      where: {
        id: createOrderDto.deliveryAddressId,
        userId,
      },
    });

    if (!address) {
      throw new BadRequestException('Invalid delivery address');
    }

    // Validate fabric option if provided
    let fabricPriceAdjustment = 0;
    if (createOrderDto.fabricOptionId) {
      const fabric = design.fabricOptions.find(
        (f) => f.id === createOrderDto.fabricOptionId,
      );
      if (!fabric || !fabric.isAvailable) {
        throw new BadRequestException('Invalid fabric option');
      }
      fabricPriceAdjustment = Number(fabric.priceAdjustment);
    }

    // Validate add-ons if provided
    let addOnsTotal = 0;
    const validAddOnIds: string[] = [];
    if (createOrderDto.addOnIds && createOrderDto.addOnIds.length > 0) {
      for (const addOnSelection of createOrderDto.addOnIds) {
        const addOn = design.addOns.find((a) => a.id === addOnSelection.addOnId);
        if (!addOn || !addOn.isAvailable) {
          throw new BadRequestException(`Invalid add-on: ${addOnSelection.addOnId}`);
        }
        addOnsTotal += Number(addOn.price);
        validAddOnIds.push(addOn.id);
      }
    }

    // Get size pricing adjustment if size is specified
    let sizePriceAdjustment = 0;
    if (createOrderDto.sizeLabel) {
      const sizePricing = design.sizePricings.find(
        (s) => s.sizeLabel === createOrderDto.sizeLabel,
      );
      if (sizePricing) {
        sizePriceAdjustment = Number(sizePricing.priceAdjustment);
      }
    }

    // Calculate total price
    const basePrice = Number(design.basePrice);
    const deliveryFee = createOrderDto.deliveryFee || 0;
    const totalPrice =
      basePrice +
      fabricPriceAdjustment +
      sizePriceAdjustment +
      addOnsTotal +
      deliveryFee;

    // Get platform commission percentage from settings
    const commissionSetting = await this.prisma.platformSetting.findUnique({
      where: { key: 'commission_percentage' },
    });
    const commissionPercentage = commissionSetting
      ? parseFloat(commissionSetting.value)
      : 10;
    const platformCommission = (totalPrice * commissionPercentage) / 100;

    // Fetch user's measurements from Open Tailor if linked
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    let measurementSnapshot: any = null;
    if (user?.openTailorEmail) {
      try {
        measurementSnapshot = await this.openTailorService.getMeasurementsByEmail(
          user.openTailorEmail,
        );
      } catch (error) {
        // If measurements not found, just store the email
        measurementSnapshot = { email: user.openTailorEmail };
      }
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId,
          designerId: design.designerId,
          designId: design.id,
          deliveryAddressId: address.id,
          status: OrderStatus.PENDING_PAYMENT,
          basePrice,
          fabricPriceAdjustment,
          sizePriceAdjustment,
          addOnsTotal,
          deliveryFee,
          totalPrice,
          platformCommission,
          currency: design.currency,
          sizeLabel: createOrderDto.sizeLabel,
          specialInstructions: createOrderDto.specialInstructions,
          measurementSnapshot,
        },
      });

      // Create fabric selection if provided
      if (createOrderDto.fabricOptionId) {
        await tx.orderFabricSelection.create({
          data: {
            orderId: newOrder.id,
            fabricOptionId: createOrderDto.fabricOptionId,
          },
        });
      }

      // Create add-on selections
      if (validAddOnIds.length > 0) {
        const addOnSelections = validAddOnIds.map((addOnId) => {
          const addOn = design.addOns.find((a) => a.id === addOnId);
          return {
            orderId: newOrder.id,
            addOnId,
            price: addOn!.price,
          };
        });
        await tx.orderAddOnSelection.createMany({
          data: addOnSelections,
        });
      }

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          toStatus: OrderStatus.PENDING_PAYMENT,
          note: 'Order created',
          changedBy: userId,
        },
      });

      return newOrder;
    });

    // Return full order with relations
    return this.findOne(order.id, userId);
  }

  async findAll(
    userId: string,
    userRole: string,
    paginationDto: PaginationDto,
    status?: string,
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (userRole === 'CUSTOMER') {
      where.customerId = userId;
    } else if (userRole === 'DESIGNER') {
      // Get designer profile
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { designerProfile: true },
      });
      if (!user?.designerProfile) {
        throw new BadRequestException('Designer profile not found');
      }
      where.designerId = user.designerProfile.id;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          designer: {
            select: {
              id: true,
              businessName: true,
              slug: true,
            },
          },
          design: {
            select: {
              id: true,
              title: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          deliveryAddress: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            avatarUrl: true,
          },
        },
        designer: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            shopAddress: true,
            shopCity: true,
            shopState: true,
            user: {
              select: {
                phone: true,
              },
            },
          },
        },
        design: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            images: true,
          },
        },
        deliveryAddress: true,
        fabricSelection: {
          include: {
            fabricOption: true,
          },
        },
        addOnSelections: {
          include: {
            addOn: true,
          },
        },
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check authorization if userId is provided
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { designerProfile: true },
      });

      const isCustomer = order.customerId === userId;
      const isDesigner =
        user?.designerProfile && order.designerId === user.designerProfile.id;

      if (!isCustomer && !isDesigner && user?.role !== 'ADMIN') {
        throw new ForbiddenException('Not authorized to view this order');
      }
    }

    return order;
  }

  // Designer accepts order
  async acceptOrder(
    userId: string,
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.checkDesignerOwnership(userId, orderId);

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Order can only be accepted when status is PAID',
      );
    }

    return this.updateOrderStatus(
      order.id,
      OrderStatus.ACCEPTED,
      userId,
      updateDto.note || 'Designer accepted the order',
    );
  }

  // Designer rejects order
  async rejectOrder(
    userId: string,
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.checkDesignerOwnership(userId, orderId);

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Order can only be rejected when status is PAID',
      );
    }

    return this.updateOrderStatus(
      order.id,
      OrderStatus.REJECTED,
      userId,
      updateDto.note || 'Designer rejected the order',
    );
  }

  // Designer marks as in progress
  async markInProgress(
    userId: string,
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.checkDesignerOwnership(userId, orderId);

    if (order.status !== OrderStatus.ACCEPTED) {
      throw new BadRequestException(
        'Order must be accepted before marking as in progress',
      );
    }

    return this.updateOrderStatus(
      order.id,
      OrderStatus.IN_PROGRESS,
      userId,
      updateDto.note || 'Work started on the garment',
    );
  }

  // Designer marks as ready for pickup
  async markReady(
    userId: string,
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.checkDesignerOwnership(userId, orderId);

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Order must be in progress before marking as ready',
      );
    }

    return this.updateOrderStatus(
      order.id,
      OrderStatus.READY_FOR_PICKUP,
      userId,
      updateDto.note || 'Garment ready for courier pickup',
      { readyAt: new Date() },
    );
  }

  // Admin/System marks as picked up
  async markPickedUp(orderId: string, updateDto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Order must be ready for pickup');
    }

    return this.updateOrderStatus(
      order.id,
      OrderStatus.PICKED_UP,
      'SYSTEM',
      updateDto.note || 'Courier picked up from designer',
      { pickedUpAt: new Date() },
    );
  }

  // Admin/System marks as in transit
  async markInTransit(orderId: string, updateDto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException('Order must be picked up first');
    }

    return this.updateOrderStatus(
      order.id,
      OrderStatus.IN_TRANSIT,
      'SYSTEM',
      updateDto.note || 'Order in transit to customer',
    );
  }

  // Admin/System marks as delivered
  async markDelivered(orderId: string, updateDto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.IN_TRANSIT) {
      throw new BadRequestException('Order must be in transit');
    }

    // Set auto-confirm deadline (2 days from delivery)
    const autoConfirmDays = await this.getAutoConfirmDays();
    const autoConfirmDeadline = new Date();
    autoConfirmDeadline.setDate(autoConfirmDeadline.getDate() + autoConfirmDays);

    return this.updateOrderStatus(
      order.id,
      OrderStatus.DELIVERED,
      'SYSTEM',
      updateDto.note || 'Order delivered to customer',
      { deliveredAt: new Date(), autoConfirmDeadline },
    );
  }

  // Customer confirms order
  async confirmOrder(
    userId: string,
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.checkCustomerOwnership(userId, orderId);

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Order must be delivered to confirm');
    }

    return this.updateOrderStatus(
      order.id,
      OrderStatus.CONFIRMED,
      userId,
      updateDto.note || 'Customer confirmed satisfaction',
      { confirmedAt: new Date() },
    );
  }

  // Cancel order (only before accepted)
  async cancelOrder(
    userId: string,
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.checkCustomerOwnership(userId, orderId);

    const allowedStatuses: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
    ];

    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Order can only be cancelled before designer accepts it',
      );
    }

    return this.updateOrderStatus(
      order.id,
      OrderStatus.CANCELLED,
      userId,
      updateDto.note || 'Customer cancelled the order',
      { cancelledAt: new Date() },
    );
  }

  // Get status history
  async getStatusHistory(orderId: string, userId: string) {
    // Check authorization
    await this.findOne(orderId, userId);

    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Helper methods
  private async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    note: string,
    additionalData: any = {},
  ) {
    const order = await this.prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...additionalData,
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          designer: {
            select: {
              id: true,
              businessName: true,
            },
          },
          design: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: currentOrder!.status,
          toStatus: newStatus,
          note,
          changedBy,
        },
      });

      return updatedOrder;
    });

    return order;
  }

  private async checkDesignerOwnership(userId: string, orderId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { designerProfile: true },
    });

    if (!user?.designerProfile) {
      throw new ForbiddenException('Not a designer');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.designerId !== user.designerProfile.id) {
      throw new ForbiddenException('Not authorized to modify this order');
    }

    return order;
  }

  private async checkCustomerOwnership(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== userId) {
      throw new ForbiddenException('Not authorized to modify this order');
    }

    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `STZ-${year}${month}${day}-${random}`;
  }

  private async getAutoConfirmDays(): Promise<number> {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key: 'auto_confirm_days' },
    });
    return setting ? parseInt(setting.value) : 2;
  }
}
