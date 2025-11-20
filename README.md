# SmartAttendance - Student & Teacher Attendance Tracking System

A comprehensive full-stack web application for educational institutions to manage and track student attendance with automated RFID integration. The system features separate portals for students and teachers, with automatic attendance calculation based on login/logout times and scheduled class periods.

## 🌟 Features

### For Students
- **Login/Logout Tracking**: Students can log in and out of their sessions
- **Attendance Dashboard**: View attendance records for all enrolled classes
- **Real-time Status**: Check current login status and attendance statistics
- **RFID Card Support**: Automatic login/logout via RFID card scanning

### For Teachers
- **Class Management**: Create, edit, and delete classes with schedules
- **Student Management**: Add and manage student profiles
- **Attendance Monitoring**: View attendance records by class or student
- **Manual Attendance**: Edit attendance records as needed
- **Comprehensive Reports**: Access detailed attendance analytics

### System Features
- **Automatic Attendance Calculation**: Attendance is automatically marked when student logout times overlap with class schedules
- **RFID Integration**: External Python-based RFID scanner for hands-free attendance
- **Real-time Updates**: Live session tracking and attendance updates
- **RESTful API**: Well-structured API for all operations
- **Type-Safe**: Full TypeScript implementation with Zod validation

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and development server
- **Wouter** - Lightweight routing
- **TanStack Query (React Query)** - Server state management
- **shadcn/ui** - UI component library (built on Radix UI)
- **Tailwind CSS** - Utility-first styling
- **React Hook Form + Zod** - Form handling and validation

### Backend
- **Node.js** with TypeScript (ESM modules)
- **Express.js** - HTTP server and REST API
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Primary database (via Neon serverless)
- **Zod** - Runtime schema validation

### RFID Integration
- **Python 3** - RFID scanner script
- **pyserial** - Serial communication with ESP32
- **psycopg2** - PostgreSQL database access

## 📁 Project Structure

```
SmartAttendance/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Route pages (student/teacher dashboards)
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── main.tsx       # Application entry point
│   └── index.html
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── db.ts              # Database connection
│   ├── storage.ts         # Database operations layer
│   └── vite.ts            # Vite integration for dev mode
├── shared/                 # Shared code between client and server
│   └── schema.ts          # Drizzle schemas and Zod validators
├── scripts/                # Database migration scripts
│   ├── create-tables.ts   # Initial table creation
│   └── add-rfid-column.ts # RFID column migration
├── rfid_scanner.py        # RFID card scanner integration
├── package.json           # Dependencies and scripts
├── drizzle.config.ts      # Drizzle ORM configuration
├── vite.config.ts         # Vite build configuration
└── tsconfig.json          # TypeScript configuration
```

## 🏗️ System Architecture

### Database Schema

#### `students` table
- `id` (serial, primary key)
- `name` (text, not null)
- `email` (text, unique, not null)
- `role` (text, default: "student")
- `rfid_uid` (text, unique, optional) - RFID card identifier

#### `classes` table
- `id` (serial, primary key)
- `name` (text, not null)
- `start_time` (text, not null) - Format: "HH:MM"
- `end_time` (text, not null) - Format: "HH:MM"
- `days` (text array, not null) - e.g., ["Monday", "Wednesday", "Friday"]

#### `login_logout` table
- `id` (serial, primary key)
- `student_id` (integer, foreign key to students)
- `login_time` (timestamp with timezone, not null)
- `logout_time` (timestamp with timezone, nullable)

#### `attendance` table
- `id` (serial, primary key)
- `student_id` (integer, foreign key to students)
- `class_id` (integer, foreign key to classes)
- `date` (timestamp with timezone, not null)
- `status` (text, not null) - "present", "absent", or "late"
- `login_logout_id` (integer, foreign key to login_logout)

### API Endpoints

#### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

#### Classes
- `GET /api/classes` - List all classes
- `POST /api/classes` - Create new class
- `PATCH /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

#### Login/Logout
- `POST /api/student/:studentId/login` - Log student in
- `POST /api/student/:studentId/logout` - Log student out
- `GET /api/student/session/:studentId` - Check active session
- `GET /api/activity` - Get all login/logout records

#### Attendance
- `GET /api/attendance/student/:studentId` - Get student's attendance
- `GET /api/attendance/class/:classId` - Get class attendance
- `GET /api/attendance/all` - Get all attendance records
- `POST /api/attendance` - Create attendance record
- `PATCH /api/attendance/:id` - Update attendance record
- `DELETE /api/attendance/:id` - Delete attendance record

#### Utility
- `POST /api/seed` - Seed database with sample data

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (local or cloud-hosted like Neon)
- **Python 3** (optional, for RFID integration)
- **ESP32 with RFID reader** (optional, for RFID integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkshayBasutkar/SmartAttendance.git
   cd SmartAttendance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   PORT=5000
   ```

