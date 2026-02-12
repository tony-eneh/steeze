import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePlatformSettingDto {
  @ApiProperty({ description: 'Setting value' })
  @IsString()
  @IsNotEmpty()
  value: string;
}
