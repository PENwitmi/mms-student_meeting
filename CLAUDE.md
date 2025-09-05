# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
MMS Student Meeting System - A React/TypeScript/Firebase application for managing weekly student counseling sessions. Currently implementing MVP with admin and student roles only.

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
│   ├── AuthContext.tsx # Authentication state management
│   ├── DataContext.tsx # Centralized data management (to be implemented)
│   └── hooks/         
│       ├── realtime/   # onSnapshot hooks
│       └── query/      # getDocs hooks
├── features/           # Business logic - NO Firebase imports allowed
├── lib/firebase/       # Firebase configuration only
├── pages/              # Route components
└── shared/             # Shared types, utils, components
```

### Path Aliases (configured in vite.config.ts)
- `@/` → `src/`
- `@contexts/` → `src/contexts/`
- `@features/` → `src/features/`
- `@shared/` → `src/shared/`
- `@lib/` → `src/lib/`
- `@pages/` → `src/pages/`

## Current Implementation Status

### Completed
- Firebase Authentication with role-based access (admin/student)
- AuthContext with user profile integration
- Login/logout functionality
- Basic routing with protected routes

### Test Users
```
Admin: admin@test.com / admin123
Student: student@test.com / student123
```

### Pending Implementation
- DataContext for interview record management
- Interview CRUD operations
- Admin dashboard features
- Student read-only views

## Data Models

### Core Types
```typescript
type UserRole = 'admin' | 'student';

interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InterviewRecord {
  id: string;
  studentId: string;
  date: Date;
  topics: string[];
  notes: string;
  followUp?: string;
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

## Key Implementation Files
- `src/contexts/AuthContext.tsx` - Authentication management
- `src/lib/firebase/config.ts` - Firebase initialization
- `src/pages/Login.tsx` - Login interface
- `src/pages/Dashboard.tsx` - User dashboard with logout
- `scripts/setupUsers.js` - User profile initialization script

## Important Notes
1. Always check user role before displaying features
2. Use `useAuth()` hook for authentication state
3. Use `useRequireAuth(role)` for role-based access control
4. Development logger available via `dev.log()`, `dev.warn()`, `dev.error()`
5. All timestamps should use `serverTimestamp()` for consistency