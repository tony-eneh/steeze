import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
