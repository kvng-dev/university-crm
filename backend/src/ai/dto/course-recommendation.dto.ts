// src/modules/ai/dto/course-recommendation.dto.ts
import { IsArray, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AcademicLevel {
  FRESHMAN = 'freshman',
  SOPHOMORE = 'sophomore',
  JUNIOR = 'junior',
  SENIOR = 'senior',
  GRADUATE = 'graduate',
}

export class CourseRecommendationDto {
  @ApiProperty({
    example: ['computer science', 'artificial intelligence', 'web development'],
    description: 'Student interests and preferred topics',
  })
  @IsArray()
  @IsString({ each: true })
  interests: string[];

  @ApiPropertyOptional({
    enum: AcademicLevel,
    example: AcademicLevel.JUNIOR,
    description: 'Current academic level',
  })
  @IsOptional()
  @IsEnum(AcademicLevel)
  academicLevel?: AcademicLevel;

  @ApiPropertyOptional({
    example: ['mathematics', 'programming', 'data analysis'],
    description: 'Preferred study areas',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredAreas?: string[];

  @ApiPropertyOptional({
    example: ['full-time', 'part-time'],
    description: 'Study preferences',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studyPreferences?: string[];
}

