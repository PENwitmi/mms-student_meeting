# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
MMS Student Meeting System - A React/TypeScript/Firebase application for managing weekly student counseling sessions. MVP implementation with admin and student roles. Features simplified interview recording with only 2 required fields (student/date) and 5 optional content sections for comprehensive educational tracking.

## Current Status (2025-09-05 - Latest)

### Production (main branch - GitHub Pages)
- ✅ Core CRUD functionality complete
- ✅ Context API fully compliant with MMS Finance pattern
- ✅ Student self-registration implemented  
- ✅ User profile editing (name, email, password)
- ✅ All Firebase operations centralized in contexts
- ✅ Interview content redesign (5 optional fields)
- 🌐 **Deployed at**: GitHub Pages (public)

### Development (develop branch - NOT merged)
- ✅ File storage feature (PDF/images upload, list, delete) - MVP implementation
- ✅ Firebase Storage integration (Blaze plan required)
- ✅ Context API strict pattern enhancement
- ✅ Firebase Storage instantiation in DataContext only
- ⚠️ **Status**: Ready to merge but held for review

## Essential Commands

```bash
npm run dev          # Start development server (http://localhost:5175)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run setup:users  # Initialize Firebase test users (after creating in Firebase Console)
```

## Architecture Rules (CRITICAL - Based on MMS Finance Pattern)

### Firebase Access Pattern (Strict Compliance)
1. **Firebase operations ONLY in `src/contexts/` directory**
2. **Firebase instances ONLY created in DataContext (not in lib/)**
3. **`src/features/` components MUST NOT import Firebase directly**
4. **All data access through Context API hooks only**
5. **Realtime updates (onSnapshot) separate from one-time queries (getDocs)**
6. **Pure utility functions in `shared/utils/` (Firebase-independent)**

### Directory Structure & Responsibilities
```
src/
├── contexts/           # Firebase layer - ONLY place for Firebase operations
│   ├── AuthContext.tsx # Authentication + user management (extended 2025-09-05)
│   ├── DataContext.tsx # Centralized data management + Storage management
│   └── hooks/         
│       ├── realtime/   # onSnapshot hooks
│       │   ├── useInterviews.ts
│       │   ├── useStudents.ts
│       │   └── useFiles.ts      # File storage realtime hook
│       └── query/      # getDocs hooks (future)
├── features/           # Business logic - NO Firebase imports allowed
│   ├── interviews/     # Interview management
│   ├── profile/        # Profile editing components
│   └── files/          # File storage UI components
│       ├── FileUpload.tsx
│       ├── FileList.tsx
│       └── StudentFileSection.tsx
├── lib/firebase/       # Firebase configuration only (no Storage instance)
├── pages/              # Route components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── Register.tsx   # Student self-registration
└── shared/             # Shared types, utils, components
    └── utils/
        └── fileUtils.ts # Pure utility functions (Firebase-independent)
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
- ✅ Firebase Storage integration (Blaze plan - Osaka region)
- ✅ Admin-only file upload (PDF, images including HEIC)
- ✅ File list display by student
- ✅ Delete functionality (admin only)
- ✅ Simple preview (opens in new tab)
- ✅ Max file size: 10MB
- ✅ Storage path: `students/{studentId}/files`
- 🔄 Firestore composite index needed: files (studentId + createdAt)
- Documentation: `docs/07_file_storage_feature/`

### Test Users
```
Admin: admin@test.com / admin123
Student: student@test.com / student123
```

### Feature Availability by Branch
| Feature | main (Production) | develop |
|---------|------------------|---------|
| Interview CRUD | ✅ | ✅ |
| Student Registration | ✅ | ✅ |
| Profile Edit | ✅ | ✅ |
| **File Storage** | ❌ | ✅ |
| **Firebase Storage** | ❌ | ✅ |
| **Blaze Plan Required** | ❌ | ✅ |

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

interface FileRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  studentId: string;
  studentName: string;
  uploadedBy: string;          // User ID of uploader
  uploadedByName: string;      // Display name of uploader
  createdAt: Date;
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

## Firebase Configuration
### Plan & Region
- **Plan**: Blaze (Pay-as-you-go with free tier)
- **Region**: asia-northeast2 (Osaka)
- **Storage Bucket**: mms-student-meeting.appspot.com

### Security Rules Status
- **Firestore**: Admin can read/write all, students read own data only
- **Storage**: Test mode (expires in 30 days from 2025-09-05)
- **Authentication**: Required for all operations

### Pending Tasks
- 🔄 Create Firestore composite index: files (studentId + createdAt)
- 🔄 Configure production Storage security rules
- 🔄 Set up budget alerts for Blaze plan

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
4. Use `useData()` or selective hooks (`useInterviewsData()`, `useStudentsData()`, `useFilesData()`) for data access
5. Development logger available via `dev.log()`, `dev.warn()`, `dev.error()`
6. All timestamps should use `serverTimestamp()` for consistency
7. **Never import Firebase functions directly in features/ or pages/ layer**
8. **Never import from lib/firebase/storage (doesn't exist - use DataContext)**
9. **Interview records use simplified model** - only student & date required
10. **Profile changes update immediately** via updateUserProfile()
11. **All Firebase operations must go through AuthContext or DataContext**
12. **Firebase Storage instance created ONLY in DataContext**
13. **Pure utility functions in shared/utils must be Firebase-independent**

## Recent Changes & Branch Status

### main branch (Production - GitHub Pages)
- 2025-09-05 AM: Context API compliance refactoring
- 2025-09-05 AM: Student registration & profile management
- 2025-09-05 AM: Interview content redesign (5 optional fields)
- Last merge: 2025-09-05 morning (commit: f027515)

### develop branch (Development - NOT in production)
- 2025-09-05 PM: File storage feature implementation
- 2025-09-05 PM: Firebase Blaze plan migration
- 2025-09-05 PM: Storage bucket configuration (Osaka region)
- 2025-09-05 PM: Context API strict pattern (Storage in DataContext)
- **23 files changed, 1917 lines added**
- **Status**: Awaiting merge decision

### Documentation
- `/docs/05/`: Context API refactoring (in main)
- `/docs/04_interview_content_redesign/`: Interview redesign (in main)
- `/docs/03_student_account_management/`: Student features (in main)
- `/docs/07_file_storage_feature/`: File storage docs (in develop only)