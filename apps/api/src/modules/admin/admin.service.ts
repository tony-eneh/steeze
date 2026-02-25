import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  UpdatePlatformSettingDto,
  UpdateUserStatusDto,
  UpdateDesignerVerificationDto,
} from './dto';
import { UserRole, OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalDesigners,
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.designerProfile.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: { in: ['CONFIRMED', 'AUTO_CONFIRMED'] },
        },
      }),
      this.prisma.order.count({
        where: {
          status: {
            in: ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
          },
        },
      }),
      this.prisma.order.count({
        where: {
          status: { in: ['CONFIRMED', 'AUTO_CONFIRMED'] },
        },
      }),
    ]);

    return {
      totalUsers,
      totalDesigners,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      pendingOrders,
      completedOrders,
    };
  }

  /**
   * List all users with filters
   */
  async listUsers(paginationDto: PaginationDto, role?: UserRole) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          designerProfile: {
            select: {
              id: true,
              businessName: true,
              isVerified: true,
              averageRating: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        designerProfile: true,
        ordersAsCustomer: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalPrice: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user active status
   */
  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
    });
  }

  /**
   * List all designers with verification status
   */
  async listDesigners(paginationDto: PaginationDto, verified?: boolean) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (verified !== undefined) {
      where.isVerified = verified;
    }

    const [designers, total] = await Promise.all([
      this.prisma.designerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.designerProfile.count({ where }),
    ]);

    return {
      data: designers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update designer verification status
   */
  async updateDesignerVerification(
    id: string,
    dto: UpdateDesignerVerificationDto,
  ) {
    const designer = await this.prisma.designerProfile.findUnique({
      where: { id },
    });

    if (!designer) {
      throw new NotFoundException('Designer not found');
    }

    return this.prisma.designerProfile.update({
      where: { id },
      data: {
        isVerified: dto.isVerified,
      },
    });
  }

  /**
   * Get all platform settings
   */
  async getAllSettings() {
    return this.prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get a single platform setting by key
   */
  async getSetting(key: string) {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    return setting;
  }

  /**
   * Update a platform setting
   */
  async updateSetting(
    key: string,
    dto: UpdatePlatformSettingDto,
    adminId: string,
  ) {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    // Validate value based on key
    if (key === 'commission_percentage') {
      const value = parseFloat(dto.value);
      if (isNaN(value) || value < 0 || value > 100) {
        throw new BadRequestException(
          'Commission percentage must be between 0 and 100',
        );
      }
    }

    if (key === 'return_courier_fee' || key === 'auto_confirm_days') {
      const value = parseFloat(dto.value);
      if (isNaN(value) || value < 0) {
        throw new BadRequestException(`${key} must be a positive number`);
      }
    }

    return this.prisma.platformSetting.update({
      where: { key },
      data: {
        value: dto.value,
        updatedBy: adminId,
      },
    });
  }

  /**
   * Get orders statistics for admin dashboard
   */
  async getOrdersStats() {
    const statuses: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.ACCEPTED,
      OrderStatus.IN_PROGRESS,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.DELIVERED,
      OrderStatus.CONFIRMED,
      OrderStatus.AUTO_CONFIRMED,
      OrderStatus.RETURN_REQUESTED,
      OrderStatus.RETURNED,
      OrderStatus.CANCELLED,
      OrderStatus.REJECTED,
    ];

    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.order.count({
          where: { status },
        }),
      ),
    );

    const stats: Record<string, number> = {};
    statuses.forEach((status, index) => {
      stats[status] = counts[index];
    });

    return stats;
  }

  /**
   * Get payments overview
   */
  async getPaymentsOverview() {
    const [totalEscrow, totalReleased, totalRefunded, pendingRelease] =
      await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'HELD_IN_ESCROW' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'RELEASED' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'REFUNDED' },
        }),
        this.prisma.payment.count({
          where: { status: 'HELD_IN_ESCROW' },
        }),
      ]);

    return {
      totalEscrow: totalEscrow._sum.amount || 0,
      totalReleased: totalReleased._sum.amount || 0,
      totalRefunded: totalRefunded._sum.amount || 0,
      pendingReleaseCount: pendingRelease,
    };
  }
}
