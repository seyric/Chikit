import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Hospital Facilities/Departments (extending existing hospitals table with more detailed info)
export const hospitalFacilitiesTable = pgTable("hospital_facilities", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull(), // References hospitals table
  facilityCode: text("facility_code").notNull(), // e.g., "EMERGENCY", "CARDIOLOGY"
  facilityName: text("facility_name").notNull(),
  description: text("description"),
  isEmergencyCapable: boolean("is_emergency_capable").notNull().default(false),
  hasICU: boolean("has_icu").notNull().default(false),
  hasBloodBank: boolean("has_blood_bank").notNull().default(false),
  hasAmbulanceService: boolean("has_ambulance_service").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHospitalFacilitySchema = createInsertSchema(hospitalFacilitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHospitalFacility = z.infer<typeof insertHospitalFacilitySchema>;
export type HospitalFacility = typeof hospitalFacilitiesTable.$inferSelect;