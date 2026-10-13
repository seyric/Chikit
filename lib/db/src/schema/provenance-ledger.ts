import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { caseGraphsTable } from "./case-graphs.ts";
import { usersTable } from "./users.ts";
import { hospitalsTable } from "./hospitals.ts";

// Provenance Ledger for tamper-evident audit trail of case data
export const provenanceLedgerTable = pgTable("provenance_ledger", {
  id: serial("id").primaryKey(),
  ledgerUuid: uuid("ledger_uuid").notNull().defaultRandom().unique(),

  // Reference to the case this entry pertains to
  caseId: integer("case_id").notNull().references(() => caseGraphsTable.id, { onDelete: "cascade" }),
  caseUuid: uuid("case_uuid").notNull(), // Denormalized for easier querying

  // Entry type and description
  entryType: text("entry_type", {
    enum: [
      "case_creation",
      "case_update",
      "case_verification",
      "consent_update",
      "embedding_generation",
      "access_log",
      "network_share",
      "privacy_filter_application",
      "administrative_action"
    ]
  }).notNull(),

  entryDescription: text("entry_description").notNull(),

  // Cryptographic hashing for tamper evidence
  previousHash: text("previous_hash"), // Hash of previous ledger entry (chain linkage)
  entryHash: text("entry_hash").notNull(), // Hash of this entry's contents
  merkleRoot: text("merkle_root"), // For batch verification (optional)

  // Data snapshot (what was changed)
  changedFields: jsonb("changed_fields").notNull().default([]), // List of field names that changed
  previousValues: jsonb("previous_values"), // Values before change
  newValues: jsonb("new_values"), // Values after change
  dataSnapshot: jsonb("data_snapshot"), // Full snapshot of relevant data at this point

  // Actor and context
  actorId: integer("actor_id").notNull().references(() => usersTable.id), // Who made the change
  actorHospitalId: integer("actor_hospital_id").notNull().references(() => hospitalsTable.id), // Actor's hospital
  actorRole: text("actor_role").notNull(), // Role of the actor (doctor, admin, etc.)

  // Timestamp and sequencing
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sequenceNumber: integer("sequence_number").notNull(), // Sequential number within case

  // Verification and validation
  verifiedBy: integer("verified_by").references(() => usersTable.id), // Who verified this entry
  verifiedAt: timestamp("verified_at"),
  verificationMethod: text("verification_method"), // e.g., "cryptographic", "manual_review"
  isVerified: boolean("is_verified").notNull().default(false),

  // Privacy and compliance
  consentHashAtTime: text("consent_hash_at_time"), // Hash of consent status when entry was made
  privacyLevel: text("privacy_level", {
    enum: ["anonymous", "pseudonymized", "limited_dataset", "full_phi"]
  }).notNull().default("pseudonymized"),

  // Metadata
  ipAddress: text("ip_address"), // Actor's IP address (for audit)
  userAgent: text("user_agent"), // Actor's user agent (for audit)
  originatingSystem: text("originating_system").notNull().default("chikit_casegraph"), // System that created the entry

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Indexes for performance
export const provenanceLedgerCaseIdIdx = provenanceLedgerTable.caseId;
export const provenanceLedgerTimestampIdx = provenanceLedgerTable.timestamp;
export const provenanceLedgerActorIdIdx = provenanceLedgerTable.actorId;
export const provenanceLedgerEntryTypeIdx = provenanceLedgerTable.entryType;

export const insertProvenanceLedgerSchema = createInsertSchema(provenanceLedgerTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ledgerUuid: true
});
export type InsertProvenanceLedger = z.infer<typeof insertProvenanceLedgerSchema>;
export type ProvenanceLedger = typeof provenanceLedgerTable.$inferSelect;