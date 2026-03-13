import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const consentRequestsTable = pgTable("consent_requests", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  requestingDoctorId: integer("requesting_doctor_id").notNull(),
  requestingHospitalId: integer("requesting_hospital_id"),
  status: text("status", { enum: ["pending", "approved", "denied", "expired"] }).notNull().default("pending"),
  accessScope: text("access_scope").default("all"),
  notes: text("notes"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"),
});

export type ConsentRequest = typeof consentRequestsTable.$inferSelect;
