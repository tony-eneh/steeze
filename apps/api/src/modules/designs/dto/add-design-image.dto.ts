import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class AddDesignImageDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/steeze/image/upload/x.jpg' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  sortOrder?: number;

  @ApiProperty({
    required: false,
    description: 'Defaults to true for the first image on a design',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
