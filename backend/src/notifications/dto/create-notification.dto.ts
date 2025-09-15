// src/modules/notifications/dto/create-notification.dto.ts
import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: 1, description: 'User ID to send notification to' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.ENROLLMENT_APPROVED,
    description: 'Type of notification',
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    example: 'Enrollment Approved',
    description: 'Notification title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Your enrollment in Computer Science 101 has been approved.',
    description: 'Notification message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: { courseId: 1, courseName: 'Computer Science 101' },
    description: 'Additional metadata for the notification',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
