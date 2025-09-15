import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(
  PickType(CreateNotificationDto, ['title', 'message', 'metadata'] as const),
) {
  @ApiPropertyOptional({
    example: true,
    description: 'Mark notification as read/unread',
  })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
