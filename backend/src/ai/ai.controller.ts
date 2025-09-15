// src/modules/ai/ai.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { CourseRecommendationDto } from './dto/course-recommendation.dto';
import { SyllabusGenerationDto } from './dto/syllabus-generation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('AI Assistant')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @Throttle({ long: { limit: 20, ttl: 3600000 } }) // 20 requests per hour
  @ApiOperation({
    summary: 'Get AI-powered course recommendations (Students only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Course recommendations generated successfully',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async recommendCourses(
    @Body() recommendationDto: CourseRecommendationDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.aiService.recommendCourses(userId, recommendationDto);
  }

  @Post('syllabus')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @Throttle({ long: { limit: 10, ttl: 3600000 } }) // 10 requests per hour
  @ApiOperation({
    summary: 'Generate AI-powered syllabus (Lecturers and Admins only)',
  })
  @ApiResponse({ status: 200, description: 'Syllabus generated successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async generateSyllabus(@Body() syllabusDto: SyllabusGenerationDto) {
    return this.aiService.generateSyllabus(syllabusDto);
  }
}
