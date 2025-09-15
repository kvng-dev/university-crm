// src/modules/assignments/entities/assignment.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

export enum AssignmentType {
  SUBMISSION = 'submission',
  EXAM = 'exam',
  QUIZ = 'quiz',
  PROJECT = 'project',
}

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  RETURNED = 'returned',
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AssignmentType,
    default: AssignmentType.SUBMISSION,
  })
  type: AssignmentType;

  @Column({ nullable: true })
  fileUrl: string;

  @Column('text', { nullable: true })
  submissionText: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  grade: number | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  weight: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  maxGrade: number;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.DRAFT,
  })
  status: SubmissionStatus;

  @Column('text', { nullable: true })
  feedback: string | null;

  @Column({ nullable: true })
  dueDate: Date;

  @CreateDateColumn({ type: 'timestamp' })
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date | null;

  // Relations
  @ManyToOne(() => Course, (course) => course.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'student_id' })
  studentId: number;

  // Virtual properties
  get isGraded(): boolean {
    return this.grade !== null && this.status === SubmissionStatus.GRADED;
  }

  get isOverdue(): boolean {
    return this.dueDate && new Date() > this.dueDate && !this.isGraded;
  }

  get gradePercentage(): number {
    return this.grade ? (this.grade / this.maxGrade) * 100 : 0;
  }
}