4. **Create database tables**
   ```bash
   npm run db:create-tables
   ```

5. **Seed sample data** (optional)
   
   Start the development server and make a POST request:
   ```bash
   curl -X POST http://localhost:5000/api/seed
   ```

### Running the Application

#### Development Mode
```bash
npm run dev
```
This starts both the frontend (with hot-reload) and backend servers.
- Frontend: http://localhost:5000
- Backend API: http://localhost:5000/api

#### Production Mode
```bash
npm run build
npm start
```

#### Type Checking
```bash
npm run check
```

## 📊 Workflow Explanation

### How Attendance Tracking Works

1. **Class Setup**
   - Teachers create classes with name, start time, end time, and days of the week
   - Example: "Mathematics" from 09:00 to 10:30 on Monday, Wednesday, Friday

2. **Student Login**
   - Student logs in via the web interface or RFID card scan
   - System records login time in `login_logout` table
   - Only one active session per student is allowed

3. **Student Logout**
   - Student logs out via the web interface or RFID card scan
   - System records logout time in `login_logout` table
   - **Automatic Attendance Calculation** is triggered

4. **Attendance Calculation Logic**
   - System retrieves all classes scheduled for the login day
   - For each class, checks if:
     - Student logged in before/during class (loginTime ≤ classEndTime)
     - Student logged out after class started (logoutTime ≥ classStartTime)
     - Session duration is at least 30 seconds
   - If all conditions are met, creates an attendance record with status "present"
   - Prevents duplicate attendance records for the same session

5. **Viewing Attendance**
   - Students can view their attendance records on their dashboard
   - Teachers can view attendance by class or by student
   - Teachers can manually edit attendance if needed

### Example Scenario

**Class Schedule:**
- Mathematics: Monday 09:00-10:30

**Student Activity:**
- Login: Monday 08:55
- Logout: Monday 10:45

**Result:**
- Attendance is automatically marked as "present" for Mathematics
- The system detected that the student was logged in during the entire class period

## 🏷️ RFID Integration

The system supports automatic login/logout via RFID card scanning. This provides a hands-free, contactless attendance tracking solution.

### Setup RFID Scanner

1. **Install Python dependencies**
   ```bash
   pip install pyserial psycopg2 python-dotenv
   ```

2. **Add RFID column to database** (if not already done)
   ```bash
   npm run db:add-rfid-column
   ```

3. **Assign RFID UIDs to students**
   - Via teacher dashboard: Edit student and add RFID UID
   - Via API: `PATCH /api/students/:id` with `rfidUid` field

4. **Configure serial port**
   
   Edit `rfid_scanner.py` and set your ESP32's serial port:
   ```python
   SERIAL_PORT = 'COM7'  # Windows
   # or
   SERIAL_PORT = '/dev/ttyUSB0'  # Linux
   ```

5. **Run the RFID scanner**
   ```bash
   python rfid_scanner.py
   ```

### RFID Workflow

- **First scan**: Creates a login session for the student
- **Second scan**: Logs out the student and calculates attendance
- **Subsequent scans**: Alternates between login and logout

For detailed RFID integration instructions, see [RFID_INTEGRATION.md](RFID_INTEGRATION.md)

## 🎨 Design Guidelines

The application follows Material Design principles adapted for educational software. Key design elements include:

- **Typography**: Inter font family for optimal readability
- **Layout**: Responsive grid system with mobile-first approach
- **Components**: shadcn/ui components for consistent UI
- **Colors**: Custom theme with light mode support
- **Icons**: Lucide React icon library

For detailed design guidelines, see [design_guidelines.md](design_guidelines.md)

## 🔒 Security Considerations

- **Input Validation**: All API inputs are validated using Zod schemas
- **SQL Injection Prevention**: Using Drizzle ORM with parameterized queries
- **Cascade Deletes**: Maintaining referential integrity with proper foreign key constraints
- **Environment Variables**: Sensitive data stored in `.env` file (not committed to repo)

## 🧪 Testing

Currently, the application does not have automated tests. To manually test:

1. Start the development server: `npm run dev`
2. Test student login/logout flow
3. Test teacher class creation and management
4. Test attendance calculation by creating overlapping login/logout sessions
5. Verify RFID integration (if applicable)

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Akshay Basutkar** - [AkshayBasutkar](https://github.com/AkshayBasutkar)

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) component library
- Database hosting by [Neon](https://neon.tech/)
- Icons by [Lucide](https://lucide.dev/)
- Inspired by modern educational technology needs

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the maintainers.

---

**Note**: This is an educational project designed for attendance tracking in schools and universities. Adapt it to your specific institution's needs and policies.
