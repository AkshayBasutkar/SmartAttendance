-- ============================================
-- ClassConnect Database Schema Creation Script
-- ============================================
-- This SQL script creates all tables required for the ClassConnect application.
-- Execute this script directly in your PostgreSQL database to create all tables.
--
-- Usage:
--   psql -d your_database -f scripts/create-tables.sql
--   or run directly in your PostgreSQL client
--
-- Prerequisites:
--   - PostgreSQL database must exist
--   - DATABASE_URL environment variable must be set (if using connection string)
-- ============================================

BEGIN;

-- ============================================
-- Table: students
-- Purpose: Stores student user accounts
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student'
);

COMMENT ON TABLE students IS 'Stores student user accounts';
COMMENT ON COLUMN students.id IS 'Unique identifier for each student';
COMMENT ON COLUMN students.name IS 'Student full name';
COMMENT ON COLUMN students.email IS 'Student email address (unique)';
COMMENT ON COLUMN students.role IS 'User role (defaults to "student")';

-- ============================================
-- Table: classes
-- Purpose: Stores class schedules
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  days TEXT[] NOT NULL
);

COMMENT ON TABLE classes IS 'Stores class schedules';
COMMENT ON COLUMN classes.id IS 'Unique identifier for each class';
COMMENT ON COLUMN classes.name IS 'Class name';
COMMENT ON COLUMN classes.start_time IS 'Class start time (stored as text)';
COMMENT ON COLUMN classes.end_time IS 'Class end time (stored as text)';
COMMENT ON COLUMN classes.days IS 'Array of days of the week (e.g., ["Monday", "Wednesday", "Friday"])';

-- ============================================
-- Table: login_logout
-- Purpose: Tracks student login/logout sessions
-- ============================================
CREATE TABLE IF NOT EXISTS login_logout (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL,
  logout_time TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE login_logout IS 'Tracks student login/logout sessions';
COMMENT ON COLUMN login_logout.id IS 'Unique identifier for each session';
COMMENT ON COLUMN login_logout.student_id IS 'Foreign key to students table';
COMMENT ON COLUMN login_logout.login_time IS 'Timestamp when student logged in';
COMMENT ON COLUMN login_logout.logout_time IS 'Timestamp when student logged out (NULL if active session)';

-- Create index on student_id for faster queries
CREATE INDEX IF NOT EXISTS idx_login_logout_student_id ON login_logout(student_id);
CREATE INDEX IF NOT EXISTS idx_login_logout_login_time ON login_logout(login_time);

-- ============================================
-- Table: attendance
-- Purpose: Records attendance for students in classes
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL,
  login_logout_id INTEGER REFERENCES login_logout(id) ON DELETE SET NULL
);

COMMENT ON TABLE attendance IS 'Records attendance for students in classes';
COMMENT ON COLUMN attendance.id IS 'Unique identifier for each attendance record';
COMMENT ON COLUMN attendance.student_id IS 'Foreign key to students table';
COMMENT ON COLUMN attendance.class_id IS 'Foreign key to classes table';
COMMENT ON COLUMN attendance.date IS 'Date and time of the attendance record';
COMMENT ON COLUMN attendance.status IS 'Attendance status (e.g., "present", "absent", "late")';
COMMENT ON COLUMN attendance.login_logout_id IS 'Optional foreign key to login_logout table (links to session)';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_login_logout_id ON attendance(login_logout_id);

-- Create composite index for common queries (student + class + date)
CREATE INDEX IF NOT EXISTS idx_attendance_student_class_date ON attendance(student_id, class_id, date);

COMMIT;

-- ============================================
-- Verification Query
-- ============================================
-- Uncomment the following lines to verify tables were created:

-- SELECT 
--   table_name,
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
-- FROM information_schema.tables t
-- WHERE table_schema = 'public'
--   AND table_name IN ('students', 'classes', 'login_logout', 'attendance')
-- ORDER BY table_name;

-- ============================================
-- Script completed successfully!
-- ============================================

