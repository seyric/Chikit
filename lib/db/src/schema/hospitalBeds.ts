import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Individual Bed Inventory
export const hospitalBedsTable = pgTable("hospital_beds", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull(),
  facilityId: integer("facility_id"), // References hospital_facilities table (nullable for general beds)
  bedNumber: text("bed_number").notNull(), // e.g., "ICU-01", "GW-12A"
  categoryId: integer("category_id").notNull(), // References bed_categories table
  roomNumber: text("room_number"),
  wing: text("wing"),
  floor: integer("floor"),
  bedState: text("bed_state", {
    enum: ["available", "occupied", "reserved", "cleaning", "maintenance", "unavailable", "pending_confirmation"]
  }).notNull().default("available"),
  isAccessible: boolean("is_accessible").notNull().default(false), // For wheelchair accessibility
  hasVentilator: boolean("has_ventilator").notNull().default(false),
  hasMonitor: boolean("has_monitor").notNull().default(false),
  lastStateChange: timestamp("last_state_change").notNull().defaultNow(),
  stateChangeReason: text("state_change_reason"),
  changedBy: integer("changed_by"), // References users table (staff who made the change)
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHospitalBedSchema = createInsertSchema(hospitalBedsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHospitalBed = z.infer<typeof insertHospitalBedSchema>;
export type HospitalBed = typeof hospitalBedsTable.$inferSelect;