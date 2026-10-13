import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Bed Assignments (Current patient-bed assignments)
export const bedAssignmentsTable = pgTable("bed_assignments", {
  id: serial("id").primaryKey(),
  bedId: integer("bed_id").notNull(), // References hospital_beds table
  patientId: integer("patient_id").notNull(), // References patients table
  admissionDate: timestamp("admission_date").notNull().defaultNow(),
  dischargeDate: timestamp("discharge_date"),
  admissionType: text("admission_type", {
    enum: ["emergency", "elective", "transfer", "referral"]
  }).notNull().default("elective"),
  admittingDoctorId: integer("admitting_doctor_id"), // References users table
  primaryDiagnosis: text("primary_diagnosis"),
  admittedFrom: text("admitted_from"), // e.g., "home", "other_hospital", "clinic"
  dischargeTo: text("discharge_to"), // e.g., "home", "rehab", "other_hospital"
  dischargeSummary: text("discharge_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBedAssignmentSchema = createInsertSchema(bedAssignmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBedAssignment = z.infer<typeof insertBedAssignmentSchema>;
export type BedAssignment = typeof bedAssignmentsTable.$inferSelect;