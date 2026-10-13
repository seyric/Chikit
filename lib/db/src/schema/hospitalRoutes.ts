import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Route and Navigation Data (Cached routing information)
export const hospitalRoutesTable = pgTable("hospital_routes", {
  id: serial("id").primaryKey(),
  originId: integer("origin_id"), // Reference to hospitals table (or could be lat/lng)
  destinationHospitalId: integer("destination_hospital_id").notNull(),
  routeData: jsonb("route_data").notNull(), // Contains route geometry, instructions, etc.
  distanceKm: real("distance_km").notNull(),
  estimatedTimeMinutes: integer("estimated_time_minutes").notNull(),
  trafficFactor: real("traffic_factor").notNull().default(1.0), // Multiplier for traffic conditions
  lastUpdated: timestamp("lastUpdated").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt").notNull(), // When this route data should be refresced
  routeProvider: text("routeProvider").notNull().default("unknown"), // e.g., "google_maps", "here", "osrm"
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertHospitalRouteSchema = createInsertSchema(hospitalRoutesTable).omit({ id: true, createdAt: true });
export type InsertHospitalRoute = z.infer<typeof insertHospitalRouteSchema>;
export type HospitalRoute = typeof hospitalRoutesTable.$inferSelect;