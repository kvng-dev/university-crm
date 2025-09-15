// src/database/seeds/seed.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';
import { Course, CourseStatus } from '../../courses/entities/course.entity';
import {
  Enrollment,
  EnrollmentStatus,
} from '../../enrollments/entities/enrollment.entity';
import {
  Assignment,
  AssignmentType,
  SubmissionStatus,
} from '../../assignments/entities/assignment.entity';
import {
  Notification,
  NotificationType,
} from '../../notifications/entities/notification.entity';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  // Inside your DatabaseSeeder
  private async clearTables() {
    console.log('🧹 Clearing tables...');

    // Clear child tables first
    await this.dataSource.query(`
    TRUNCATE TABLE
      "notifications",
      "assignments",
      "enrollments",
      "courses",
      "users"
    CASCADE;
  `);

    console.log('✅ Tables cleared');
  }

  async seed() {
    console.log('🌱 Starting database seeding...');

    try {
      await this.clearTables();

      // 2️⃣ Seed users
      const users = await this.seedUsers();
      await this.seedCourses();
      await this.seedEnrollments();
      await this.seedAssignments();
      await this.seedNotifications(users);

      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async seedUsers() {
    console.log('👥 Seeding users...');

    // Use CASCADE to avoid foreign key errors
    const userRepository = this.dataSource.getRepository(User);
    const saltRounds = 12;

    const users = [
      // Admin Users
      {
        email: 'admin@university.edu',
        password: await bcrypt.hash('Admin123!', saltRounds),
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        email: 'dean@university.edu',
        password: await bcrypt.hash('Dean123!', saltRounds),
        firstName: 'Margaret',
        lastName: 'Johnson',
        role: UserRole.ADMIN,
        isActive: true,
      },

      // Lecturer Users
      {
        email: 'prof.smith@university.edu',
        password: await bcrypt.hash('Lecturer123!', saltRounds),
        firstName: 'Dr. Robert',
        lastName: 'Smith',
        role: UserRole.LECTURER,
        isActive: true,
      },
      {
        email: 'prof.davis@university.edu',
        password: await bcrypt.hash('Lecturer123!', saltRounds),
        firstName: 'Dr. Sarah',
        lastName: 'Davis',
        role: UserRole.LECTURER,
        isActive: true,
      },
      {
        email: 'prof.wilson@university.edu',
        password: await bcrypt.hash('Lecturer123!', saltRounds),
        firstName: 'Dr. Michael',
        lastName: 'Wilson',
        role: UserRole.LECTURER,
        isActive: true,
      },
      {
        email: 'prof.brown@university.edu',
        password: await bcrypt.hash('Lecturer123!', saltRounds),
        firstName: 'Dr. Emily',
        lastName: 'Brown',
        role: UserRole.LECTURER,
        isActive: true,
      },
      {
        email: 'prof.garcia@university.edu',
        password: await bcrypt.hash('Lecturer123!', saltRounds),
        firstName: 'Dr. Carlos',
        lastName: 'Garcia',
        role: UserRole.LECTURER,
        isActive: true,
      },

      // Student Users
      {
        email: 'john.doe@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'jane.smith@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'alice.johnson@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'Alice',
        lastName: 'Johnson',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'bob.wilson@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'Bob',
        lastName: 'Wilson',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'charlie.brown@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'Charlie',
        lastName: 'Brown',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'diana.martinez@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'Diana',
        lastName: 'Martinez',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'ethan.davis@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'Ethan',
        lastName: 'Davis',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'fiona.taylor@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'Fiona',
        lastName: 'Taylor',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'george.lee@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'George',
        lastName: 'Lee',
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        email: 'hannah.clark@student.university.edu',
        password: await bcrypt.hash('Student123!', saltRounds),
        firstName: 'Hannah',
        lastName: 'Clark',
        role: UserRole.STUDENT,
        isActive: true,
      },
    ];

    // Insert seed users
    const createdUsers = await userRepository.save(users);

    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  }

  private async seedCourses() {
    console.log('📚 Seeding courses...');

    const courseRepository = this.dataSource.getRepository(Course);
    const userRepository = this.dataSource.getRepository(User);

    // Get lecturers
    const lecturers = await userRepository.find({
      where: { role: UserRole.LECTURER },
    });

    const courses = [
      {
        title: 'Introduction to Computer Science',
        description:
          'A comprehensive introduction to computer science fundamentals, covering programming basics, data structures, and algorithmic thinking.',
        credits: 4,
        lecturerId: lecturers[0].id, // Dr. Robert Smith
        status: CourseStatus.ACTIVE,
        maxStudents: 30,
        fee: 1200.0,
        semester: 'Fall 2024',
        year: 2024,
      },
      {
        title: 'Data Structures and Algorithms',
        description:
          'Advanced study of data structures and algorithm design, including analysis of time and space complexity.',
        credits: 4,
        lecturerId: lecturers[0].id, // Dr. Robert Smith
        status: CourseStatus.ACTIVE,
        maxStudents: 25,
        fee: 1350.0,
        semester: 'Fall 2024',
        year: 2024,
      },
      {
        title: 'Database Management Systems',
        description:
          'Comprehensive coverage of database design, SQL, normalization, and database administration.',
        credits: 3,
        lecturerId: lecturers[1].id, // Dr. Sarah Davis
        status: CourseStatus.ACTIVE,
        maxStudents: 28,
        fee: 1100.0,
        semester: 'Fall 2024',
        year: 2024,
      },
      {
        title: 'Web Development Fundamentals',
        description:
          'Introduction to modern web development using HTML, CSS, JavaScript, and popular frameworks.',
        credits: 3,
        lecturerId: lecturers[1].id, // Dr. Sarah Davis
        status: CourseStatus.ACTIVE,
        maxStudents: 35,
        fee: 1000.0,
        semester: 'Fall 2024',
        year: 2024,
      },
      {
        title: 'Software Engineering Principles',
        description:
          'Study of software development methodologies, project management, and software quality assurance.',
        credits: 4,
        lecturerId: lecturers[2].id, // Dr. Michael Wilson
        status: CourseStatus.ACTIVE,
        maxStudents: 20,
        fee: 1400.0,
        semester: 'Fall 2024',
        year: 2024,
      },
      {
        title: 'Machine Learning Fundamentals',
        description:
          'Introduction to machine learning algorithms, data preprocessing, and model evaluation techniques.',
        credits: 4,
        lecturerId: lecturers[3].id, // Dr. Emily Brown
        status: CourseStatus.ACTIVE,
        maxStudents: 22,
        fee: 1500.0,
        semester: 'Fall 2024',
        year: 2024,
      },
      {
        title: 'Network Security',
        description:
          'Comprehensive study of network security protocols, cryptography, and cybersecurity best practices.',
        credits: 3,
        lecturerId: lecturers[4].id, // Dr. Carlos Garcia
        status: CourseStatus.ACTIVE,
        maxStudents: 25,
        fee: 1300.0,
        semester: 'Fall 2024',
        year: 2024,
      },
      {
        title: 'Mobile App Development',
        description:
          'Hands-on course covering iOS and Android development using modern frameworks and tools.',
        credits: 3,
        lecturerId: lecturers[2].id, // Dr. Michael Wilson
        status: CourseStatus.ACTIVE,
        maxStudents: 30,
        fee: 1250.0,
        semester: 'Spring 2025',
        year: 2025,
      },
      {
        title: 'Artificial Intelligence',
        description:
          'Advanced topics in AI including natural language processing, computer vision, and neural networks.',
        credits: 4,
        lecturerId: lecturers[3].id, // Dr. Emily Brown
        status: CourseStatus.ACTIVE,
        maxStudents: 20,
        fee: 1600.0,
        semester: 'Spring 2025',
        year: 2025,
      },
      {
        title: 'Cloud Computing Architecture',
        description:
          'Study of cloud computing platforms, distributed systems, and scalable application deployment.',
        credits: 3,
        lecturerId: lecturers[4].id, // Dr. Carlos Garcia
        status: CourseStatus.ACTIVE,
        maxStudents: 24,
        fee: 1400.0,
        semester: 'Spring 2025',
        year: 2025,
      },
    ];

    // Insert seed courses
    const createdCourses = await courseRepository.save(courses);

    console.log(`✅ Created ${createdCourses.length} courses`);
    return createdCourses;
  }

  private async seedEnrollments() {
    console.log('📝 Seeding enrollments...');

    const enrollmentRepository = this.dataSource.getRepository(Enrollment);
    const userRepository = this.dataSource.getRepository(User);
    const courseRepository = this.dataSource.getRepository(Course);

    // Get students and courses
    const students = await userRepository.find({
      where: { role: UserRole.STUDENT },
    });
    const courses = await courseRepository.find();

    const enrollments: Enrollment[] = [];

    // Create diverse enrollment scenarios
    students.forEach((student) => {
      const courseCount = Math.floor(Math.random() * 4) + 2; // 2-5 courses per student
      const studentCourses = courses
        .sort(() => 0.5 - Math.random())
        .slice(0, courseCount);

      studentCourses.forEach((course, courseIndex) => {
        let status = EnrollmentStatus.APPROVED;
        let finalGrade;

        // Create different enrollment scenarios
        if (courseIndex === 0) {
          // First course - always approved with grade
          finalGrade = 75 + Math.random() * 20; // 75-95 range
        } else if (courseIndex === 1) {
          // Second course - approved, in progress
          status = EnrollmentStatus.APPROVED;
        } else if (Math.random() < 0.1) {
          // 10% chance of pending enrollment
          status = EnrollmentStatus.PENDING;
        } else if (Math.random() < 0.05) {
          // 5% chance of rejected enrollment
          status = EnrollmentStatus.REJECTED;
        } else {
          status = EnrollmentStatus.APPROVED;
          // 50% chance of having a final grade
          if (Math.random() < 0.5) {
            finalGrade = 60 + Math.random() * 35; // 60-95 range
          }
        }

        const enrollment = enrollmentRepository.create({
          courseId: course.id,
          studentId: student.id,
          status,
          finalGrade: finalGrade ? Math.round(finalGrade * 100) / 100 : null,
          enrollmentReason:
            'Interest in the subject matter and career development',
          enrolledAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ),
        });

        enrollments.push(enrollment);
      });
    });

    // Insert seed enrollments
    const createdEnrollments = await enrollmentRepository.save(enrollments);

    console.log(`✅ Created ${createdEnrollments.length} enrollments`);
    return createdEnrollments;
  }

  private async seedAssignments() {
    console.log('📋 Seeding assignments...');

    const assignmentRepository = this.dataSource.getRepository(Assignment);
    const enrollmentRepository = this.dataSource.getRepository(Enrollment);

    // Get approved enrollments
    const enrollments = await enrollmentRepository.find({
      where: { status: EnrollmentStatus.APPROVED },
      relations: ['student', 'course'],
    });

    const assignments: Assignment[] = [];
    const assignmentTemplates = [
      {
        title: 'Programming Assignment 1',
        description: 'Implement basic data structures and algorithms',
        type: AssignmentType.SUBMISSION,
        weight: 0.2,
        maxGrade: 100,
      },
      {
        title: 'Midterm Project',
        description: 'Mid-semester project demonstrating core concepts',
        type: AssignmentType.PROJECT,
        weight: 0.3,
        maxGrade: 100,
      },
      {
        title: 'Quiz 1',
        description: 'Weekly quiz covering recent topics',
        type: AssignmentType.QUIZ,
        weight: 0.1,
        maxGrade: 50,
      },
      {
        title: 'Final Examination',
        description: 'Comprehensive final exam',
        type: AssignmentType.EXAM,
        weight: 0.4,
        maxGrade: 100,
      },
    ];

    enrollments.forEach((enrollment) => {
      assignmentTemplates.forEach((template, index) => {
        let status = SubmissionStatus.DRAFT;
        let grade: number | null = null;
        let gradedAt: Date | null = null;
        let feedback: string | null = null;
        let submissionText: string | null = null;

        // Create different assignment scenarios
        const scenario = Math.random();

        if (scenario < 0.6) {
          // 60% - Submitted and graded
          status = SubmissionStatus.GRADED;
          grade = Math.round((60 + Math.random() * 35) * 100) / 100; // 60-95 range
          gradedAt = new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          );
          submissionText = `Submission for ${template.title} by ${enrollment.student.firstName} ${enrollment.student.lastName}`;

          // Generate appropriate feedback based on grade
          if (grade >= 90) {
            feedback =
              'Excellent work! Shows deep understanding of the concepts.';
          } else if (grade >= 80) {
            feedback = 'Good job! Minor improvements needed in some areas.';
          } else if (grade >= 70) {
            feedback = 'Satisfactory work. Consider reviewing key concepts.';
          } else {
            feedback = 'Needs improvement. Please see me during office hours.';
          }
        } else if (scenario < 0.8) {
          // 20% - Submitted, waiting for grade
          status = SubmissionStatus.SUBMITTED;
          submissionText = `Submission for ${template.title} by ${enrollment.student.firstName} ${enrollment.student.lastName}`;
        } else if (scenario < 0.9) {
          // 10% - Draft/In progress
          status = SubmissionStatus.DRAFT;
        } else {
          // 10% - Not started yet
          status = SubmissionStatus.DRAFT;
        }

        const assignment = assignmentRepository.create({
          courseId: enrollment.courseId,
          studentId: enrollment.studentId,
          title: template.title,
          description: template.description,
          type: template.type,
          weight: template.weight,
          maxGrade: template.maxGrade,
          grade, // could be null
          status,
          feedback, // could be null
          submissionText, // could be null
          dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000),
          submittedAt:
            status !== SubmissionStatus.DRAFT
              ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
              : new Date(),
          gradedAt, // could be null
        });

        assignments.push(assignment);
      });
    });

    // Clear existing assignments
    await assignmentRepository.clear();

    // Insert seed assignments
    const createdAssignments = await assignmentRepository.save(assignments);

    console.log(`✅ Created ${createdAssignments.length} assignments`);
    return createdAssignments;
  }

  private async seedNotifications(users: User[]) {
    console.log('🔔 Seeding notifications...');

    const notificationRepository = this.dataSource.getRepository(Notification);

    // Clear existing notifications
    await notificationRepository.clear();

    const notificationTemplates = [
      {
        type: NotificationType.ENROLLMENT_APPROVED,
        title: 'Enrollment Approved',
        message: 'Your enrollment has been approved.',
        metadata: { courseId: 1, courseName: 'Intro to CS' },
      },
      {
        type: NotificationType.ASSIGNMENT_GRADED,
        title: 'Assignment Graded',
        message: 'Your assignment has been graded.',
        metadata: { assignmentId: 1, grade: 85, maxGrade: 100 },
      },
    ];

    const notifications: Notification[] | any = [];

    for (const user of users) {
      const notificationCount = Math.floor(Math.random() * 6) + 3;

      for (let i = 0; i < notificationCount; i++) {
        const template =
          notificationTemplates[
            Math.floor(Math.random() * notificationTemplates.length)
          ];

        const isRead = Math.random() < 0.6;
        const createdAt = new Date(
          Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000,
        );

        const notification = notificationRepository.create({
          userId: user.id,
          type: template.type,
          title: template.title,
          message: template.message,
          metadata: template.metadata,
          read: isRead,
          readAt: isRead
            ? new Date(
                createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
              )
            : null,
          createdAt,
        } as any);

        notifications.push(notification);
      }
    }

    const createdNotifications =
      await notificationRepository.save(notifications);
    console.log(`✅ Created ${createdNotifications.length} notifications`);
    return createdNotifications;
  }
}
