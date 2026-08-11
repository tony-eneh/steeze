import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  // memoryStorage keeps uploads off the container filesystem: the buffer is
  // streamed straight to Cloudinary.
  imports: [MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } })],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
