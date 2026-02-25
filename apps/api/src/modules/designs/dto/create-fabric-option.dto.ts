import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFabricOptionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  colorHex?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceAdjustment?: number;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
