import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const labReportsTable = pgTable("lab_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  hospitalId: integer("hospital_id").notNull(),
  testName: text("test_name").notNull(),
  testDate: timestamp("test_date").notNull(),
  results: jsonb("results"),
  referenceRanges: jsonb("reference_ranges"),
  interpretation: text("interpretation"),
  aiInterpretation: text("ai_interpretation"),
  status: text("status", { enum: ["pending", "completed", "reviewed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLabReportSchema = createInsertSchema(labReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabReport = z.infer<typeof insertLabReportSchema>;
export type LabReport = typeof labReportsTable.$inferSelect;
