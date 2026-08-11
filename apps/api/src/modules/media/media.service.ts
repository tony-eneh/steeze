import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

export interface UploadedAsset {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary is not configured; media uploads will be rejected',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.configured = true;
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedAsset> {
    this.assertUploadable(file);

    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Image uploads are not available because storage is not configured',
      );
    }

    const result = await this.uploadBuffer(file.buffer, folder);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.configured) {
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      // A failed cleanup should not block the database delete that follows.
      this.logger.warn(`Could not delete asset ${publicId}: ${reason}`);
    }
  }

  private assertUploadable(file: Express.Multer.File | undefined): void {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_BYTES) {
      throw new BadRequestException(
        `Image is larger than the ${MAX_BYTES / (1024 * 1024)}MB limit`,
      );
    }
  }

  private uploadBuffer(
    buffer: Buffer,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `steeze/${folder}`,
          resource_type: 'image',
          // Strip metadata and cap dimensions so one upload cannot dominate
          // storage or bandwidth.
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Upload returned no result'));
            return;
          }
          resolve(result);
        },
      );

      stream.end(buffer);
    });
  }
}
