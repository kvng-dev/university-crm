// src/modules/courses/courses.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  Enrollment,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { EnrollCourseDto, UpdateCourseDto } from './dto/update-course.to';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    lecturerId: number,
  ): Promise<Course> {
    const lecturer = await this.userRepository.findOne({
      where: { id: lecturerId, role: UserRole.LECTURER },
    });

    if (!lecturer) {
      throw new ForbiddenException('Only lecturers can create courses');
    }

    const course = this.courseRepository.create({
      ...createCourseDto,
      lecturerId,
    });

    const savedCourse = await this.courseRepository.save(course);

    // Notify admin about new course
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: NotificationType.COURSE_CREATED,
        title: 'New Course Created',
        message: `${lecturer.fullName} created a new course: ${savedCourse.title}`,
        metadata: { courseId: savedCourse.id },
      });
    }

    return savedCourse;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [courses, total] = await this.courseRepository.findAndCount({
      relations: ['lecturer', 'enrollments'],
      where: { status: CourseStatus.ACTIVE },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['lecturer', 'enrollments', 'enrollments.student'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findByLecturer(lecturerId: number): Promise<Course[]> {
    return this.courseRepository.find({
      where: { lecturerId },
      relations: ['enrollments', 'enrollments.student'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateCourseDto: UpdateCourseDto,
    userId: number,
    userRole: UserRole,
  ): Promise<Course> {
    const course = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && course.lecturerId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    Object.assign(course, updateCourseDto);
    const updatedCourse = await this.courseRepository.save(course);

    // Notify enrolled students about course update
    const enrolledStudents = await this.enrollmentRepository.find({
      where: { courseId: id, status: EnrollmentStatus.APPROVED },
      relations: ['student'],
    });

    for (const enrollment of enrolledStudents) {
      await this.notificationsService.create({
        userId: enrollment.student.id,
        type: NotificationType.COURSE_UPDATED,
        title: 'Course Updated',
        message: `The course "${updatedCourse.title}" has been updated`,
        metadata: { courseId: updatedCourse.id },
      });
    }

    return updatedCourse;
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<void> {
    const course = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && course.lecturerId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    // Check if there are active enrollments
    const activeEnrollments = await this.enrollmentRepository.count({
      where: { courseId: id, status: EnrollmentStatus.APPROVED },
    });

    if (activeEnrollments > 0) {
      throw new BadRequestException(
        'Cannot delete course with active enrollments',
      );
    }

    await this.courseRepository.remove(course);
  }

  async enroll(
    courseId: number,
    enrollDto: EnrollCourseDto,
    studentId: number,
  ): Promise<Enrollment> {
    const course = await this.findOne(courseId);

    if (!course.isActive) {
      throw new BadRequestException('Course is not available for enrollment');
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { courseId, studentId },
    });

    if (existingEnrollment) {
      throw new BadRequestException('Already enrolled in this course');
    }

    // Check course capacity
    if (course.maxStudents) {
      const currentEnrollments = await this.enrollmentRepository.count({
        where: { courseId, status: EnrollmentStatus.APPROVED },
      });

      if (currentEnrollments >= course.maxStudents) {
        throw new BadRequestException('Course is full');
      }
    }

    const enrollment = this.enrollmentRepository.create({
      courseId,
      studentId,
      enrollmentReason: enrollDto.reason,
      status: EnrollmentStatus.PENDING,
    });

    const savedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Notify lecturer about new enrollment request
    await this.notificationsService.create({
      userId: course.lecturerId,
      type: NotificationType.ENROLLMENT_APPROVED, // Will be changed based on admin decision
      title: 'New Enrollment Request',
      message: `A student has requested to enroll in your course: ${course.title}`,
      metadata: { courseId, enrollmentId: savedEnrollment.id },
    });

    return savedEnrollment;
  }

  async drop(courseId: number, studentId: number): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { courseId, studentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status === EnrollmentStatus.DROPPED) {
      throw new BadRequestException('Already dropped from this course');
    }

    enrollment.status = EnrollmentStatus.DROPPED;
    await this.enrollmentRepository.save(enrollment);
  }

  async search(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.lecturer', 'lecturer')
      .where('course.status = :status', { status: CourseStatus.ACTIVE })
      .andWhere(
        '(course.title ILIKE :query OR course.description ILIKE :query)',
        { query: `%${query}%` },
      )
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('course.createdAt', 'DESC');

    const [courses, total] = await queryBuilder.getManyAndCount();

    return {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
