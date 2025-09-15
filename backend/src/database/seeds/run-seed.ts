// src/database/seeds/run-seed.ts
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from './seed';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { databaseConfig } from '../../config/database.config';

async function runSeed() {
  const dataSource = new DataSource({
    ...databaseConfig,
    entities: [User, Course, Enrollment, Assignment, Notification],
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    const seeder = new DatabaseSeeder(dataSource);
    await seeder.seed();

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('👤 Admin: admin@university.edu / Admin123!');
    console.log('👨‍🏫 Lecturer: prof.smith@university.edu / Lecturer123!');
    console.log('👨‍🎓 Student: john.doe@student.university.edu / Student123!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    process.exit(0);
  }
}

// Run the seeder
runSeed();
