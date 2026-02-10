import {
  Controller,
  Get,
  Post,
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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order (customer only)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async create(
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const order = await this.ordersService.create(user.sub, createOrderDto);
    return {
      success: true,
      data: order,
      message: 'Order created successfully',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own orders (customer or designer)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async findAll(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    const result = await this.ordersService.findAll(
      user.sub,
      user.role,
      paginationDto,
      status,
    );
    return {
      success: true,
      ...result,
      message: 'Orders retrieved successfully',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order detail' })
  @ApiResponse({ status: 200, description: 'Order retrieved' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const order = await this.ordersService.findOne(id, user.sub);
    return {
      success: true,
      data: order,
      message: 'Order retrieved successfully',
    };
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept order (designer only)' })
  @ApiResponse({ status: 200, description: 'Order accepted' })
  async acceptOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.acceptOrder(user.sub, id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order accepted successfully',
    };
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject order (designer only)' })
  @ApiResponse({ status: 200, description: 'Order rejected' })
  async rejectOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.rejectOrder(user.sub, id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order rejected',
    };
  }

  @Patch(':id/in-progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark order as in progress (designer only)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async markInProgress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.markInProgress(user.sub, id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order marked as in progress',
    };
  }

  @Patch(':id/ready')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark order as ready for pickup (designer only)' })
  @ApiResponse({ status: 200, description: 'Order marked as ready' })
  async markReady(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.markReady(user.sub, id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order marked as ready for pickup',
    };
  }

  @Patch(':id/picked-up')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark order as picked up (admin only)' })
  @ApiResponse({ status: 200, description: 'Order marked as picked up' })
  async markPickedUp(@Param('id') id: string, @Body() updateDto: UpdateOrderStatusDto) {
    const order = await this.ordersService.markPickedUp(id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order marked as picked up',
    };
  }

  @Patch(':id/in-transit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark order as in transit (admin only)' })
  @ApiResponse({ status: 200, description: 'Order marked as in transit' })
  async markInTransit(@Param('id') id: string, @Body() updateDto: UpdateOrderStatusDto) {
    const order = await this.ordersService.markInTransit(id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order marked as in transit',
    };
  }

  @Patch(':id/delivered')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark order as delivered (admin only)' })
  @ApiResponse({ status: 200, description: 'Order marked as delivered' })
  async markDelivered(@Param('id') id: string, @Body() updateDto: UpdateOrderStatusDto) {
    const order = await this.ordersService.markDelivered(id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order marked as delivered',
    };
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm order satisfaction (customer only)' })
  @ApiResponse({ status: 200, description: 'Order confirmed' })
  async confirmOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.confirmOrder(user.sub, id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order confirmed successfully',
    };
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order (customer only, before accepted)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.cancelOrder(user.sub, id, updateDto);
    return {
      success: true,
      data: order,
      message: 'Order cancelled',
    };
  }

  @Get(':id/status-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order status history' })
  @ApiResponse({ status: 200, description: 'Status history retrieved' })
  async getStatusHistory(@CurrentUser() user: any, @Param('id') id: string) {
    const history = await this.ordersService.getStatusHistory(id, user.sub);
    return {
      success: true,
      data: history,
      message: 'Status history retrieved successfully',
    };
  }
}
