import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

// Consent records for identity verification (Aadhaar, ABHA, DigiLocker, Govt ID, etc.)
export const identityVerificationConsentTable = pgTable("identity_verification_consent", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  consentType: text("consent_type").notNull(), // e.g., 'aadhaar', 'abha', 'digilocker', 'govt_id'
  consentGranted: boolean("consent_granted").notNull().default(false),
  consentDate: timestamp("consent_date"),
  consentExpiryDate: timestamp("consent_expiry_date"),
  verificationMethod: text("verification_method"), // e.g., 'otp', 'biometric', 'document', 'provider_api'
  verificationReference: text("verification_reference"), // Reference from verification provider (txnId, etc.)
  verificationDate: timestamp("verification_date"),
  consentWithdrawn: boolean("consent_withdrawn").notNull().default(false),
  withdrawalDate: timestamp("withdrawal_date"),
  withdrawalReason: text("withdrawal_reason"),
  verifiedBy: integer("verified_by"), // user ID who verified/processed the consent
  verificationMethodDetails: jsonb("verification_method_details"), // Additional details from verification process
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIdentityVerificationConsentSchema = createInsertSchema(identityVerificationConsentTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIdentityVerificationConsent = z.infer<typeof insertIdentityVerificationConsentSchema>;
export type IdentityVerificationConsent = typeof identityVerificationConsentTable.$inferSelect;