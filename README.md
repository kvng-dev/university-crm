University CRM System
A comprehensive University Course and Student Management System built with modern web technologies, featuring role-based access control, AI integrations, and real-time notifications.

🚀 Features
Core Functionality
Authentication & Authorization: JWT-based auth with role-based access control
Course Management: Create, update, and manage university courses
Enrollment System: Student enrollment with admin approval workflow
Assignment Management: Submit, grade, and track assignments
AI Assistant: Course recommendations and syllabus generation
Real-time Notifications: WebSocket-powered instant notifications
File Management: Upload and manage course materials and assignments
User Roles
Students: Browse courses, enroll, submit assignments, get AI recommendations
Lecturers: Create courses, manage enrollments, grade assignments, generate syllabi
Admins: Full system access, user management, enrollment approvals
Advanced Features
Real-time Updates: WebSocket notifications for grades, enrollments, and announcements
AI Integration: OpenAI-powered course recommendations and syllabus generation
File Upload: Support for PDF, DOCX, images with text extraction
Responsive Design: Mobile-friendly interface with modern UI
API Documentation: Complete Swagger/OpenAPI documentation
🛠 Tech Stack
Backend
Framework: NestJS (Node.js)
Database: PostgreSQL with TypeORM
Authentication: JWT with refresh tokens
Real-time: WebSockets (Socket.io)
AI Integration: OpenAI API
File Storage: Local file system with Multer
Caching: Redis for sessions and caching
API Docs: Swagger/OpenAPI
Frontend
Framework: React.js with TypeScript
Build Tool: Vite
Styling: Tailwind CSS
State Management: Zustand + React Query
Routing: React Router v6
UI Components: Headless UI + Heroicons
Real-time: Socket.io Client
Forms: React Hook Form
DevOps
Containerization: Docker & Docker Compose
Database: PostgreSQL 15
Reverse Proxy: Nginx (production)
Environment: Environment-based configuration
📋 Prerequisites
Node.js 18+ and npm
Docker and Docker Compose
PostgreSQL 15+ (if running locally)
Redis (optional, for caching)
OpenAI API key (optional, will use mock data without it)
🚀 Quick Start
Using Docker (Recommended)
Clone the repository
bash
git clone <repository-url>
cd university-crm
Set up environment variables
bash
cp .env.example .env

# Edit .env with your configuration

Start all services
bash
docker-compose up -d
Access the application
Frontend: http://localhost:3000
Backend API: http://localhost:3001
API Documentation: http://localhost:3001/api/docs
Local Development Setup
Backend Setup
bash
cd backend
npm install

# Set up database

createdb university_crm

# Start development server

npm run start:dev
Frontend Setup
bash
cd frontend
npm install

# Start development server

npm run dev
🔐 Sample Credentials
The system includes default users for testing:

Admin User
Email: admin@university.edu
Password: Admin123!
Role: Administrator
Lecturer User
Email: prof.smith@university.edu
Password: Lecturer123!
Role: Lecturer
Student User
Email: john.doe@student.university.edu
Password: Student123!
Role: Student
📚 API Documentation
The API is fully documented with Swagger/OpenAPI. Access the interactive documentation at:

Development: http://localhost:3001/api/docs
Production: https://your-domain.com/api/docs
Core Endpoints
Authentication
POST /api/v1/auth/register - Register new user
POST /api/v1/auth/login - User login
POST /api/v1/auth/refresh - Refresh access token
GET /api/v1/auth/profile - Get user profile
Courses
GET /api/v1/courses - List all courses
POST /api/v1/courses - Create course (lecturers)
GET /api/v1/courses/:id - Get course details
POST /api/v1/courses/:id/enroll - Enroll in course (students)
AI Assistant
POST /api/v1/ai/recommend - Get course recommendations
POST /api/v1/ai/syllabus - Generate course syllabus
Notifications
GET /api/v1/notifications - Get user notifications
PATCH /api/v1/notifications/:id/read - Mark as read
WebSocket /notifications - Real-time notifications
🤖 AI Integration
OpenAI Setup
Get an API key from OpenAI
Add to your .env file:
bash
OPENAI_API_KEY=your-openai-api-key-here
Mock Mode
If no OpenAI key is provided, the system automatically uses mock data:

Course recommendations based on simple algorithms
Pre-generated syllabus templates
All AI features remain functional for development
AI Features
Course Recommendations: Personalized suggestions based on student interests and history
Syllabus Generation: Automated creation of comprehensive course syllabi
Smart Content: Context-aware recommendations and academic guidance
🌐 Real-time Features
WebSocket Notifications
The system uses WebSocket connections for real-time updates:

javascript
// Connect to notifications
const socket = io('/notifications', {
auth: { token: accessToken }
});

// Listen for real-time events
socket.on('new_notification', (data) => {
// Handle new notification
});

