import {
  Controller,
  Get,
  Post,
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
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('orders/:orderId/rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Rate the other party on an order (customer rates designer, designer rates customer)',
  })
  @ApiResponse({ status: 201, description: 'Rating created' })
  async createRating(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    const rating = await this.ratingsService.createRating(
      user.sub,
      orderId,
      createRatingDto,
    );
    return {
      success: true,
      data: rating,
      message: 'Rating submitted successfully',
    };
  }

  @Get('users/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ratings received by a user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Ratings retrieved' })
  async getRatingsForUser(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.ratingsService.getRatingsForUser(
      userId,
      paginationDto,
    );
    return {
      success: true,
      ...result,
      message: 'Ratings retrieved successfully',
    };
  }

  @Get('orders/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ratings for an order' })
  @ApiResponse({ status: 200, description: 'Ratings retrieved' })
  async getRatingsForOrder(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const ratings = await this.ratingsService.getRatingsForOrder(
      orderId,
      user.sub,
    );
    return {
      success: true,
      data: ratings,
      message: 'Ratings retrieved successfully',
    };
  }

  @Get('designers/:designerProfileId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rating statistics for a designer' })
  @ApiResponse({ status: 200, description: 'Rating statistics retrieved' })
  async getDesignerRatingStats(
    @Param('designerProfileId') designerProfileId: string,
  ) {
    const stats =
      await this.ratingsService.getDesignerRatingStats(designerProfileId);
    return {
      success: true,
      data: stats,
      message: 'Rating statistics retrieved successfully',
    };
  }
}
