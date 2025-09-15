// src/modules/enrollments/enrollments.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { ApproveEnrollmentDto } from './dto/approve-enrollment.dto';
import { RejectEnrollmentDto } from './dto/reject-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    enrollments: Enrollment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [enrollments, total] = await this.enrollmentRepository.findAndCount({
      relations: ['student', 'course', 'course.lecturer'],
      skip: (page - 1) * limit,
      take: limit,
      order: { enrolledAt: 'DESC' },
    });

    return {
      enrollments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByLecturer(
    lecturerId: number,
    status?: EnrollmentStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    enrollments: Enrollment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.course', 'course')
      .where('course.lecturerId = :lecturerId', { lecturerId });

    if (status) {
      queryBuilder.andWhere('enrollment.status = :status', { status });
    }

    const [enrollments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('enrollment.enrolledAt', 'DESC')
      .getManyAndCount();

    return {
      enrollments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByStudent(studentId: number): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({
      where: { studentId },
      relations: ['course', 'course.lecturer'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['student', 'course', 'course.lecturer'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  async approveEnrollment(
    enrollmentId: number,
    approveDto: ApproveEnrollmentDto,
    lecturerId: number,
  ): Promise<Enrollment> {
    const enrollment = await this.findOne(enrollmentId);

    // Verify lecturer owns the course
    if (enrollment.course.lecturerId !== lecturerId) {
      throw new ForbiddenException(
        'You can only approve enrollments for your own courses',
      );
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException('Only pending enrollments can be approved');
    }

    // Check course capacity before approving
    if (enrollment.course.maxStudents) {
      const currentEnrollments = await this.enrollmentRepository.count({
        where: {
          courseId: enrollment.courseId,
          status: EnrollmentStatus.APPROVED,
        },
      });

      if (currentEnrollments >= enrollment.course.maxStudents) {
        throw new BadRequestException(
          'Course is full - cannot approve more enrollments',
        );
      }
    }

    enrollment.status = EnrollmentStatus.APPROVED;
    enrollment.updatedAt = new Date();

    const updatedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Notify student about approval
    await this.notificationsService.create({
      userId: enrollment.studentId,
      type: NotificationType.ENROLLMENT_APPROVED,
      title: 'Enrollment Approved',
      message: `Your enrollment in "${enrollment.course.title}" has been approved by the lecturer.${approveDto.message ? ' Message: ' + approveDto.message : ''}`,
      metadata: {
        courseId: enrollment.courseId,
        courseName: enrollment.course.title,
        lecturerMessage: approveDto.message,
      },
    });

    // Notify admins about the approval
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: 'Enrollment Approved by Lecturer',
        message: `${enrollment.student.firstName} ${enrollment.student.lastName}'s enrollment in "${enrollment.course.title}" was approved by the lecturer.`,
        metadata: {
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          studentId: enrollment.studentId,
        },
      });
    }

    return updatedEnrollment;
  }

  async rejectEnrollment(
    enrollmentId: number,
    rejectDto: RejectEnrollmentDto,
    lecturerId: number,
  ): Promise<Enrollment> {
    const enrollment = await this.findOne(enrollmentId);

    // Verify lecturer owns the course
    if (enrollment.course.lecturerId !== lecturerId) {
      throw new ForbiddenException(
        'You can only reject enrollments for your own courses',
      );
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException('Only pending enrollments can be rejected');
    }

    enrollment.status = EnrollmentStatus.REJECTED;
    enrollment.rejectionReason = rejectDto.reason;
    enrollment.updatedAt = new Date();

    const updatedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Notify student about rejection
    await this.notificationsService.create({
      userId: enrollment.studentId,
      type: NotificationType.ENROLLMENT_REJECTED,
      title: 'Enrollment Rejected',
      message: `Your enrollment in "${enrollment.course.title}" has been rejected by the lecturer. Reason: ${rejectDto.reason}`,
      metadata: {
        courseId: enrollment.courseId,
        courseName: enrollment.course.title,
        rejectionReason: rejectDto.reason,
      },
    });

    // Notify admins about the rejection
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: 'Enrollment Rejected by Lecturer',
        message: `${enrollment.student.firstName} ${enrollment.student.lastName}'s enrollment in "${enrollment.course.title}" was rejected by the lecturer.`,
        metadata: {
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          studentId: enrollment.studentId,
          rejectionReason: rejectDto.reason,
        },
      });
    }

    return updatedEnrollment;
  }

  async getPendingEnrollmentsByCourse(
    courseId: number,
    lecturerId: number,
  ): Promise<Enrollment[]> {
    // Verify lecturer owns the course
    const course = await this.courseRepository.findOne({
      where: { id: courseId, lecturerId },
    });

    if (!course) {
      throw new ForbiddenException(
        'You can only view enrollments for your own courses',
      );
    }

    return this.enrollmentRepository.find({
      where: { courseId, status: EnrollmentStatus.PENDING },
      relations: ['student'],
      order: { enrolledAt: 'ASC' }, // Oldest first for FIFO processing
    });
  }

  async getEnrollmentStatistics(lecturerId?: number): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    dropped: number;
    byStatus: Record<EnrollmentStatus, number>;
  }> {
    let whereCondition = {};

    if (lecturerId) {
      // Get statistics for specific lecturer's courses
      const courses = await this.courseRepository.find({
        where: { lecturerId },
        select: ['id'],
      });
      const courseIds = courses.map((course) => course.id);
      whereCondition = { courseId: In(courseIds) };
    }

    const [total, pending, approved, rejected, dropped] = await Promise.all([
      this.enrollmentRepository.count({ where: whereCondition }),
      this.enrollmentRepository.count({
        where: { ...whereCondition, status: EnrollmentStatus.PENDING },
      }),
      this.enrollmentRepository.count({
        where: { ...whereCondition, status: EnrollmentStatus.APPROVED },
      }),
      this.enrollmentRepository.count({
        where: { ...whereCondition, status: EnrollmentStatus.REJECTED },
      }),
      this.enrollmentRepository.count({
        where: { ...whereCondition, status: EnrollmentStatus.DROPPED },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      dropped,
      byStatus: {
        [EnrollmentStatus.PENDING]: pending,
        [EnrollmentStatus.APPROVED]: approved,
        [EnrollmentStatus.REJECTED]: rejected,
        [EnrollmentStatus.DROPPED]: dropped,
      },
    };
  }

  async bulkApproveEnrollments(
    enrollmentIds: number[],
    lecturerId: number,
    message?: string,
  ): Promise<{ approved: number; failed: number; errors: string[] }> {
    let approved = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const enrollmentId of enrollmentIds) {
      try {
        await this.approveEnrollment(enrollmentId, { message }, lecturerId);
        approved++;
      } catch (error) {
        failed++;
        errors.push(`Enrollment ${enrollmentId}: ${error.message}`);
      }
    }

    return { approved, failed, errors };
  }

  async withdrawEnrollment(
    enrollmentId: number,
    studentId: number,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, studentId },
      relations: ['course', 'course.lecturer'],
    });

    if (!enrollment) {
      throw new NotFoundException(
        'Enrollment not found or you are not enrolled in this course',
      );
    }

    if (enrollment.status === EnrollmentStatus.DROPPED) {
      throw new BadRequestException('Already withdrawn from this course');
    }

    if (enrollment.status === EnrollmentStatus.REJECTED) {
      throw new BadRequestException(
        'Cannot withdraw from a rejected enrollment',
      );
    }

    enrollment.status = EnrollmentStatus.DROPPED;
    enrollment.updatedAt = new Date();

    const updatedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Notify lecturer about withdrawal
    await this.notificationsService.create({
      userId: enrollment.course.lecturerId,
      type: NotificationType.SYSTEM,
      title: 'Student Withdrew from Course',
      message: `${enrollment.student.firstName} ${enrollment.student.lastName} has withdrawn from "${enrollment.course.title}".`,
      metadata: {
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
      },
    });

    return updatedEnrollment;
  }
}
