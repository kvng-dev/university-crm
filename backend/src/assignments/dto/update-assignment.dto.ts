// src/modules/assignments/dto/update-assignment.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentDto } from './create-assignment.dto';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}

// src/modules/assignments/dto/submit-assignment.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAssignmentDto {
  @ApiPropertyOptional({
    example:
      'This is my assignment submission. I have implemented the required data structures...',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  submissionText?: string;
}
