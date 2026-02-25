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
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
    @CurrentUser() user: any,
    @Body() createDesignDto: CreateDesignDto,
  ) {
    const design = await this.designsService.create(user.sub, createDesignDto);
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
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('category') category?: string,
    @Query('gender') gender?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    const result = await this.designsService.findAll(paginationDto, {
      category,
      gender,
      minPrice,
      maxPrice,
      search,
      sortBy,
    });
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDesignDto: UpdateDesignDto,
  ) {
    const design = await this.designsService.update(
      user.sub,
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
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.designsService.remove(user.sub, id);
  }

  // Fabric Options
  @Post(':id/fabrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add fabric option' })
  @ApiResponse({ status: 201, description: 'Fabric option added' })
  async addFabricOption(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() createFabricDto: CreateFabricOptionDto,
  ) {
    const fabric = await this.designsService.addFabricOption(
      user.sub,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('fabricId') fabricId: string,
    @Body() updateDto: Partial<CreateFabricOptionDto>,
  ) {
    const fabric = await this.designsService.updateFabricOption(
      user.sub,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('fabricId') fabricId: string,
  ) {
    return this.designsService.removeFabricOption(user.sub, id, fabricId);
  }

  // Add-ons
  @Post(':id/addons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add add-on' })
  @ApiResponse({ status: 201, description: 'Add-on added' })
  async addAddOn(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() createAddOnDto: CreateAddOnDto,
  ) {
    const addOn = await this.designsService.addAddOn(
      user.sub,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('addonId') addonId: string,
    @Body() updateDto: Partial<CreateAddOnDto>,
  ) {
    const addOn = await this.designsService.updateAddOn(
      user.sub,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('addonId') addonId: string,
  ) {
    return this.designsService.removeAddOn(user.sub, id, addonId);
  }

  // Size Pricing
  @Post(':id/size-pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add size pricing' })
  @ApiResponse({ status: 201, description: 'Size pricing added' })
  async addSizePricing(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() createSizePricingDto: CreateSizePricingDto,
  ) {
    const sizePricing = await this.designsService.addSizePricing(
      user.sub,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('pricingId') pricingId: string,
    @Body() updateDto: Partial<CreateSizePricingDto>,
  ) {
    const sizePricing = await this.designsService.updateSizePricing(
      user.sub,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('pricingId') pricingId: string,
  ) {
    return this.designsService.removeSizePricing(user.sub, id, pricingId);
  }
}
