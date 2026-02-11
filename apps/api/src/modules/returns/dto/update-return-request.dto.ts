import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateReturnRequestDto {
  @ApiProperty({
    description: 'Admin notes on the return request',
    example: 'Return approved, courier dispatched',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  adminNotes?: string;
}
