import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  live() {
    return { status: 'ok', uptime: Math.floor(process.uptime()) };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe including dependency checks' })
  @ApiResponse({ status: 200, description: 'Dependency health report' })
  ready() {
    return this.healthService.check();
  }
}
