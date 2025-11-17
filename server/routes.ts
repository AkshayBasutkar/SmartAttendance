import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { students, classes, loginLogout, attendance } from "@shared/schema";
import { insertStudentSchema, insertClassSchema, insertLoginLogoutSchema } from "@shared/schema";
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

  app.patch("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || (status !== "present" && status !== "absent")) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedAttendance = await storage.updateAttendanceStatus(id, status);
      res.json(updatedAttendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendance" });
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

      if (loginTime <= classStartTime && logoutTime >= classStartTime) {
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
