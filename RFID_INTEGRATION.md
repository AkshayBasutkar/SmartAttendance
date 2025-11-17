# RFID Integration with ClassConnect

This document explains how to integrate RFID card scanning with ClassConnect for automatic student login/logout.

## Overview

The RFID scanner (`rfid_scanner.py`) reads RFID card UIDs from an ESP32 and automatically:
- **Logs students in** when they scan their card (if no active session)
- **Logs students out** when they scan their card again (if active session exists)
- **Calculates attendance** automatically when students logout during class time

## Setup Instructions

### 1. Database Migration

Add the `rfid_uid` column to the students table:

```bash
npm run db:add-rfid-column
```

Or manually run the SQL script:

```bash
psql -d attendance -f scripts/add-rfid-column.sql
```

### 2. Assign RFID UIDs to Students

**Option A: Via Teacher Dashboard**
1. Go to Teacher Dashboard
2. Click on "Students" tab
3. Edit a student
4. Enter their RFID UID in the "RFID UID (Optional)" field
5. Save

**Option B: Via API**
```bash
# Update student with RFID UID
PATCH /api/students/:id
Body: { "name": "John Doe", "email": "john@example.com", "rfidUid": "4A 2B 81 3D" }
```

### 3. Install Python Dependencies

```bash
pip install pyserial psycopg2 python-dotenv
```

### 4. Configure RFID Scanner

The scanner uses the `DATABASE_URL` from your `.env` file automatically. To change the serial port, edit `SERIAL_PORT` in `rfid_scanner.py`:

```python
SERIAL_PORT = 'COM7'  # Change to your ESP32's port
```

### 5. Run the RFID Scanner

```bash
python rfid_scanner.py
```

## How It Works

### Login Flow (First Scan)
1. Student scans RFID card
2. Scanner reads UID (e.g., "4A 2B 81 3D")
3. Looks up student by `rfid_uid` in database
4. Checks if student has an active session
5. If no active session → Creates LOGIN record
6. Attendance tracking starts

### Logout Flow (Second Scan)
1. Student scans RFID card again
2. Scanner finds student by UID
3. Finds active session (where `logout_time` is NULL)
4. Updates session with `logout_time`
5. **Calculates attendance** for all classes during the session:
   - Checks if login/logout times overlap with class schedules
   - Creates attendance records for matching classes
   - Marks student as "present"

## Example Output

```
Connecting to ClassConnect database: attendance on localhost
Database connected successfully.
Connecting to serial port COM7...
Connected. Listening for RFID scans...
Press Ctrl+C to stop.

RFID scanning behavior:
  - If student has no active session: Creates LOGIN
  - If student has active session: Creates LOGOUT and calculates attendance
------------------------------------------------------------
✓ [14:30:15] RFID 4A 2B 81 3D - Student: Alice Johnson (alice@example.com)
  → LOGIN: Session started

✓ [14:35:22] RFID 4A 2B 81 3D - Student: Alice Johnson (alice@example.com)
  → LOGOUT: Session ended (Logged in at 14:30:15)
  → Attendance: Marked present for Math
```

## Troubleshooting

### "No student found with this RFID UID"
- Make sure the student has been assigned an RFID UID in the database
- Verify the RFID UID matches exactly (spaces and case matter)

### "Could not open port COM7"
- Check if ESP32 is connected to the computer
- Verify the correct COM port (Windows Device Manager)
- Make sure no other program is using the serial port

### Database connection errors
- Verify `DATABASE_URL` in `.env` file
- Check PostgreSQL is running
- Verify database credentials

## RFID UID Format

RFID UIDs are typically received as space-separated hex values:
- Example: `4A 2B 81 3D`
- Example: `A1 B2 C3 D4`

The scanner stores them exactly as received from the ESP32.

## Integration with ClassConnect

The RFID scanner directly writes to ClassConnect's database:
- **Table**: `login_logout` - Creates login/logout records
- **Table**: `attendance` - Automatically creates attendance records on logout
- **Table**: `students` - Reads `rfid_uid` to find students

## Notes

- Each student can have only one active session at a time
- Attendance is calculated automatically on logout
- The scanner handles multiple classes and calculates attendance for all relevant classes
- Duplicate attendance records are prevented (checks if record already exists)

