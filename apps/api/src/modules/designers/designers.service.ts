import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDesignerProfileDto } from './dto/update-designer-profile.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class DesignersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto, search?: string) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {
      isVerified: true,
      user: {
        isActive: true,
      },
    };

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [designers, total] = await Promise.all([
      this.prisma.designerProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              designs: { where: { isPublished: true } },
            },
          },
        },
        orderBy: [
          { averageRating: 'desc' },
          { totalCompletedOrders: 'desc' },
        ],
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

  async findBySlug(slug: string) {
    const designer = await this.prisma.designerProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            designs: { where: { isPublished: true } },
          },
        },
      },
    });

    if (!designer) {
      throw new NotFoundException('Designer not found');
    }

    return designer;
  }

  async getDesignerDesigns(slug: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const designer = await this.prisma.designerProfile.findUnique({
      where: { slug },
    });

    if (!designer) {
      throw new NotFoundException('Designer not found');
    }

    const [designs, total] = await Promise.all([
      this.prisma.design.findMany({
        where: {
          designerId: designer.id,
          isPublished: true,
          isActive: true,
        },
        skip,
        take: limit,
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              fabricOptions: true,
              addOns: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.design.count({
        where: {
          designerId: designer.id,
          isPublished: true,
          isActive: true,
        },
      }),
    ]);

    return {
      data: designs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateMyProfile(userId: string, updateDto: UpdateDesignerProfileDto) {
    // Check if user has designer profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { designerProfile: true },
    });

    if (!user?.designerProfile) {
      throw new BadRequestException('Designer profile not found');
    }

    // If businessName is being updated, generate new slug
    let slug: string | undefined;
    if (updateDto.businessName) {
      slug = this.generateSlug(updateDto.businessName);
      
      // Check if slug already exists
      const existingSlug = await this.prisma.designerProfile.findUnique({
        where: { slug },
      });

      if (existingSlug && existingSlug.id !== user.designerProfile.id) {
        // Append random string to make it unique
        slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
      }
    }

    const designer = await this.prisma.designerProfile.update({
      where: { id: user.designerProfile.id },
      data: {
        ...updateDto,
        ...(slug && { slug }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return designer;
  }

  async getMyOrders(userId: string, paginationDto: PaginationDto, status?: string) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    // Get designer profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { designerProfile: true },
    });

    if (!user?.designerProfile) {
      throw new BadRequestException('Designer profile not found');
    }

    const where: any = {
      designerId: user.designerProfile.id,
    };

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

  async getMyEarnings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { designerProfile: true },
    });

    if (!user?.designerProfile) {
      throw new BadRequestException('Designer profile not found');
    }

    // Calculate total earnings from wallet transactions
    const transactions = await this.prisma.walletTransaction.groupBy({
      by: ['type'],
      where: {
        userId,
        type: {
          in: ['ESCROW_RELEASE', 'COMMISSION_DEDUCTION', 'RETURN_FEE_DEDUCTION'],
        },
      },
      _sum: {
        amount: true,
      },
    });

    let totalEarnings = 0;
    let totalCommission = 0;
    let totalReturnFees = 0;

    transactions.forEach((t) => {
      if (t.type === 'ESCROW_RELEASE') {
        totalEarnings += Number(t._sum.amount || 0);
      } else if (t.type === 'COMMISSION_DEDUCTION') {
        totalCommission += Number(t._sum.amount || 0);
      } else if (t.type === 'RETURN_FEE_DEDUCTION') {
        totalReturnFees += Number(t._sum.amount || 0);
      }
    });

    // Get pending earnings (orders that are delivered but not confirmed)
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        designerId: user.designerProfile.id,
        status: { in: ['DELIVERED', 'PAID', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'] },
      },
      select: {
        totalPrice: true,
        platformCommission: true,
      },
    });

    const pendingEarnings = pendingOrders.reduce(
      (sum, order) =>
        sum + (Number(order.totalPrice) - Number(order.platformCommission)),
      0,
    );

    return {
      totalEarnings,
      totalCommission,
      totalReturnFees,
      netEarnings: totalEarnings - totalCommission - totalReturnFees,
      pendingEarnings,
      availableBalance: totalEarnings - totalCommission - totalReturnFees,
      totalCompletedOrders: user.designerProfile.totalCompletedOrders,
      averageRating: user.designerProfile.averageRating,
    };
  }

  private generateSlug(businessName: string): string {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
