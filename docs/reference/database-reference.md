# Chikit by Solar - Database Reference

This document provides a comprehensive reference of the Chikit database schema, including all tables, columns, data types, constraints, and relationships. The schema is implemented using Drizzle ORM with PostgreSQL.

## Overview

The Chikit database follows a relational model with tables organized around core healthcare entities: patients, hospitals, users/staff, clinical encounters, medical records, laboratory results, prescriptions, appointments, billing, and specialized modules for ABDM integration, AI analysis, case management, and more.

## Conventions

- **Primary Key**: `id` column of type `serial` (auto-incrementing integer) unless otherwise specified
- **Foreign Keys**: Named as `{entity}Id` (e.g., `patientId`, `hospitalId`) referencing the `id` column of the respective table
- **Timestamps**: `createdAt` and `updatedAt` columns of type `timestamp` with `defaultNow()` for automatic population
- **Soft Deletes**: `isActive` column of type `boolean` with `default(true)` for logical deletion
- **Enums**: Defined using PostgreSQL enum types via Drizzle for constrained values
- **JSONB**: Used for flexible storage of complex or variable-structured data
- **Unique Constraints**: Applied where business logic requires uniqueness (e.g., patient codes, ABHA numbers)
- **Indexes**: Implicit through primary keys, unique constraints, and foreign keys; additional indexes may be needed for performance

## Table Reference

### 1. Patients Table
**File**: `lib/db/src/schema/patients.ts`
**Purpose**: Stores core patient demographic and identification information

