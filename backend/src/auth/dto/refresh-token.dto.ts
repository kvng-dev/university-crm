// src/modules/auth/dto/refresh-token.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Refresh token (optional if sent via cookie)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
