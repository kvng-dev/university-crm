// src/modules/notifications/notifications.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
// import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { UpdateNotificationDto } from './dto/update-notification.dto';
// import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const { userId, type, title, message, metadata } = createNotificationDto;

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Emit real-time notification via WebSocket
    this.notificationGateway.sendToUser(userId, 'new_notification', {
      ...savedNotification,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName },
    });

    return savedNotification;
  }

  async createBulk(
    notifications: CreateNotificationDto[],
  ): Promise<Notification[]> {
    const createdNotifications: Notification[] = [];

    for (const notificationDto of notifications) {
      try {
        const notification = await this.create(notificationDto);
        createdNotifications.push(notification);
      } catch (error) {
        console.error(
          `Failed to create notification for user ${notificationDto.userId}:`,
          error,
        );
      }
    }

    return createdNotifications;
  }

  async findByUser(
    userId: number,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (unreadOnly) {
      queryBuilder.andWhere('notification.read = :read', { read: false });
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Check if user owns this notification
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only access your own notifications',
      );
    }

    return notification;
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();

      const updatedNotification =
        await this.notificationRepository.save(notification);

      // Emit real-time update
      this.notificationGateway.sendToUser(userId, 'notification_read', {
        notificationId: id,
      });

      return updatedNotification;
    }

    return notification;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );

    // Emit real-time update
    this.notificationGateway.sendToUser(userId, 'all_notifications_read', {});
  }

  async update(
    id: number,
    userId: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async remove(id: number, userId: number): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationRepository.remove(notification);

    // Emit real-time update
    this.notificationGateway.sendToUser(userId, 'notification_deleted', {
      notificationId: id,
    });
  }

  async removeAllRead(userId: number): Promise<void> {
    await this.notificationRepository.delete({
      userId,
      read: true,
    });

    // Emit real-time update
    this.notificationGateway.sendToUser(
      userId,
      'read_notifications_cleared',
      {},
    );
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async createSystemNotification(
    title: string,
    message: string,
    userIds?: number[],
    metadata?: Record<string, any>,
  ): Promise<void> {
    let targetUsers: User[];

    if (userIds && userIds.length > 0) {
      targetUsers = await this.userRepository.findByIds(userIds);
    } else {
      // Send to all active users
      targetUsers = await this.userRepository.find({
        where: { isActive: true },
      });
    }

    const notifications = targetUsers.map((user) => ({
      userId: user.id,
      type: NotificationType.SYSTEM,
      title,
      message,
      metadata,
    }));

    await this.createBulk(notifications);
  }

  async createEnrollmentNotification(
    studentId: number,
    courseTitle: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    const type =
      status === 'approved'
        ? NotificationType.ENROLLMENT_APPROVED
        : NotificationType.ENROLLMENT_REJECTED;

    const title =
      status === 'approved' ? 'Enrollment Approved' : 'Enrollment Rejected';

    let message = `Your enrollment in "${courseTitle}" has been ${status}.`;
    if (reason && status === 'rejected') {
      message += ` Reason: ${reason}`;
    }

    await this.create({
      userId: studentId,
      type,
      title,
      message,
      metadata: { courseTitle, status, reason },
    });
  }

  async createAssignmentNotification(
    studentId: number,
    assignmentTitle: string,
    courseTitle: string,
    grade: number,
    feedback?: string,
  ): Promise<void> {
    await this.create({
      userId: studentId,
      type: NotificationType.ASSIGNMENT_GRADED,
      title: 'Assignment Graded',
      message: `Your assignment "${assignmentTitle}" in "${courseTitle}" has been graded. Score: ${grade}/100`,
      metadata: {
        assignmentTitle,
        courseTitle,
        grade,
        feedback,
      },
    });
  }

  async createDeadlineReminder(
    studentId: number,
    assignmentTitle: string,
    courseTitle: string,
    dueDate: Date,
  ): Promise<void> {
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    await this.create({
      userId: studentId,
      type: NotificationType.DEADLINE_REMINDER,
      title: 'Assignment Deadline Reminder',
      message: `Assignment "${assignmentTitle}" in "${courseTitle}" is due in ${daysUntilDue} day(s).`,
      metadata: {
        assignmentTitle,
        courseTitle,
        dueDate: dueDate.toISOString(),
        daysUntilDue,
      },
    });
  }

  // Analytics and reporting
  async getNotificationStats(userId: number): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    recent: number; // Last 7 days
  }> {
    const total = await this.notificationRepository.count({
      where: { userId },
    });

    const unread = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    // Get counts by type
    const typeStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.userId = :userId', { userId })
      .groupBy('notification.type')
      .getRawMany();

    const byType: Record<NotificationType, number> = {} as any;
    Object.values(NotificationType).forEach((type) => {
      byType[type] = 0;
    });

    typeStats.forEach((stat) => {
      byType[stat.type] = parseInt(stat.count);
    });

    // Recent notifications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = await this.notificationRepository.count({
      where: {
        userId,
        createdAt: { $gte: sevenDaysAgo } as any, // TypeORM date comparison
      },
    });

    return {
      total,
      unread,
      byType,
      recent,
    };
  }
}
