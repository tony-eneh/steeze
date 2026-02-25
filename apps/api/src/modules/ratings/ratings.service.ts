import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a rating for an order (bidirectional - customer rates designer, designer rates customer)
   */
  async createRating(userId: string, orderId: string, dto: CreateRatingDto) {
    // Find order and validate
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        designer: {
          include: {
            user: true,
          },
        },
        ratings: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate order is completed (CONFIRMED or AUTO_CONFIRMED)
    if (
      order.status !== OrderStatus.CONFIRMED &&
      order.status !== OrderStatus.AUTO_CONFIRMED
    ) {
      throw new BadRequestException(
        'Ratings can only be given after order is confirmed',
      );
    }

    // Determine if user is customer or designer
    let raterId: string;
    let rateeId: string;

    if (order.customerId === userId) {
      // Customer is rating the designer
      raterId = userId;
      rateeId = order.designer.userId;
    } else if (order.designer.userId === userId) {
      // Designer is rating the customer
      raterId = userId;
      rateeId = order.customerId;
    } else {
      throw new ForbiddenException('You are not part of this order');
    }

    // Check if user has already rated this order
    const existingRating = order.ratings.find((r) => r.raterId === raterId);
    if (existingRating) {
      throw new BadRequestException('You have already rated this order');
    }

    // Create rating
    const rating = await this.prisma.rating.create({
      data: {
        orderId,
        raterId,
        rateeId,
        score: dto.score,
        comment: dto.comment,
      },
      include: {
        rater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        ratee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // If ratee is a designer, update their average rating
    if (rateeId === order.designer.userId) {
      await this.updateDesignerAverageRating(order.designer.id);
    }

    // Send notification to the person being rated
    try {
      const raterName = `${rating.rater.firstName} ${rating.rater.lastName}`;
      await this.notificationsService.notifyRatingReceived(
        rateeId,
        orderId,
        order.orderNumber,
        dto.score,
        raterName,
      );
    } catch (error) {
      console.error('Failed to send rating notification:', error);
    }

    return rating;
  }

  /**
   * Get ratings received by a user
   */
  async getRatingsForUser(userId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        designerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { rateeId: userId },
        skip,
        take: limit,
        include: {
          rater: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rating.count({ where: { rateeId: userId } }),
    ]);

    // Calculate average rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0;

    return {
      data: ratings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        averageRating: parseFloat(averageRating.toFixed(2)),
      },
    };
  }

  /**
   * Get ratings for a specific order
   */
  async getRatingsForOrder(orderId: string, userId: string) {
    // Find order and validate user has access
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        designer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is part of this order
    if (order.customerId !== userId && order.designer.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    const ratings = await this.prisma.rating.findMany({
      where: { orderId },
      include: {
        rater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
        ratee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ratings;
  }

  /**
   * Update designer's average rating
   */
  private async updateDesignerAverageRating(designerProfileId: string) {
    const designerProfile = await this.prisma.designerProfile.findUnique({
      where: { id: designerProfileId },
    });

    if (!designerProfile) {
      return;
    }

    // Get all ratings for this designer
    const ratings = await this.prisma.rating.findMany({
      where: { rateeId: designerProfile.userId },
      select: { score: true },
    });

    if (ratings.length === 0) {
      return;
    }

    // Calculate average
    const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
    const averageRating = totalScore / ratings.length;

    // Update designer profile
    await this.prisma.designerProfile.update({
      where: { id: designerProfileId },
      data: {
        averageRating: parseFloat(averageRating.toFixed(2)),
      },
    });
  }

  /**
   * Get rating statistics for a designer
   */
  async getDesignerRatingStats(designerProfileId: string) {
    const designerProfile = await this.prisma.designerProfile.findUnique({
      where: { id: designerProfileId },
    });

    if (!designerProfile) {
      throw new NotFoundException('Designer profile not found');
    }

    const ratings = await this.prisma.rating.findMany({
      where: { rateeId: designerProfile.userId },
      select: { score: true },
    });

    const total = ratings.length;
    const distribution = {
      5: ratings.filter((r) => r.score === 5).length,
      4: ratings.filter((r) => r.score === 4).length,
      3: ratings.filter((r) => r.score === 3).length,
      2: ratings.filter((r) => r.score === 2).length,
      1: ratings.filter((r) => r.score === 1).length,
    };

    return {
      averageRating: designerProfile.averageRating,
      totalRatings: total,
      distribution,
    };
  }
}
