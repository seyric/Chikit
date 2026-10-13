import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Log of identity verification attempts for security and audit
export const patientVerificationAttemptsTable = pgTable("patient_verification_attempts", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => require("./patients").patientsTable.id), // nullable for attempts before patient creation
  phoneNumber: text("phone_number"), // for OTP-based attempts
  verificationType: text("verification_type").notNull(), // e.g., 'otp', 'aadhaar', 'abha', 'digilocker', 'govt_id'
  verificationMethod: text("verification_method").notNull(), // e.g., 'send_otp', 'verify_otp', 'initiate', 'confirm'
  status: text("status").notNull(), // e.g., 'success', 'failed', 'expired', 'cancelled'
  attemptDate: timestamp("attempt_date").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  failureReason: text("failure_reason"),
  attemptMetadata: jsonb("attempt_metadata"), // Additional context about the attempt
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPatientVerificationAttemptSchema = createInsertSchema(patientVerificationAttemptsTable).omit({ id: true, createdAt: true });
export type InsertPatientVerificationAttempt = z.infer<typeof insertPatientVerificationAttemptSchema>;
export type PatientVerificationAttempt = typeof patientVerificationAttemptsTable.$inferSelect;