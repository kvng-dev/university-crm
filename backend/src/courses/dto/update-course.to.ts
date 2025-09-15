// src/modules/courses/dto/update-course.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

// src/modules/courses/dto/enroll-course.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollCourseDto {
  @ApiPropertyOptional({
    example:
      'I am interested in this course because it aligns with my career goals',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
