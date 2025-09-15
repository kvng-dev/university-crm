// src/modules/courses/courses.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EnrollCourseDto, UpdateCourseDto } from './dto/update-course.to';
import { CreateCourseDto } from './dto/create-course.dto';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new course (Lecturers only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Only lecturers can create courses',
  })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.coursesService.create(createCourseDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active courses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.coursesService.findAll(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search courses' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async search(
    @Query('q') query: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.coursesService.search(query, page, limit);
  }

  @Get('my-courses')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Get courses created by current lecturer' })
  @ApiResponse({
    status: 200,
    description: 'Lecturer courses retrieved successfully',
  })
  async getMyCoures(@CurrentUser('id') userId: number) {
    return this.coursesService.findByLecturer(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 403, description: 'Can only update own courses' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.coursesService.update(id, updateCourseDto, userId, userRole);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete course' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 403, description: 'Can only delete own courses' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.coursesService.remove(id, userId, userRole);
  }

  @Post(':id/enroll')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Enroll in a course (Students only)' })
  @ApiResponse({
    status: 201,
    description: 'Enrollment request created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Already enrolled or course is full',
  })
  async enroll(
    @Param('id', ParseIntPipe) courseId: number,
    @Body() enrollDto: EnrollCourseDto,
    @CurrentUser('id') studentId: number,
  ) {
    return this.coursesService.enroll(courseId, enrollDto, studentId);
  }

  @Delete(':id/drop')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Drop from a course (Students only)' })
  @ApiResponse({ status: 200, description: 'Successfully dropped from course' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async drop(
    @Param('id', ParseIntPipe) courseId: number,
    @CurrentUser('id') studentId: number,
  ) {
    return this.coursesService.drop(courseId, studentId);
  }
}
