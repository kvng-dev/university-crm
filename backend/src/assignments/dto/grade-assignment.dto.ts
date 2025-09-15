// src/modules/assignments/dto/grade-assignment.dto.ts
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GradeAssignmentDto {
  @ApiProperty({ example: 85.5, minimum: 0 })
  @IsNumber()
  @Min(0)
  grade: number;

  @ApiPropertyOptional({
    example:
      'Good work! Clean implementation with efficient algorithms. Minor improvements needed in error handling.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}
