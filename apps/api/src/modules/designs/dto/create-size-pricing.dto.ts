import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSizePricingDto {
  @ApiProperty()
  @IsString()
  sizeLabel: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Type(() => Number)
  priceAdjustment: number;
}
