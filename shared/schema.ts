import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("student"),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  days: text("days").array().notNull(),
});

export const loginLogout = pgTable("login_logout", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  loginTime: timestamp("login_time", { withTimezone: true }).notNull(),
  logoutTime: timestamp("logout_time", { withTimezone: true }),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  loginLogoutId: integer("login_logout_id").references(() => loginLogout.id, { onDelete: "set null" }),
});

export const studentsRelations = relations(students, ({ many }) => ({
  loginLogout: many(loginLogout),
  attendance: many(attendance),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  attendance: many(attendance),
}));

export const loginLogoutRelations = relations(loginLogout, ({ one, many }) => ({
  student: one(students, {
    fields: [loginLogout.studentId],
    references: [students.id],
  }),
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  loginLogout: one(loginLogout, {
    fields: [attendance.loginLogoutId],
    references: [loginLogout.id],
  }),
}));

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  role: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
}).extend({
  days: z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])).min(1),
});

export const insertLoginLogoutSchema = createInsertSchema(loginLogout).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type LoginLogout = typeof loginLogout.$inferSelect;
export type InsertLoginLogout = z.infer<typeof insertLoginLogoutSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
