// src/modules/admin/admin.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Course, CourseStatus } from '../courses/entities/course.entity';
import {
  Enrollment,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import {
  Assignment,
  SubmissionStatus,
} from '../assignments/entities/assignment.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ApproveEnrollmentDto } from 'src/enrollments/dto/approve-enrollment.dto';
import { RejectEnrollmentDto } from 'src/enrollments/dto/reject-enrollment.dto';
// import { ApproveEnrollmentDto } from './dto/approve-enrollment.dto';
// import { RejectEnrollmentDto } from './dto/reject-enrollment.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDashboardStats(): Promise<{
    users: {
      total: number;
      students: number;
      lecturers: number;
      admins: number;
    };
    courses: { total: number; active: number; inactive: number };
    enrollments: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    assignments: { total: number; submitted: number; graded: number };
    recentActivity: any[];
  }> {
    const [
      userStats,
      courseStats,
      enrollmentStats,
      assignmentStats,
      recentEnrollments,
      recentAssignments,
    ] = await Promise.all([
      this.getUserStats(),
      this.getCourseStats(),
      this.getEnrollmentStats(),
      this.getAssignmentStats(),
      this.getRecentEnrollments(),
      this.getRecentAssignments(),
    ]);

    const recentActivity = [
      ...recentEnrollments.map((e) => ({
        type: 'enrollment',
        message: `${e.student.firstName} ${e.student.lastName} enrolled in ${e.course.title}`,
        timestamp: e.enrolledAt,
        status: e.status,
      })),
      ...recentAssignments.map((a) => ({
        type: 'assignment',
        message: `${a.student.firstName} ${a.student.lastName} submitted ${a.title}`,
        timestamp: a.submittedAt,
        status: a.status,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);

    return {
      users: userStats,
      courses: courseStats,
      enrollments: enrollmentStats,
      assignments: assignmentStats,
      recentActivity,
    };
  }

  private async getUserStats() {
    const [total, students, lecturers, admins] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: UserRole.STUDENT } }),
      this.userRepository.count({ where: { role: UserRole.LECTURER } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
    ]);

    return { total, students, lecturers, admins };
  }

  private async getCourseStats() {
    const [total, active, inactive] = await Promise.all([
      this.courseRepository.count(),
      this.courseRepository.count({ where: { status: CourseStatus.ACTIVE } }),
      this.courseRepository.count({ where: { status: CourseStatus.INACTIVE } }),
    ]);

    return { total, active, inactive };
  }

  private async getEnrollmentStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.enrollmentRepository.count(),
      this.enrollmentRepository.count({
        where: { status: EnrollmentStatus.PENDING },
      }),
      this.enrollmentRepository.count({
        where: { status: EnrollmentStatus.APPROVED },
      }),
      this.enrollmentRepository.count({
        where: { status: EnrollmentStatus.REJECTED },
      }),
    ]);

    return { total, pending, approved, rejected };
  }

  private async getAssignmentStats() {
    const [total, submitted, graded] = await Promise.all([
      this.assignmentRepository.count(),
      this.assignmentRepository.count({
        where: { status: SubmissionStatus.SUBMITTED },
      }),
      this.assignmentRepository.count({
        where: { status: SubmissionStatus.GRADED },
      }),
    ]);

    return { total, submitted, graded };
  }

  private async getRecentEnrollments() {
    return this.enrollmentRepository.find({
      relations: ['student', 'course'],
      order: { enrolledAt: 'DESC' },
      take: 5,
    });
  }

  private async getRecentAssignments() {
    return this.assignmentRepository.find({
      relations: ['student', 'course'],
      where: { status: SubmissionStatus.SUBMITTED },
      order: { submittedAt: 'DESC' },
      take: 5,
    });
  }

  async getPendingEnrollments(): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({
      where: { status: EnrollmentStatus.PENDING },
      relations: ['student', 'course', 'course.lecturer'],
      order: { enrolledAt: 'ASC' },
    });
  }

  async approveEnrollment(
    enrollmentId: number,
    approveDto: ApproveEnrollmentDto,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['student', 'course'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new ForbiddenException('Only pending enrollments can be approved');
    }

    enrollment.status = EnrollmentStatus.APPROVED;
    const updatedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Send notification to student
    await this.notificationsService.createEnrollmentNotification(
      enrollment.studentId,
      enrollment.course.title,
      'approved',
      approveDto.message,
    );

    return updatedEnrollment;
  }

  async rejectEnrollment(
    enrollmentId: number,
    rejectDto: RejectEnrollmentDto,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['student', 'course'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new ForbiddenException('Only pending enrollments can be rejected');
    }

    enrollment.status = EnrollmentStatus.REJECTED;
    enrollment.rejectionReason = rejectDto.reason;
    const updatedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Send notification to student
    await this.notificationsService.createEnrollmentNotification(
      enrollment.studentId,
      enrollment.course.title,
      'rejected',
      rejectDto.reason,
    );

    return updatedEnrollment;
  }

  async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = newRole;
    return this.userRepository.save(user);
  }

  async toggleUserStatus(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async getSystemLogs(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // In a real application, you would have a proper logging system
    // For now, we'll use notifications as a simple log system
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    const logs = notifications.map((notification) => ({
      id: notification.id,
      timestamp: notification.createdAt,
      type: notification.type,
      user: notification.user
        ? `${notification.user.firstName} ${notification.user.lastName}`
        : 'System',
      message: notification.message,
      metadata: notification.metadata,
    }));

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createSystemAnnouncement(
    title: string,
    message: string,
    targetRoles?: UserRole[],
  ): Promise<void> {
    let targetUsers: User[];

    if (targetRoles && targetRoles.length > 0) {
      targetUsers = await this.userRepository.find({
        where: targetRoles.map((role) => ({ role, isActive: true })),
      });
    } else {
      targetUsers = await this.userRepository.find({
        where: { isActive: true },
      });
    }

    const userIds = targetUsers.map((user) => user.id);
    await this.notificationsService.createSystemNotification(
      title,
      message,
      userIds,
    );
  }
}
