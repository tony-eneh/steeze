import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto, RegisterDeviceDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications with filters and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of notifications',
  })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() dto: ListNotificationsDto,
  ) {
    return this.notificationsService.findAll(userId, dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns unread notification count',
    schema: {
      type: 'object',
      properties: {
        unreadCount: { type: 'number' },
      },
    },
  })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('devices')
  @ApiOperation({ summary: 'Register a device for push notifications' })
  @ApiResponse({ status: 201, description: 'Device registered' })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(userId, dto);
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Unregister a device from push notifications' })
  @ApiResponse({ status: 200, description: 'Device unregistered' })
  async unregisterDevice(
    @CurrentUser('id') userId: string,
    @Param('token') token: string,
  ) {
    return this.notificationsService.unregisterDevice(userId, token);
  }
}
