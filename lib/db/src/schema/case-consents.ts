import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

// Consent records for ABHA-based research participation
export const caseConsentsTable = pgTable("case_consents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  abhaAddress: text("abha_address").notNull(), // ABHA address of the patient
  consentArtifactId: text("consent_artifact_id").notNull(), // Reference to ABDM consent artifact
  consentArtifactHash: text("consent_artifact_hash").notNull(), // Hash of the consent artifact for verification
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration of consent
  scope: jsonb("scope").notNull(), // Detailed consent scope: data types, retention, sharing, etc.
  status: text("consent_status", {
    enum: ["active", "withdrawn", "expired", "rejected"]
  }).notNull().default("active"),
  withdrawalReason: text("withdrawal_reason"), // If withdrawn, reason provided
  withdrawnAt: timestamp("withdrawn_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaseConsentSchema = createInsertSchema(caseConsentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCaseConsent = z.infer<typeof insertCaseConsentSchema>;
export type CaseConsent = typeof caseConsentsTable.$inferSelect;