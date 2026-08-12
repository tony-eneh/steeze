import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { CreateFabricOptionDto } from './dto/create-fabric-option.dto';
import { CreateAddOnDto } from './dto/create-addon.dto';
import { CreateSizePricingDto } from './dto/create-size-pricing.dto';
import { AddDesignImageDto } from './dto/add-design-image.dto';
import { ListDesignsDto } from './dto/list-designs.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UserRole } from '@prisma/client';

@ApiTags('designs')
@Controller('designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new design (designer only)' })
  @ApiResponse({ status: 201, description: 'Design created' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDesignDto: CreateDesignDto,
  ) {
    const design = await this.designsService.create(user.id, createDesignDto);
    return {
      success: true,
      data: design,
      message: 'Design created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all published designs (public)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'gender', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiResponse({ status: 200, description: 'Designs retrieved' })
  async findAll(@Query() query: ListDesignsDto) {
    const { page, limit, ...filters } = query;
    const result = await this.designsService.findAll({ page, limit }, filters);
    return {
      success: true,
      ...result,
      message: 'Designs retrieved successfully',
    };
  }

  // Declared before :id so the literal path is not swallowed by the param.
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List every design owned by the signed-in designer',
  })
  @ApiResponse({ status: 200, description: 'Designs retrieved' })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.designsService.findMine(user.id, paginationDto);
    return {
      success: true,
      ...result,
      message: 'Designs retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get design detail (public)' })
  @ApiResponse({ status: 200, description: 'Design retrieved' })
  async findOne(@Param('id') id: string) {
    const design = await this.designsService.findOne(id);
    return {
      success: true,
      data: design,
      message: 'Design retrieved successfully',
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update design (designer only)' })
  @ApiResponse({ status: 200, description: 'Design updated' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDesignDto: UpdateDesignDto,
  ) {
    const design = await this.designsService.update(
      user.id,
      id,
      updateDesignDto,
    );
    return {
      success: true,
      data: design,
      message: 'Design updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete design (designer only)' })
  @ApiResponse({ status: 200, description: 'Design deleted' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.designsService.remove(user.id, id);
  }

  // Images
  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Attach an uploaded image to a design',
    description:
      'Upload the file via POST /media/upload first, then pass the returned URL here.',
  })
  @ApiResponse({ status: 201, description: 'Image attached' })
  async addImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() addImageDto: AddDesignImageDto,
  ) {
    const image = await this.designsService.addImage(user.id, id, addImageDto);
    return {
      success: true,
      data: image,
      message: 'Image added successfully',
    };
  }

  @Patch(':id/images/:imageId/primary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Make an image the design thumbnail' })
  @ApiResponse({ status: 200, description: 'Primary image updated' })
  async setPrimaryImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.designsService.setPrimaryImage(user.id, id, imageId);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an image from a design' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  async removeImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.designsService.removeImage(user.id, id, imageId);
  }

  // Fabric Options
  @Post(':id/fabrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add fabric option' })
  @ApiResponse({ status: 201, description: 'Fabric option added' })
  async addFabricOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() createFabricDto: CreateFabricOptionDto,
  ) {
    const fabric = await this.designsService.addFabricOption(
      user.id,
      id,
      createFabricDto,
    );
    return {
      success: true,
      data: fabric,
      message: 'Fabric option added successfully',
    };
  }

  @Patch(':id/fabrics/:fabricId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update fabric option' })
  @ApiResponse({ status: 200, description: 'Fabric option updated' })
  async updateFabricOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('fabricId') fabricId: string,
    @Body() updateDto: Partial<CreateFabricOptionDto>,
  ) {
    const fabric = await this.designsService.updateFabricOption(
      user.id,
      id,
      fabricId,
      updateDto,
    );
    return {
      success: true,
      data: fabric,
      message: 'Fabric option updated successfully',
    };
  }

  @Delete(':id/fabrics/:fabricId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete fabric option' })
  @ApiResponse({ status: 200, description: 'Fabric option deleted' })
  async removeFabricOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('fabricId') fabricId: string,
  ) {
    return this.designsService.removeFabricOption(user.id, id, fabricId);
  }

  // Add-ons
  @Post(':id/addons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add add-on' })
  @ApiResponse({ status: 201, description: 'Add-on added' })
  async addAddOn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() createAddOnDto: CreateAddOnDto,
  ) {
    const addOn = await this.designsService.addAddOn(
      user.id,
      id,
      createAddOnDto,
    );
    return {
      success: true,
      data: addOn,
      message: 'Add-on added successfully',
    };
  }

  @Patch(':id/addons/:addonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update add-on' })
  @ApiResponse({ status: 200, description: 'Add-on updated' })
  async updateAddOn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('addonId') addonId: string,
    @Body() updateDto: Partial<CreateAddOnDto>,
  ) {
    const addOn = await this.designsService.updateAddOn(
      user.id,
      id,
      addonId,
      updateDto,
    );
    return {
      success: true,
      data: addOn,
      message: 'Add-on updated successfully',
    };
  }

  @Delete(':id/addons/:addonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete add-on' })
  @ApiResponse({ status: 200, description: 'Add-on deleted' })
  async removeAddOn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('addonId') addonId: string,
  ) {
    return this.designsService.removeAddOn(user.id, id, addonId);
  }

  // Size Pricing
  @Post(':id/size-pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add size pricing' })
  @ApiResponse({ status: 201, description: 'Size pricing added' })
  async addSizePricing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() createSizePricingDto: CreateSizePricingDto,
  ) {
    const sizePricing = await this.designsService.addSizePricing(
      user.id,
      id,
      createSizePricingDto,
    );
    return {
      success: true,
      data: sizePricing,
      message: 'Size pricing added successfully',
    };
  }

  @Patch(':id/size-pricing/:pricingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update size pricing' })
  @ApiResponse({ status: 200, description: 'Size pricing updated' })
  async updateSizePricing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('pricingId') pricingId: string,
    @Body() updateDto: Partial<CreateSizePricingDto>,
  ) {
    const sizePricing = await this.designsService.updateSizePricing(
      user.id,
      id,
      pricingId,
      updateDto,
    );
    return {
      success: true,
      data: sizePricing,
      message: 'Size pricing updated successfully',
    };
  }

  @Delete(':id/size-pricing/:pricingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete size pricing' })
  @ApiResponse({ status: 200, description: 'Size pricing deleted' })
  async removeSizePricing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('pricingId') pricingId: string,
  ) {
    return this.designsService.removeSizePricing(user.id, id, pricingId);
  }
}
