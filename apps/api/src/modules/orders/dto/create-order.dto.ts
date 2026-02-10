import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class AddOnSelectionDto {
  @ApiProperty()
  @IsUUID()
  addOnId: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  designId: string;

  @ApiProperty()
  @IsUUID()
  deliveryAddressId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  fabricOptionId?: string;

  @ApiProperty({ type: [AddOnSelectionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddOnSelectionDto)
  addOnIds?: AddOnSelectionDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sizeLabel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
