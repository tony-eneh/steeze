import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OpenTailorService {
  private readonly logger = new Logger(OpenTailorService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('OPEN_TAILOR_API_URL') ||
      'http://localhost:3000';
  }

  async getMeasurementsByEmail(email: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/measurements`, {
          params: {
            'filter[email]': email,
          },
        }),
      );

      if (
        response?.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data[0];
      }

      return null;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch measurements for ${email}`,
        error.message,
      );
      throw new BadRequestException(
        'Failed to fetch measurements from Open Tailor',
      );
    }
  }

  async createMeasurement(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/measurements`, data),
      );
      return response?.data;
    } catch (error: any) {
      this.logger.error('Failed to create measurement', error.message);
      throw new BadRequestException(
        'Failed to create measurement in Open Tailor',
      );
    }
  }

  async updateMeasurement(id: string, data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/api/measurements/${id}`, data),
      );
      return response?.data;
    } catch (error: any) {
      this.logger.error(`Failed to update measurement ${id}`, error.message);
      throw new BadRequestException(
        'Failed to update measurement in Open Tailor',
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await firstValueFrom(this.httpService.get(`${this.baseUrl}/health`));
      return true;
    } catch (error) {
      this.logger.warn('Open Tailor API is not reachable');
      return false;
    }
  }
}
