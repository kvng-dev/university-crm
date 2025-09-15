// src/modules/notifications/entities/notification.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  ENROLLMENT_APPROVED = 'enrollment_approved',
  ENROLLMENT_REJECTED = 'enrollment_rejected',
  ASSIGNMENT_GRADED = 'assignment_graded',
  COURSE_CREATED = 'course_created',
  COURSE_UPDATED = 'course_updated',
  NEW_ASSIGNMENT = 'new_assignment',
  DEADLINE_REMINDER = 'deadline_reminder',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  // Virtual properties
  get isUnread(): boolean {
    return !this.read;
  }

  get isRecent(): boolean {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return this.createdAt > oneDayAgo;
  }
}
