import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

// DigiLocker connection metadata for patients
export const digiLockerConnectionsTable = pgTable("digi_locker_connections", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  connectionId: text("connection_id").notNull().unique(), // Unique identifier from DigiLocker
  accessToken: text("access_token").notNull(), // Should be encrypted in production
  refreshToken: text("refresh_token"), // Should be encrypted in production
  scope: text("scope"), // Comma-separated list of document types accessible
  status: text("status").notNull(), // e.g., 'connected', 'disconnected', 'expired'
  connectedAt: timestamp("connected_at"),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDigiLockerConnectionSchema = createInsertSchema(digiLockerConnectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDigiLockerConnection = z.infer<typeof insertDigiLockerConnectionSchema>;
export type DigiLockerConnection = typeof digiLockerConnectionsTable.$inferSelect;