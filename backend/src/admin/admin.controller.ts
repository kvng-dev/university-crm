// src/modules/admin/admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
// import { ApproveEnrollmentDto } from './dto/approve-enrollment.dto';
// import { RejectEnrollmentDto } from './dto/reject-enrollment.dto';
// import { UpdateUserRoleDto } from './dto/update-user-role.dto';
// import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RejectEnrollmentDto } from './dto/reject-enrollment.dto';
import { ApproveEnrollmentDto } from './dto/approve-enrollment.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully',
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('enrollments/pending')
  @ApiOperation({ summary: 'Get pending enrollments' })
  @ApiResponse({
    status: 200,
    description: 'Pending enrollments retrieved successfully',
  })
  async getPendingEnrollments() {
    return this.adminService.getPendingEnrollments();
  }

  @Post('enrollments/:id/approve')
  @ApiOperation({ summary: 'Approve enrollment' })
  @ApiResponse({ status: 200, description: 'Enrollment approved successfully' })
  async approveEnrollment(
    @Param('id', ParseIntPipe) enrollmentId: number,
    @Body() approveDto: ApproveEnrollmentDto,
  ) {
    return this.adminService.approveEnrollment(enrollmentId, approveDto);
  }

  @Post('enrollments/:id/reject')
  @ApiOperation({ summary: 'Reject enrollment' })
  @ApiResponse({ status: 200, description: 'Enrollment rejected successfully' })
  async rejectEnrollment(
    @Param('id', ParseIntPipe) enrollmentId: number,
    @Body() rejectDto: RejectEnrollmentDto,
  ) {
    return this.adminService.rejectEnrollment(enrollmentId, rejectDto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  async updateUserRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, updateRoleDto.role);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async toggleUserStatus(@Param('id', ParseIntPipe) userId: number) {
    return this.adminService.toggleUserStatus(userId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get system logs' })
  @ApiResponse({
    status: 200,
    description: 'System logs retrieved successfully',
  })
  async getSystemLogs(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.adminService.getSystemLogs(page, limit);
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create system announcement' })
  @ApiResponse({
    status: 201,
    description: 'Announcement created successfully',
  })
  async createAnnouncement(@Body() announcementDto: CreateAnnouncementDto) {
    await this.adminService.createSystemAnnouncement(
      announcementDto.title,
      announcementDto.message,
      announcementDto.targetRoles,
    );
    return { message: 'Announcement sent successfully' };
  }
}
