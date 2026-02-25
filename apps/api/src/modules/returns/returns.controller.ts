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
import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('returns')
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('orders/:orderId/return')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Request return for an order (customer only, within 2 days of delivery)',
  })
  @ApiResponse({ status: 201, description: 'Return request created' })
  async createReturnRequest(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() createReturnRequestDto: CreateReturnRequestDto,
  ) {
    const returnRequest = await this.returnsService.createReturnRequest(
      user.sub,
      orderId,
      createReturnRequestDto,
    );
    return {
      success: true,
      data: returnRequest,
      message: 'Return request created successfully',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all return requests (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Return requests retrieved' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    const result = await this.returnsService.findAll(paginationDto, status);
    return {
      success: true,
      ...result,
      message: 'Return requests retrieved successfully',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get return request details (admin only)' })
  @ApiResponse({ status: 200, description: 'Return request retrieved' })
  async findOne(@Param('id') id: string) {
    const returnRequest = await this.returnsService.findOne(id);
    return {
      success: true,
      data: returnRequest,
      message: 'Return request retrieved successfully',
    };
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve return request (admin only)' })
  @ApiResponse({ status: 200, description: 'Return request approved' })
  async approve(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateReturnRequestDto,
  ) {
    const returnRequest = await this.returnsService.approve(
      id,
      user.sub,
      updateDto,
    );
    return {
      success: true,
      data: returnRequest,
      message: 'Return request approved',
    };
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject return request (admin only)' })
  @ApiResponse({ status: 200, description: 'Return request rejected' })
  async reject(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateReturnRequestDto,
  ) {
    const returnRequest = await this.returnsService.reject(
      id,
      user.sub,
      updateDto,
    );
    return {
      success: true,
      data: returnRequest,
      message: 'Return request rejected',
    };
  }

  @Patch(':id/pickup-dispatched')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark courier dispatched for return pickup (admin only)',
  })
  @ApiResponse({ status: 200, description: 'Courier dispatch recorded' })
  async markPickupDispatched(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateReturnRequestDto,
  ) {
    const returnRequest = await this.returnsService.markPickupDispatched(
      id,
      user.sub,
      updateDto,
    );
    return {
      success: true,
      data: returnRequest,
      message: 'Courier dispatched for return pickup',
    };
  }

  @Patch(':id/returned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Complete return - refund customer and deduct fee from designer (admin only)',
  })
  @ApiResponse({ status: 200, description: 'Return completed' })
  async markReturned(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateReturnRequestDto,
  ) {
    const returnRequest = await this.returnsService.markReturned(
      id,
      user.sub,
      updateDto,
    );
    return {
      success: true,
      data: returnRequest,
      message: 'Return completed successfully',
    };
  }
}
