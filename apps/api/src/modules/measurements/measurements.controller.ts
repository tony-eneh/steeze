import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MeasurementsService } from './measurements.service';
import {
  LinkOpenTailorDto,
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

@ApiTags('measurements')
@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Post('link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Open Tailor email to account' })
  @ApiResponse({ status: 200, description: 'Email linked successfully' })
  async linkEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() linkDto: LinkOpenTailorDto,
  ) {
    const result = await this.measurementsService.linkOpenTailorEmail(
      user.id,
      linkDto,
    );
    return {
      success: true,
      data: result,
      message: 'Open Tailor email linked successfully',
    };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own measurements from Open Tailor' })
  @ApiResponse({ status: 200, description: 'Measurements retrieved' })
  async getMyMeasurements(@CurrentUser() user: AuthenticatedUser) {
    const measurements = await this.measurementsService.getMyMeasurements(
      user.id,
    );
    return {
      success: true,
      data: measurements,
      message: 'Measurements retrieved successfully',
    };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create measurements in Open Tailor' })
  @ApiResponse({ status: 201, description: 'Measurements created' })
  async createMeasurement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateMeasurementDto,
  ) {
    const measurement = await this.measurementsService.createMeasurement(
      user.id,
      createDto,
    );
    return {
      success: true,
      data: measurement,
      message: 'Measurements created successfully',
    };
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update measurements in Open Tailor' })
  @ApiResponse({ status: 200, description: 'Measurements updated' })
  async updateMeasurement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdateMeasurementDto,
  ) {
    const measurement = await this.measurementsService.updateMeasurement(
      user.id,
      updateDto,
    );
    return {
      success: true,
      data: measurement,
      message: 'Measurements updated successfully',
    };
  }
}
