// src/modules/courses/dto/create-course.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../entities/course.entity';

export class CreateCourseDto {
  @ApiProperty({ example: 'Introduction to Computer Science' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'A comprehensive introduction to computer science principles',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 6 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(6)
  credits: number;

  @ApiPropertyOptional({ example: 'https://example.com/syllabus.pdf' })
  @IsOptional()
  @IsString()
  syllabusUrl?: string;

  @ApiPropertyOptional({ enum: CourseStatus, example: CourseStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxStudents?: number;

  @ApiPropertyOptional({ example: 500.0 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  fee?: number;

  @ApiPropertyOptional({ example: 'Fall 2024' })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsNumber()
  @Min(2020)
  @Max(2030)
  year?: number;
}