socket.on('grade_update', (data) => {
// Handle grade update
});
Real-time Events
New notifications and announcements
Enrollment status updates
Assignment grade notifications
Course updates and changes
System maintenance alerts
🏗 System Architecture
Database Schema
sql
-- Core entities
Users (id, email, password, firstName, lastName, role)
Courses (id, title, description, credits, lecturerId, status)
Enrollments (id, courseId, studentId, status, enrolledAt)
Assignments (id, courseId, studentId, grade, submittedAt)
Notifications (id, userId, type, title, message, read)
Application Layers
Presentation: React.js frontend with responsive design
API Gateway: NestJS with authentication and rate limiting
Business Logic: Service layer with domain logic
Data Access: TypeORM with PostgreSQL
External Services: OpenAI API integration
🚀 Deployment
Production Docker Setup
Update environment for production
bash
NODE_ENV=production
DB_SSL=true
FRONTEND_URL=https://your-domain.com
JWT_SECRET=your-production-secret-key-min-32-chars
Deploy with Docker Compose
bash
docker-compose --profile production up -d
Set up SSL (with Let's Encrypt)
bash

# Add SSL certificates to ./ssl directory

# Update nginx.conf for HTTPS

Cloud Deployment Options
Backend (API)
Recommended: Railway, Render, or DigitalOcean Apps
Alternative: AWS ECS, Google Cloud Run, Azure Container Instances
Frontend
Recommended: Vercel, Netlify
Alternative: AWS S3 + CloudFront, Azure Static Web Apps
Database
Recommended: Neon, Supabase, or PlanetScale
Alternative: AWS RDS, Google Cloud SQL, Azure Database
Environment Variables for Production
bash

# Database

DB_HOST=your-production-db-host
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-db-password
DB_NAME=university_crm
DB_SSL=true

# Security

JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-minimum-32-characters

# External Services

OPENAI_API_KEY=your-openai-production-key
REDIS_URL=redis://your-redis-host:6379

# Application

FRONTEND_URL=https://your-frontend-domain.com
REACT_APP_API_URL=https://your-api-domain.com/api/v1
🧪 Testing
Backend Testing
bash
cd backend
npm run test # Unit tests
npm run test:e2e # Integration tests
npm run test:cov # Coverage report
Frontend Testing
bash
cd frontend
npm run test # Jest tests
npm run test:coverage # Coverage report
API Testing
Use the provided Postman collection or test via Swagger UI:

Import postman_collection.json
Set environment variables
Run automated test suite
🔧 Development
Code Style
Backend: ESLint + Prettier (NestJS style guide)
Frontend: ESLint + Prettier (React best practices)
Database: Conventional SQL naming
Git Workflow
Create feature branch: git checkout -b feature/amazing-feature
Commit changes: git commit -m 'Add amazing feature'
Push branch: git push origin feature/amazing-feature
Create Pull Request
Adding New Features
Backend (NestJS)
Generate module: nest generate module feature-name
Create service, controller, and DTOs
Add to main app module
Write tests
Frontend (React)
Create component in src/components/
Add route in App.tsx
Create API service in src/services/
Add to navigation if needed
📊 Performance Optimization
Backend Optimizations
Database indexing on frequently queried fields
Query optimization with eager loading
API response caching with Redis
Rate limiting to prevent abuse
File upload size limits and validation
Frontend Optimizations
Code splitting with React.lazy()
Image optimization and compression
API response caching with React Query
Virtualization for large lists
Bundle analysis and optimization
🔒 Security Features
Authentication & Authorization
JWT with short expiration times
Refresh token rotation
Role-based access control (RBAC)
Password hashing with bcrypt
Rate limiting on sensitive endpoints
Data Protection
Input validation and sanitization
SQL injection prevention
XSS protection
CORS configuration
File upload security
Infrastructure Security
Environment-based secrets
Docker security best practices
Database connection encryption
HTTPS enforcement in production
🆘 Troubleshooting
Common Issues
Docker Issues
bash

# Clear Docker cache

docker system prune -a

# Restart services

docker-compose down && docker-compose up -d

# Check logs

docker-compose logs backend
docker-compose logs frontend
Database Connection Issues
bash

# Check PostgreSQL is running

docker-compose ps postgres

# Connect to database directly

docker-compose exec postgres psql -U postgres -d university_crm
File Upload Issues
bash

# Check upload directory permissions

ls -la uploads/
sudo chown -R node:node uploads/
Support
Create an issue on GitHub
Check existing issues and discussions
Review system logs for error details
🤝 Contributing
Fork the repository
Create a feature branch
Make your changes
Add tests for new functionality
Ensure all tests pass
Create a pull request
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
NestJS team for the excellent framework
React team for the powerful frontend library
OpenAI for AI integration capabilities
All contributors and testers
Built with ❤️ for modern university management
