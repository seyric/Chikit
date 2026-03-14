import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientCode: text("patient_code").notNull().unique(),
  chikitHealthId: text("chikit_health_id").unique(),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  bloodGroup: text("blood_group"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  govtIdType: text("govt_id_type"),
  govtIdNumber: text("govt_id_number"),
  hospitalId: integer("hospital_id"),
  isActive: boolean("is_active").notNull().default(true),
  abhaNumber: text("abha_number").unique(),
  abhaAddress: text("abha_address"),
  abhaVerified: boolean("abha_verified").default(false),
  abhaLinkedAt: timestamp("abha_linked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, patientCode: true, chikitHealthId: true, createdAt: true, updatedAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
