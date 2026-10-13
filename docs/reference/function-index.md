# Chikit by Solar - Function Index

This document provides an index of key functions discovered in the Chikit codebase, organized by module and service. Each entry includes the function signature, purpose, parameters, return value, and location.

## ABDM Service (`artifacts/api-server/src/abdm/service.ts`)

### ABDMService Class
**Location**: `artifacts/api-server/src/abdm/service.ts`
**Purpose**: Main service class for ABDM/ABHA integration

#### Constructor
```typescript
constructor()
```
**Purpose**: Initializes the ABDM service with configuration validation
**Parameters**: None
**Returns**: ABDMService instance
**Throws**: Error in production if configuration validation fails

#### Private Methods
```typescript
private getAuthHeaders(): Record<string, string>
```
**Purpose**: Generates authentication headers for ABDM API requests
**Parameters**: None
**Returns**: Object containing authorization headers

```typescript
private generateTransactionId(): string
```
**Purpose**: Creates a unique transaction ID for ABDM requests
**Parameters**: None
**Returns**: Transaction ID string in format `TXN_<timestamp>_<random>`

```typescript
private generateAbhaNumber(): string
```
**Purpose**: Generates a formatted ABHA number (demo purposes)
**Parameters**: None
**Returns**: Formatted ABHA number (e.g., "1234-5678-9012-3456")

```typescript
private generateAbhaAddress(name: string): string
```
**Purpose**: Generates an ABHA address from patient name (demo purposes)
**Parameters**: 
- `name`: Patient name string
**Returns**: ABHA address string in format `cleanname123@abdm`

```typescript
private generateJwtToken(payload: any): string
```
**Purpose**: Generates a JWT token for internal authentication
**Parameters**:
- `payload`: Object to encode in JWT payload
**Returns**: JWT token string (base64 encoded payload + HMAC signature)

#### Public Methods
```typescript
async initiateAbhaRegistrationWithAadhaar(aadhaarNumber: string): Promise<{ transactionId: string; response: any }>
```
**Purpose**: Step 1 of Aadhaar-based ABHA registration - generate OTP
**Parameters**:
- `aadhaarNumber`: 12-digit Aadhaar number
**Returns**: Object containing transactionId and ABDM API response
**Throws**: Error for invalid Aadhaar number format

```typescript
async verifyAbhaRegistrationWithAadhaar(transactionId: string, otp: string): Promise<{ transactionId: string; abhaNumber: string; abhaAddress: string; profile: any }>
```
**Purpose**: Step 2 of Aadhaar-based ABHA registration - verify OTP
**Parameters**:
- `transactionId`: Transaction ID from initiate step
- `otp`: 6-digit OTP received by user
**Returns**: Object containing transactionId, ABHA number, ABHA address, and profile
**Throws**: Error for invalid OTP or expired transaction

```typescript
async initiateAbhaRegistrationWithMobile(mobileNumber: string): Promise<{ transactionId: string; response: any }>
```
**Purpose**: Step 1 of Mobile-based ABHA registration - generate OTP
**Parameters**:
- `mobileNumber`: Mobile number (10-15 digits)
**Returns**: Object containing transactionId and ABDM API response
**Throws**: Error for invalid mobile number format

```typescript
async verifyAbhaRegistrationWithMobile(transactionId: string, otp: string, name: string, gender: string, dateOfBirth: string): Promise<{ transactionId: string; abhaNumber: string; abhaAddress: string; profile: any }>
```
**Purpose**: Step 2 of Mobile-based ABHA registration - verify OTP
**Parameters**:
- `transactionId`: Transaction ID from initiate step
- `otp`: 6-digit OTP received by user
- `name`: Patient name
- `gender`: Patient gender (male/female/other)
- `dateOfBirth`: Patient date of birth (YYYY-MM-DD format)
**Returns**: Object containing transactionId, ABHA number, ABHA address, and profile
**Throws**: Error for invalid OTP, expired transaction, or validation failures

```typescript
async initiateAbhaAuth(abhaNumber: string): Promise<{ transactionId: string; response: any }>
```
**Purpose**: Step 1 of ABHA-based authentication - initiate auth
**Parameters**:
- `abhaNumber`: Patient's ABHA number
**Returns**: Object containing transactionId and ABDM API response
**Throws**: Error for invalid ABHA number format or service issues

