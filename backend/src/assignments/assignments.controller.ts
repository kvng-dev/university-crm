// src/modules/assignments/assignments.controller.ts
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dto/update-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';

@ApiTags('Assignments')
@Controller('assignments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create assignment template (Lecturers only)' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  async create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @CurrentUser('id') lecturerId: number,
  ) {
    return this.assignmentsService.create(createAssignmentDto, lecturerId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get assignments for a course' })
  @ApiResponse({
    status: 200,
    description: 'Assignments retrieved successfully',
  })
  async findByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.assignmentsService.findByCourse(courseId, userId, userRole);
  }

  @Get('my-assignments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student assignments (Students only)' })
  @ApiResponse({
    status: 200,
    description: 'Student assignments retrieved successfully',
  })
  async getMyAssignments(@CurrentUser('id') studentId: number) {
    return this.assignmentsService.findByStudent(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Assignment retrieved successfully',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.assignmentsService.findOne(id, userId, userRole);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Submit assignment (Students only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Assignment submitted successfully',
  })
  async submit(
    @Param('id', ParseIntPipe) assignmentId: number,
    @Body() submitDto: SubmitAssignmentDto,
    @CurrentUser('id') studentId: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.assignmentsService.submit(
      assignmentId,
      submitDto,
      studentId,
      file,
    );
  }

  @Post(':id/grade')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Grade assignment (Lecturers only)' })
  @ApiResponse({ status: 200, description: 'Assignment graded successfully' })
  async grade(
    @Param('id', ParseIntPipe) assignmentId: number,
    @Body() gradeDto: GradeAssignmentDto,
    @CurrentUser('id') lecturerId: number,
  ) {
    return this.assignmentsService.grade(assignmentId, gradeDto, lecturerId);
  }

  @Get('course/:courseId/student/:studentId/grade')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate student grade for course' })
  @ApiResponse({
    status: 200,
    description: 'Course grade calculated successfully',
  })
  async calculateCourseGrade(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.assignmentsService.calculateCourseGrade(courseId, studentId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assignment' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.assignmentsService.update(
      id,
      updateAssignmentDto,
      userId,
      userRole,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete assignment' })
  @ApiResponse({ status: 200, description: 'Assignment deleted successfully' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: UserRole,
  ) {
    await this.assignmentsService.remove(id, userId, userRole);
    return { message: 'Assignment deleted successfully' };
  }
}
