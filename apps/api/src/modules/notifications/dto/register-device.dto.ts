import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DevicePlatform } from '@prisma/client';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'fcm-registration-token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ enum: DevicePlatform, example: DevicePlatform.ANDROID })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}
