// src/modules/enrollments/dto/bulk-approve-enrollments.dto.ts
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkApproveEnrollmentsDto {
  @ApiProperty({
    example: [1, 2, 3, 4],
    description: 'Array of enrollment IDs to approve',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  enrollmentIds: number[];

  @ApiPropertyOptional({
    example: 'Welcome to the course! All selected students have been approved.',
    maxLength: 500,
    description: 'Optional message to send to all approved students',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
