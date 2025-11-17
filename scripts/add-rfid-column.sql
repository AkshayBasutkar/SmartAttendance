-- ============================================
-- Add RFID UID Column to Students Table
-- ============================================
-- This SQL script adds an rfid_uid column to the students table
-- to enable RFID card scanning for automatic login/logout.
--
-- Usage:
--   psql -d your_database -f scripts/add-rfid-column.sql
--   or run directly in your PostgreSQL client
-- ============================================

BEGIN;

-- Add rfid_uid column to students table (unique, nullable)
-- If column already exists, this will show an error but won't break
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS rfid_uid TEXT;

-- Create unique index on rfid_uid to ensure no duplicate RFID cards
-- Using IF NOT EXISTS to avoid errors if index already exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_rfid_uid ON students(rfid_uid) 
WHERE rfid_uid IS NOT NULL;

COMMENT ON COLUMN students.rfid_uid IS 'RFID card UID for automatic student login/logout';

COMMIT;

-- ============================================
-- Verification Query
-- ============================================
-- Uncomment the following to verify the column was added:

-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'students' 
--   AND column_name = 'rfid_uid';

-- ============================================
-- Script completed successfully!
-- ============================================

