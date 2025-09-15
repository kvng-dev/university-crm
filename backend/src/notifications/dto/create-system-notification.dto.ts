// src/modules/notifications/dto/create-system-notification.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemNotificationDto {
  @ApiProperty({
    example: 'System Maintenance',
    description: 'System notification title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'The system will be under maintenance from 2:00 AM to 4:00 AM UTC.',
    description: 'System notification message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: [1, 2, 3],
    description:
      'Specific user IDs to send notification to (if not provided, sends to all users)',
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds?: number[];

  @ApiPropertyOptional({
    example: { priority: 'high', category: 'maintenance' },
    description: 'Additional metadata for the notification',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
