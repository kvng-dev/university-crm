// src/modules/assignments/assignments.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Assignment,
  AssignmentType,
  SubmissionStatus,
} from './entities/assignment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import {
  Enrollment,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { FilesService } from '../files/files.service';
import {
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dto/update-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { NotificationType } from 'src/notifications/entities/notification.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly notificationsService: NotificationsService,
    private readonly filesService: FilesService,
  ) {}

  async create(
    createAssignmentDto: CreateAssignmentDto,
    lecturerId: number,
  ): Promise<Assignment> {
    const { courseId, title, description, type, dueDate, maxGrade, weight } =
      createAssignmentDto;

    // Verify lecturer owns the course
    const course = await this.courseRepository.findOne({
      where: { id: courseId, lecturerId },
    });

    if (!course) {
      throw new ForbiddenException(
        'You can only create assignments for your own courses',
      );
    }

    const assignment: Assignment = this.assignmentRepository.create({
      title,
      description,
      type,
      maxGrade: maxGrade || 100,
      weight: weight || 1.0,
      status: SubmissionStatus.DRAFT,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Notify enrolled students about new assignment
    const enrolledStudents = await this.enrollmentRepository.find({
      where: { courseId, status: EnrollmentStatus.APPROVED },
      relations: ['student'],
    });

    for (const enrollment of enrolledStudents) {
      await this.notificationsService.create({
        userId: enrollment.student.id,
        type: NotificationType.NEW_ASSIGNMENT,
        title: 'New Assignment Posted',
        message: `A new assignment "${title}" has been posted in "${course.title}"`,
        metadata: { assignmentId: savedAssignment.id, courseId },
      });
    }

    return savedAssignment;
  }

  async findByCourse(
    courseId: number,
    userId: number,
    userRole: UserRole,
  ): Promise<Assignment[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['lecturer'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    let whereCondition: any = { courseId };

    // Students can only see their own assignment submissions
    if (userRole === UserRole.STUDENT) {
      // Check if student is enrolled
      const enrollment = await this.enrollmentRepository.findOne({
        where: {
          courseId,
          studentId: userId,
          status: EnrollmentStatus.APPROVED,
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You must be enrolled in this course');
      }

      whereCondition.studentId = userId;
    }
    // Lecturers can see all assignments for their courses
    else if (userRole === UserRole.LECTURER && course.lecturerId !== userId) {
      throw new ForbiddenException(
        'You can only view assignments for your own courses',
      );
    }

    return this.assignmentRepository.find({
      where: whereCondition,
      relations: ['student', 'course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudent(studentId: number): Promise<Assignment[]> {
    return this.assignmentRepository.find({
      where: { studentId },
      relations: ['course', 'course.lecturer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: number,
    userId: number,
    userRole: UserRole,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['student', 'course', 'course.lecturer'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check permissions
    if (userRole === UserRole.STUDENT && assignment.studentId !== userId) {
      throw new ForbiddenException('You can only view your own assignments');
    } else if (
      userRole === UserRole.LECTURER &&
      assignment.course.lecturerId !== userId
    ) {
      throw new ForbiddenException(
        'You can only view assignments for your own courses',
      );
    }

    return assignment;
  }

  async submit(
    assignmentId: number,
    submitDto: SubmitAssignmentDto,
    studentId: number,
    file?: Express.Multer.File,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['course'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if student is enrolled in the course
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        courseId: assignment.courseId,
        studentId,
        status: EnrollmentStatus.APPROVED,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to submit assignments',
      );
    }

    // Check if assignment is overdue
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      throw new BadRequestException(
        'Assignment submission deadline has passed',
      );
    }

    // Create student's assignment submission
    let studentAssignment = await this.assignmentRepository.findOne({
      where: {
        courseId: assignment.courseId,
        studentId,
        title: assignment.title,
      },
    });

    if (!studentAssignment) {
      // Create new submission based on template
      studentAssignment = this.assignmentRepository.create({
        courseId: assignment.courseId,
        studentId,
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        dueDate: assignment.dueDate,
        maxGrade: assignment.maxGrade,
        weight: assignment.weight,
      });
    }

    // Handle file upload
    if (file) {
      const uploadedFile = await this.filesService.uploadFile(file);
      studentAssignment.fileUrl = uploadedFile.url;
    }

    studentAssignment.submissionText = submitDto.submissionText ?? null;
    studentAssignment.status = SubmissionStatus.SUBMITTED;
    studentAssignment.submittedAt = new Date();

    return this.assignmentRepository.save(studentAssignment);
  }

  async grade(
    assignmentId: number,
    gradeDto: GradeAssignmentDto,
    lecturerId: number,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['student', 'course'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify lecturer owns the course
    if (assignment.course.lecturerId !== lecturerId) {
      throw new ForbiddenException(
        'You can only grade assignments for your own courses',
      );
    }

    if (gradeDto.grade < 0 || gradeDto.grade > assignment.maxGrade) {
      throw new BadRequestException(
        `Grade must be between 0 and ${assignment.maxGrade}`,
      );
    }

    assignment.grade = gradeDto.grade;
    assignment.feedback = gradeDto.feedback ?? null;
    assignment.status = SubmissionStatus.GRADED;
    assignment.gradedAt = new Date();

    const gradedAssignment = await this.assignmentRepository.save(assignment);

    // Notify student about grade
    if (assignment.student) {
      await this.notificationsService.createAssignmentNotification(
        assignment.studentId,
        assignment.title,
        assignment.course.title,
        gradeDto.grade,
        gradeDto.feedback,
      );
    }

    return gradedAssignment;
  }

  async update(
    id: number,
    updateAssignmentDto: UpdateAssignmentDto,
    userId: number,
    userRole: UserRole,
  ): Promise<Assignment> {
    const assignment = await this.findOne(id, userId, userRole);

    // Students can only update their own draft assignments
    if (userRole === UserRole.STUDENT) {
      if (assignment.status !== SubmissionStatus.DRAFT) {
        throw new ForbiddenException('Cannot update submitted assignments');
      }
    }

    Object.assign(assignment, updateAssignmentDto);
    assignment.updatedAt = new Date();

    return this.assignmentRepository.save(assignment);
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<void> {
    const assignment = await this.findOne(id, userId, userRole);

    // Only lecturers and admins can delete assignments
    if (userRole === UserRole.STUDENT) {
      throw new ForbiddenException('Students cannot delete assignments');
    }

    // Delete associated file if exists
    if (assignment.fileUrl) {
      const filename = assignment.fileUrl.split('/').pop();
      if (filename) {
        await this.filesService.deleteFile(filename);
      }
    }

    await this.assignmentRepository.remove(assignment);
  }

  async calculateCourseGrade(
    courseId: number,
    studentId: number,
  ): Promise<{
    finalGrade: number;
    assignmentGrades: Array<{
      title: string;
      grade: number | null;
      weight: number;
      maxGrade: number;
    }>;
  }> {
    const assignments = await this.assignmentRepository.find({
      where: {
        courseId,
        studentId,
        status: SubmissionStatus.GRADED,
        grade: { $ne: null } as any,
      },
    });

    if (assignments.length === 0) {
      return { finalGrade: 0, assignmentGrades: [] };
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    const assignmentGrades = assignments.map((assignment) => {
      const normalizedGrade =
        ((assignment.grade ?? 0) / assignment.maxGrade) * 100;
      totalWeightedScore += normalizedGrade * assignment.weight;
      totalWeight += assignment.weight;

      return {
        title: assignment.title,
        grade: assignment.grade,
        weight: assignment.weight,
        maxGrade: assignment.maxGrade,
      };
    });

    const finalGrade = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    return {
      finalGrade: Math.round(finalGrade * 100) / 100,
      assignmentGrades,
    };
  }
}
