// src/modules/ai/dto/syllabus-generation.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CourseLevel {
  UNDERGRADUATE = 'undergraduate',
  GRADUATE = 'graduate',
  DOCTORAL = 'doctoral',
}

export class SyllabusGenerationDto {
  @ApiProperty({
    example: 'Introduction to Machine Learning',
    description: 'Course topic or title',
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({
    example: 3,
    minimum: 1,
    maximum: 6,
    description: 'Number of course credits',
  })
  @IsNumber()
  @Min(1)
  @Max(6)
  credits: number;

  @ApiPropertyOptional({
    enum: CourseLevel,
    example: CourseLevel.UNDERGRADUATE,
    description: 'Course level',
  })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({
    example: '16 weeks',
    description: 'Course duration',
  })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({
    example: ['supervised learning', 'neural networks', 'data preprocessing'],
    description: 'Specific focus areas for the course',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];

  @ApiPropertyOptional({
    example: ['Introduction to Statistics', 'Basic Programming'],
    description: 'Course prerequisites',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({
    example: 'practical',
    description: 'Teaching approach (theoretical, practical, mixed)',
  })
  @IsOptional()
  @IsString()
  approach?: string;
}
