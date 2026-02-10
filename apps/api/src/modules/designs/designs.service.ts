import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { CreateFabricOptionDto } from './dto/create-fabric-option.dto';
import { CreateAddOnDto } from './dto/create-addon.dto';
import { CreateSizePricingDto } from './dto/create-size-pricing.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class DesignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createDesignDto: CreateDesignDto) {
    // Get designer profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { designerProfile: true },
    });

    if (!user?.designerProfile) {
      throw new BadRequestException('Designer profile not found');
    }

    const design = await this.prisma.design.create({
      data: {
        ...createDesignDto,
        designerId: user.designerProfile.id,
      },
      include: {
        images: true,
        fabricOptions: true,
        addOns: true,
        sizePricings: true,
      },
    });

    return design;
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      category?: string;
      gender?: string;
      minPrice?: number;
      maxPrice?: number;
      designerId?: string;
      search?: string;
      sortBy?: string;
    },
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
      isActive: true,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.gender) {
      where.gender = filters.gender;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters.minPrice !== undefined) {
        where.basePrice.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.basePrice.lte = filters.maxPrice;
      }
    }

    if (filters?.designerId) {
      where.designerId = filters.designerId;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (filters?.sortBy === 'price') {
      orderBy = { basePrice: 'asc' };
    } else if (filters?.sortBy === 'price_desc') {
      orderBy = { basePrice: 'desc' };
    } else if (filters?.sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [designs, total] = await Promise.all([
      this.prisma.design.findMany({
        where,
        skip,
        take: limit,
        include: {
          designer: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              averageRating: true,
              isVerified: true,
            },
          },
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
        orderBy,
      }),
      this.prisma.design.count({ where }),
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

  async findOne(id: string) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      include: {
        designer: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            averageRating: true,
            isVerified: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        fabricOptions: {
          where: { isAvailable: true },
        },
        addOns: {
          where: { isAvailable: true },
        },
        sizePricings: true,
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    if (!design.isPublished || !design.isActive) {
      // Only allow designer to view unpublished designs
      throw new NotFoundException('Design not found');
    }

    return design;
  }

  async update(
    userId: string,
    designId: string,
    updateDesignDto: UpdateDesignDto,
  ) {
    const design = await this.checkOwnership(userId, designId);

    const updated = await this.prisma.design.update({
      where: { id: designId },
      data: updateDesignDto,
      include: {
        images: true,
        fabricOptions: true,
        addOns: true,
        sizePricings: true,
      },
    });

    return updated;
  }

  async remove(userId: string, designId: string) {
    await this.checkOwnership(userId, designId);

    // Soft delete
    await this.prisma.design.update({
      where: { id: designId },
      data: { isActive: false },
    });

    return { success: true, message: 'Design deleted successfully' };
  }

  // Fabric Options
  async addFabricOption(
    userId: string,
    designId: string,
    createFabricDto: CreateFabricOptionDto,
  ) {
    await this.checkOwnership(userId, designId);

    const fabric = await this.prisma.fabricOption.create({
      data: {
        ...createFabricDto,
        designId,
      },
    });

    return fabric;
  }

  async updateFabricOption(
    userId: string,
    designId: string,
    fabricId: string,
    updateDto: Partial<CreateFabricOptionDto>,
  ) {
    await this.checkOwnership(userId, designId);

    const fabric = await this.prisma.fabricOption.findFirst({
      where: { id: fabricId, designId },
    });

    if (!fabric) {
      throw new NotFoundException('Fabric option not found');
    }

    return this.prisma.fabricOption.update({
      where: { id: fabricId },
      data: updateDto,
    });
  }

  async removeFabricOption(userId: string, designId: string, fabricId: string) {
    await this.checkOwnership(userId, designId);

    const fabric = await this.prisma.fabricOption.findFirst({
      where: { id: fabricId, designId },
    });

    if (!fabric) {
      throw new NotFoundException('Fabric option not found');
    }

    await this.prisma.fabricOption.delete({
      where: { id: fabricId },
    });

    return { success: true, message: 'Fabric option deleted successfully' };
  }

  // Add-ons
  async addAddOn(userId: string, designId: string, createAddOnDto: CreateAddOnDto) {
    await this.checkOwnership(userId, designId);

    const addOn = await this.prisma.designAddOn.create({
      data: {
        ...createAddOnDto,
        designId,
      },
    });

    return addOn;
  }

  async updateAddOn(
    userId: string,
    designId: string,
    addOnId: string,
    updateDto: Partial<CreateAddOnDto>,
  ) {
    await this.checkOwnership(userId, designId);

    const addOn = await this.prisma.designAddOn.findFirst({
      where: { id: addOnId, designId },
    });

    if (!addOn) {
      throw new NotFoundException('Add-on not found');
    }

    return this.prisma.designAddOn.update({
      where: { id: addOnId },
      data: updateDto,
    });
  }

  async removeAddOn(userId: string, designId: string, addOnId: string) {
    await this.checkOwnership(userId, designId);

    const addOn = await this.prisma.designAddOn.findFirst({
      where: { id: addOnId, designId },
    });

    if (!addOn) {
      throw new NotFoundException('Add-on not found');
    }

    await this.prisma.designAddOn.delete({
      where: { id: addOnId },
    });

    return { success: true, message: 'Add-on deleted successfully' };
  }

  // Size Pricing
  async addSizePricing(
    userId: string,
    designId: string,
    createSizePricingDto: CreateSizePricingDto,
  ) {
    await this.checkOwnership(userId, designId);

    const sizePricing = await this.prisma.sizePricing.create({
      data: {
        ...createSizePricingDto,
        designId,
      },
    });

    return sizePricing;
  }

  async updateSizePricing(
    userId: string,
    designId: string,
    sizePricingId: string,
    updateDto: Partial<CreateSizePricingDto>,
  ) {
    await this.checkOwnership(userId, designId);

    const sizePricing = await this.prisma.sizePricing.findFirst({
      where: { id: sizePricingId, designId },
    });

    if (!sizePricing) {
      throw new NotFoundException('Size pricing not found');
    }

    return this.prisma.sizePricing.update({
      where: { id: sizePricingId },
      data: updateDto,
    });
  }

  async removeSizePricing(
    userId: string,
    designId: string,
    sizePricingId: string,
  ) {
    await this.checkOwnership(userId, designId);

    const sizePricing = await this.prisma.sizePricing.findFirst({
      where: { id: sizePricingId, designId },
    });

    if (!sizePricing) {
      throw new NotFoundException('Size pricing not found');
    }

    await this.prisma.sizePricing.delete({
      where: { id: sizePricingId },
    });

    return { success: true, message: 'Size pricing deleted successfully' };
  }

  // Helper method to check ownership
  private async checkOwnership(userId: string, designId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { designerProfile: true },
    });

    if (!user?.designerProfile) {
      throw new ForbiddenException('Not a designer');
    }

    const design = await this.prisma.design.findUnique({
      where: { id: designId },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    if (design.designerId !== user.designerProfile.id) {
      throw new ForbiddenException('Not authorized to modify this design');
    }

    return design;
  }
}
