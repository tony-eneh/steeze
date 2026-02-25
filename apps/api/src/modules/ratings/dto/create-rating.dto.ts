import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({
    description: 'Rating score',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @ApiProperty({
    description: 'Optional comment about the experience',
    example:
      'Great work! The garment fits perfectly and the quality is excellent.',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}
