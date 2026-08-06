# DriveMate Driving School Management System

A comprehensive full-stack web application for managing driving school operations, including student bookings, instructor schedules, progress tracking, payments, and communications. **100% Local Hosting - No Cloud Dependencies - Completely Free.**

## 🚗 Features

### High Priority (Essential Features)
1. **User Management & Roles** - Authentication system with distinct permissions and dashboards for STUDENT, INSTRUCTOR, and ADMIN roles
2. **Booking & Scheduling** - Interactive slot viewer for students to book, view available times, reschedule, or cancel lessons
3. **Instructor Availability** - Management panel for instructors to set, toggle, and update available time slots
4. **Prevention of Double Booking** - Server-side validation logic in Express preventing booking transactions on already claimed slots

### Medium Priority (Important Features)
5. **Payment Management** - Payment tracking module for students (packages/lessons) and a financial overview table for Admins
6. **Lesson Progress & History** - Instructor progress tracker (rating, miles, lesson notes) and student lesson history view
7. **Notifications & Reminders** - Interactive notification drawer displaying booking confirmations and automated upcoming lesson reminders

### Low Priority (Additional Features)
8. **In-App Communication** - Simple direct messaging UI thread between students and assigned instructors
9. **Reporting & Analytics** - Admin dashboard visual cards (total bookings, revenue metrics, instructor performance)
10. **Advanced Feedback System** - Detailed feedback modal for instructors to post structured evaluation scores to student profiles

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Prisma ORM** with SQLite (local file database - completely free)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **Recharts** for analytics visualization

**Database: SQLite** - A powerful, zero-configuration, serverless SQL database engine. Perfect for local hosting with no external dependencies.

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## 🚀 Installation

### 1. Install Dependencies
```bash
npm run setup
```
This installs dependencies for root, backend, and frontend in one command.

### 2. Initialize Database
```bash
npm run db:push
```
This creates the SQLite database with all required tables.

### 3. Seed Sample Data
```bash
npm run db:seed
```
This populates the database with demo accounts and sample data for testing.

### 4. Start the Application
```bash
npm run dev
```
This starts both backend (port 5000) and frontend (port 3000) concurrently.

## 📱 Demo Credentials

The database seed includes the following demo accounts:

### Admin
- **Email**: lesego@drivemate.co.za
- **Password**: Admin@123
- **Role**: Technical Lead with full system access

### Instructors
- **Email**: sipho.khumalo@drivemate.co.za
- **Password**: Instructor@123
- **Role**: Senior Instructor

- **Email**: thabo.mokoena@drivemate.co.za
- **Password**: Instructor@123
- **Role**: Road Safety Specialist

- **Email**: naledi.ngobeni@drivemate.co.za
- **Password**: Instructor@123
- **Role**: Code 10 Specialist

### Students
- **Email**: thando.zungu@example.co.za
- **Password**: Student@123
- **Role**: Student

- **Email**: lerato.ndlovu@example.co.za
- **Password**: Student@123
- **Role**: Student

## 🎨 Design Theme

The application uses a professional dark theme with:
- **Background**: Deep navy (`#0f172a`)
- **Accent**: DriveMate dark emerald green (`#1D6A4A`)
- **Card borders**: Slate (`#1E293B`)
- **Highlight pills**: Neon emerald (`#10b981`)

## 💾 Database

**SQLite is used for all data storage:**
- **File Location**: `backend/dev.db`
- **Zero Configuration**: Database is created automatically on first run
- **Completely Free**: No licensing costs
- **Fully Portable**: Entire database is one file - can be copied anywhere
- **Perfect for Local Hosting**: No external database server needed
- **No Dependencies**: No need to install PostgreSQL, MySQL, or other databases

The database includes all tables for users, bookings, payments, messages, feedback, quiz attempts, and notifications.

## 📁 Project Structure

```
Drivemate2/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Database seed script
│   ├── server.js            # Express API server (Node.js)
│   ├── dev.db               # SQLite database (auto-created)
│   ├── package.json
│   └── .env                 # Environment variables (auto-created)
├── frontend/
│   ├── src/                 # React source code
│   ├── package.json
│   └── tailwind.config.js
├── package.json             # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### User Management (Admin)
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:userId` - Update user role
- `DELETE /api/admin/users/:userId` - Delete user

### Availability Slots
- `POST /api/slots` - Create availability slot (Instructor)
- `GET /api/slots/available` - Get available slots
- `GET /api/slots/my-schedule` - Get instructor's schedule
- `DELETE /api/slots/:slotId` - Delete slot

### Bookings
- `POST /api/bookings/:slotId` - Book a lesson
- `GET /api/bookings/my-lessons` - Get student's bookings
- `POST /api/bookings/:bookingId/cancel` - Cancel booking

### Progress
- `GET /api/progress/:studentId` - Get student progress
- `PATCH /api/progress/:studentId` - Update progress (Instructor)
- `GET /api/lessons/history` - Get lesson history

### Payments
- `GET /api/payments/packages` - Get payment packages
- `POST /api/payments` - Create payment
- `GET /api/payments/my` - Get student's payments
- `PATCH /api/payments/:paymentId` - Update payment status
- `GET /api/admin/payments` - Get admin payment overview

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:notificationId` - Mark as read

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:peerId` - Get messages with user
- `GET /api/messages-threads` - Get message threads

### Feedback
- `POST /api/feedback` - Submit feedback (Instructor)
- `GET /api/feedback/:studentId` - Get student feedback

### Quiz
- `GET /api/quiz/questions` - Get K53 quiz questions
- `POST /api/quiz/attempt` - Submit quiz attempt
- `GET /api/quiz/attempts` - Get user's quiz attempts

### Analytics (Admin)
- `GET /api/admin/analytics` - Get dashboard analytics

## 🧪 Testing

The application includes demo credentials and seeded data for testing all features. Use the role switcher (available when logged in as Admin) to quickly switch between Student, Instructor, and Admin views.

## 📝 Database Schema

The application uses the following main models:
- **User** - Accounts with roles (STUDENT, INSTRUCTOR, ADMIN)
- **StudentProgress** - Tracks student learning progress
- **AvailabilitySlot** - Instructor availability time slots
- **Booking** - Lesson bookings with status tracking
- **Payment** - Payment records and package tracking
- **Message** - In-app communication
- **Feedback** - Instructor evaluations
- **QuizAttempt** - K53 learner's licence quiz results
- **Notification** - System notifications

## 🤝 Contributing

This is a CPUT Project III submission for the Faculty of Informatics & Design.

## 👥 Team

**Technical Lead**: Lesego Lebese

## 📄 License

© 2026 DriveMate Driving School Management System. Faculty of Informatics & Design — CPUT Project III
