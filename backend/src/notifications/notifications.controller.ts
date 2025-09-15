// src/modules/notifications/notifications.controller.ts
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
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateSystemNotificationDto } from './dto/create-system-notification.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a notification (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('system')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create system notification for all users (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'System notification sent successfully',
  })
  async createSystemNotification(
    @Body() createSystemNotificationDto: CreateSystemNotificationDto,
  ) {
    const { title, message, userIds, metadata } = createSystemNotificationDto;
    await this.notificationsService.createSystemNotification(
      title,
      message,
      userIds,
      metadata,
    );
    return { message: 'System notification sent successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async findByUser(
    @CurrentUser('id') userId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('unreadOnly', ParseBoolPipe) unreadOnly: boolean = false,
  ) {
    return this.notificationsService.findByUser(
      userId,
      page,
      limit,
      unreadOnly,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics for current user' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully',
  })
  async getStats(@CurrentUser('id') userId: number) {
    return this.notificationsService.getNotificationStats(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(@CurrentUser('id') userId: number) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser('id') userId: number) {
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() UpdateNotificationDto: UpdateNotificationDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.update(id, userId, UpdateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.notificationsService.remove(id, userId);
    return { message: 'Notification deleted successfully' };
  }

  @Delete('clear-read')
  @ApiOperation({ summary: 'Delete all read notifications' })
  @ApiResponse({
    status: 200,
    description: 'Read notifications cleared successfully',
  })
  async removeAllRead(@CurrentUser('id') userId: number) {
    await this.notificationsService.removeAllRead(userId);
    return { message: 'Read notifications cleared successfully' };
  }
}
