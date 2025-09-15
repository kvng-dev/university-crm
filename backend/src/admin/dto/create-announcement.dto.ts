// src/modules/admin/dto/create-announcement.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'System Maintenance Notification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'The system will be under maintenance from 2:00 AM to 4:00 AM UTC tomorrow.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    example: [UserRole.STUDENT, UserRole.LECTURER],
    description:
      'Target specific user roles (if not provided, sends to all users)',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];
}
