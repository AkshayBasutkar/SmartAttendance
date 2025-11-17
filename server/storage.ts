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
  createStudent(student: InsertStudent): Promise<Student>;
  
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: InsertClass): Promise<Class>;
  deleteClass(id: number): Promise<void>;
  
  getLoginLogout(studentId: number): Promise<LoginLogout[]>;
  getActiveSession(studentId: number): Promise<LoginLogout | undefined>;
  createLoginLogout(loginLogout: InsertLoginLogout): Promise<LoginLogout>;
  updateLogoutTime(id: number, logoutTime: Date): Promise<LoginLogout>;
  
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByClass(classId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendanceStatus(id: number, status: string): Promise<Attendance>;
}

export class DatabaseStorage implements IStorage {
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    return student;
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

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [record] = await db
      .insert(attendance)
      .values(insertAttendance)
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
}

export const storage = new DatabaseStorage();
