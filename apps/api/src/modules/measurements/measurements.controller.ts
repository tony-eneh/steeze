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
    @CurrentUser() user: any,
    @Body() linkDto: LinkOpenTailorDto,
  ) {
    const result = await this.measurementsService.linkOpenTailorEmail(
      user.sub,
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
  async getMyMeasurements(@CurrentUser() user: any) {
    const measurements = await this.measurementsService.getMyMeasurements(
      user.sub,
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
    @CurrentUser() user: any,
    @Body() createDto: CreateMeasurementDto,
  ) {
    const measurement = await this.measurementsService.createMeasurement(
      user.sub,
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
    @CurrentUser() user: any,
    @Body() updateDto: UpdateMeasurementDto,
  ) {
    const measurement = await this.measurementsService.updateMeasurement(
      user.sub,
      updateDto,
    );
    return {
      success: true,
      data: measurement,
      message: 'Measurements updated successfully',
    };
  }
}
