import { IsString, IsEmail, IsOptional, IsIn, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkOpenTailorDto {
  @ApiProperty()
  @IsEmail()
  openTailorEmail: string;
}

export class CreateMeasurementDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['male', 'female', 'other'] })
  @IsIn(['male', 'female', 'other'])
  gender: string;

  @ApiProperty({ enum: ['cm', 'inch'], default: 'cm' })
  @IsOptional()
  @IsIn(['cm', 'inch'])
  unit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  measurements?: any;
}

export class UpdateMeasurementDto {
  @ApiProperty({ enum: ['male', 'female', 'other'], required: false })
  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: string;

  @ApiProperty({ enum: ['cm', 'inch'], required: false })
  @IsOptional()
  @IsIn(['cm', 'inch'])
  unit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  measurements?: any;
}
