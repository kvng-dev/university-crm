// src/modules/enrollments/enrollments.controller.ts
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
import { EnrollmentsService } from './enrollments.service';
import { ApproveEnrollmentDto } from './dto/approve-enrollment.dto';
// import { RejectEnrollmentDto } from './dto/reject-enrollment.dto';
// import { BulkApproveEnrollmentsDto } from './dto/bulk-approve-enrollments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { EnrollmentStatus } from './entities/enrollment.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { BulkApproveEnrollmentsDto } from './dto/bulk-approve-enrollments.dto';
import { RejectEnrollmentDto } from './dto/reject-enrollment.dto';

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all enrollments (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Enrollments retrieved successfully',
  })
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.enrollmentsService.findAll(page, limit);
  }

  @Get('my-courses')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student enrollments (Students only)' })
  @ApiResponse({
    status: 200,
    description: 'Student enrollments retrieved successfully',
  })
  async getMyEnrollments(@CurrentUser('id') studentId: number) {
    return this.enrollmentsService.findByStudent(studentId);
  }

  @Get('lecturer/my-enrollments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER)
  @ApiOperation({
    summary: 'Get enrollments for lecturer courses (Lecturers only)',
  })
  @ApiQuery({ name: 'status', required: false, enum: EnrollmentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lecturer enrollments retrieved successfully',
  })
  async getLecturerEnrollments(
    @CurrentUser('id') lecturerId: number,
    @Query('status') status?: EnrollmentStatus,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.enrollmentsService.findByLecturer(
      lecturerId,
      status,
      page,
      limit,
    );
  }

  @Get('lecturer/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Get pending enrollments for lecturer courses' })
  @ApiResponse({
    status: 200,
    description: 'Pending enrollments retrieved successfully',
  })
  async getPendingEnrollments(@CurrentUser('id') lecturerId: number) {
    return this.enrollmentsService.findByLecturer(
      lecturerId,
      EnrollmentStatus.PENDING,
    );
  }

  @Get('course/:courseId/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER)
  @ApiOperation({
    summary: 'Get pending enrollments for specific course (Lecturers only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Course pending enrollments retrieved successfully',
  })
  async getPendingEnrollmentsByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser('id') lecturerId: number,
  ) {
    return this.enrollmentsService.getPendingEnrollmentsByCourse(
      courseId,
      lecturerId,
    );
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get enrollment statistics' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment statistics retrieved successfully',
  })
  async getStatistics(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: UserRole,
  ) {
    const lecturerId = userRole === UserRole.LECTURER ? userId : undefined;
    return this.enrollmentsService.getEnrollmentStatistics(lecturerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.findOne(id);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Approve enrollment (Lecturers only)' })
  @ApiResponse({ status: 200, description: 'Enrollment approved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Can only approve enrollments for own courses',
  })
  async approveEnrollment(
    @Param('id', ParseIntPipe) enrollmentId: number,
    @Body() approveDto: ApproveEnrollmentDto,
    @CurrentUser('id') lecturerId: number,
  ) {
    return this.enrollmentsService.approveEnrollment(
      enrollmentId,
      approveDto,
      lecturerId,
    );
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Reject enrollment (Lecturers only)' })
  @ApiResponse({ status: 200, description: 'Enrollment rejected successfully' })
  @ApiResponse({
    status: 403,
    description: 'Can only reject enrollments for own courses',
  })
  async rejectEnrollment(
    @Param('id', ParseIntPipe) enrollmentId: number,
    @Body() rejectDto: RejectEnrollmentDto,
    @CurrentUser('id') lecturerId: number,
  ) {
    return this.enrollmentsService.rejectEnrollment(
      enrollmentId,
      rejectDto,
      lecturerId,
    );
  }

  @Post('bulk-approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Bulk approve enrollments (Lecturers only)' })
  @ApiResponse({ status: 200, description: 'Bulk approval completed' })
  async bulkApproveEnrollments(
    @Body() bulkApproveDto: BulkApproveEnrollmentsDto,
    @CurrentUser('id') lecturerId: number,
  ) {
    return this.enrollmentsService.bulkApproveEnrollments(
      bulkApproveDto.enrollmentIds,
      lecturerId,
      bulkApproveDto.message,
    );
  }

  @Delete(':id/withdraw')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Withdraw from course (Students only)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully withdrawn from course',
  })
  async withdrawEnrollment(
    @Param('id', ParseIntPipe) enrollmentId: number,
    @CurrentUser('id') studentId: number,
  ) {
    return this.enrollmentsService.withdrawEnrollment(enrollmentId, studentId);
  }
}
