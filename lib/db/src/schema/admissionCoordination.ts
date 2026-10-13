import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Admission Coordination Records
export const admissionCoordinationTable = pgTable("admission_coordination", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  referringHospitalId: integer("referring_hospital_id"), // References hospitals table
  receivingHospitalId: integer("receiving_hospital_id").notNull(), // References hospitals table
  referralDate: timestamp("referral_date").notNull().defaultNow(),
  referralReason: text("referral_reason"),
  clinicalSummary: text("clinical_summary"),
  requestedBedCategory: integer("requested_bed_category"), // References bed_categories table
  urgencyLevel: text("urgency_level", {
    enum: ["low", "medium", "high", "emergency"]
  }).notNull().default("medium"),
  status: text("coordination_status", {
    enum: ["initiated", "pending_acceptance", "accepted", "rejected", "completed", "cancelled"]
  }).notNull().default("initiated"),
  receivingHospitalResponse: text("receiving_hospital_response"),
  responseDate: timestamp("response_date"),
  estimatedTransferDate: timestamp("estimated_transfer_date"),
  actualTransferDate: timestamp("actual_transfer_date"),
  transferMode: text("transfer_mode", {
    enum: ["ambulance", "air_ambulance", "patient_transport_van", "self_transport"]
  }),
  transferVehicleId: text("transfer_vehicle_id"), // Reference to ambulance/vehicle tracking
  transferCrewAssigned: text("transferCrewAssigned"),
  clinicalHandoverCompleted: boolean("clinical_handover_completed").notNull().default(false),
  receivingNotes: text("receiving_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdmissionCoordinationSchema = createInsertSchema(admissionCoordinationTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdmissionCoordination = z.infer<typeof insertAdmissionCoordinationSchema>;
export type AdmissionCoordination = typeof admissionCoordinationTable.$inferSelect;