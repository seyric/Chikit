import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Inter-Hospital Transfer Records
export const interHospitalTransfersTable = pgTable("inter_hospital_transfers", {
  id: serial("id").primaryKey(),
  transferRequestId: integer("transferRequestId").notNull(), // References admission_coordination table
  patientId: integer("patient_id").notNull(),
  sendingHospitalId: integer("sending_hospital_id").notNull(),
  receivingHospitalId: integer("receiving_hospital_id").notNull(),
  transferDate: timestamp("transfer_date").notNull().defaultNow(),
  transferMode: text("transfer_mode", {
    enum: ["ambulance", "air_ambulance", "patient_transport_van"]
  }).notNull(),
  vehicleId: text("vehicle_id"), // Reference to transport fleet
  crewIds: jsonb("crew_ids").notNull().default([]), // Array of user IDs (medical staff, driver)
  departureTime: timestamp("departure_time"),
  arrivalTime: timestamp("arrival_time"),
  estimatedDuration: integer("estimated_duration"), // In minutes
  actualDuration: integer("actual_duration"), // In minutes
  distanceKm: real("distance_km"),
  clinicalConditionDuringTransfer: text("clinical_condition_during_transfer"),
  incidentsDuringTransfer: text("incidents_during_transfer"),
  transferNotes: text("transferNotes"),
  receivingHospitalAcceptance: boolean("receiving_hospital_acceptance").notNull().default(false),
  acceptanceDate: timestamp("acceptance_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInterHospitalTransferSchema = createInsertSchema(interHospitalTransfersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInterHospitalTransfer = z.infer<typeof insertInterHospitalTransferSchema>;
export type InterHospitalTransfer = typeof interHospitalTransfersTable.$inferSelect;