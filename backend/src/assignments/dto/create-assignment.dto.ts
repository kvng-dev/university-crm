import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentType } from '../entities/assignment.entity';

export class CreateAssignmentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({ example: 'Programming Assignment 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Implement basic data structures and algorithms',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AssignmentType, example: AssignmentType.SUBMISSION })
  @IsEnum(AssignmentType)
  type: AssignmentType;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 100, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxGrade?: number;

  @ApiPropertyOptional({ example: 0.25, minimum: 0.1, maximum: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  weight?: number;
}
