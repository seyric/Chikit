import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients.ts";
import { hospitalsTable } from "./hospitals.ts";

// Clinical Case Representation (de-identified for cross-hospital sharing)
export const caseGraphsTable = pgTable("case_graphs", {
  id: serial("id").primaryKey(),
  caseUuid: uuid("case_uuid").notNull().defaultRandom().unique(),

  // Patient identifiers (hashed/pseudonymized for privacy)
  patientHash: text("patient_hash").notNull(), // Hash of ABHA + salt for pseudonymization
  abhaConsentHash: text("abha_consent_hash"), // Hash of consent artifact for verification

  // Temporal context
  caseDate: timestamp("case_date").notNull(), // When case was indexed
  onsetDate: timestamp("onset_date"), // When symptoms began

  // Demographics (generalized for privacy)
  ageGroup: text("age_group"), // e.g., "0-18", "19-35", "36-50", "51-65", "65+"
  gender: text("gender"), // From standardized set
  region: text("region"), // State level only for privacy

  // Clinical data (structured for search)
  chiefComplaint: text("chief_complaint"),
  symptoms: jsonb("symptoms").notNull().default([]), // Array of symptom objects
  chiefComplaintDuration: text("chief_complaint_duration"),

  // Vital signs at presentation
  vitalSigns: jsonb("vital_signs").notNull().default({}),

  // Diagnostic information
  suspectedDiagnoses: jsonb("suspected_diagnoses").notNull().default([]), // Array of ICD-10 codes with confidence
  confirmedDiagnoses: jsonb("confirmed_diagnoses").notNull().default([]), // Array of ICD-10 codes
  differentialDiagnosis: jsonb("differential_diagnosis").notNull().default([]),

  // Investigations
  laboratoryResults: jsonb("lab_results").notNull().default([]), // Array of lab test results
  imagingStudies: jsonb("imaging_studies").notNull().default([]), // Array of imaging results
  otherInvestigations: jsonb("other_investigations").notNull().default([]),

  // Treatment and interventions
  treatmentsAdministered: jsonb("treatments_administered").notNull().default([]), // Array of treatment objects
  proceduresPerformed: jsonb("procedures_performed").notNull().default([]),
  medicationsPrescribed: jsonb("medications_prescribed").notNull().default([]),

  // Clinical course
  complications: jsonb("complications").notNull().default([]),
  clinicalCourse: text("clinical_course"), // Narrative summary of hospitalization

  // Outcome
  outcome: text("outcome"), // e.g., "recovered", "deteriorated", "died", "transferred"
  outcomeDate: timestamp("outcome_date"),
  dischargeDisposition: text("discharge_disposition"), // e.g., "home", "rehab", "ltac", "hospice"
  readmissionRisk: text("readmission_risk"), // e.g., "low", "medium", "high"

  // Metadata
  contributingHospitalId: integer("contributing_hospital_id").notNull(), // References hospitals table
  contributingSpecialty: text("contributing_specialty"), // e.g., "cardiology", "neurology"
  caseSeverity: text("case_severity"), // e.g., "mild", "moderate", "severe", "critical"
  verificationStatus: text("verification_status", {
    enum: ["pending", "clinician_reviewed", "verified", "disputed"]
  }).notNull().default("pending"),

  // Privacy and consent fields
  consentLevel: text("consent_level", {
    enum: ["anonymous", "pseudonymized", "limited_dataset", "full_phi"] // For internal use only
  }).notNull().default("anonymous"),
  dataRetentionUntil: timestamp("data_retention_until"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Case Embeddings for AI-powered similarity search
export const caseEmbeddingsTable = pgTable("case_embeddings", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => caseGraphsTable.id, { onDelete: "cascade" }),

  // Different embedding types for different aspects of the case
  symptomEmbedding: jsonb("symptom_embedding"), // Vector embedding of symptoms
  diagnosisEmbedding: jsonb("diagnosis_embedding"), // Vector embedding of diagnoses
  treatmentEmbedding: jsonb("treatment_embedding"), // Vector embedding of treatments
  outcomeEmbedding: jsonb("outcome_embedding"), // Vector embedding of outcomes
  compositeEmbedding: jsonb("composite_embedding").notNull(), // Combined embedding for overall similarity

  // Embedding metadata
  embeddingModel: text("embedding_model").notNull(), // e.g., "medgemma-4b-it", "clinical-bert"
  embeddingVersion: text("embedding_version").notNull().default("1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCaseGraphSchema = createInsertSchema(caseGraphsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCaseGraph = z.infer<typeof insertCaseGraphSchema>;
export type CaseGraph = typeof caseGraphsTable.$inferSelect;

export const insertCaseEmbeddingSchema = createInsertSchema(caseEmbeddingsTable).omit({ id: true, createdAt: true });
export type InsertCaseEmbedding = z.infer<typeof insertCaseEmbeddingSchema>;
export type CaseEmbedding = typeof caseEmbeddingsTable.$inferSelect;