```typescript
async verifyAbhaAuth(transactionId: string, otp: string): Promise<{ transactionId: string; abhaNumber: string; name: string; token: string }>
```
**Purpose**: Step 2 of ABHA-based authentication - verify OTP and authenticate
**Parameters**:
- `transactionId`: Transaction ID from initiate step
- `otp`: 6-digit OTP received by user
**Returns**: Object containing transactionId, ABHA number, name, and JWT token
**Throws**: Error for invalid OTP, expired transaction, or authentication failure

```typescript
async linkAbhaToPatient(patientId: number, abhaNumber: string, abhaAddress?: string): Promise<{ success: true; patient: Patient }>
```
**Purpose**: Link an ABHA number to a patient record
**Parameters**:
- `patientId`: Chikit patient ID
- `abhaNumber`: ABHA number to link
- `abhaAddress`: Optional ABHA address (will be generated if not provided)
**Returns**: Object indicating success and updated patient data
**Throws**: Error for invalid patient ID, ABHA already linked, or service failure

```typescript
async getAbhaProfile(abhaNumber: string): Promise<any>
```
**Purpose**: Fetch ABHA profile information from ABDM servers
**Parameters**:
- `abhaNumber`: ABHA number to look up
**Returns**: ABHA profile object from ABDM API
**Throws**: Error for invalid ABHA number or service failure

### ABDM Service Instance
```typescript
export const abdmService: ABDMService
```
**Purpose**: Singleton instance of the ABDM service
**Location**: End of `artifacts/api-server/src/abdm/service.ts`

## MedGemma Service (`artifacts/api-server/src/medgemma/service.ts`)

### MedGemmaService Class
**Location**: `artifacts/api-server/src/medgemma/service.ts`
**Purpose**: Main service class for MedGemma offline AI integration

#### Constructor
```typescript
constructor()
```
**Purpose**: Initializes the MedGemma service with configuration
**Parameters**: None
**Returns**: MedGemmaService instance
**Sets**: inferenceUrl, modelName, and availability check

#### Private Methods (Inferred from code inspection)
- Various helper functions for prompt engineering, response parsing, and fallback logic

#### Public Methods
```typescript
async isMedGemmaAvailable(): Promise<boolean>
```
**Purpose**: Check if the MedGemma inference server is available
**Parameters**: None
**Returns**: Boolean indicating server availability
**Note**: Makes HTTP request to inference server health endpoint

```typescript
async analyzeSymptomsMedGemma(symptoms: string, patientContext?: any): Promise<{ findings: any; differentialDiagnosis: any[]; recommendations: any[]; urgencyLevel: string; summary: string; disclaimer: string }>
```
**Purpose**: Perform AI-powered symptom analysis using MedGemma
**Parameters**:
- `symptoms`: String describing patient symptoms
- `patientContext`: Optional patient context (age, gender, history, etc.)
**Returns**: Structured AI analysis results
**Behavior**: 
- Checks MedGemma server availability
- If available: Sends prompt to local inference server
- If unavailable: Falls back to rule-based AI
- Returns structured response with findings, differential diagnosis, recommendations, urgency level, summary, and disclaimer

```typescript
async summarizePatientMedGemma(patientData: any): Promise<{ summary: string; keyFindings: any[]; careRecommendations: any[]; disclaimer: string }>
```
**Purpose**: Perform AI-powered patient record summarization using MedGemma
**Parameters**:
- `patientData`: Object containing patient information (medical history, vitals, labs, etc.)
**Returns**: Structured patient summary
**Behavior**: 
- Checks MedGemma server availability
- If available: Sends prompt to local inference server
- If unavailable: Falls back to rule-based AI
- Returns structured summary with key findings and care recommendations

```typescript
async interpretLabResultsMedGemma(labData: any, patientContext?: any): Promise<{ findings: any; abnormalFlags: any[]; interpretations: any[]; recommendations: any[]; disclaimer: string }>
```
**Purpose**: Perform AI-powered laboratory results interpretation using MedGemma
**Parameters**:
- `labData`: Object containing laboratory test results
- `patientContext`: Optional patient context (age, gender, history, etc.)
**Returns**: Structured lab interpretation
**Behavior**: 
- Checks MedGemma server availability
- If available: Sends prompt to local inference server
- If unavailable: Falls back to rule-based AI
- Returns structured interpretation with findings, abnormal flag interpretations, and recommendations

