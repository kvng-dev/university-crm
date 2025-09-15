// src/modules/admin/dto/update-user-role.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.LECTURER })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
