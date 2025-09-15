// src/modules/enrollments/dto/reject-enrollment.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectEnrollmentDto {
  @ApiProperty({
    example:
      'Prerequisites not met. Please complete CS101 before enrolling in this course.',
    maxLength: 500,
    description: 'Reason for rejecting the enrollment',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
