import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { students, classes, loginLogout, attendance } from "@shared/schema";
import { insertStudentSchema, insertClassSchema, insertLoginLogoutSchema, insertAttendanceSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/students", async (req, res) => {
    try {
      const allStudents = await storage.getStudents();
      res.json(allStudents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Invalid student data" });
    }
  });

  app.patch("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.updateStudent(id, validatedData);
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStudent(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  app.get("/api/classes", async (req, res) => {
    try {
      const allClasses = await storage.getClasses();
      res.json(allClasses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const validatedData = insertClassSchema.parse(req.body);
      const classItem = await storage.createClass(validatedData);
      res.json(classItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid class data" });
    }
  });

  app.patch("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertClassSchema.parse(req.body);
      const classItem = await storage.updateClass(id, validatedData);
      res.json(classItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update class" });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClass(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  app.post("/api/student/:studentId/login", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const activeSession = await storage.getActiveSession(studentId);
      if (activeSession) {
        return res.status(400).json({ message: "Student is already logged in" });
      }

      const loginRecord = await storage.createLoginLogout({
        studentId,
        loginTime: new Date(),
        logoutTime: null,
      });

      res.json(loginRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to log in student" });
    }
  });

  app.post("/api/student/:studentId/logout", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const activeSession = await storage.getActiveSession(studentId);
      if (!activeSession) {
        return res.status(400).json({ message: "No active session found" });
      }

      const logoutTime = new Date();
      const updatedRecord = await storage.updateLogoutTime(activeSession.id, logoutTime);

      await calculateAttendance(studentId, activeSession.loginTime, logoutTime, activeSession.id);

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to log out student" });
    }
  });

  app.get("/api/student/session/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const activeSession = await storage.getActiveSession(studentId);
      
      if (activeSession) {
        res.json({ isLoggedIn: true, loginTime: activeSession.loginTime });
      } else {
        res.json({ isLoggedIn: false });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to check session" });
    }
  });

  app.get("/api/activity", async (req, res) => {
    try {
      const activityRecords = await storage.getAllLoginLogout();
      res.json(activityRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get("/api/attendance/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const attendanceRecords = await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          classId: attendance.classId,
          date: attendance.date,
          status: attendance.status,
          loginLogoutId: attendance.loginLogoutId,
          class: classes,
        })
        .from(attendance)
        .leftJoin(classes, eq(attendance.classId, classes.id))
        .where(eq(attendance.studentId, studentId));

      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/class/:classId", async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      
      const attendanceRecords = await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          classId: attendance.classId,
          date: attendance.date,
          status: attendance.status,
          loginLogoutId: attendance.loginLogoutId,
          student: students,
        })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .where(eq(attendance.classId, classId));

      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/all", async (req, res) => {
    try {
      const attendanceRecords = await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          classId: attendance.classId,
          date: attendance.date,
          status: attendance.status,
          loginLogoutId: attendance.loginLogoutId,
          student: students,
          class: classes,
        })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .leftJoin(classes, eq(attendance.classId, classes.id))
        .orderBy(attendance.date);

      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      // Convert date string to Date object if provided as string
      const body = { ...req.body };
      if (body.date && typeof body.date === 'string') {
        body.date = new Date(body.date);
      }
      const validatedData = insertAttendanceSchema.parse(body);
      const attendanceRecord = await storage.createAttendance(validatedData);
      res.json(attendanceRecord);
    } catch (error: any) {
      console.error("Attendance creation error:", error);
      res.status(400).json({ 
        message: "Invalid attendance data",
        error: error.errors || error.message 
      });
    }
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, date, studentId, classId, loginLogoutId } = req.body;
      
      // Allow updating multiple fields
      const updateData: any = {};
      if (status !== undefined) {
        if (status !== "present" && status !== "absent" && status !== "late") {
          return res.status(400).json({ message: "Invalid status. Must be 'present', 'absent', or 'late'" });
        }
        updateData.status = status;
      }
      if (date !== undefined) {
        // Convert date string to Date object if provided as string
        updateData.date = typeof date === 'string' ? new Date(date) : date;
      }
      if (studentId !== undefined) updateData.studentId = studentId;
      if (classId !== undefined) updateData.classId = classId;
      if (loginLogoutId !== undefined) updateData.loginLogoutId = loginLogoutId;

      const updatedAttendance = await storage.updateAttendance(id, updateData);
      res.json(updatedAttendance);
    } catch (error: any) {
      console.error("Attendance update error:", error);
      res.status(500).json({ 
        message: "Failed to update attendance",
        error: error.message 
      });
    }
  });

  app.delete("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAttendance(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendance" });
    }
  });

  async function calculateAttendance(
    studentId: number,
    loginTime: Date,
    logoutTime: Date,
    loginLogoutId: number
  ) {
    const allClasses = await storage.getClasses();
    
    for (const classItem of allClasses) {
      const loginDay = loginTime.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!classItem.days.includes(loginDay)) {
        continue;
      }

      const [startHours, startMinutes] = classItem.startTime.split(':').map(Number);
      const [endHours, endMinutes] = classItem.endTime.split(':').map(Number);
      
      const classStartTime = new Date(loginTime);
      classStartTime.setHours(startHours, startMinutes, 0, 0);
      
      const classEndTime = new Date(loginTime);
      classEndTime.setHours(endHours, endMinutes, 0, 0);

      // Check if student was logged in during class time
      // AND was logged in for at least 30 seconds
      const sessionDurationMs = logoutTime.getTime() - loginTime.getTime();
      const minSessionDurationMs = 30 * 1000; // 30 seconds in milliseconds
      
      // Check if session overlaps with class time:
      // - Student logged in before or during class AND
      // - Student logged out after class started AND
      // - Session duration is at least 30 seconds
      const wasLoggedInDuringClass = loginTime <= classEndTime && logoutTime >= classStartTime;
      
      if (wasLoggedInDuringClass && sessionDurationMs >= minSessionDurationMs) {
        // Check if attendance record already exists to avoid duplicates
        const existingAttendance = await storage.getAttendanceByStudent(studentId);
        const alreadyExists = existingAttendance.some(
          (att) => att.classId === classItem.id && 
                   att.date.toISOString().split('T')[0] === classStartTime.toISOString().split('T')[0] &&
                   att.loginLogoutId === loginLogoutId
        );
        
        if (!alreadyExists) {
          await storage.createAttendance({
            studentId,
            classId: classItem.id,
            date: classStartTime,
            status: "present",
            loginLogoutId,
          });
        }
      }
    }
  }

  app.post("/api/seed", async (req, res) => {
    try {
      const existingStudents = await storage.getStudents();
      if (existingStudents.length > 0) {
        return res.json({ message: "Database already seeded", students: existingStudents });
      }

      const sampleStudents = [
        { name: "Alice Johnson", email: "alice@example.com", role: "student" },
        { name: "Bob Smith", email: "bob@example.com", role: "student" },
        { name: "Carol Williams", email: "carol@example.com", role: "student" },
        { name: "David Brown", email: "david@example.com", role: "student" },
        { name: "Emma Davis", email: "emma@example.com", role: "student" },
      ];

      const createdStudents = [];
      for (const student of sampleStudents) {
        const created = await storage.createStudent(student);
        createdStudents.push(created);
      }

      res.json({ message: "Database seeded successfully", students: createdStudents });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
