# SmartAttendance System Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Database Architecture](#database-architecture)
6. [API Architecture](#api-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Security Architecture](#security-architecture)

## System Overview

SmartAttendance is a full-stack attendance tracking system consisting of four main layers:

1. **Hardware Layer** - ESP32 with RFID reader
2. **Bridge Layer** - Python script for serial-to-database communication
3. **Backend Layer** - Node.js/Express API with PostgreSQL database
4. **Frontend Layer** - React web application

## Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         HARDWARE LAYER                           │
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │  RFID Cards  │────────▶│   MFRC522    │                      │
│  │   (Students) │         │ RFID Reader  │                      │
│  └──────────────┘         └──────┬───────┘                      │
│                                   │ SPI                          │
│                            ┌──────▼───────┐                      │
│                            │    ESP32     │                      │
│                            │ Microcontroller                     │
│                            └──────┬───────┘                      │
└────────────────────────────────────┼──────────────────────────────┘
                                     │ USB Serial (115200 baud)
                                     │
┌────────────────────────────────────▼──────────────────────────────┐
│                         BRIDGE LAYER                              │
│                                                                    │
│                    ┌──────────────────────┐                       │
│                    │  rfid_scanner.py     │                       │
│                    │  (Python Script)     │                       │
│                    │                      │                       │
│                    │  - Serial Reader     │                       │
│                    │  - DB Connector      │                       │
│                    │  - Logic Handler     │                       │
│                    └──────┬──────┬────────┘                       │
└────────────────────────────┼──────┼─────────────────────────────┘
                             │      │
                    ┌────────▼──────▼────────┐
                    │   PostgreSQL Database  │
                    │   (Neon/Local)         │
                    └────────┬───────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                         BACKEND LAYER                              │
│                                                                    │
│                    ┌──────────────────────┐                       │
│                    │   Express Server     │                       │
│                    │   (Node.js + TypeScript)                     │
│                    │                      │                       │
│                    │  ┌────────────────┐ │                       │
│                    │  │   Routes       │ │                       │
│                    │  │  /api/students │ │                       │
│                    │  │  /api/classes  │ │                       │
│                    │  │  /api/attendance│                        │
│                    │  │  /api/activity │ │                       │
│                    │  └────────┬───────┘ │                       │
│                    │           │         │                       │
│                    │  ┌────────▼───────┐ │                       │
│                    │  │   Storage      │ │                       │
│                    │  │  (Drizzle ORM) │ │                       │
│                    │  └────────┬───────┘ │                       │
│                    │           │         │                       │
│                    │  ┌────────▼───────┐ │                       │
│                    │  │   Database     │ │                       │
│                    │  │   Connection   │ │                       │
│                    │  └────────────────┘ │                       │
│                    └──────┬───────────────┘                       │
└────────────────────────────┼─────────────────────────────────────┘
                             │ REST API (JSON)
                             │ HTTP/HTTPS
┌────────────────────────────▼─────────────────────────────────────┐
│                        FRONTEND LAYER                             │
│                                                                   │
│                    ┌──────────────────────┐                      │
│                    │   React Application  │                      │
│                    │   (TypeScript + Vite)│                      │
│                    │                      │                      │
│                    │  ┌────────────────┐ │                      │
│                    │  │ Role Selection │ │                      │
│                    │  └────┬───────┬───┘ │                      │
│                    │       │       │     │                      │
│                    │  ┌────▼───┐ ┌─▼────┐│                      │
│                    │  │Student│ │Teacher││                      │
│                    │  │Portal │ │Portal ││                      │
│                    │  └───────┘ └───────┘│                      │
│                    │                      │                      │
│                    │  - TanStack Query    │                      │
│                    │  - Wouter (routing)  │                      │
│                    │  - shadcn/ui         │                      │
│                    │  - Tailwind CSS      │                      │
│                    └──────────────────────┘                      │
│                                                                   │
│                    ┌──────────────────────┐                      │
│                    │   Web Browser        │                      │
│                    │   (Student/Teacher)  │                      │
│                    └──────────────────────┘                      │
└───────────────────────────────────────────────────────────────────┘
```

## Component Details

### Hardware Layer

#### RFID Cards
- **Type:** ISO/IEC 14443 Type A (MIFARE)
- **Function:** Each card has a unique UID
- **Assignment:** One card per student
- **Storage:** UID stored in `students.rfid_uid` column

#### MFRC522 RFID Reader
- **Communication:** SPI protocol
- **Frequency:** 13.56 MHz
- **Range:** 0-60mm
- **Function:** Reads card UIDs and sends to ESP32

#### ESP32 Microcontroller
- **Role:** Interface between RFID reader and computer
- **Communication:** 
  - Input: SPI from MFRC522
  - Output: Serial USB to computer (115200 baud)
- **Software:** Arduino sketch (`sketch.ino`)
- **Output Format:** Hex string (e.g., "4A 2B 81 3D")

### Bridge Layer

#### rfid_scanner.py (Python Script)

**Purpose:** Connects hardware to database

**Responsibilities:**
1. **Serial Communication**
   - Opens serial port (e.g., COM7, /dev/ttyUSB0)
   - Reads RFID UIDs from ESP32
   - Filters out boot messages and noise

2. **Database Operations**
   - Connects to PostgreSQL using `psycopg2`
   - Looks up students by RFID UID
   - Creates login/logout records
   - Calculates attendance

3. **Business Logic**
   - Determines if student is logging in or out
   - Checks for active sessions
   - Matches login/logout times with class schedules
   - Creates attendance records automatically

**Technology Stack:**
- Python 3
- Libraries: `pyserial`, `psycopg2`, `python-dotenv`

### Backend Layer

#### Express Server (server/index.ts)

**Purpose:** RESTful API server

**Key Files:**
- `server/index.ts` - Server entry point
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Database operations (data access layer)
- `server/db.ts` - Database connection setup
- `server/vite.ts` - Vite integration for development

**Middleware:**
- Body parsing (Express built-in)
- Error handling
- CORS (if needed)
- Request logging

**Environment:**
- Node.js v20+
- TypeScript (ESM modules)
- Hot-reload in development (via tsx)

#### Database Layer

**ORM:** Drizzle ORM
- Type-safe queries
- Schema definitions in `shared/schema.ts`
- Migration scripts in `scripts/`

**Database:** PostgreSQL
- Hosted on Neon (serverless) or local
- Connection via `DATABASE_URL` environment variable
- Pooled connections for efficiency

### Frontend Layer

#### React Application (client/)

**Purpose:** User interface for students and teachers

**Key Directories:**
- `client/src/pages/` - Route components
  - `role-selection.tsx` - Landing page
  - `student-dashboard.tsx` - Student interface
  - `teacher-dashboard.tsx` - Teacher interface
  - `not-found.tsx` - 404 page
- `client/src/components/` - Reusable UI components
  - `ui/` - shadcn/ui components
  - Custom components (if any)
- `client/src/hooks/` - Custom React hooks
- `client/src/lib/` - Utility functions

**Technology Stack:**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Wouter** - Lightweight routing
- **TanStack Query** - Server state management and caching
- **shadcn/ui** - Component library (Radix UI + Tailwind)
- **React Hook Form** - Form management
- **Zod** - Client-side validation

**State Management:**
- Server state: TanStack Query (React Query)
- Local state: React hooks (useState, useReducer)
- Forms: React Hook Form

## Data Flow

### Scenario 1: Student Login via RFID

```
┌─────────────┐
│ 1. Student  │
│  scans card │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 2. MFRC522 reads UID                 │
│    Example: [0x4A, 0x2B, 0x81, 0x3D] │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 3. ESP32 converts to hex string      │
│    Output: "4A 2B 81 3D"             │
└──────┬───────────────────────────────┘
       │ Serial USB
       ▼
┌──────────────────────────────────────┐
│ 4. rfid_scanner.py receives UID      │
│    - Looks up student by rfid_uid    │
│    - Finds: student_id = 5           │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 5. Check for active session          │
│    SELECT * FROM login_logout        │
│    WHERE student_id = 5              │
│      AND logout_time IS NULL         │
└──────┬───────────────────────────────┘
       │
       ▼ (No active session found)
┌──────────────────────────────────────┐
│ 6. Create LOGIN record               │
│    INSERT INTO login_logout          │
│    (student_id, login_time)          │
│    VALUES (5, NOW())                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 7. Print confirmation                │
│    "✓ LOGIN: Session started"        │
└──────────────────────────────────────┘
```

### Scenario 2: Student Logout via RFID (with Attendance)

```
┌─────────────┐
│ 1. Student  │
│ scans again │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 2-4. Same as Login (UID received)    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 5. Check for active session          │
│    FOUND: session_id = 123           │
│           login_time = 09:00         │
└──────┬───────────────────────────────┘
       │ (Active session exists)
       ▼
┌──────────────────────────────────────┐
│ 6. Update with LOGOUT time           │
│    UPDATE login_logout               │
│    SET logout_time = NOW()           │
│    WHERE id = 123                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 7. Retrieve all classes for today    │
│    SELECT * FROM classes             │
│    WHERE 'Monday' = ANY(days)        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 8. For each class, check overlap     │
│    Class: "Math" (09:00-10:30)       │
│    Login: 08:55, Logout: 10:45       │
│                                      │
│    Overlap? YES                      │
│    - login_time <= class_end_time    │
│    - logout_time >= class_start_time │
│    - duration >= 30 seconds          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 9. Create attendance record          │
│    INSERT INTO attendance            │
│    (student_id, class_id, date,      │
│     status, login_logout_id)         │
│    VALUES (5, 10, '2025-11-20',      │
│     'present', 123)                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 10. Print confirmation               │
│     "✓ LOGOUT: Session ended"        │
│     "→ Attendance: Marked present    │
│        for Math"                     │
└──────────────────────────────────────┘
```

### Scenario 3: Teacher Views Attendance (Web)

```
┌─────────────┐
│ 1. Teacher  │
│ opens web   │
│ browser     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 2. Navigate to Teacher Dashboard     │
│    URL: /teacher-dashboard           │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 3. React component loads             │
│    teacher-dashboard.tsx renders     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 4. TanStack Query fetches data       │
│    GET /api/classes                  │
│    GET /api/students                 │
│    GET /api/attendance/all           │
└──────┬───────────────────────────────┘
       │ HTTP Request
       ▼
┌──────────────────────────────────────┐
│ 5. Express routes to handler         │
│    routes.ts: app.get("/api/classes")│
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 6. Storage layer queries DB          │
│    storage.ts: getAllClasses()       │
│    Drizzle ORM executes:             │
│    SELECT * FROM classes             │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 7. Data flows back through layers    │
│    DB → Drizzle → Storage → Route    │
│         → JSON Response              │
└──────┬───────────────────────────────┘
       │ HTTP Response
       ▼
┌──────────────────────────────────────┐
│ 8. TanStack Query caches result      │
│    Updates React component state     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 9. UI renders with data              │
│    - Classes displayed in cards/table│
│    - Attendance records shown        │
└──────────────────────────────────────┘
```

## Database Architecture

### Entity-Relationship Diagram

```
┌─────────────────────────┐
│       students          │
├─────────────────────────┤
│ id (PK)                 │◀────┐
│ name                    │     │
│ email (UNIQUE)          │     │
│ role                    │     │
│ rfid_uid (UNIQUE)       │     │
└─────────────────────────┘     │
                                │ (1:N)
                                │
┌─────────────────────────┐     │
│     login_logout        │     │
├─────────────────────────┤     │
│ id (PK)                 │     │
│ student_id (FK) ────────┼─────┘
│ login_time              │◀────┐
│ logout_time (nullable)  │     │
└─────────────────────────┘     │
                                │ (1:N)
                                │
┌─────────────────────────┐     │
│      attendance         │     │
├─────────────────────────┤     │
│ id (PK)                 │     │
│ student_id (FK) ────────┼─────┤
│ class_id (FK) ──────────┼───┐ │
│ date                    │   │ │
│ status                  │   │ │
│ login_logout_id (FK) ───┼───┼─┘
└─────────────────────────┘   │
                              │ (N:1)
                              │
┌─────────────────────────┐   │
│        classes          │   │
├─────────────────────────┤   │
│ id (PK)                 │◀──┘
│ name                    │
│ start_time              │
│ end_time                │
│ days (array)            │
└─────────────────────────┘
```

### Table Details

#### students
- **Primary Key:** id (auto-increment)
- **Unique Constraints:** email, rfid_uid
- **Indexes:** 
  - Primary key on id
  - Unique index on email
  - Unique index on rfid_uid (for fast RFID lookups)

#### classes
- **Primary Key:** id (auto-increment)
- **Array Field:** days (PostgreSQL array type)
- **Indexes:** Primary key on id

#### login_logout
- **Primary Key:** id (auto-increment)
- **Foreign Keys:**
  - student_id → students.id (CASCADE DELETE)
- **Indexes:**
  - Primary key on id
  - Index on student_id (for fast session lookups)
- **Nullable:** logout_time (NULL = active session)

#### attendance
- **Primary Key:** id (auto-increment)
- **Foreign Keys:**
  - student_id → students.id (CASCADE DELETE)
  - class_id → classes.id (CASCADE DELETE)
  - login_logout_id → login_logout.id (SET NULL on delete)
- **Indexes:**
  - Primary key on id
  - Index on student_id (for student attendance queries)
  - Index on class_id (for class attendance queries)
  - Index on date (for date-range queries)

### Cascade Behavior

```
DELETE students WHERE id = 5
  ↓ CASCADE
  DELETE FROM login_logout WHERE student_id = 5
    ↓ SET NULL
    UPDATE attendance SET login_logout_id = NULL WHERE login_logout_id IN (...)
  ↓ CASCADE
  DELETE FROM attendance WHERE student_id = 5

DELETE classes WHERE id = 10
  ↓ CASCADE
  DELETE FROM attendance WHERE class_id = 10
```

## API Architecture

### RESTful Design Principles

- **Resource-based URLs**
- **HTTP methods:** GET, POST, PATCH, DELETE
- **JSON payloads**
- **Status codes:** 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Server Error

### API Endpoints Map

```
/api
├── /students
│   ├── GET     → List all students
│   ├── POST    → Create student
│   ├── PATCH /:id → Update student
│   └── DELETE /:id → Delete student
│
├── /classes
│   ├── GET     → List all classes
│   ├── POST    → Create class
│   ├── PATCH /:id → Update class
│   └── DELETE /:id → Delete class
│
├── /student
│   ├── POST /:studentId/login → Log student in
│   ├── POST /:studentId/logout → Log student out
│   └── GET /session/:studentId → Check session
│
├── /attendance
│   ├── GET /student/:studentId → Student's attendance
│   ├── GET /class/:classId → Class attendance
│   ├── GET /all → All attendance records
│   ├── POST → Create attendance
│   ├── PATCH /:id → Update attendance
│   └── DELETE /:id → Delete attendance
│
├── /activity
│   └── GET → All login/logout records
│
└── /seed
    └── POST → Seed database
```

### Request/Response Flow

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. HTTP Request
       │    POST /api/students
       │    {name: "John", email: "john@edu"}
       ▼
┌──────────────────┐
│  Express Server  │
│  (routes.ts)     │
└──────┬───────────┘
       │ 2. Validate with Zod
       │    insertStudentSchema.parse(req.body)
       ▼
┌──────────────────┐
│  Storage Layer   │
│  (storage.ts)    │
└──────┬───────────┘
       │ 3. Drizzle ORM Query
       │    db.insert(students).values(...)
       ▼
┌──────────────────┐
│   PostgreSQL     │
│    Database      │
└──────┬───────────┘
       │ 4. Return inserted row
       ▼
┌──────────────────┐
│  Storage Layer   │
└──────┬───────────┘
       │ 5. Return to route handler
       ▼
┌──────────────────┐
│  Express Server  │
└──────┬───────────┘
       │ 6. HTTP Response
       │    201 Created
       │    {id: 15, name: "John", ...}
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App (main.tsx)
│
├── Role Selection Page (/)
│   └── RoleSelectionPage
│       ├── Card (Student)
│       └── Card (Teacher)
│
├── Student Dashboard (/student-dashboard)
│   └── StudentDashboard
│       ├── Header
│       ├── AttendanceSummary
│       ├── LoginLogoutControls
│       └── ClassList
│           └── ClassCard (for each class)
│
└── Teacher Dashboard (/teacher-dashboard)
    └── TeacherDashboard
        ├── Header
        ├── Tabs
        │   ├── Classes Tab
        │   │   ├── CreateClassButton
        │   │   └── ClassList
        │   │       └── ClassCard (for each)
        │   │
        │   ├── Students Tab
        │   │   ├── CreateStudentButton
        │   │   └── StudentTable
        │   │       └── StudentRow (for each)
        │   │
        │   └── Attendance Tab
        │       ├── Filters
        │       └── AttendanceTable
        │           └── AttendanceRow (for each)
        │
        └── Dialogs/Modals
            ├── CreateClassDialog
            ├── EditClassDialog
            ├── CreateStudentDialog
            └── EditStudentDialog
```

### State Management Flow

```
┌──────────────────────────────────────────┐
│       TanStack Query Cache               │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ students │  │ classes  │  │activity││
│  │  query   │  │  query   │  │ query  ││
│  └──────────┘  └──────────┘  └────────┘│
└──────┬──────────────┬──────────────┬────┘
       │              │              │
       │ Provides     │ Provides     │ Provides
       │ data         │ data         │ data
       ▼              ▼              ▼
┌──────────────────────────────────────────┐
│         React Components                 │
│                                          │
│  - Automatically re-render on changes   │
│  - Loading states handled               │
│  - Error states handled                 │
└──────┬──────────────┬──────────────┬────┘
       │              │              │
       │ Mutations    │ Mutations    │ Mutations
       │              │              │
       ▼              ▼              ▼
┌──────────────────────────────────────────┐
│    TanStack Query Mutations              │
│                                          │
│  - POST/PATCH/DELETE requests           │
│  - Optimistic updates                   │
│  - Automatic cache invalidation         │
└──────────────────────────────────────────┘
```

## Security Architecture

### Input Validation

```
┌─────────────┐
│ Client Side │
│             │  1. React Hook Form validation
│  Zod Schema ├──────────────────────────────┐
│  Validation │                              │
└──────┬──────┘                              │
       │                                     │
       │ 2. HTTP Request                     │
       │    (if validation passes)           │
       ▼                                     │
┌─────────────┐                              │
│ Server Side │                              │
│             │  3. Zod Schema validation    │
│  Zod Schema ├──────────────────────────────┘
│  Validation │     (same schema via shared/)
└──────┬──────┘
       │
       │ 4. Only proceed if valid
       ▼
┌─────────────┐
│  Database   │
│  Operation  │
└─────────────┘
```

### SQL Injection Prevention

**Using Drizzle ORM with parameterized queries:**

```typescript
// SAFE - Parameterized (used in project)
db.select().from(students).where(eq(students.id, userId));

// UNSAFE - String concatenation (NOT used in project)
db.execute(`SELECT * FROM students WHERE id = ${userId}`);
```

### Environment Variable Security

```
.env file (NOT committed to Git)
├── DATABASE_URL=postgresql://...  (Database credentials)
└── PORT=5000                      (Server port)

.gitignore
├── .env                           (Ignored)
└── node_modules/                  (Ignored)
```

## Scalability Considerations

### Current Architecture (Small to Medium Scale)
- Single server instance
- Serverless PostgreSQL (Neon)
- Direct database connections
- Suitable for: 1-1000 concurrent users

### Future Enhancements for Large Scale

1. **Load Balancing**
   ```
   [NGINX Load Balancer]
          ↓
   ┌──────┴──────┬──────────┐
   │             │          │
   [Server 1] [Server 2] [Server 3]
   ```

2. **Database Connection Pooling**
   - PgBouncer or Neon's built-in pooling
   - Reduces connection overhead

3. **Caching Layer**
   ```
   [Express] → [Redis] → [PostgreSQL]
   ```
   - Cache frequently accessed data
   - Reduce database load

4. **Microservices (Optional)**
   - Separate attendance calculation service
   - Dedicated RFID processing service

## Deployment Architecture

### Development Environment
```
[Local Machine]
├── Node.js Server (port 5000)
│   ├── Express API
│   └── Vite Dev Server (HMR)
├── PostgreSQL (local or Neon)
└── Python RFID Scanner (optional)
```

### Production Environment (Example: Replit)
```
[Replit Container]
├── Node.js Server (production build)
│   ├── Express API
│   └── Static files (client build)
└── Neon PostgreSQL (serverless)

[Physical Location]
└── ESP32 + Python Script → Database
```

## Conclusion

This architecture provides:
- **Separation of concerns** - Each layer has a specific role
- **Type safety** - TypeScript + Drizzle + Zod
- **Scalability** - Can grow with minor modifications
- **Maintainability** - Clear structure and conventions
- **Security** - Multiple validation layers
- **Flexibility** - Can swap components (e.g., different database, frontend framework)

The design follows modern web development best practices while maintaining simplicity for educational use cases.
