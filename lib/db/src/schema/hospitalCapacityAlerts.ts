import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Hospital Capacity Alerts (For low capacity, stale data, etc.)
export const hospitalCapacityAlertsTable = pgTable("hospital_capacity_alerts", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull(),
  alertType: text("alertType", {
    enum: ["low_capacity", "stale_data", "icu_overcapacity", "emergency_overcapacity", "data_discrepancy"]
  }).notNull(),
  severity: text("severity", {
    enum: ["low", "medium", "high", "critical"]
  }).notNull().default("medium"),
  thresholdValue: real("threshold_value"), // The threshold that triggered the alert
  currentValue: real("currentValue"), // The actual measured value
  alertMessage: text("alertMessage").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  acknowledgedBy: integer("acknowledgedBy"), // References users table
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolutionNotes: text("resolutionNotes"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHospitalCapacityAlertSchema = createInsertSchema(hospitalCapacityAlertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHospitalCapacityAlert = z.infer<typeof insertHospitalCapacityAlertSchema>;
export type HospitalCapacityAlert = typeof hospitalCapacityAlertsTable.$inferSelect;