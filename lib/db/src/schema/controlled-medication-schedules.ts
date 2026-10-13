import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Controlled Medication Schedules (based on Indian drug schedules)
export const controlledMedicationSchedulesTable = pgTable("controlled_medication_schedules", {
  id: serial("id").primaryKey(),
  scheduleCode: text("schedule_code").notNull().unique(), // e.g., "H1", "H2", "X", "Schedule Y"
  scheduleName: text("schedule_name").notNull(),
  description: text("description"),
  prescribingRestrictions: jsonb("prescribing_restrictions").notNull().default({}),
  dispensingRestrictions: jsonb("dispensing_restrictions").notNull().default({}),
  recordRetentionYears: integer("record_retention_years").notNull().default(3),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertControlledMedicationScheduleSchema = createInsertSchema(controlledMedicationSchedulesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertControlledMedicationSchedule = z.infer<typeof insertControlledMedicationScheduleSchema>;
export type ControlledMedicationSchedule = typeof controlledMedicationSchedulesTable.$inferSelect;

// Controlled Medication Authorization Registry
export const controlledMedicationAuthorizationsTable = pgTable("controlled_medication_authorizations", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull(), // Reference to prescriptions table
  patientId: integer("patient_id").notNull(),
  prescriberId: integer("prescriber_id").notNull(), // Reference to doctors/users table
  prescribingFacilityId: integer("prescribing_facility_id").notNull(), // Reference to hospitals table
  medicationId: integer("medication_id").notNull(), // Reference to drugs table
  strength: text("strength").notNull(),
  dosageForm: text("dosage_form").notNull(),
  authorizedQuantity: integer("authorized_quantity").notNull(),
  unit: text("unit").notNull(), // e.g., "tablets", "ml", "vials"
  alreadyDispensedQuantity: integer("already_dispensed_quantity").notNull().default(0),
  remainingQuantity: integer("remaining_quantity").notNull(),
  authorizedRefills: integer("authorized_refills").notNull().default(0),
  usedRefills: integer("used_refills").notNull().default(0),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status", { enum: ["active", "completed", "cancelled", "expired"] }).notNull().default("active"),
  verificationStatus: text("verification_status", { enum: ["pending", "verified", "failed"] }).notNull().default("pending"),
  legalClassification: text("legal_classification").notNull(), // References scheduleCode
  dispensingRestrictions: jsonb("dispensing_restrictions").notNull().default({}),
  specialInstructions: text("special_instructions"),
  auditEventId: integer("audit_event_id"), // Reference to audit logs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertControlledMedicationAuthorizationSchema = createInsertSchema(controlledMedicationAuthorizationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertControlledMedicationAuthorization = z.infer<typeof insertControlledMedicationAuthorizationSchema>;
export type ControlledMedicationAuthorization = typeof controlledMedicationAuthorizationsTable.$inferSelect;

// Pharmacy Controlled Medication Inventory
export const pharmacyControlledInventoryTable = pgTable("pharmacy_controlled_inventory", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull(), // Reference to hospitals/branches table
  medicationId: integer("medication_id").notNull(), // Reference to drugs table
  batchNumber: text("batch_number").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  openingStock: integer("opening_stock").notNull(),
  closingStock: integer("closing_stock").notNull(),
  receivedQuantity: integer("received_quantity").notNull().default(0),
  dispensedQuantity: integer("dispensed_quantity").notNull().default(0),
  returnedQuantity: integer("returned_quantity").notNull().default(0),
  adjustedQuantity: integer("adjusted_quantity").notNull().default(0),
  adjustmentReason: text("adjustment_reason"),
  isQuarantined: boolean("is_quarantined").notNull().default(false),
  quarantineReason: text("quarantine_reason"),
  lastPhysicalCount: timestamp("last_physical_count"),
  physicalCountQuantity: integer("physical_count_quantity"),
  discrepancy: integer("discrepancy").notNull().default(0),
  status: text("status", { enum: ["active", "quarantined", "expired", "recalled"] }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPharmacyControlledInventorySchema = createInsertSchema(pharmacyControlledInventoryTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPharmacyControlledInventory = z.infer<typeof insertPharmacyControlledInventorySchema>;
export type PharmacyControlledInventory = typeof pharmacyControlledInventoryTable.$inferSelect;

// Caregiver Authorization for Medication Collection
export const caregiverAuthorizationsTable = pgTable("caregiver_authorizations", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  caregiverId: integer("caregiver_id").notNull(), // Reference to users table
  relationship: text("relationship"), // e.g., "spouse", "parent", "child"
  authorizationStartDate: timestamp("authorization_start_date").notNull(),
  authorizationEndDate: timestamp("authorization_end_date"),
  authorizedMedications: jsonb("authorized_medications").notNull().default([]), // List of medication IDs or schedules
  maxQuantityPerPickup: integer("max_quantity_per_pickup"),
  pickupFrequencyLimit: text("pickup_frequency_limit"), // e.g., "daily", "weekly", "monthly"
  status: text("status", { enum: ["active", "revoked", "expired", "suspended"] }).notNull().default("active"),
  verifiedBy: integer("verified_by"), // Reference to users table (verifying staff)
  verificationDate: timestamp("verification_date"),
  verificationMethod: text("verification_method"), // e.g., "document_check", "aadhaar_verified"
  auditEventId: integer("audit_event_id"), // Reference to audit logs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaregiverAuthorizationSchema = createInsertSchema(caregiverAuthorizationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCaregiverAuthorization = z.infer<typeof insertCaregiverAuthorizationSchema>;
export type CaregiverAuthorization = typeof caregiverAuthorizationsTable.$inferSelect;

// Medication Dispensing Records
export const medicationDispensingRecordsTable = pgTable("medication_dispensing_records", {
  id: serial("id").primaryKey(),
  authorizationId: integer("authorization_id").notNull(), // Reference to controlled_medication_authorizations
  prescriptionId: integer("prescription_id").notNull(), // Reference to prescriptions table
  patientId: integer("patient_id").notNull(),
  pharmacyId: integer("pharmacy_id").notNull(),
  pharmacistId: integer("pharmacist_id").notNull(), // Reference to users table
  medicationId: integer("medication_id").notNull(),
  batchNumber: text("batch_number").notNull(),
  quantityDispensed: integer("quantity_dispensed").notNull(),
  unit: text("unit").notNull(),
  dispensingDate: timestamp("dispensing_date").notNull().defaultNow(),
  status: text("status", { enum: ["completed", "partial", "failed"] }).notNull().default("completed"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  verificationMethod: text("verification_method"),
  patientVerified: boolean("patient_verified").notNull().default(false),
  caregiverVerified: boolean("caregiver_verified").notNull().default(false),
  caregiverId: integer("caregiver_id"), // If collected by caregiver
  prescriptionVerified: boolean("prescription_verified").notNull().default(false),
  inventoryUpdated: boolean("inventory_updated").notNull().default(false),
  auditEventId: integer("audit_event_id"), // Reference to audit logs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMedicationDispensingRecordSchema = createInsertSchema(medicationDispensingRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMedicationDispensingRecord = z.infer<typeof insertMedicationDispensingRecordSchema>;
export type MedicationDispensingRecord = typeof medicationDispensingRecordsTable.$inferSelect;

// Prescription Amendments and Cancellations
export const prescriptionAmendmentsTable = pgTable("prescription_amendments", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull(), // Reference to prescriptions table
  authorizationId: integer("authorization_id"), // Reference to controlled_medication_authorizations
  amendedBy: integer("amended_by").notNull(), // Reference to users table (prescriber)
  amendmentReason: text("amendment_reason").notNull(),
  originalPrescription: jsonb("original_prescription").notNull(), // Snapshot of original prescription
  amendedPrescription: jsonb("amended_prescription").notNull(), // Snapshot of amended prescription
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  auditEventId: integer("audit_event_id"), // Reference to audit logs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPrescriptionAmendmentSchema = createInsertSchema(prescriptionAmendmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrescriptionAmendment = z.infer<typeof insertPrescriptionAmendmentSchema>;
export type PrescriptionAmendment = typeof prescriptionAmendmentsTable.$inferSelect;

// Medication Anomaly Detection Rules
export const medicationAnomalyRulesTable = pgTable("medication_anomaly_rules", {
  id: serial("id").primaryKey(),
  ruleName: text("rule_name").notNull(),
  description: text("description"),
  ruleType: text("rule_type").notNull(), // e.g., "duplicate_prescription", "excessive_dispensing", "expired_prescription"
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  thresholdValue: text("threshold_value"), // Configurable threshold
  timeWindow: text("time_window"), // e.g., "24h", "7d", "30d"
  isEnabled: boolean("is_enabled").notNull().default(true),
  appliesToSchedules: jsonb("applies_to_schedules").notNull().default([]), // List of schedule codes
  appliesToMedications: jsonb("applies_to_medications").notNull().default([]), // List of medication IDs
  alertMessage: text("alert_message").notNull(),
  requiresHumanReview: boolean("requires_human_review").notNull().default(true),
  autoAction: text("auto_action"), // e.g., "flag_for_review", "block_dispensing", "notify_prescriber"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMedicationAnomalyRuleSchema = createInsertSchema(medicationAnomalyRulesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMedicationAnomalyRule = z.infer<typeof insertMedicationAnomalyRuleSchema>;
export type MedicationAnomalyRule = typeof medicationAnomalyRulesTable.$inferSelect;

// Medication Anomaly Alerts
export const medicationAnomalyAlertsTable = pgTable("medication_anomaly_alerts", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").notNull(), // Reference to medication_anomaly_rules
  prescriptionId: integer("prescription_id"), // Reference to prescriptions table
  authorizationId: integer("authorization_id"), // Reference to controlled_medication_authorizations
  patientId: integer("patient_id").notNull(),
  prescriberId: integer("prescriber_id").notNull(),
  pharmacyId: integer("pharmacy_id"),
  alertDetails: jsonb("alert_details").notNull(), // Specific details about the anomaly
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  status: text("status", { enum: ["open", "investigating", "resolved", "false_positive"] }).notNull().default("open"),
  assignedTo: integer("assigned_to"), // Reference to users table (investigator)
  investigationNotes: text("investigation_notes"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMedicationAnomalyAlertSchema = createInsertSchema(medicationAnomalyAlertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMedicationAnomalyAlert = z.infer<typeof insertMedicationAnomalyAlertSchema>;
export type MedicationAnomalyAlert = typeof medicationAnomalyAlertsTable.$inferSelect;