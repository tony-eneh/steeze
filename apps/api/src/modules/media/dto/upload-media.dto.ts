import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const MEDIA_FOLDERS = [
  'designs',
  'fabrics',
  'avatars',
  'returns',
] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export class UploadMediaDto {
  @ApiProperty({ enum: MEDIA_FOLDERS, required: false, default: 'designs' })
  @IsOptional()
  @IsIn(MEDIA_FOLDERS)
  folder?: MediaFolder;
}
