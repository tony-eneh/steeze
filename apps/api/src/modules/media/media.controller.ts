import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: {
          type: 'string',
          enum: ['designs', 'fabrics', 'avatars', 'returns'],
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload an image and get back a hosted URL' })
  @ApiResponse({ status: 201, description: 'Image uploaded' })
  @ApiResponse({ status: 400, description: 'Unsupported or oversized image' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ) {
    return this.mediaService.uploadImage(file, dto.folder ?? 'designs');
  }
}
