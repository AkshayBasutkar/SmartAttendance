import serial
import datetime
import psycopg2
import os
from urllib.parse import urlparse

# Try to load from .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, skip

# --- CONFIGURATION ---
SERIAL_PORT = 'COM7'  # <== CHANGE THIS to your ESP32's port
BAUD_RATE = 115200
# ---------------------

# --- DATABASE CONFIGURATION (ClassConnect Database) ---
# Uses DATABASE_URL from environment variable or .env file
# Format: postgresql://user:password@host:port/database
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    # Fallback to default if DATABASE_URL not set
    DATABASE_URL = 'postgresql://postgres:Basutkar@localhost:5432/attendance'
    print("⚠️  WARNING: DATABASE_URL not found in environment. Using default connection.")

# Parse DATABASE_URL to get connection parameters
parsed_url = urlparse(DATABASE_URL)

postgres_config = {
    'host': parsed_url.hostname or 'localhost',
    'dbname': parsed_url.path.lstrip('/') or 'attendance',
    'user': parsed_url.username or 'postgres',
    'password': parsed_url.password or '',
    'port': parsed_url.port or 5432
}

print(f"Connecting to ClassConnect database: {postgres_config['dbname']} on {postgres_config['host']}")
# -----------------------------------

db_connection = None
cursor = None

