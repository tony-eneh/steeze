import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  UpdatePlatformSettingDto,
  UpdateUserStatusDto,
  UpdateDesignerVerificationDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('orders/stats')
  @ApiOperation({ summary: 'Get orders statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns order stats by status' })
  async getOrdersStats() {
    return this.adminService.getOrdersStats();
  }

  @Get('payments/overview')
  @ApiOperation({ summary: 'Get payments overview (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns payments overview' })
  async getPaymentsOverview() {
    return this.adminService.getPaymentsOverview();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of users' })
  async listUsers(
    @Query() paginationDto: PaginationDto,
    @Query('role') role?: UserRole,
  ) {
    return this.adminService.listUsers(paginationDto, role);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user active status (admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Get('designers')
  @ApiOperation({ summary: 'List all designers (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of designers',
  })
  async listDesigners(
    @Query() paginationDto: PaginationDto,
    @Query('verified') verified?: boolean,
  ) {
    return this.adminService.listDesigners(paginationDto, verified);
  }

  @Patch('designers/:id/verify')
  @ApiOperation({ summary: 'Update designer verification status (admin only)' })
  @ApiResponse({ status: 200, description: 'Designer verification updated' })
  async updateDesignerVerification(
    @Param('id') id: string,
    @Body() dto: UpdateDesignerVerificationDto,
  ) {
    return this.adminService.updateDesignerVerification(id, dto);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get all platform settings (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all platform settings' })
  async getAllSettings() {
    return this.adminService.getAllSettings();
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get a platform setting by key (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns platform setting' })
  async getSetting(@Param('key') key: string) {
    return this.adminService.getSetting(key);
  }

  @Patch('settings/:key')
  @ApiOperation({ summary: 'Update a platform setting (admin only)' })
  @ApiResponse({ status: 200, description: 'Platform setting updated' })
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdatePlatformSettingDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.updateSetting(key, dto, adminId);
  }
}
