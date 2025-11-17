import { 
  students, 
  classes, 
  loginLogout, 
  attendance,
  type Student, 
  type InsertStudent,
  type Class,
  type InsertClass,
  type LoginLogout,
  type InsertLoginLogout,
  type Attendance,
  type InsertAttendance,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, isNull, desc } from "drizzle-orm";

export interface IStorage {
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByRfidUid(rfidUid: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: InsertStudent): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: InsertClass): Promise<Class>;
  deleteClass(id: number): Promise<void>;
  
  getLoginLogout(studentId: number): Promise<LoginLogout[]>;
  getAllLoginLogout(): Promise<(LoginLogout & { student: Student })[]>;
  getActiveSession(studentId: number): Promise<LoginLogout | undefined>;
  createLoginLogout(loginLogout: InsertLoginLogout): Promise<LoginLogout>;
  updateLogoutTime(id: number, logoutTime: Date): Promise<LoginLogout>;
  
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByClass(classId: number): Promise<Attendance[]>;
  getAttendance(id: number): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance>;
  updateAttendanceStatus(id: number, status: string): Promise<Attendance>;
  deleteAttendance(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByRfidUid(rfidUid: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.rfidUid, rfidUid));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    return student;
  }

  async updateStudent(id: number, insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .update(students)
      .set(insertStudent)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
    return classItem || undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [classItem] = await db
      .insert(classes)
      .values(classData)
      .returning();
    return classItem;
  }

  async updateClass(id: number, classData: InsertClass): Promise<Class> {
    const [classItem] = await db
      .update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return classItem;
  }

  async deleteClass(id: number): Promise<void> {
    await db.delete(classes).where(eq(classes.id, id));
  }

  async getLoginLogout(studentId: number): Promise<LoginLogout[]> {
    return await db
      .select()
      .from(loginLogout)
      .where(eq(loginLogout.studentId, studentId))
      .orderBy(desc(loginLogout.loginTime));
  }

  async getAllLoginLogout(): Promise<(LoginLogout & { student: Student })[]> {
    const records = await db
      .select({
        id: loginLogout.id,
        studentId: loginLogout.studentId,
        loginTime: loginLogout.loginTime,
        logoutTime: loginLogout.logoutTime,
        student: students,
      })
      .from(loginLogout)
      .leftJoin(students, eq(loginLogout.studentId, students.id))
      .orderBy(desc(loginLogout.loginTime));
    
    // Filter out records where student is null and type assert
    return records
      .filter((r): r is typeof records[0] & { student: Student } => r.student !== null)
      .map((r) => ({
        id: r.id,
        studentId: r.studentId,
        loginTime: r.loginTime,
        logoutTime: r.logoutTime,
        student: r.student,
      })) as (LoginLogout & { student: Student })[];
  }

  async getActiveSession(studentId: number): Promise<LoginLogout | undefined> {
    const [session] = await db
      .select()
      .from(loginLogout)
      .where(
        and(
          eq(loginLogout.studentId, studentId),
          isNull(loginLogout.logoutTime)
        )
      )
      .orderBy(desc(loginLogout.loginTime));
    return session || undefined;
  }

  async createLoginLogout(insertLoginLogout: InsertLoginLogout): Promise<LoginLogout> {
    const [record] = await db
      .insert(loginLogout)
      .values(insertLoginLogout)
      .returning();
    return record;
  }

  async updateLogoutTime(id: number, logoutTime: Date): Promise<LoginLogout> {
    const [record] = await db
      .update(loginLogout)
      .set({ logoutTime })
      .where(eq(loginLogout.id, id))
      .returning();
    return record;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceByClass(classId: number): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.classId, classId))
      .orderBy(desc(attendance.date));
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [record] = await db.select().from(attendance).where(eq(attendance.id, id));
    return record || undefined;
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [record] = await db
      .insert(attendance)
      .values(insertAttendance)
      .returning();
    return record;
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance> {
    const [record] = await db
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return record;
  }

  async updateAttendanceStatus(id: number, status: string): Promise<Attendance> {
    const [record] = await db
      .update(attendance)
      .set({ status })
      .where(eq(attendance.id, id))
      .returning();
    return record;
  }

  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendance).where(eq(attendance.id, id));
  }
}

export const storage = new DatabaseStorage();