try:
    print(f"Connecting to PostgreSQL database '{postgres_config['dbname']}'...")
    db_connection = psycopg2.connect(**postgres_config)
    cursor = db_connection.cursor()
    print("Database connected successfully.")

    print(f"Connecting to serial port {SERIAL_PORT}...")
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print("Connected. Listening for RFID scans...")
    print("Press Ctrl+C to stop.")
    print("\nRFID scanning behavior:")
    print("  - If student has no active session: Creates LOGIN")
    print("  - If student has active session: Creates LOGOUT and calculates attendance")
    print("-" * 60)

    while True:
        try:
            uid_line = ser.readline().decode('utf-8').strip()

            if uid_line:
                # Filter out long boot messages
                if len(uid_line) < 50:
                    timestamp = datetime.datetime.now(datetime.timezone.utc)
                    rfid_uid = uid_line.strip()
                    
                    # Look up student by RFID UID
                    cursor.execute(
                        "SELECT id, name, email FROM students WHERE rfid_uid = %s",
                        (rfid_uid,)
                    )
                    student = cursor.fetchone()
                    
                    if not student:
                        print(f"⚠️  [{timestamp.strftime('%H:%M:%S')}] RFID {rfid_uid} - No student found with this RFID UID")
                        continue
                    
                    student_id, student_name, student_email = student
                    print(f"✓ [{timestamp.strftime('%H:%M:%S')}] RFID {rfid_uid} - Student: {student_name} ({student_email})")
                    
                    # Check if student has an active session (logout_time is NULL)
                    cursor.execute(
                        """SELECT id, login_time FROM login_logout 
                           WHERE student_id = %s AND logout_time IS NULL 
                           ORDER BY login_time DESC LIMIT 1""",
                        (student_id,)
                    )
                    active_session = cursor.fetchone()
                    
                    if active_session:
                        # Student has active session - LOGOUT
                        session_id, login_time = active_session
                        logout_time = timestamp
                        
                        # Ensure login_time is timezone-aware for comparisons
                        # PostgreSQL returns timezone-aware datetimes, but we ensure it here
                        if login_time.tzinfo is None:
                            login_time = login_time.replace(tzinfo=datetime.timezone.utc)
                        
                        # Update logout time
                        cursor.execute(
                            "UPDATE login_logout SET logout_time = %s WHERE id = %s",
                            (logout_time, session_id)
                        )
                        db_connection.commit()
                        
                        print(f"  → LOGOUT: Session ended (Logged in at {login_time.strftime('%H:%M:%S')})")
                        
                        # Calculate attendance for classes during this session
                        cursor.execute(
                            """SELECT id, name, start_time, end_time, days 
                               FROM classes"""
                        )
                        all_classes = cursor.fetchall()
                        
                        login_day = login_time.strftime('%A')  # e.g., "Monday"
                        
                        for class_id, class_name, start_time, end_time, class_days in all_classes:
                            if login_day not in class_days:
                                continue
                            
                            # Parse class times
                            start_h, start_m = map(int, start_time.split(':'))
                            end_h, end_m = map(int, end_time.split(':'))
                            
                            # Create class start/end times for the login day (ensure timezone-aware)
                            class_start = login_time.replace(hour=start_h, minute=start_m, second=0, microsecond=0)
                            class_end = login_time.replace(hour=end_h, minute=end_m, second=0, microsecond=0)
                            
                            # Ensure class times are timezone-aware
                            if class_start.tzinfo is None:
                                class_start = class_start.replace(tzinfo=datetime.timezone.utc)
                            if class_end.tzinfo is None:
                                class_end = class_end.replace(tzinfo=datetime.timezone.utc)
                            
                            # Check if student was logged in during class time
                            # Student must be logged in when class happens (overlap check)
                            # AND was logged in for at least 30 seconds
                            
                            # Check if session overlaps with class time:
                            # - Student logged in before or during class (login_time <= class_end) AND
                            # - Student logged out after class started (logout_time >= class_start)
                            was_logged_in_during_class = login_time <= class_end and logout_time >= class_start
                            
                            if was_logged_in_during_class:
                                # Calculate session duration in seconds
                                session_duration_seconds = (logout_time - login_time).total_seconds()
                                min_session_duration_seconds = 30  # Minimum 30 seconds
                                
                                if session_duration_seconds >= min_session_duration_seconds:
                                    # Check if attendance record already exists (by date and login_logout_id)
                                    cursor.execute(
                                        """SELECT id FROM attendance 
                                           WHERE student_id = %s AND class_id = %s AND date = %s AND login_logout_id = %s""",
                                        (student_id, class_id, class_start, session_id)
                                    )
                                    existing = cursor.fetchone()
                                    
                                    if not existing:
                                        # Create attendance record
                                        cursor.execute(
                                            """INSERT INTO attendance 
                                               (student_id, class_id, date, status, login_logout_id) 
                                               VALUES (%s, %s, %s, %s, %s)""",
                                            (student_id, class_id, class_start, 'present', session_id)
                                        )
                                        db_connection.commit()
                                        print(f"  → Attendance: Marked present for {class_name}")
                                    else:
                                        print(f"  → Attendance: Already marked for {class_name}")
                                else:
                                    print(f"  → Attendance: Skipped {class_name} (session too short: {int(session_duration_seconds)}s < 30s)")
                            else:
                                print(f"  → Attendance: Skipped {class_name} (not logged in during class time)")
                    
                    else:
                        # No active session - LOGIN
                        cursor.execute(
                            "INSERT INTO login_logout (student_id, login_time, logout_time) VALUES (%s, %s, NULL)",
                            (student_id, timestamp)
                        )
                        db_connection.commit()
                        print(f"  → LOGIN: Session started")
                    
                    print()  # Empty line for readability
                    
                else:
                    print(f"Skipped long boot message: {uid_line[:50]}...")

        except UnicodeDecodeError:
            print("Warning: Could not decode a byte. Skipping.")
        except KeyboardInterrupt:
            print("\nStopping...")
            break
        # --- CHANGED for PostgreSQL ---
        except psycopg2.Error as err:
            print(f"Database Error: {err}")
            # Roll back any pending transactions
            if db_connection:
                db_connection.rollback()
            # Check if connection is closed and try to reconnect
            if db_connection.closed:
                print("Reconnecting to database...")
                db_connection = psycopg2.connect(**postgres_config)
                cursor = db_connection.cursor()
                print("Reconnected.")
        # --- END CHANGED ---

except serial.SerialException as e:
    print(f"\n--- ERROR: Could not open port {SERIAL_PORT}. {e}")
    print("Please check: Is the ESP32 plugged in? Is the port correct?")
    print("Is the Arduino Serial Monitor or any other program using the port? (Close it!)")
# --- CHANGED for PostgreSQL ---
except psycopg2.Error as err:
    print(f"\n--- DATABASE CONNECTION ERROR: {err}")
    print("Please check your 'postgres_config' settings.")
# --- END CHANGED ---
except Exception as e:
    print(f"An unexpected error occurred: {e}")

finally:
    # --- CHANGED for PostgreSQL ---
    if cursor:
        cursor.close()
    if db_connection and not db_connection.closed:
        db_connection.close()
        print("PostgreSQL connection closed.")
    # --- END CHANGED ---
    if 'ser' in locals() and ser.is_open:
        ser.close()
        print("Serial port closed.")