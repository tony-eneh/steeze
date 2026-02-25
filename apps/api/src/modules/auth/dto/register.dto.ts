import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: ['CUSTOMER', 'DESIGNER'], example: 'CUSTOMER' })
  @IsEnum(['CUSTOMER', 'DESIGNER'])
  role: 'CUSTOMER' | 'DESIGNER';

  // Designer-specific fields
  @ApiPropertyOptional({ example: 'My Fashion House' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Ikeja' })
  @IsOptional()
  @IsString()
  shopAddress?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  shopCity?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  shopState?: string;

  @ApiPropertyOptional({ example: 'Bio about the designer' })
  @IsOptional()
  @IsString()
  bio?: string;
}
