// src/modules/admin/dto/approve-enrollment.dto.ts

import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveEnrollmentDto {
  @ApiPropertyOptional({
    example: 'Welcome to the course! Looking forward to having you.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
