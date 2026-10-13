import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hospitalsTable } from "./hospitals";

// Hospital-to-Hospital Case Sharing Permissions
export const caseNetworkPermissionsTable = pgTable("case_network_permissions", {
  id: serial("id").primaryKey(),
  sharingHospitalId: integer("sharing_hospital_id").notNull().references(() => hospitalsTable.id),
  receivingHospitalId: integer("receiving_hospital_id").notNull().references(() => hospitalsTable.id),

  // Permission scope
  caseTypesAllowed: jsonb("case_types_allowed").notNull().default([]), // e.g., ["cardiology", "oncology"]
  minDataReciprocity: text("min_data_reciprocity"), // e.g., "hospital_only", "state_level"

  // Temporal constraints
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),

  // Status
  status: text("status", {
    enum: ["pending", "active", "suspended", "terminated"]
  }).notNull().default("pending"),

  // Audit
  establishedBy: integer("established_by").notNull(), // References users table
  establishedAt: timestamp("established_at").notNull().defaultNow(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaseNetworkPermissionSchema = createInsertSchema(caseNetworkPermissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCaseNetworkPermission = z.infer<typeof insertCaseNetworkPermissionSchema>;
export type CaseNetworkPermission = typeof caseNetworkPermissionsTable.$inferSelect;