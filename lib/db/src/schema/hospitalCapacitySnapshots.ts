import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Hospital Capacity Snapshots (For tracking capacity over time)
export const hospitalCapacitySnapshotsTable = pgTable("hospital_capacity_snapshots", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull(),
  snapshotDate: timestamp("snapshot_date").notNull().defaultNow(),
  totalBeds: integer("total_beds").notNull(),
  availableBeds: integer("available_beds").notNull(),
  occupiedBeds: integer("occupied_beds").notNull(),
  reservedBeds: integer("reserved_beds").notNull(),
  cleaningBeds: integer("cleaning_beds").notNull(),
  maintenanceBeds: integer("maintenance_beds").notNull(),
  unavailableBeds: integer("unavailable_beds").notNull(),
  icuTotal: integer("icu_total"),
  icuAvailable: integer("icu_available"),
  icuOccupied: integer("icu_occupied"),
  emergencyObservationTotal: integer("emergency_observation_total"),
  emergencyObservationAvailable: integer("emergency_observation_available"),
  dataSource: text("data_source", {
    enum: ["manual_entry", "api_integration", "sensor_feed", "staff_report"]
  }).notNull().default("manual_entry"),
  verifiedBy: integer("verified_by"), // References users table
  verificationMethod: text("verification_method"), // e.g., "phone_call", "portal_update", "audit"
  isVerified: boolean("is_verified").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHospitalCapacitySnapshotSchema = createInsertSchema(hospitalCapacitySnapshotsTable).omit({ id: true, createdAt: true });
export type InsertHospitalCapacitySnapshot = z.infer<typeof insertHospitalCapacitySnapshotSchema>;
export type HospitalCapacitySnapshot = typeof hospitalCapacitySnapshotsTable.$inferSelect;