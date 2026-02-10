import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDesignerProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shopAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shopCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shopState?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  shopLatitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  shopLongitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}