### MedGemma Service Instance
```typescript
export const medgemmaService: MedGemmaService
```
**Purpose**: Singleton instance of the MedGemma service
**Location**: End of `artifacts/api-server/src/medgemma/service.ts`

## Authentication Service (`artifacts/api-server/src/lib/auth.js`)

Based on references in code, this appears to contain authentication utilities:

### Functions (Inferred from Usage)
```typescript
function requireAuth(req, res, next): Middleware
```
**Purpose**: Express middleware to require authentication
**Parameters**: Standard Express middleware parameters (req, res, next)
**Behavior**: Checks for valid JWT token in request headers
**Throws**: 401 Unauthorized if token missing or invalid

```typescript
function generateToken(payload): string
```
**Purpose**: Generate a JWT token
**Parameters**:
- `payload`: Object to encode in token
**Returns**: JWT token string
**Behavior**: Uses JWT_SECRET from environment

```typescript
function verifyToken(token): any
```
**Purpose**: Verify and decode a JWT token
**Parameters**:
- `token`: JWT token string
**Returns**: Decoded payload if valid
**Throws**: Error if token invalid or expired

```typescript
function hashPassword(password): string
```
**Purpose**: Hash a password for secure storage
**Parameters**:
- `password`: Plain text password string
**Returns**: Hashed password string
**Behavior**: Uses bcrypt or similar (implementation specific)

```typescript
function comparePassword(password, hashed): boolean
```
**Purpose**: Compare a password with its hash
**Parameters**:
- `password`: Plain text password string
- `hashed`: Hashed password string
**Returns**: Boolean indicating if password matches hash

## Audit Service (`artifacts/api-server/src/lib/audit.js`)

Based on references in code, this appears to contain audit logging utilities:

### Functions (Inferred from Usage)
```typescript
function createAuditLog(action, userId, entityType, entityId, changes, metadata): Promise<void>
```
**Purpose**: Create an audit log entry
**Parameters**:
- `action`: String describing the action performed (CREATE, UPDATE, DELETE, etc.)
- `userId`: ID of user performing the action
- `entityType`: Type of entity being acted upon (patient, medical record, etc.)
- `entityId`: ID of the specific entity
- `changes`: Object describing what changed (before/after values)
- `metadata`: Additional context information
**Returns**: Promise resolving when log entry is created
**Behavior**: Inserts record into audit-logs table

```typescript
function getAuditLogs(filters): Promise<AuditLog[]>
```
**Purpose**: Retrieve audit log entries with filtering
**Parameters**:
- `filters`: Object containing filter criteria (date range, user, entity type, etc.)
**Returns**: Array of audit log entries matching filters
**Behavior**: Queries audit-logs table with applied filters

```typescript
function deleteOldAuditLogs(days): Promise<number>
```
**Purpose**: Delete audit log entries older than specified days
**Parameters**:
- `days`: Number of days - entries older than this will be deleted
**Returns**: Number of deleted entries
**Behavior**: Deletes old audit logs for retention compliance

## Hospital Service (`artifacts/api-server/src/routes/hospitals.ts` - inferred)

Based on the hospitals route file, key functions include:

### Route Handlers (Express Middleware Functions)
```typescript
async getHospitals(req, res): Promise<void>
```
**Purpose**: Get list of hospitals with filtering and pagination
**Parameters**:
- `req`: Express request object (query params for filters)
- `res`: Express response object
**Behavior**: 
- Applies filters (name, location, state, district, type)
- Implements pagination
- Returns JSON array of hospitals
- Requires authentication

```typescript
async getHospitalById(req, res): Promise<void>
```
**Purpose**: Get details for a specific hospital
**Parameters**:
- `req`: Express request object (params contains hospital ID)
- `res`: Express response object
**Behavior**: 
- Validates hospital ID
- Returns hospital details or 404 if not found
- Requires authentication

