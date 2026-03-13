import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const radiologyReportsTable = pgTable("radiology_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  hospitalId: integer("hospital_id").notNull(),
  imagingType: text("imaging_type", { enum: ["xray", "mri", "ct_scan", "ultrasound", "ecg", "pet_scan"] }).notNull(),
  bodyPart: text("body_part").notNull(),
  studyDate: timestamp("study_date").notNull(),
  findings: text("findings"),
  impression: text("impression"),
  radiologistNotes: text("radiologist_notes"),
  aiFindings: text("ai_findings"),
  status: text("status", { enum: ["pending", "reported", "reviewed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRadiologyReportSchema = createInsertSchema(radiologyReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRadiologyReport = z.infer<typeof insertRadiologyReportSchema>;
export type RadiologyReport = typeof radiologyReportsTable.$inferSelect;
