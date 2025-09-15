// src/modules/courses/entities/course.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';

export enum CourseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  credits: number;

  @Column({ nullable: true })
  syllabusUrl: string;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.ACTIVE,
  })
  status: CourseStatus;

  @Column({ nullable: true })
  maxStudents: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number;

  @Column({ nullable: true })
  semester: string;

  @Column({ nullable: true })
  year: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.courses)
  @JoinColumn({ name: 'lecturer_id' })
  lecturer: User;

  @Column({ name: 'lecturer_id' })
  lecturerId: number;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @OneToMany(() => Assignment, (assignment) => assignment.course)
  assignments: Assignment[];

  // Virtual properties
  get enrolledStudentsCount(): number {
    return this.enrollments?.filter((e) => e.status === 'approved').length || 0;
  }

  get isActive(): boolean {
    return this.status === CourseStatus.ACTIVE;
  }
}