```typescript
async createHospital(req, res): Promise<void>
```
**Purpose**: Create a new hospital record
**Parameters**:
- `req`: Express request object (body contains hospital data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Creates hospital record
- Returns created hospital data
- Requires authentication

```typescript
async importHospitals(req, res): Promise<void>
```
**Purpose**: Import hospitals from CSV file
**Parameters**:
- `req`: Express request object (should trigger import process)
- `res`: Express response object
**Behavior**: 
- Processes attached hospital directory CSV
- Parses CSV lines with proper quoted field handling
- Performs batched inserts (500 records)
- Checks for duplicates using sourceId
- Returns import statistics (success/failed counts)
- Requires authentication

```typescript
async getStates(req, res): Promise<void>
```
**Purpose**: Get list of unique states for filtering
**Parameters**:
- `req`: Express request object
- `res`: Express response object
**Behavior**: 
- Queries distinct state values from hospitals table
- Returns array of state strings
- Requires authentication

## Patient Service (`artifacts/api-server/src/routes/patients.ts` - inferred)

Based on the patients route file size (14.9K lines), key functions likely include:

### Route Handlers (Express Middleware Functions)
```typescript
async getPatient(req, res): Promise<void>
```
**Purpose**: Get details for a specific patient
**Parameters**:
- `req`: Express request object (params contains patient ID)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Returns patient data (excluding sensitive info)
- Requires authentication

```typescript
async createPatient(req, res): Promise<void>
```
**Purpose**: Create a new patient record
**Parameters**:
- `req`: Express request object (body contains patient data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Generates patientCode and chikitHealthId
- Creates patient record
- Returns created patient data
- Requires authentication

```typescript
async updatePatient(req, res): Promise<void>
```
**Purpose**: Update an existing patient record
**Parameters**:
- `req`: Express request object (params contains patient ID, body contains updates)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Validates update data
- Updates patient record
- Returns updated patient data
- Requires authentication

```typescript
async linkAbha(req, res): Promise<void>
```
**Purpose**: Link ABHA to a patient record
**Parameters**:
- `req`: Express request object (params contains patient ID, body contains ABHA number)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Delegates to ABDM service for linking
- Updates patient record with ABHA info
- Returns success confirmation
- Requires authentication

```typescript
async unlinkAbha(req, res): Promise<void>
```
**Purpose**: Unlink ABHA from a patient record
**Parameters**:
- `req`: Express request object (params contains patient ID)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Clears ABHA fields in patient record
- Returns success confirmation
- Requires authentication

```typescript
async getAbhaProfile(req, res): Promise<void>
```
**Purpose**: Get ABHA profile for a patient
**Parameters**:
- `req`: Express request object (params contains patient ID)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Retrieves patient's ABHA number
- Fetches profile from ABDM service
- Returns ABHA profile data
- Requires authentication

## Medical Records Service (`artifacts/api-server/src/routes/medical-records.ts` - inferred)

Based on the medical-records route file (2.7K lines), key functions likely include:

### Route Handlers (Express Middleware Functions)
```typescript
async getMedicalRecords(req, res): Promise<void>
```
**Purpose**: Get medical records for a patient
**Parameters**:
- `req`: Express request object (query params for patient ID, filters, pagination)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Applies filters (date range, record type, etc.)
- Implements pagination
- Returns array of medical records
- Requires authentication

```typescript
async createMedicalRecord(req, res): Promise<void>
```
**Purpose**: Create a new medical record
**Parameters**:
- `req`: Express request object (body contains medical record data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Associates with patient and encounter
- Creates medical record entry
- Returns created record data
- Requires authentication

```typescript
async updateMedicalRecord(req, res): Promise<void>
```
**Purpose**: Update an existing medical record
**Parameters**:
- `req`: Express request object (params contains record ID, body contains updates)
- `res`: Express response object
**Behavior**: 
- Validates record ID and authorization
- Validates update data
- Updates medical record
- Returns updated record data
- Requires authentication

```typescript
async deleteMedicalRecord(req, res): Promise<void>
```
**Purpose**: Delete a medical record
**Parameters**:
- `req`: Express request object (params contains record ID)
- `res`: Express response object
**Behavior**: 
- Validates record ID and authorization
- Performs soft delete or hard delete based on policy
- Returns success confirmation
- Requires authentication

## Prescription Service (`artifacts/api-server/src/routes/prescriptions.ts` - inferred)

Based on the prescriptions route file (1.5K lines), key functions likely include:

### Route Handlers (Express Middleware Functions)
```typescript
async getPrescriptions(req, res): Promise<void>
```
**Purpose**: Get prescriptions for a patient
**Parameters**:
- `req`: Express request object (query params for patient ID, filters, pagination)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Applies filters (date range, status, medication, etc.)
- Implements pagination
- Returns array of prescriptions
- Requires authentication

```typescript
async createPrescription(req, res): Promise<void>
```
**Purpose**: Create a new prescription
**Parameters**:
- `req`: Express request object (body contains prescription data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Checks for drug interactions and allergies
- Validates dosage and frequency
- Creates prescription record
- Returns created prescription data
- Requires authentication

```typescript
async updatePrescription(req, res): Promise<void>
```
**Purpose**: Update an existing prescription
**Parameters**:
- `req`: Express request object (params contains prescription ID, body contains updates)
- `res`: Express response object
**Behavior**: 
- Validates prescription ID and authorization
- Validates update data
- Updates prescription record
- Returns updated prescription data
- Requires authentication

```typescript
async deletePrescription(req, res): Promise<void>
```
**Purpose**: Delete a prescription
**Parameters**:
- `req`: Express request object (params contains prescription ID)
- `res`: Express response object
**Behavior**: 
- Validates prescription ID and authorization
- Performs soft delete or hard delete based on policy
- Returns success confirmation
- Requires authentication

```typescript
async refillPrescription(req, res): Promise<void>
```
**Purpose**: Request a refill for an existing prescription
**Parameters**:
- `req`: Express request object (params contains prescription ID)
- `res`: Express response object
**Behavior**: 
- Validates prescription ID and authorization
- Checks refill eligibility and remaining refills
- Updates prescription refill status
- Returns refill authorization or denial
- Requires authentication

## Laboratory Service (`artifacts/api-server/src/routes/lab-reports.ts` - inferred)

Based on the lab-reports route file (4.4K lines), key functions likely include:

### Route Handlers (Express Middleware Functions)
```typescript
async getLabReports(req, res): Promise<void>
```
**Purpose**: Get laboratory reports for a patient
**Parameters**:
- `req`: Express request object (query params for patient ID, filters, pagination)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Applies filters (date range, test type, normal/abnormal, etc.)
- Implements pagination
- Returns array of laboratory reports
- Requires authentication

```typescript
async createLabOrder(req, res): Promise<void>
```
**Purpose**: Create a new laboratory order
**Parameters**:
- `req`: Express request object (body contains lab order data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Associates with patient and encounter
- Creates laboratory order record
- Returns created order data
- Requires authentication

```typescript
async submitLabResults(req, res): Promise<void>
```
**Purpose**: Submit laboratory results for an order
**Parameters**:
- `req`: Express request object (body contains lab results data)
- `res`: Express response object
**Behavior**: 
- Validates order ID and authorization
- Validates results data
- Updates laboratory order with results
- Flags abnormal/critical values
- Returns updated order data
- Requires authentication

```typescript
async getLabResults(req, res): Promise<void>
```
**Purpose**: Get laboratory results for a specific order
**Parameters**:
- `req`: Express request object (params contains order ID)
- `res`: Express response object
**Behavior**: 
- Validates order ID and authorization
- Returns laboratory results for order
- Requires authentication

## AI Service (`artifacts/api-server/src/routes/ai.ts` - inferred)

Based on the AI route file, key functions include:

### Route Handlers (Express Middleware Functions)
```typescript
async analyzeSymptoms(req, res): Promise<void>
```
**Purpose**: Perform symptom analysis using AI
**Parameters**:
- `req`: Express request object (body contains symptoms and patient context)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Delegates to MedGemma service for analysis
- Returns structured AI analysis results
- Creates audit log entry
- Requires authentication

```typescript
async summarizePatient(req, res): Promise<void>
```
**Purpose**: Perform patient summarization using AI
**Parameters**:
- `req`: Express request object (body contains patient data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Delegates to MedGemma service for summarization
- Returns structured patient summary
- Creates audit log entry
- Requires authentication

```typescript
async interpretLab(req, res): Promise<void>
```
**Purpose**: Perform laboratory interpretation using AI
**Parameters**:
- `req`: Express request object (body contains lab data and patient context)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Delegates to MedGemma service for interpretation
- Returns structured lab interpretation results
- Creates audit log entry
- Requires authentication

```typescript
async getResults(req, res): Promise<void>
```
**Purpose**: Get AI analysis results
**Parameters**:
- `req`: Express request object (query params for filters, pagination)
- `res`: Express response object
**Behavior**: 
- Validates authorization
- Applies filters (patient ID, analysis type, date range, etc.)
- Implements pagination
- Returns array of AI analysis results
- Requires authentication

```typescript
async getMedGemmaStatus(req, res): Promise<void>
```
**Purpose**: Get MedGemma service status
**Parameters**:
- `req`: Express request object
- `res`: Express response object
**Behavior**: 
- Delegates to MedGemma service to check availability
- Returns status object (available/unavailable, response time, etc.)
- Requires authentication

## Appointment Service (`artifacts/api-server/src/routes/appointments.ts` - inferred)

Based on the appointments route file (15.8K lines), key functions likely include:

### Route Handlers (Express Middleware Functions)
```typescript
async getAppointments(req, res): Promise<void>
```
**Purpose**: Get appointments with filtering and pagination
**Parameters**:
- `req`: Express request object (query params for filters, pagination)
- `res`: Express response object
**Behavior**: 
- Validates authorization
- Applies filters (date range, patient ID, provider ID, status, etc.)
- Implements pagination
- Returns array of appointments
- Requires authentication

```typescript
async createAppointment(req, res): Promise<void>
```
**Purpose**: Create a new appointment
**Parameters**:
- `req`: Express request object (body contains appointment data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Checks for scheduling conflicts
- Associates with patient and provider
- Creates appointment record
- Returns created appointment data
- Requires authentication

```typescript
async updateAppointment(req, res): Promise<void>
```
**Purpose**: Update an existing appointment
**Parameters**:
- `req`: Express request object (params contains appointment ID, body contains updates)
- `res`: Express response object
**Behavior**: 
- Validates appointment ID and authorization
- Validates update data
- Updates appointment record
- Returns updated appointment data
- Requires authentication

```typescript
async deleteAppointment(req, res): Promise<void>
```
**Purpose**: Delete an appointment
**Parameters**:
- `req`: Express request object (params contains appointment ID)
- `res`: Express response object
**Behavior**: 
- Validates appointment ID and authorization
- Performs soft delete or hard delete based on policy
- Returns success confirmation
- Requires authentication

```typescript
async checkInAppointment(req, res): Promise<void>
```
**Purpose**: Check in a patient for an appointment
**Parameters**:
- `req`: Express request object (params contains appointment ID)
- `res`: Express response object
**Behavior**: 
- Validates appointment ID and authorization
- Updates appointment status to checked-in
- Records check-in time
- Returns success confirmation
- Requires authentication

```typescript
async completeAppointment(req, res): Promise<void>
```
**Purpose**: Mark an appointment as completed
**Parameters**:
- `req`: Express request object (params contains appointment ID)
- `res`: Express response object
**Behavior**: 
- Validates appointment ID and authorization
- Updates appointment status to completed
- Records completion time
- Returns success confirmation
- Requires authentication

```typescript
async cancelAppointment(req, res): Promise<void>
```
**Purpose**: Cancel an appointment
**Parameters**:
- `req`: Express request object (params contains appointment ID)
- `res`: Express response object
**Behavior**: 
- Validates appointment ID and authorization
- Updates appointment status to cancelled
- Records cancellation time and reason
- Returns success confirmation
- Requires authentication

## Staff Service (`artifacts/api-server/src/routes/staff.ts` - inferred)

Based on the staff route file (5.9K lines), key functions likely include:

### Route Handlers (Express Middleware Functions)
```typescript
async getStaff(req, res): Promise<void>
```
**Purpose**: Get staff members with filtering and pagination
**Parameters**:
- `req`: Express request object (query params for filters, pagination)
- `res`: Express response object
**Behavior**: 
- Validates authorization
- Applies filters (name, role, hospital ID, status, etc.)
- Implements pagination
- Returns array of staff members
- Requires authentication

```typescript
async createStaff(req, res): Promise<void>
```
**Purpose**: Create a new staff member record
**Parameters**:
- `req`: Express request object (body contains staff data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Checks for duplicate credentials (email, employee ID, etc.)
- Hashes password securely
- Creates staff member record
- Returns created staff data
- Requires authentication

```typescript
async updateStaff(req, res): Promise<void>
```
**Purpose**: Update an existing staff member record
**Parameters**:
- `req`: Express request object (params contains staff ID, body contains updates)
- `res`: Express response object
**Behavior**: 
- Validates staff ID and authorization
- Validates update data
- Updates staff member record
- Returns updated staff data
- Requires authentication

```typescript
async deleteStaff(req, res): Promise<void>
```
**Purpose**: Delete a staff member record
**Parameters**:
- `req`: Express request object (params contains staff ID)
- `res`: Express response object
**Behavior**: 
- Validates staff ID and authorization
- Performs soft delete or hard delete based on policy
- Returns success confirmation
- Requires authentication

```typescript
async assignHospital(req, res): Promise<void>
```
**Purpose**: Assign a staff member to a hospital
**Parameters**:
- `req`: Express request object (params contains staff ID, body contains hospital ID)
- `res`: Express response object
**Behavior**: 
- Validates staff ID and hospital ID
- Validates authorization (typically admin or same hospital)
- Updates staff member's hospital assignment
- Returns success confirmation
- Requires authentication

```typescript
async updateRole(req, res): Promise<void>
```
**Purpose**: Update a staff member's role
**Parameters**:
- `req`: Express request object (params contains staff ID, body contains new role)
- `res`: Express response object
**Behavior**: 
- Validates staff ID and new role
- Validates authorization (typically admin or same role hierarchy)
- Updates staff member's role
- Returns success confirmation
- Requires authentication

## Case Service (`artifacts/api-server/src/routes/casegraph.ts` - inferred)

Based on the casegraph route file (4.3K lines) and related files, key functions likely include:

### Route Handlers (Express Middleware Functions)
```typescript
async getCaseGraph(req, res): Promise<void>
```
**Purpose**: Get case graph for a patient
**Parameters**:
- `req`: Express request object (query params for patient ID, filters)
- `res`: Express response object
**Behavior**: 
- Validates patient ID and authorization
- Retrieves case graph nodes and edges
- Returns case graph data structure
- Requires authentication

```typescript
async createCaseNode(req, res): Promise<void>
```
**Purpose**: Create a new case graph node
**Parameters**:
- `req`: Express request object (body contains case node data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Associates with patient and encounter/episode
- Creates case graph node
- Returns created node data
- Requires authentication

```typescript
async createCaseEdge(req, res): Promise<void>
```
**Purpose**: Create a new case graph edge (relationship)
**Parameters**:
- `req`: Express request object (body contains case edge data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Connects two case graph nodes
- Creates case graph edge
- Returns created edge data
- Requires authentication

```typescript
async addCaseContribution(req, res): Promise<void>
```
**Purpose**: Add a contribution to a case
**Parameters**:
- `req`: Express request object (body contains contribution data)
- `res`: Express response object
**Behavior**: 
- Validates input data
- Attributes contribution to provider/encounter
- Creates case contribution record
- Returns created contribution data
- Requires authentication

```typescript
async getCaseNetwork(req, res): Promise<void>
```
**Purpose**: Get case network for a patient or population
**Parameters**:
- `req`: Express request object (query params for filters)
- `res`: Express response object
**Behavior**: 
- Validates authorization
- Applies filters (date range, condition, provider, etc.)
- Returns case network data
- Requires authentication

```typescript
async getCaseConsent(req, res): Promise<void>
```
**Purpose**: Get consent information for a case
**Parameters**:
- `req`: Express request object (query params for case ID)
- `res`: Express response object
**Behavior**: 
- Validates case ID and authorization
- Returns consent details for case
- Requires authentication

```typescript
async getCaseProvenance(req, res): Promise<void>
```
**Purpose**: Get provenance information for a case
**Parameters**:
- `req`: Express request object (query params for case ID)
- `res`: Express response object
**Behavior**: 
- Validates case ID and authorization
- Returns provenance details for case
- Requires authentication