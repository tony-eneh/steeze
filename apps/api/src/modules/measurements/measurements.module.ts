import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MeasurementsController } from './measurements.controller';
import { MeasurementsService } from './measurements.service';
import { OpenTailorService } from './open-tailor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [MeasurementsController],
  providers: [MeasurementsService, OpenTailorService],
  exports: [MeasurementsService, OpenTailorService],
})
export class MeasurementsModule {}
