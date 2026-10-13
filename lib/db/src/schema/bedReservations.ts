import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Bed Reservations (Provisional reservations before admission)
export const bedReservationsTable = pgTable("bed_reservations", {
  id: serial("id").primaryKey(),
  bedId: integer("bed_id").notNull(), // References hospital_beds table
  patientId: integer("patient_id").notNull(), // References patients table
  reservationDate: timestamp("reservation_date").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // When reservation expires if not confirmed
  priorityLevel: text("priority_level", {
    enum: ["low", "medium", "high", "emergency"]
  }).notNull().default("medium"),
  requiredByDate: timestamp("required_by_date"), // When patient needs the bed by
  admissionType: text("admission_type", {
    enum: ["emergency", "elective", "transfer", "referral"]
  }).notNull().default("elective"),
  clinicalNotes: text("clinical_notes"),
  contactPhone: text("contact_phone"), // For coordinator to reach patient/family
  status: text("reservation_status", {
    enum: ["pending", "confirmed", "expired", "cancelled", "rejected_by_facility"]
  }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBedReservationSchema = createInsertSchema(bedReservationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBedReservation = z.infer<typeof insertBedReservationSchema>;
export type BedReservation = typeof bedReservationsTable.$inferSelect;