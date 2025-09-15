// src/modules/ai/ai.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAI } from 'openai';
import { Course, CourseStatus } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import {
  Enrollment,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import { CourseRecommendationDto } from './dto/course-recommendation.dto';
import { SyllabusGenerationDto } from './dto/syllabus-generation.dto';

export interface CourseRecommendation {
  course: Course;
  score: number;
  reason: string;
}

export interface SyllabusContent {
  title: string;
  description: string;
  objectives: string[];
  weeklySchedule: WeeklyTopic[];
  assessments: Assessment[];
  resources: string[];
  policies: string[];
}

interface WeeklyTopic {
  week: number;
  topic: string;
  description: string;
  readings?: string[];
}

interface Assessment {
  type: string;
  weight: number;
  description: string;
  dueDate?: string;
}

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;
  private readonly useMockData: boolean;

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {
    // Initialize OpenAI if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.openai = new OpenAI({ apiKey });
      this.useMockData = false;
    } else {
      console.warn('OpenAI API key not found. Using mock AI responses.');
      this.useMockData = true;
    }
  }

  async recommendCourses(
    userId: number,
    recommendationDto: CourseRecommendationDto,
  ): Promise<CourseRecommendation[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['enrollments', 'enrollments.course'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get enrolled course IDs to exclude from recommendations
    const enrolledCourseIds = user.enrollments
      .filter((e) => e.status === EnrollmentStatus.APPROVED)
      .map((e) => e.courseId);

    // Get available courses
    const availableCourses = await this.courseRepository.find({
      where: { status: CourseStatus.ACTIVE },
      relations: ['lecturer'],
    });

    // Filter out already enrolled courses
    const candidateCourses = availableCourses.filter(
      (course) => !enrolledCourseIds.includes(course.id),
    );

    if (this.useMockData) {
      return this.generateMockRecommendations(
        candidateCourses,
        recommendationDto,
      );
    }

    return this.generateAiRecommendations(
      candidateCourses,
      user,
      recommendationDto,
    );
  }

  async generateSyllabus(
    syllabusDto: SyllabusGenerationDto,
  ): Promise<SyllabusContent> {
    if (this.useMockData) {
      return this.generateMockSyllabus(syllabusDto);
    }

    return this.generateAiSyllabus(syllabusDto);
  }

  private async generateAiRecommendations(
    courses: Course[],
    user: User,
    dto: CourseRecommendationDto,
  ): Promise<CourseRecommendation[]> {
    try {
      const enrolledCourses = user.enrollments
        .filter((e) => e.status === EnrollmentStatus.APPROVED)
        .map((e) => e.course.title)
        .join(', ');

      const prompt = `
        Based on the following information, recommend courses for a ${user.role} student:

        User Interests: ${dto.interests.join(', ')}
        Academic Level: ${dto.academicLevel || 'Not specified'}
        Preferred Study Areas: ${dto.preferredAreas?.join(', ') || 'Not specified'}
        Previously Enrolled Courses: ${enrolledCourses || 'None'}

        Available Courses:
        ${courses.map((c) => `- ${c.title}: ${c.description} (Credits: ${c.credits})`).join('\n')}

        Please provide recommendations with scores (0-100) and reasons. Return as JSON array with format:
        [{"courseTitle": "Course Name", "score": 85, "reason": "Explanation"}]
      `;

      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      const recommendations = JSON.parse(aiResponse);

      return recommendations
        .map((rec: any) => {
          const course = courses.find((c) => c.title === rec.courseTitle);
          return course
            ? {
                course,
                score: rec.score,
                reason: rec.reason,
              }
            : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('AI recommendation error:', error);
      return this.generateMockRecommendations(courses, dto);
    }
  }

  private async generateAiSyllabus(
    dto: SyllabusGenerationDto,
  ): Promise<SyllabusContent> {
    try {
      const prompt = `
        Generate a comprehensive syllabus for a ${dto.credits}-credit course on "${dto.topic}".

        Course Details:
        - Level: ${dto.level || 'Undergraduate'}
        - Duration: ${dto.duration || '16 weeks'}
        - Focus Areas: ${dto.focusAreas?.join(', ') || 'General'}
        - Prerequisites: ${dto.prerequisites?.join(', ') || 'None'}

        Please create a detailed syllabus including:
        1. Course description
        2. Learning objectives
        3. Weekly schedule with topics
        4. Assessment structure
        5. Required resources
        6. Course policies

        Return as JSON with the following structure:
        {
          "title": "Course Title",
          "description": "Course description",
          "objectives": ["objective1", "objective2"],
          "weeklySchedule": [{"week": 1, "topic": "Topic", "description": "Description"}],
          "assessments": [{"type": "Exam", "weight": 30, "description": "Final exam"}],
          "resources": ["resource1", "resource2"],
          "policies": ["policy1", "policy2"]
        }
      `;

      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('AI syllabus generation error:', error);
      return this.generateMockSyllabus(dto);
    }
  }

  private generateMockRecommendations(
    courses: Course[],
    dto: CourseRecommendationDto,
  ): CourseRecommendation[] {
    const mockReasons = [
      'Aligns with your interest areas and academic goals',
      'Builds upon your previous coursework experience',
      'Highly rated course with practical applications',
      'Good foundation for advanced topics in your field',
      'Popular among students with similar interests',
    ];

    return courses
      .slice(0, 5)
      .map((course, index) => ({
        course,
        score: Math.floor(Math.random() * 20) + 80, // 80-100 range
        reason: mockReasons[index % mockReasons.length],
      }))
      .sort((a, b) => b.score - a.score);
  }

  private generateMockSyllabus(dto: SyllabusGenerationDto): SyllabusContent {
    return {
      title: `${dto.topic} - ${dto.credits} Credits`,
      description: `This course provides a comprehensive introduction to ${dto.topic}, covering fundamental concepts and practical applications. Students will develop critical thinking skills and hands-on experience through various learning activities.`,
      objectives: [
        `Understand the core principles of ${dto.topic}`,
        'Apply theoretical knowledge to practical scenarios',
        'Develop analytical and problem-solving skills',
        'Communicate effectively about course topics',
        'Demonstrate proficiency in course-related tasks',
      ],
      weeklySchedule: Array.from({ length: 16 }, (_, i) => ({
        week: i + 1,
        topic: `Week ${i + 1}: ${dto.topic} Topic ${i + 1}`,
        description: `Introduction to key concepts and practical applications for week ${i + 1}`,
        readings: [
          `Chapter ${i + 1} from course textbook`,
          'Supplementary articles',
        ],
      })),
      assessments: [
        {
          type: 'Participation',
          weight: 10,
          description: 'Class participation and attendance',
        },
        {
          type: 'Assignments',
          weight: 30,
          description: 'Weekly assignments and projects',
        },
        {
          type: 'Midterm Exam',
          weight: 25,
          description: 'Comprehensive midterm examination',
        },
        {
          type: 'Final Project',
          weight: 35,
          description: 'Capstone project demonstrating course learning',
        },
      ],
      resources: [
        `${dto.topic}: A Comprehensive Guide (Required Textbook)`,
        'Online learning platform access',
        'Supplementary reading materials',
        'Course-specific software tools',
      ],
      policies: [
        'Attendance is mandatory for all class sessions',
        'Late submissions will incur a 10% penalty per day',
        'Academic integrity must be maintained at all times',
        'Students with disabilities should contact the accessibility office',
        'Office hours are available for additional support',
      ],
    };
  }
}
