# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
MMS Student Meeting System - A React/TypeScript/Firebase application for managing weekly student counseling sessions. MVP implementation with admin and student roles. Features simplified interview recording with only 2 required fields (student/date) and 5 optional content sections for comprehensive educational tracking.

## Current Status (2025-09-05)
- ✅ Core CRUD functionality complete
- ✅ Context API fully compliant with MMS Finance pattern
- ✅ Student self-registration implemented  
- ✅ User profile editing (name, email, password)
- ✅ All Firebase operations centralized in contexts
- ✅ File storage feature (PDF/images upload, list, delete) - MVP implementation

## Essential Commands

```bash
npm run dev          # Start development server (http://localhost:5175)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run setup:users  # Initialize Firebase test users (after creating in Firebase Console)
```

## Architecture Rules (CRITICAL - Based on MMS Finance Pattern)

### Firebase Access Pattern
1. **Firebase operations ONLY in `src/contexts/` directory**
2. **`src/features/` components MUST NOT import Firebase directly**
3. **All data access through Context API hooks only**
4. **Realtime updates (onSnapshot) separate from one-time queries (getDocs)**

### Directory Structure & Responsibilities
```
src/
├── contexts/           # Firebase layer - ONLY place for Firebase operations
│   ├── AuthContext.tsx # Authentication + user management (extended 2025-09-05)
│   ├── DataContext.tsx # Centralized data management
│   └── hooks/         
│       ├── realtime/   # onSnapshot hooks
│       │   ├── useInterviews.ts
│       │   └── useStudents.ts
│       └── query/      # getDocs hooks (future)
├── features/           # Business logic - NO Firebase imports allowed
│   ├── interviews/     # Interview management
│   └── profile/        # Profile editing components
├── lib/firebase/       # Firebase configuration only
├── pages/              # Route components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── Register.tsx   # Student self-registration
└── shared/             # Shared types, utils, components
```

### Path Aliases (configured in vite.config.ts)
- `@/` → `src/`
- `@contexts/` → `src/contexts/`
- `@features/` → `src/features/`
- `@shared/` → `src/shared/`
- `@lib/` → `src/lib/`
- `@pages/` → `src/pages/`

## Completed Features

### Core Functionality
- Firebase Authentication with role-based access (admin/student)
- AuthContext with user profile integration (extended 2025-09-05)
- DataContext for centralized data management
- Interview CRUD operations (Create/Read/Update/Delete)
- Admin dashboard with full interview management
- Student dashboard with read-only view of own records
- Real-time data synchronization using onSnapshot
- Login/logout functionality
- Protected routes with role-based access control

### User Management (2025-09-05)
- Student self-registration (Register.tsx)
- Profile name editing (NameEditSection.tsx)
- Email change with reauthentication (EmailChangeSection.tsx)
- Password change with security verification (PasswordChangeSection.tsx)
- Real-time profile updates without page reload

### ✅ Recently Completed Features

#### Interview Content Redesign (2025-09-05)
Successfully redesigned interview records for better educational alignment:
- ✅ Required fields reduced from 4 to 2 (student & date only)
- ✅ Topics tags and follow-up fields removed (deprecated but maintained for backward compatibility)
- ✅ 5 new optional content sections implemented:
  - Weekly Good Points (成長点・良かった点)
  - Weekly More Points (改善点・課題)
  - Lesson Plan (授業計画)
  - Homework Plan (家庭学習計画)
  - Other Notes (その他の話し合い内容)
- Documentation: `docs/04_interview_content_redesign/`

#### File Storage Feature - MVP (2025-09-05)
Implemented basic file management system:
- ✅ Firebase Storage integration
- ✅ Admin-only file upload (PDF, images including HEIC)
- ✅ File list display by student
- ✅ Delete functionality (admin only)
- ✅ Simple preview (opens in new tab)
- Documentation: `docs/07_file_storage_feature/`

### Test Users
```
Admin: admin@test.com / admin123
Student: student@test.com / student123
```

## Data Models

### Core Types
```typescript
type UserRole = 'admin' | 'student';

interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  studentId?: string;  // For student users
  grade?: number;      // For student users
  class?: string;      // For student users
  createdAt: Date;
  updatedAt: Date;
}

interface InterviewRecord {
  id: string;
  studentId: string;           // Required
  studentName: string;
  date: Date;                  // Required
  
  // Weekly Review (all optional)
  weeklyGoodPoints?: string;   // 良かった点・成長点
  weeklyMorePoints?: string;   // 改善点・課題点
  
  // Future Plans (all optional)
  lessonPlan?: string;         // 授業計画
  homeworkPlan?: string;       // 家庭学習計画
  
  // Other (optional)
  otherNotes?: string;         // その他の話し合い内容
  
  // Deprecated fields (backward compatibility)
  topics?: string[];           // @deprecated - removed from UI
  notes?: string;              // @deprecated - use otherNotes
  followUp?: string;           // @deprecated - removed from UI
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Development Principles

### YAGNI (You Aren't Gonna Need It)
- MVP focuses on admin and student roles only
- No teacher/parent accounts in MVP
- No grade management or daily reports in MVP
- Implement only what's currently needed

### Context API Pattern (from MMS Finance)
- Single DataContext provides all data to components
- Components use selective hooks (useInterviewsData, useStudentsData)
- 92% reduction in Firebase reads achieved in MMS Finance

## Firebase Security Rules
- Admin users can read/write all data
- Students can only read their own interview records
- Authentication required for all operations

## Environment Variables
All Firebase configuration in `.env.local`:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## AuthContext Methods (Extended 2025-09-05)

The AuthContext now provides these methods for centralized Firebase operations:

```typescript
interface AuthContextType {
  // Original methods
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // New methods (2025-09-05)
  updateUserName: (name: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  registerStudent: (data: RegisterData) => Promise<void>;
}
```

## Important Notes
1. Always check user role before displaying features
2. Use `useAuth()` hook for authentication state
3. Use `useRequireAuth(role)` for role-based access control
4. Use `useData()` or selective hooks (`useInterviewsData()`, `useStudentsData()`) for data access
5. Development logger available via `dev.log()`, `dev.warn()`, `dev.error()`
6. All timestamps should use `serverTimestamp()` for consistency
7. **Never import Firebase functions directly in features/ or pages/ layer**
8. **Interview records use simplified model** - only student & date required
9. **Profile changes update immediately** via updateUserProfile()
10. **All Firebase operations must go through AuthContext or DataContext**

## Recent Changes (2025-09-05)

### Context API Compliance Refactoring
- Removed all Firebase imports from features/ and pages/ directories
- Added 4 new methods to AuthContext for user management
- Deleted TestFirebase.tsx (Context API violation)
- Refactored 5 components to use Context hooks exclusively

### Documentation
- `/docs/05/`: Context API refactoring and compliance reports
- `/docs/04_interview_content_redesign/`: Interview field redesign
- `/docs/03_student_account_management/`: Student account features