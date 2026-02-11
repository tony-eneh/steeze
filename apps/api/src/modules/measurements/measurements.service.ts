import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenTailorService } from './open-tailor.service';
import {
  LinkOpenTailorDto,
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';

@Injectable()
export class MeasurementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openTailorService: OpenTailorService,
  ) {}

  async linkOpenTailorEmail(userId: string, linkDto: LinkOpenTailorDto) {
    // Check if measurements exist for this email in Open Tailor
    const measurements = await this.openTailorService.getMeasurementsByEmail(
      linkDto.openTailorEmail,
    );

    if (!measurements) {
      throw new BadRequestException(
        'No measurements found for this email in Open Tailor. Please create measurements first.',
      );
    }

    // Update user's openTailorEmail
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { openTailorEmail: linkDto.openTailorEmail },
      select: {
        id: true,
        email: true,
        openTailorEmail: true,
      },
    });

    return {
      user,
      measurements,
    };
  }

  async getMyMeasurements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.openTailorEmail) {
      throw new BadRequestException(
        'Open Tailor email not linked. Please link your email first.',
      );
    }

    const measurements = await this.openTailorService.getMeasurementsByEmail(
      user.openTailorEmail,
    );

    if (!measurements) {
      throw new NotFoundException(
        'No measurements found for your linked email',
      );
    }

    return measurements;
  }

  async createMeasurement(userId: string, createDto: CreateMeasurementDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use user's email if not specified
    if (!createDto.email) {
      createDto.email = user.email;
    }

    // Create measurement in Open Tailor
    const measurement =
      await this.openTailorService.createMeasurement(createDto);

    // Link the email to user's profile if not already linked
    if (!user.openTailorEmail) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { openTailorEmail: createDto.email },
      });
    }

    return measurement;
  }

  async updateMeasurement(userId: string, updateDto: UpdateMeasurementDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.openTailorEmail) {
      throw new BadRequestException('Open Tailor email not linked');
    }

    // Get current measurements
    const measurements = await this.openTailorService.getMeasurementsByEmail(
      user.openTailorEmail,
    );

    if (!measurements || !measurements.id) {
      throw new NotFoundException('Measurements not found');
    }

    // Update in Open Tailor
    const updated = await this.openTailorService.updateMeasurement(
      measurements.id,
      updateDto,
    );

    return updated;
  }
}
