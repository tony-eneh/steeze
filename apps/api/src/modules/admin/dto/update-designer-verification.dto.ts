import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDesignerVerificationDto {
  @ApiPropertyOptional({ description: 'Whether designer is verified' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Admin notes for verification decision' })
  @IsOptional()
  @IsString()
  notes?: string;
}