#### Schema
```typescript
export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientCode: text("patient_code").notNull().unique(),
  chikitHealthId: text("chikit_health_id").unique(),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  bloodGroup: text("blood_group"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  govtIdType: text("govt_id_type"),
  govtIdNumber: text("govt_id_number"),
  hospitalId: integer("hospital_id"),
  isActive: boolean("is_active").notNull().default(true),
  abhaNumber: text("abha_number").unique(),
  abhaAddress: text("abha_address"),
  abhaVerified: boolean("abha_verified").default(false),
  abhaLinkedAt: timestamp("abha_linked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Key Points
- **Identifiers**: 
  - `patientCode`: Unique patient identifier within the system
  - `chikitHealthId`: Optional alternative health ID
  - `abhaNumber`: Unique Ayushman Bharat Health Account number (when linked)
- **Demographics**: Name, DOB, gender, blood group, contact information
- **Emergency Info**: Emergency contact and phone
- **Medical History**: Allergies, chronic conditions
- **Government ID**: ID type and number for verification purposes
- **Hospital Association**: `hospitalId` foreign key for multi-tenancy
- **ABHA Fields**: 
  - `abhaNumber`: Unique ABHA number (nullable, unique when set)
  - `abhaAddress`: ABHA address (nullable)
  - `abhaVerified`: Boolean flag for verification status
  - `abhaLinkedAt`: Timestamp when ABHA was linked
- **Status**: `isActive` for soft deletion
- **Audit**: Automatic timestamps

#### Indexes (Implicit)
- Primary key on `id`
- Unique constraint on `patientCode`
- Unique constraint on `chikitHealthId` (when set)
- Unique constraint on `abhaNumber` (when set)
- Foreign key index on `hospitalId`

### 2. Hospitals Table
**File**: `lib/db/src/schema/hospitals.ts`
**Purpose**: Stores comprehensive hospital information for multi-tenancy

#### Schema
```typescript
export const hospitalsTable = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  district: text("district"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  type: text("type").notNull().default("general"),
  bedCount: integer("bed_count"),
  category: text("category"),
  careType: text("care_type"),
  discipline: text("discipline"),
  specialties: text("specialties"),
  facilities: text("facilities"),
  numDoctors: integer("num_doctors"),
  website: text("website"),
  location: text("location"),
  sourceId: text("source_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Key Points
- **Identification**: 
  - `id`: Primary key
  - `sourceId`: External identifier for imported records (used for duplicate prevention)
- **Core Info**: Name, address, city, state, district, pincode, contact information
- **Classification**: 
  - `type`: Hospital type (default: "general")
  - `category`, `careType`, `discipline`: Categorization fields
  - `specialties`: Medical specialties offered
  - `facilities`: Available facilities and services
- **Capacity**: 
  - `bedCount`: Total number of beds
  - `numDoctors`: Number of doctors employed
- **Online Presence**: Website and location descriptors
- **Status**: `isActive` for soft deletion
- **Audit**: Automatic timestamps

#### Indexes (Implicit)
- Primary key on `id`
- Foreign key relationships: Patients and Users tables reference this via `hospitalId`

### 3. Users/Staff Table
**File**: `lib/db/src/schema/users.ts`
**Purpose**: Stores system users and hospital staff information

#### Schema
```typescript
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "doctor", "nurse", "pharmacist", "lab_tech", "front_desk", "records_keeper"] }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  hospitalId: integer("hospital_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Key Points
- **Authentication**: 
  - `username`: Unique login username
  - `password`: Hashed password (should be hashed before storage)
- **Identity**: 
  - `name`: Full name of the user
  - `email`: Unique email address
  - `phone`: Contact phone number
- **Authorization**: 
  - `role`: User role defining permissions (enum with common healthcare roles)
  - `hospitalId`: Foreign key for hospital assignment (multi-tenancy)
- **Status**: `isActive` for soft deletion
- **Audit**: Automatic timestamps

#### Indexes (Implicit)
- Primary key on `id`
- Unique constraint on `username`
- Unique constraint on `email`
- Foreign key index on `hospitalId`

### 4. Medical Records Table
**File**: `lib/db/src/schema/medical-records.ts`
**Purpose**: Stores clinical encounter notes and documentation

#### Schema
```typescript
export const medicalRecordsTable = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  providerId: integer("provider_id"),
  visitDate: timestamp("visit_date"),
  chiefComplaint: text("chief_complaint"),
  historyOfPresentIllness: text("history_of_present_illness"),
  pastMedicalHistory: text("past_medical_history"),
  familyHistory: text("family_history"),
  socialHistory: text("social_history"),
  physicalExam: text("physical_exam"),
  vitalSigns: jsonb("vital_signs"),
  assessment: text("assessment"),
  plan: text("plan"),
  proceduresPerformed: text("procedures_performed"),
  patientEducation: text("patient_education"),
  followUpInstructions: text("follow_up_instructions"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Key Points
- **Relationships**: 
  - `patientId`: Foreign key to patients table (required)
  - `providerId`: Foreign key to users table (provider who created the record)
- **Encounter Info**: 
  - `visitDate`: Timestamp of the encounter
  - `chiefComplaint`: Patient's primary reason for visit
- **Clinical Documentation**: 
  - Standard SOAP note components: History (HPI, PMH, FH, SH), Physical Exam, Assessment, Plan
  - `vitalSigns`: JSONB storage for structured vital signs data
  - `proceduresPerformed`: Description of procedures done during visit
  - `patientEducation`: Education provided to patient
  - `followUpInstructions`: Instructions for next steps
- **Status**: `isActive` for soft deletion
- **Audit**: Automatic timestamps

#### Indexes (Implicit)
- Primary key on `id`
- Foreign key index on `patientId`
- Foreign key index on `providerId`

### 5. AI Analysis Results Table
**File**: `lib/db/src/schema/ai-results.ts`
**Purpose**: Stores results from AI-powered analysis (symptom analysis, patient summarization, lab interpretation)

#### Schema
```typescript
export const aiAnalysisResultsTable = pgTable("ai_analysis_results", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  analysisType: text("analysis_type", { enum: ["symptom_analysis", "patient_summary", "lab_interpretation", "radiology_analysis"] }).notNull(),
  inputData: jsonb("input_data"),
  findings: jsonb("findings").notNull(),
  differentialDiagnosis: jsonb("differential_diagnosis"),
  recommendations: jsonb("recommendations").notNull(),
  urgencyLevel: text("urgency_level", { enum: ["low", "medium", "high", "critical"] }).notNull().default("low"),
  summary: text("summary").notNull(),
  disclaimer: text("disclaimer").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

#### Key Points
- **Relationship**: 
  - `patientId`: Foreign key to patients table (required)
- **Analysis Type**: 
  - `analysisType`: Enum specifying type of AI analysis performed
- **Input/Output**: 
  - `inputData`: JSONB storage of input provided to AI (symptoms, patient data, lab results)
  - `findings`: JSONB storage of AI-generated findings (required)
  - `differentialDiagnosis`: JSONB storage of potential alternative diagnoses
  - `recommendations`: JSONB storage of AI-generated recommendations (required)
  - `urgencyLevel`: Enum indicating urgency of findings (default: "low")
  - `summary`: Text summary of the analysis (required)
  - `disclaimer`: Required disclaimer about AI being for decision support only
- **Audit**: Automatic timestamp

#### Indexes (Implicit)
- Primary key on `id`
- Foreign key index on `patientId`

### 6. Appointments Table
**File**: `lib/db/src/schema/appointments.ts`
**Purpose**: Stores patient appointments and scheduling information

#### Schema
```typescript
export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  providerId: integer("provider_id"),
  hospitalId: integer("hospital_id"),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentType: text("appointment_type"),
  reason: text("reason"),
  status: text("status", { enum: ["scheduled", "checked_in", "in_progress", "completed", "cancelled", "no_show"] }).notNull().default("scheduled"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Key Points
- **Relationships**: 
  - `patientId`: Foreign key to patients table (required)
  - `providerId`: Foreign key to users table (assigned provider)
  - `hospitalId`: Foreign key to hospitals table (where appointment occurs)
- **Scheduling**: 
  - `appointmentDate`: Date and time of appointment (required)
  - `appointmentType`: Type of visit (follow-up, new patient, procedure, etc.)
  - `reason`: Reason for appointment
  - `status`: Appointment status workflow (enum with common states)
  - `notes`: Additional notes about the appointment
- **Status**: `isActive` for soft deletion
- **Audit**: Automatic timestamps

#### Indexes (Implicit)
- Primary key on `id`
- Foreign key index on `patientId`
- Foreign key index on `providerId`
- Foreign key index on `hospitalId`

### 7. Prescriptions Table
**File**: `lib/db/src/schema/prescriptions.ts`
**Purpose**: Stores medication prescriptions and related information

#### Schema
```typescript
export const prescriptionsTable = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  providerId: integer("provider_id"),
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration"),
  instructions: text("instructions"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  refillsRemaining: integer("refills_remaining").default(0),
  status: text("status", { enum: ["active", "completed", "cancelled", "expired"] }).notNull().default("active"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Key Points
- **Relationships**: 
  - `patientId`: Foreign key to patients table (required)
  - `providerId`: Foreign key to users table (prescribing provider)
- **Medication Details**: 
  - `medication`: Medication name (required)
  - `dosage`: Dosage amount and unit (required)
  - `frequency`: How often to take (required)
  - `duration`: How long to take the medication
  - `instructions`: Special instructions for taking medication
- **Timing**: 
  - `startDate`: When to start medication
  - `endDate`: When to stop medication
  - `refillsRemaining`: Number of refills allowed
- **Status**: 
  - `status`: Prescription status enum (active, completed, cancelled, expired)
  - Defaults to "active" when created
- **Status**: `isActive` for soft deletion
- **Audit**: Automatic timestamps

#### Indexes (Implicit)
- Primary key on `id`
- Foreign key index on `patientId`
- Foreign key index on `providerId`

### 8. Laboratory Reports Table
**File**: `lib/db/src/schema/lab-reports.ts`
**Purpose**: Stores laboratory test orders and results

#### Schema
```typescript
export const labReportsTable = pgTable("lab_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  providerId: integer("provider_id"),
  hospitalId: integer("hospital_id"),
  testName: text("test_name").notNull(),
  testCode: text("test_code"),
  specimenType: text("specimen_type"),
  collectionDate: timestamp("collection_date"),
  resultValue: text("result_value"),
  resultUnit: text("result_unit"),
  referenceRange: text("reference_range"),
  isAbnormal: boolean("is_abnormal"),
  isCritical: boolean("is_critical"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Key Points
- **Relationships**: 
  - `patientId`: Foreign key to patients table (required)
  - `providerId`: Foreign key to users table (ordering provider)
  - `hospitalId`: Foreign key to hospitals table (where test performed)
- **Test Information**: 
  - `testName`: Name of the laboratory test (required)
  - `testCode`: Standardized test code (LOINC, etc.)
  - `specimenType`: Type of specimen collected (blood, urine, etc.)
  - `collectionDate`: When specimen was collected
- **Results**: 
  - `resultValue`: Numeric or categorical result value
  - `resultUnit`: Unit of measurement (mg/dL, etc.)
  - `referenceRange`: Expected normal range
  - `isAbnormal`: Boolean flag for abnormal results
  - `isCritical`: Boolean flag for critical/panic values
  - `notes": Additional comments or interpretation
- **Status**: `isActive` for soft deletion
- **Audit**: Automatic timestamps

#### Indexes (Implicit)
- Primary key on `id`
- Foreign key index on `patientId`
- Foreign key index on `providerId`
- Foreign key index on `hospitalId`

### 9. Radiology Reports Table
**File**: `lib/db/src/schema/radiology-reports.ts`
**Purpose**: Stores radiology imaging orders and reports

#### Schema
```typescript
export const radiologyReportsTable = pgTable("radiology_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  providerId: integer("provider_id"),
  hospitalId: integer("hospital_id"),
  studyName: text("study_name").notNull(),
  studyCode: text("study_code"),
  modality: text("modality"), // X-ray, CT, MRI, Ultrasound, etc.
  bodyPart: text("body_part"),
  contrastUsed: boolean("contrast_used"),
  studyDate: timestamp("study_date"),
  findings: text("findings"),
  impression: text("impression"),
  radiologistId: integer("radiologist_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Key Points
- **Relationships**: 
  - `patientId`: Foreign key to patients table (required)
  - `providerId`: Foreign key to users table (ordering provider)
  - `hospitalId`: Foreign key to hospitals table (where study performed)
  - `radiologistId`: Foreign key to users table (radiologist who interpreted)
- **Study Information**: 
  - `studyName`: Name of the radiology study (required)
  - `studyCode`: Standardized study code
  - `modality`: Imaging modality (X-ray, CT, MRI, etc.)
  - `bodyPart`: Body part examined
  - `contrastUsed`: Whether contrast agent was used
  - `studyDate`: When study was performed
- **Results**: 
  - `findings`: Detailed observations from the study
  - `impression`: Radiologist's conclusion and diagnosis
- **Status**: `isActive` for soft deletion
- **Audit**: Automatic timestamps

#### Indexes (Implicit)
- Primary key on `id`
- Foreign key index on `patientId`
- Foreign key index on `providerId`
- Foreign key index on `hospitalId`
- Foreign key index on `radiologistId`

### 10. ABHA-related Fields (in Patients Table)
As documented in the patients table, ABHA integration adds these fields:
- `abhaNumber`: text, unique when set
- `abhaAddress`: text
- `abhaVerified`: boolean, default false
- `abhaLinkedAt`: timestamp

These fields enable the ABDM/ABHA integration features documented elsewhere.

### 11. Controlled Medications Schedules Table
**File**: `lib/db/src/schema/controlled-medication-schedules.ts`
**Purpose**: Tracks controlled substance prescriptions and dispensing (note: this is a large schema suggesting detailed tracking)

#### Schema
```typescript
export const controlledMedicationSchedulesTable = pgTable("controlled_medication_schedules", {
  id: serial("id").primaryKey(),
  // Many columns for detailed tracking of controlled substances
  // Based on file size (13.2K), this includes extensive fields for:
  // - Prescription details
  // - Dispensing records
  // - Inventory tracking
  // - Patient/provider information
  // - Regulatory compliance fields
  // - Transaction tracking
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

*Note: Due to the large size of this file, specific column definitions are not shown here, but the table exists for comprehensive controlled substance management.*

### 12. Case Management Tables
Several tables support sophisticated case management and longitudinal tracking:

#### Case Graphs Table
**File**: `lib/db/src/schema/case-graphs.ts`
**Purpose**: Stores nodes and edges for case relationship graphs
```typescript
export const caseGraphsTable = pgTable("case_graphs", {
  id: serial("id").primaryKey(),
  // Fields for graph nodes representing clinical encounters, episodes, etc.
  // Based on file size (5.2K), this includes:
  // - Node type and labels
  // - Associated patient and encounter IDs
  // - Temporal information
  // - Clinical data and summaries
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Case Network Table
**File**: `lib/db/src/schema/case-network.ts`
**Purpose**: Stores network-level case relationships and patterns
```typescript
export const caseNetworkTable = pgTable("case_network", {
  id: serial("id").primaryKey(),
  // Fields for network analysis and population-level patterns
  // Based on file size (1.7K), this includes:
  # - Network metrics and connections
  # - Population health patterns
  # - Cohort identification
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Case Contributions Table
**File**: `lib/db/src/schema/case-contributions.ts`
**Purpose**: Tracks contributions to cases from different providers/encounters
```typescript
export const caseContributionsTable = pgTable("case_contributions", {
  id: serial("id").primaryKey(),
  // Fields for attributing clinical actions and decisions to specific encounters
  # Based on file size (1.8K), this includes:
  # - Contribution type and description
  # - Associated encounter/provider
  # - Timestamps and context
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Case Consents Table
**File**: `lib/db/src/schema/case-consents.ts`
**Purpose**: Manages consent for case-related data sharing and usage
```typescript
export const caseConsentsTable = pgTable("case_consents", {
  id: serial("id").primaryKey(),
  # Fields for consent management related to cases
  # Based on file size (1.6K), this includes:
  # - Consent type and scope
  # - Granted/revoked status
  # - Purpose and expiration
  # - Associated case and patient
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Case Graph Consent and Provenance Routes
The existence of `casegraph-consent.ts` and `casegraph-provenance.ts` route files suggests additional functionality for managing consent and provenance tracking within the case management system.

### 13. Audit Logs Table
**File**: `lib/db/src/schema/audit-logs.ts`
**Purpose**: Tracks system activities for security, compliance, and quality improvement

#### Schema
```typescript
export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  // Based on file size (789B), this is a relatively compact table suggesting:
  # - Action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
  # - User ID (who performed the action)
  # - Entity type and ID (what was acted upon)
  # - Timestamp
  # - Possibly changes or metadata (though table size suggests basic implementation)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

*Note: The small size suggests this may be a basic implementation that could be enhanced with before/after tracking and more detailed metadata.*

### 14. Admission Coordination Table
**File**: `lib/db/src/schema/admissionCoordination.ts`
**Purpose**: Manages patient admission workflows and bed assignments

#### Schema
```typescript
export const admissionCoordinationTable = pgTable("admission_coordination", {
  id: serial("id").primaryKey(),
  # Based on file size (2.2K), this includes:
  # - Patient ID
  # - Admission request details
  # - Bed assignment information
  # - Admission status and workflow tracking
  # - Related clinical information
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 15. Hospital Capacity and Bed Management Tables
Several tables support hospital resource management:

#### Hospital Beds Table
**File**: `lib/db/src/schema/hospitalBeds.ts`
**Purpose**: Tracks individual hospital beds and their status
```typescript
export const hospitalBedsTable = pgTable("hospital_beds", {
  id: serial("id").primaryKey(),
  # Based on file size (1.7K), this includes:
  # - Hospital ID
  # - Bed identifier/number
  # - Bed type and category
  # - Current status (available, occupied, maintenance, etc.)
  # - Associated patient/rooms
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Bed Assignments Table
**File**: `lib/db/src/schema/bedAssignments.ts`
**Purpose**: Tracks bed assignments to patients over time
```typescript
export const bedAssignmentsTable = pgTable("bed_assignments", {
  id: serial("id").primaryKey(),
  # Based on file size (1.5K), this includes:
  # - Hospital ID
  # - Bed ID
  # - Patient ID
  # - Assignment start and end times
  # - Assignment reason and status
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Bed Categories Table
**File**: `lib/db/src/schema/bedCategories.ts`
**Purpose**: Defines categories of beds (ICU, general, pediatric, etc.)
```typescript
export const bedCategoriesTable = pgTable("bed_categories", {
  id: serial("id").primaryKey(),
  # Based on file size (1.2K), this includes:
  # - Category name and description
  # - Associated equipment and features
  # - Typical use cases
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Bed Reservations Table
**File**: `lib/db/src/schema/bedReservations.ts`
**Purpose**: Tracks advance reservations of beds for scheduled admissions
```typescript
export const bedReservationsTable = pgTable("bed_reservations", {
  id: serial("id").primaryKey(),
  # Based on file size (1.7K), this includes:
  # - Hospital ID
  # - Bed ID
  # - Patient ID (for whom reserved)
  # - Reservation start and end times
  # - Reservation status and reason
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Hospital Capacity Tables
Several tables track hospital capacity metrics:
- `hospital-capacity.ts` (570B): Basic capacity metrics
- `hospitalCapacityAlerts.ts` (1.6K): Capacity threshold alerts
- `hospitalCapacitySnapshots.ts` (1.9K): Historical capacity snapshots
- `hospitalFacilities.ts` (1.4K): Hospital facilities and services
- `hospitalRoutes.ts` (1.4K): Patient transfer and referral routing

### 16. Specialized Tables
Several other tables support specific healthcare functions:

#### Doctors Table
**File**: `lib/db/src/schema/doctors.ts`
**Purpose**: Stores detailed information about medical doctors
```typescript
export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  # Based on file size (940B), this includes:
  # - User ID link (if users table contains auth info)
  # - Specialty and board certification
  # - License information
  # - Education and training
  # - Contact and practice details
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Drugs Table
**File**: `lib/db/src/schema/drugs.ts`
**Purpose**: Stores medication formulary and drug information
```typescript
export const drugsTable = pgTable("drugs", {
  id: serial("id").primaryKey(),
  # Based on file size (1.1K), this includes:
  # - Medication name and identifiers
  # - Drug class and mechanism
  # - Indications and contraindications
  # - Dosage forms and strengths
  # - Side effects and warnings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### OTP Codes Table
**File**: `lib/db/src/schema/otp-codes.ts`
**Purpose**: Stores one-time passwords for verification workflows
```typescript
export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  # Based on file size (439B), this includes:
  # - Associated user/patient ID
  # - Purpose (ABHA verification, login, etc.)
  # - The OTP code itself
  # - Expiration timestamp
  # - Usage status
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

#### Provenance Ledger Table
**File**: `lib/db/src/schema/provenance-ledger.ts`
**Purpose**: Tracks data lineage and provenance for auditability
```typescript
export const provenanceLedgerTable = pgTable("provenance_ledger", {
  id: serial("id").primaryKey(),
  # Based on file size (4.0K), this includes:
  # - Data source tracking
  # - Transformation history
  # - Quality and reliability metrics
  # - Audit trail for critical data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Inter-Hospital Transfers Table
**File**: `lib/db/src/schema/interHospitalTransfers.ts`
**Purpose**: Tracks patient transfers between hospitals
```typescript
export const interHospitalTransfersTable = pgTable("inter_hospital_transfers", {
  id: serial("id").primaryKey(),
  # Based on file size (2.0K), this includes:
  # - Patient ID
  # - Transferring and receiving hospitals
  # - Transfer date and reason
  # - Clinical summary and handoff information
  # - Transport details and status
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Case Network Table
(Already documented above under case management)

#### Consent Requests Table
**File**: `lib/db/src/schema/consent-requests.ts`
**Purpose**: Manages consent requests for data sharing and procedures
```typescript
export const consentRequestsTable = pgTable("consent_requests", {
  id: serial("id").primaryKey(),
  # Based on file size (775B), this includes:
  # - Request ID
  # - Associated patient and user
  # - Purpose and scope of consent
  # - Status (pending, granted, denied, expired)
  # - Timestamp information
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### 17. Billing Table
**File**: `lib/db/src/schema/billing.ts`
**Purpose**: Stores billing and financial transaction information
```typescript
export const billingTable = pgTable("billing", {
  id: serial("id").primaryKey(),
  # Based on file size (1.1K), this includes:
  # - Patient ID
  # - Encounter/visit ID
  # - Service/item description and codes
  # - Charges, payments, and adjustments
  # - Insurance information
  # - Payment status and dates
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Notes on Billing
The relatively small size (1.1K) suggests this may be a basic implementation. A full-featured billing system would typically be much more complex, including:
- Detailed service/procedure coding (CPT, HCPCS, ICD)
- Insurance eligibility and claims management
- Payment posting and reconciliation
- Patient statements and collections
- Adjustments and write-offs
- Financial reporting

### 18. Tables from IMPLEMENTATION_SUMMARY Cross-Reference
The IMPLEMENTATION_SUMMARY.md file mentions several additional components that should correspond to tables:

#### Patients Table (Already documented)
- Includes ABHA fields: abhaNumber, abhaAddress, abhaVerified, abhaLinkedAt

#### AI Analysis Results Table (Already documented)
- Stores various AI analysis types with findings, recommendations, etc.

#### Hospitals Table (Already documented)
- Comprehensive hospital information with CSV import capability

## Relationships and Data Flow

### Key Foreign Key Relationships
1. **Patients → Hospitals**: `patients.hospitalId` → `hospitals.id`
   - Each patient is associated with a primary hospital
   - Enables multi-tenancy and data scoping

2. **Users/Staff → Hospitals**: `users.hospitalId` → `hospitals.id`
   - Each staff member is assigned to a hospital
   - Enables role-based access control with hospital scoping

3. **Medical Records → Patients**: `medical_records.patientId` → `patients.id`
   - Each medical record belongs to a patient
   - Enables longitudinal patient history

4. **Medical Records → Users/Staff**: `medical_records.providerId` → `users.id`
   - Each medical record is created by a provider
   - Enables attribution and accountability

5. **Appointments → Patients**: `appointments.patientId` → `patients.id`
   - Each appointment is for a specific patient
   - Enables patient scheduling views

6. **Appointments → Users/Staff**: `appointments.providerId` → `users.id`
   - Each appointment has an assigned provider
   - Enables provider schedule views

7. **Appointments → Hospitals**: `appointments.hospitalId` → `hospitals.id`
   - Each appointment occurs at a specific hospital
   - Enables hospital resource planning

8. **Prescriptions → Patients**: `prescriptions.patientId` → `patients.id`
   - Each prescription is for a specific patient
   - Enables medication history tracking

9. **Prescriptions → Users/Staff**: `prescriptions.providerId` → `users.id`
   - Each prescription is prescribed by a provider
   - Enables prescription tracking per provider

10. **Lab Reports → Patients**: `lab_reports.patientId` → `patients.id`
    - Each lab report is for a specific patient
    - Enables lab result tracking per patient

11. **Lab Reports → Users/Staff**: `lab_reports.providerId` → `users.id`
    - Each lab report is ordered by a provider
    - Enables lab ordering tracking per provider

12. **Lab Reports → Hospitals**: `lab_reports.hospitalId` → `hospitals.id`
    - Each lab test is performed at a specific hospital
    - Enables lab utilization tracking per hospital

13. **Radiology Reports → Patients**: `radiology_reports.patientId` → `patients.id`
    - Each radiology report is for a specific patient
    - Enables imaging history tracking per patient

14. **Radiology Reports → Users/Staff**: `radiology_reports.providerId` → `users.id`
    - Each radiology study is ordered by a provider
    - Enables imaging ordering tracking per provider

15. **Radiology Reports → Hospitals**: `radiology_reports.hospitalId` → `hospitals.id`
    - Each imaging study is performed at a specific hospital
    - Enables imaging utilization tracking per hospital

16. **Radiology Reports → Users/Staff**: `radiology_reports.radiologistId` → `users.id`
    - Each imaging study is interpreted by a radiologist
    - Enables radiologist workload tracking

17. **AI Analysis Results → Patients**: `ai_analysis_results.patientId` → `patients.id`
    - Each AI analysis is for a specific patient
    - Enables AI-assisted care tracking per patient

### Data Flow Example: Patient Visit
1. **Registration**: Patient record created in `patients` table
2. **Scheduling**: Appointment created in `appointments` table with links to patient, provider, hospital
3. **Visit**: Medical record created in `medical_records` table with links to patient and provider
4. **Orders**: 
   - Lab orders created in `lab_reports` table (initially without results)
   - Prescriptions created in `prescriptions` table
   - Imaging orders created in `radiology_reports` table
5. **Results**: 
   - Lab results added to `lab_reports` table
   - AI analysis results created in `ai_analysis_results` table
   - Radiology reports added to `radiology_reports` table
6. **Billing**: Charges created in `billing` table
7. **Follow-up**: Future appointments scheduled in `appointments` table

### Data Flow Example: ABHA Linking
1. **Initiate**: Patient requests ABHA linking
2. **Verify**: OTP verification through ABDM service
3. **Link**: Patient record updated in `patients` table with ABHA fields
4. **Audit**: Entry created in `audit_logs` table
5. **Profile**: ABHA profile fetched and potentially stored (implementation dependent)

## Schema Design Patterns

### 1. Extensibility Patterns
- **JSONB Columns**: Used for flexible data storage (`inputData`, `findings`, `vitalSigns`, etc.)
- **Enum Types**: Used for constrained values with clear semantics (`gender`, `analysisType`, `status`, etc.)
- **Timestamp Columns**: Automatic `createdAt` and `updatedAt` for audit trails
- **Soft Delete Pattern**: `isActive` boolean for logical deletion instead of hard deletes

### 2. Reference Data Patterns
- **Lookup Tables**: Implied through enum types and reference data (could be externalized to separate tables)
- **Hierarchical Data**: Suggested through categorization fields (hospital type, bed categories, etc.)

### 3. Audit and Compliance Patterns
- **Automatic Timestamps**: Created/updated timestamps on all tables
- **Audit Table**: Dedicated `audit_logs` table for tracking actions
- **Foreign Key Relationships**: Enable tracing of actions to specific entities
- **JSONB for Flexible Data**: Allows storage of variable-structured audit details

### 4. Multi-tenancy Patterns
- **Foreign Key to Hospitals**: `hospitalId` in patients, users, and other tables
- **Implied Scoping**: Through patient-hospital relationships in clinical data
- **Explicit Scoping**: Direct hospital references where needed (appointments, lab reports, etc.)

### 5. Temporal Patterns
- **Point-in-time Timestamps**: Specific event times (visitDate, appointmentDate, studyDate, etc.)
- **Duration Fields**: Start/end dates for episodes of care (prescriptions, hospital stays, etc.)
- **Timestamp Sequences**: Created/updated for audit trails
- **Expiration Fields**: For time-limited authorizations (prescription refills, consent, etc.)

## Constraints and Validation

### Database-Level Constraints
1. **Primary Keys**: Ensure uniqueness and not-null for identification
2. **Unique Constraints**: 
   - `patients.patientCode`
   - `patients.chikitHealthId` (when set)
   - `patients.abhaNumber` (when set)
   - `users.username`
   - `users.email`
3. **Foreign Key Constraints**: Ensure referential integrity between tables
4. **Check Constraints**: Implied through enum types for validated values
5. **Not Null Constraints**: On required fields per business logic

### Application-Level Validation (Inferred)
1. **Input Validation**: Zod schemas used in API route handlers
2. **Business Logic Validation**: 
   - Date ranges (end dates after start dates)
   - Reference range validation for lab results
   - Dosage and frequency validation for prescriptions
   - OTP validation and expiration
   - ABHA number format validation
   - Consent workflow validation
3. **Cross-table Validation** (Application Level):
   - Preventing duplicate ABHA linking
   - Ensuring provider is authorized for patient
   - Validating appointment availability
   - Checking medication interactions and allergies

## Indexing Strategy (Implicit and Recommended)

### Automatically Created Indexes
1. **Primary Key Indexes**: On all `id` columns
2. **Unique Constraint Indexes**: 
   - `patients.patientCode`
   - `patients.chikitHealthId`
   - `patients.abhaNumber`
   - `users.username`
   - `users.email`
3. **Foreign Key Indexes**: 
   - All foreign key columns should have indexes for join performance
   - This includes: `patientId`, `providerId`, `hospitalId` in various tables

### Recommended Additional Indexes
Based on common query patterns, consider adding:

1. **Patients Table**:
   - Index on `abhaNumber` (for ABHA lookups)
   - Index on `abhaVerified` (for filtering verified ABHA patients)
   - Composite index on (`hospitalId`, `isActive`) (for hospital patient lists)

2. **Hospitals Table**:
   - Index on `state` (for state-based filtering)
   - Index on `isActive` (for active hospital lists)
   - Index on (`state`, `isActive`) (for active hospitals by state)

3. **Users/Staff Table**:
   - Index on `hospitalId` (for hospital staff lists)
   - Index on `role` (for role-based filtering)
   - Index on (`hospitalId`, `role`) (for hospital staff by role)

4. **Medical Records Table**:
   - Index on `patientId` (for patient history queries)
   - Index on `providerId` (for provider documentation queries)
   - Index on `visitDate` (for date-range queries)
   - Composite index on (`patientId`, `visitDate`) (for patient history over time)

5. **Appointments Table**:
   - Index on `appointmentDate` (for scheduling and availability)
   - Index on `status` (for filtering by status)
   - Index on `patientId` (for patient appointment history)
   - Index on `providerId` (for provider schedule)
   - Index on `hospitalId` (for hospital appointment load)
   - Composite index on (`appointmentDate`, `status`) (for finding available slots)

6. **Lab/Radiology Reports Tables**:
   - Index on `patientId` (for patient result history)
   - Index on `providerId` (for provider ordering history)
   - Index on `hospitalId` (for facility utilization)
   - Index on `collectionDate`/`studyDate` (for date-range queries)
   - Index on `isAbnormal`/`isCritical` (for flagging abnormal results)

7. **Prescriptions Table**:
   - Index on `patientId` (for patient medication history)
   - Index on `providerId` (for provider prescribing history)
   - Index on `status` (for active prescriptions)
   - Index on `endDate` (for expiring prescriptions)
   - Composite index on (`patientId`, `status`) (for patient's active medications)

8. **AI Analysis Results Table**:
   - Index on `patientId` (for patient AI history)
   - Index on `analysisType` (for filtering by analysis type)
   - Index on `createdAt` (for recent analyses)
   - Composite index on (`patientId`, `analysisType`) (for patient's specific AI analyses)

9. **Audit Logs Table**:
   - Index on `createdAt` (for time-based queries)
   - Index on `userId` (for user activity queries)
   - Index on `entityType` and `entityId` (for entity-specific history)
   - Composite index on (`createdAt`, `userId`) (for recent user activity)

## Schema Evolution and Migrations

The schema uses Drizzle ORM which supports migrations through SQL files. Migration history would be tracked separately, but the current schema represents the latest state.

### Migration Considerations
1. **Backward Compatibility**: New columns should be nullable or have sensible defaults
2. **Data Migration**: When changing data types or adding constraints, existing data may need transformation
3. **Performance**: Adding indexes on large tables requires consideration of lock duration and performance impact
4. **Rolling Updates**: Schema changes should be compatible with rolling deployment strategies where possible
5. **Testing**: Migration scripts should be tested on copies of production data before applying to live systems

## Data Quality and Integrity

### Implicit Constraints
1. **Referential Integrity**: Foreign keys prevent orphaned records
2. **Uniqueness**: Prevents duplicate identifiers where business logic requires uniqueness
3. **Data Types**: Column types prevent storage of invalid data formats
4. **Enumerations**: Restrict values to predefined sets where appropriate

### Application-Level Enforcement (Inferred)
1. **Input Validation**: Prevents invalid data from entering the system
2. **Business Rules**: Enforces complex validation that can't be expressed in schema alone
3. **Consistency Checks**: May include periodic validation processes
4. **Audit Trails**: Enable detection and correction of data quality issues

### Known Limitations from Schema Inspection
1. **Audit Table Size**: The `audit_logs` table is relatively small (789B), suggesting it may not capture before/after values or extensive metadata
2. **Billing Complexity**: The billing table is relatively small (1.1K), suggesting it may not implement full revenue cycle management
3. **JSONB Overuse**: While flexible, excessive use of JSONB can make querying and indexing challenging
4. **Enum Limitations**: PostgreSQL enums require schema modification to change, which can be disruptive in production
5. **Timestamp Precision**: Timestamp columns may not include timezone information (to be verified based on implementation)

## Summary

The Chikit database schema demonstrates a thoughtful design that supports the core healthcare functionality while incorporating modern architectural patterns:

### Strengths
1. **Normalization**: Well-normalized structure reducing data redundancy
2. **Referential Integrity**: Foreign key relationships ensure data consistency
3. **Extensibility**: JSONB columns and modular design allow for future enhancement
4. **Audit Readiness**: Automatic timestamps and dedicated audit table
5. **Multi-tenancy**: Hospital-scoped design enables true multi-hospital operation
6. **Clinical Completeness**: Comprehensive coverage of patient, encounter, orders, results, and medications
7. **Integration Points**: Clear fields for external system integration (ABDA, AI services)
8. **Scalability Foundations**: Proper indexing through keys and relationships

### Areas for Enhancement
1. **Audit Completeness**: Enhance audit logging to include before/after values and more detailed metadata
2. **Billing Complexity**: Expand billing functionality to support full revenue cycle management
3. **Data Warehousing**: Consider separating operational and analytical workloads for reporting
4. **Temporal Tables**: Consider system-versioned tables for historical tracking
5. **Partitioning**: Consider table partitioning for large tables (lab results, medical records) by date
6. **Encryption**: Consider column-level encryption for highly sensitive data (to be evaluated based on requirements)
7. **Archiving**: Consider strategies for archiving old data while maintaining accessibility for reporting

The schema provides a solid foundation for a healthcare information system that can support the advanced features implemented in Chikit, including ABDM/ABHA integration, MedGemma offline AI, comprehensive hospital management, and sophisticated case management. With continued evolution, it can support even more advanced healthcare workflows while maintaining data integrity, security, and compliance.