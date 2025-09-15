// src/modules/enrollments/entities/enrollment.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

export enum EnrollmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DROPPED = 'dropped',
}

@Entity('enrollments')
@Unique(['courseId', 'studentId'])
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.PENDING,
  })
  status: EnrollmentStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  finalGrade: number | null;

  @Column({ nullable: true })
  enrollmentReason: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  enrolledAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: number;

  @ManyToOne(() => User, (user) => user.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'student_id' })
  studentId: number;

  // Virtual properties
  get isActive(): boolean {
    return this.status === EnrollmentStatus.APPROVED;
  }

  get isPending(): boolean {
    return this.status === EnrollmentStatus.PENDING;
  }

  get isCompleted(): boolean {
    return this.completedAt !== null;
  }
}
