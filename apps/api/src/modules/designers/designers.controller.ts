import {
  Controller,
  Get,
  Patch,
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
import { DesignersService } from './designers.service';
import { UpdateDesignerProfileDto } from './dto/update-designer-profile.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('designers')
@Controller('designers')
export class DesignersController {
  constructor(private readonly designersService: DesignersService) {}

  @Get()
  @ApiOperation({ summary: 'List all designers (public)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Designers retrieved' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
  ) {
    const result = await this.designersService.findAll(paginationDto, search);
    return {
      success: true,
      ...result,
      message: 'Designers retrieved successfully',
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get designer profile by slug (public)' })
  @ApiResponse({ status: 200, description: 'Designer profile retrieved' })
  async findBySlug(@Param('slug') slug: string) {
    const designer = await this.designersService.findBySlug(slug);
    return {
      success: true,
      data: designer,
      message: 'Designer profile retrieved successfully',
    };
  }

  @Get(':slug/designs')
  @ApiOperation({ summary: "List designer's published designs (public)" })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Designs retrieved' })
  async getDesignerDesigns(
    @Param('slug') slug: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.designersService.getDesignerDesigns(
      slug,
      paginationDto,
    );
    return {
      success: true,
      ...result,
      message: 'Designs retrieved successfully',
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own designer profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateDesignerProfileDto,
  ) {
    const designer = await this.designersService.updateMyProfile(
      user.sub,
      updateDto,
    );
    return {
      success: true,
      data: designer,
      message: 'Designer profile updated successfully',
    };
  }

  @Get('me/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders received (designer only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async getMyOrders(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    const result = await this.designersService.getMyOrders(
      user.sub,
      paginationDto,
      status,
    );
    return {
      success: true,
      ...result,
      message: 'Orders retrieved successfully',
    };
  }

  @Get('me/earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get earnings summary (designer only)' })
  @ApiResponse({ status: 200, description: 'Earnings retrieved' })
  async getMyEarnings(@CurrentUser() user: any) {
    const earnings = await this.designersService.getMyEarnings(user.sub);
    return {
      success: true,
      data: earnings,
      message: 'Earnings retrieved successfully',
    };
  }
}
