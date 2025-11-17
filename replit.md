# Attendance Tracker - Student & Teacher Portal

## Overview

This is a full-stack attendance tracking application designed for educational institutions. The system provides separate portals for students and teachers to manage and monitor class attendance. Students can log in/out of their sessions, while teachers can create and manage classes and view attendance records. The application automatically tracks attendance based on student login/logout times and scheduled class periods.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)

**UI Component Library**
- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for styling with custom design tokens
- Material Design principles adapted for educational software
- Inter font family for optimal readability in data-heavy interfaces

**State Management**
- **TanStack Query (React Query)** for server state management, caching, and data synchronization
- Local component state with React hooks for UI-specific state

**Form Handling**
- **React Hook Form** for performant form state management
- **Zod** for runtime schema validation
- **@hookform/resolvers** to integrate Zod with React Hook Form

### Backend Architecture

**Runtime & Framework**
- **Node.js** with TypeScript (ESM modules)
- **Express.js** for HTTP server and REST API endpoints
- Custom Vite middleware integration for development hot-reloading

**API Design**
- RESTful API architecture with resource-based endpoints
- Endpoints for students, classes, login/logout tracking, and attendance records
- JSON request/response format
- Request body validation using Zod schemas from shared directory

**Key API Routes**
- `/api/students` - Student CRUD operations
- `/api/classes` - Class management (create, read, update, delete)
- `/api/attendance/student/:id` - Student-specific attendance records
- `/api/attendance/class/:id` - Class-specific attendance records
- `/api/student/:id/login` - Student login tracking
- `/api/student/:id/logout` - Student logout tracking

### Data Storage

**Database**
- **PostgreSQL** via Neon serverless database
- **Drizzle ORM** for type-safe database queries and schema management
- WebSocket connection support for serverless PostgreSQL (using `ws` library)

**Schema Design**
- `students` table - Student profiles (id, name, email, role)
- `classes` table - Class schedules (id, name, start_time, end_time, days array)
- `login_logout` table - Student session tracking (id, student_id, login_time, logout_time)
- `attendance` table - Attendance records with foreign keys to students, classes, and login sessions
- Cascade delete relationships to maintain referential integrity

**Migration Strategy**
- Drizzle Kit for schema migrations
- Migrations stored in `/migrations` directory
- Push-based deployment with `npm run db:push`

### External Dependencies

**Database Service**
- **Neon Database** - Serverless PostgreSQL hosting
- Requires `DATABASE_URL` environment variable
- Connection pooling via `@neondatabase/serverless`

**UI Component Libraries**
- **Radix UI** - Headless component primitives for accessibility
- **Lucide React** - Icon library
- **cmdk** - Command palette component
- **embla-carousel-react** - Carousel functionality
- **date-fns** - Date manipulation and formatting
- **vaul** - Drawer component primitive

**Development Tools**
- **Replit-specific plugins** for Vite (cartographer, dev banner, runtime error modal)
- **esbuild** for production server bundling
- **tsx** for TypeScript execution in development

**Styling & Theming**
- Custom CSS variables for theme colors (light mode defined in index.css)
- Tailwind with custom border radius, spacing, and color tokens
- shadcn/ui "new-york" style variant
- Class variance authority (CVA) for component variant management

### Code Organization

**Monorepo Structure**
- `/client` - React frontend application
- `/server` - Express backend application
- `/shared` - Shared TypeScript schemas and types (Drizzle schemas, Zod validators)
- Path aliases configured: `@/` for client src, `@shared/` for shared code, `@assets/` for static assets

**Type Safety**
- Shared Zod schemas between frontend and backend for validation consistency
- Drizzle-Zod integration generates TypeScript types from database schema
- TypeScript strict mode enabled across the entire codebase