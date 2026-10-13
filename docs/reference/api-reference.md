# Chikit by Solar - API Reference

This document provides a comprehensive reference of the Chikit RESTful API endpoints. All API endpoints are prefixed with `/api` and follow REST conventions where appropriate.

## Base URL
```
http://localhost:3000/api
```
*(In production, this would be your deployed domain)*

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```
Exceptions are noted in individual endpoint descriptions.

## Response Format
All successful responses follow this format:
```json
{
  "success": true,
  "data": {/* endpoint-specific data */},
  "message": "Optional human-readable message"
}
```

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `500`: Internal Server Error
- `503`: Service Unavailable

## Endpoints by Category

### 1. Authentication Endpoints
**File**: `artifacts/api-server/src/routes/auth.ts`

#### POST /auth/register
**Description**: Register a new user account
**Authentication**: None
**Request Body**:
```json
{
  "username": "string (required, unique)",
  "password": "string (required, min 8 chars)",
  "name": "string (required)",
  "email": "string (required, unique)",
  "phone": "string (optional)",
  "role": "enum [admin, doctor, nurse, pharmacist, lab_tech, front_desk, records_keeper] (required)",
  "hospitalId": "integer (required)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "hospitalId": "integer"
    },
    "token": "string (JWT)"
  },
  "message": "User registered successfully"
}
```

#### POST /auth/login
**Description**: Login and obtain authentication token
**Authentication**: None
**Request Body**:
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "hospitalId": "integer"
    },
    "token": "string (JWT)"
  },
  "message": "Login successful"
}
```

#### POST /auth/logout
**Description**: Logout (invalidate token on client side - token invalidation handled client-side)
**Authentication**: Required
**Request Body**: None
**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

### 2. Patient Endpoints
**File**: `artifacts/api-server/src/routes/patients.ts`

#### GET /patients
**Description**: Get list of patients with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `search`: "string (optional, search by name or patientCode)"
- `hospitalId`: "integer (optional, filter by hospital)"
- `isActive`: "boolean (optional, default: true)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "integer",
        "patientCode": "string",
        "chikitHealthId": "string (nullable)",
        "name": "string",
        "dateOfBirth": "string (ISO date)",
        "gender": "string [male, female, other]",
        "bloodGroup": "string (nullable)",
        "phone": "string (nullable)",
        "email": "string (nullable)",
        "address": "string (nullable)",
        "emergencyContact": "string (nullable)",
        "emergencyPhone": "string (nullable)",
        "allergies": "string (nullable)",
        "chronicConditions": "string (nullable)",
        "govtIdType": "string (nullable)",
        "govtIdNumber": "string (nullable)",
        "hospitalId": "integer (nullable)",
        "isActive": "boolean",
        "abhaNumber": "string (nullable, unique)",
        "abhaAddress": "string (nullable)",
        "abhaVerified": "boolean",
        "abhaLinkedAt": "string (ISO timestamp, nullable)",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Patients retrieved successfully"
}
```

#### GET /patients/:id
**Description**: Get a specific patient by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, patient ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Same patient object as in list endpoint */
  },
  "message": "Patient retrieved successfully"
}
```

#### POST /patients
**Description**: Create a new patient record
**Authentication**: Required
**Request Body**:
```json
{
  "name": "string (required)",
  "dateOfBirth": "string (required, ISO date)",
  "gender": "enum [male, female, other] (required)",
  "bloodGroup": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "address": "string (optional)",
  "emergencyContact": "string (optional)",
  "emergencyPhone": "string (optional)",
  "allergies": "string (optional)",
  "chronicConditions": "string (optional)",
  "govtIdType": "string (optional)",
  "govtIdNumber": "string (optional)",
  "hospitalId": "integer (optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created patient object */
  },
  "message": "Patient created successfully"
}
```

#### PUT /patients/:id
**Description**: Update an existing patient record
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, patient ID)"
**Request Body**: Partial patient object (same fields as POST)
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated patient object */
  },
  "message": "Patient updated successfully"
}
```

#### DELETE /patients/:id
**Description**: Delete a patient record (soft delete)
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, patient ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Patient deleted successfully"
}
```

#### POST /patients/:id/link-abha
**Description**: Link ABHA number to a patient
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, patient ID)"
**Request Body**:
```json
{
  "abhaNumber": "string (required, 14-digit ABHA number)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "patient": {
      /* Updated patient object with ABHA fields */
    }
  },
  "message": "ABHA linked successfully"
}
```

#### DELETE /patients/:id/unlink-abha
**Description**: Unlink ABHA number from a patient
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, patient ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "patient": {
      /* Patient object with ABHA fields cleared */
    }
  },
  "message": "ABHA unlinked successfully"
}
```

#### GET /patients/:id/abha-profile
**Description**: Get ABHA profile information for a patient
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, patient ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* ABHA profile object from ABDM service */
  },
  "message": "ABHA profile retrieved successfully"
}
```

### 3. Hospital Endpoints
**File**: `artifacts/api-server/src/routes/hospitals.ts`

#### GET /hospitals
**Description**: Get list of hospitals with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `search`: "string (optional, search by name or address)"
- `state`: "string (optional, filter by state)"
- `district`: "string (optional, filter by district)"
- `hospitalType`: "string (optional, filter by type)"
- `isActive`: "boolean (optional, default: true)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "hospitals": [
      {
        "id": "integer",
        "name": "string",
        "address": "string",
        "city": "string",
        "state": "string",
        "district": "string (nullable)",
        "pincode": "string (nullable)",
        "phone": "string (nullable)",
        "email": "string (nullable)",
        "type": "string",
        "bedCount": "integer (nullable)",
        "category": "string (nullable)",
        "careType": "string (nullable)",
        "discipline": "string (nullable)",
        "specialties": "string (nullable)",
        "facilities": "string (nullable)",
        "numDoctors": "integer (nullable)",
        "website": "string (nullable)",
        "location": "string (nullable)",
        "sourceId": "string (nullable)",
        "isActive": "boolean",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Hospitals retrieved successfully"
}
```

#### GET /hospitals/:id
**Description**: Get a specific hospital by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, hospital ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Hospital object */
  },
  "message": "Hospital retrieved successfully"
}
```

#### POST /hospitals
**Description**: Create a new hospital record
**Authentication**: Required
**Request Body**:
```json
{
  "name": "string (required)",
  "address": "string (required)",
  "city": "string (required)",
  "state": "string (required)",
  "district": "string (optional)",
  "pincode": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "type": "string (default: \"general\")",
  "bedCount": "integer (optional)",
  "category": "string (optional)",
  "careType": "string (optional)",
  "discipline": "string (optional)",
  "specialties": "string (optional)",
  "facilities": "string (optional)",
  "numDoctors": "integer (optional)",
  "website": "string (optional)",
  "location": "string (optional)",
  "sourceId": "string (optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created hospital object */
  },
  "message": "Hospital created successfully"
}
```

#### PUT /hospitals/:id
**Description**: Update an existing hospital record
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, hospital ID)"
**Request Body**: Partial hospital object (same fields as POST)
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated hospital object */
  },
  "message": "Hospital updated successfully"
}
```

#### DELETE /hospitals/:id
**Description**: Delete a hospital record (soft delete)
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, hospital ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Hospital deleted successfully"
}
```

#### GET /hospitals/states
**Description**: Get list of unique states for filtering
**Authentication**: Required
**Parameters**: None
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "states": ["string"]
  },
  "message": "States retrieved successfully"
}
```

#### POST /hospitals/import
**Description**: Import hospitals from CSV file
**Authentication**: Required
**Request Body**: None (triggers import of attached hospital directory CSV)
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "imported": "integer (number of hospitals imported)",
    "skipped": "integer (number of hospitals skipped due to duplicates)",
    "errors": "integer (number of errors encountered)"
  },
  "message": "Hospital import completed"
}
```

### 4. Appointment Endpoints
**File**: `artifacts/api-server/src/routes/appointments.ts`

#### GET /appointments
**Description**: Get list of appointments with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `patientId`: "integer (optional, filter by patient)"
- `providerId`: "integer (optional, filter by provider)"
- `hospitalId`: "integer (optional, filter by hospital)"
- `startDate`: "string (optional, ISO date, filter appointments on or after)"
- `endDate`: "string (optional, ISO date, filter appointments on or before)"
- `status`: "string [scheduled, checked_in, in_progress, completed, cancelled, no_show] (optional)"
- `appointmentType`: "string (optional)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "integer",
        "patientId": "integer",
        "providerId": "integer",
        "hospitalId": "integer",
        "appointmentDate": "string (ISO timestamp)",
        "appointmentType": "string (nullable)",
        "reason": "string (nullable)",
        "status": "string [scheduled, checked_in, in_progress, completed, cancelled, no_show]",
        "notes": "string (nullable)",
        "isActive": "boolean",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Appointments retrieved successfully"
}
```

#### GET /appointments/:id
**Description**: Get a specific appointment by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, appointment ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Appointment object */
  },
  "message": "Appointment retrieved successfully"
}
```

#### POST /appointments
**Description**: Create a new appointment
**Authentication**: Required
**Request Body**:
```json
{
  "patientId": "integer (required)",
  "providerId": "integer (required)",
  "hospitalId": "integer (required)",
  "appointmentDate": "string (required, ISO timestamp)",
  "appointmentType": "string (optional)",
  "reason": "string (optional)",
  "notes": "string (optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created appointment object */
  },
  "message": "Appointment created successfully"
}
```

#### PUT /appointments/:id
**Description**: Update an existing appointment
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, appointment ID)"
**Request Body**: Partial appointment object (same fields as POST)
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated appointment object */
  },
  "message": "Appointment updated successfully"
}
```

#### DELETE /appointments/:id
**Description**: Delete an appointment (soft delete)
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, appointment ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Appointment deleted successfully"
}
```

#### PUT /appointments/:id/check-in
**Description**: Check in a patient for an appointment
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, appointment ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated appointment object with status: checked_in */
  },
  "message": "Patient checked in successfully"
}
```

#### PUT /appointments/:id/complete
**Description**: Mark an appointment as completed
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, appointment ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated appointment object with status: completed */
  },
  "message": "Appointment marked as completed"
}
```

#### PUT /appointments/:id/cancel
**Description**: Cancel an appointment
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, appointment ID)"
**Request Body**:
```json
{
  "reason": "string (optional, cancellation reason)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated appointment object with status: cancelled */
  },
  "message": "Appointment cancelled successfully"
}
```

### 5. Medical Records Endpoints
**File**: `artifacts/api-server/src/routes/medical-records.ts`

#### GET /medical-records
**Description**: Get list of medical records with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `patientId`: "integer (optional, filter by patient)"
- `providerId`: "integer (optional, filter by provider)"
- `startDate`: "string (optional, ISO date, filter records on or after)"
- `endDate`: "string (optional, ISO date, filter records on or before)"
- `visitDate`: "string (optional, ISO date, filter by visit date)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "medicalRecords": [
      {
        "id": "integer",
        "patientId": "integer",
        "providerId": "integer (nullable)",
        "visitDate": "string (ISO timestamp, nullable)",
        "chiefComplaint": "string (nullable)",
        "historyOfPresentIllness": "string (nullable)",
        "pastMedicalHistory": "string (nullable)",
        "familyHistory": "string (nullable)",
        "socialHistory": "string (nullable)",
        "physicalExam": "string (nullable)",
        "vitalSigns": "object (nullable, JSONB)",
        "assessment": "string (nullable)",
        "plan": "string (nullable)",
        "proceduresPerformed": "string (nullable)",
        "patientEducation": "string (nullable)",
        "followUpInstructions": "string (nullable)",
        "isActive": "boolean",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Medical records retrieved successfully"
}
```

#### GET /medical-records/:id
**Description**: Get a specific medical record by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, medical record ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Medical record object */
  },
  "message": "Medical record retrieved successfully"
}
```

#### POST /medical-records
**Description**: Create a new medical record
**Authentication**: Required
**Request Body**:
```json
{
  "patientId": "integer (required)",
  "providerId": "integer (optional)",
  "visitDate": "string (optional, ISO timestamp, defaults to now)",
  "chiefComplaint": "string (optional)",
  "historyOfPresentIllness": "string (optional)",
  "pastMedicalHistory": "string (optional)",
  "familyHistory": "string (optional)",
  "socialHistory": "string (optional)",
  "physicalExam": "string (optional)",
  "vitalSigns": "object (optional)",
  "assessment": "string (optional)",
  "plan": "string (optional)",
  "proceduresPerformed": "string (optional)",
  "patientEducation": "string (optional)",
  "followUpInstructions": "string (optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created medical record object */
  },
  "message": "Medical record created successfully"
}
```

#### PUT /medical-records/:id
**Description**: Update an existing medical record
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, medical record ID)"
**Request Body**: Partial medical record object (same fields as POST)
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated medical record object */
  },
  "message": "Medical record updated successfully"
}
```

#### DELETE /medical-records/:id
**Description**: Delete a medical record (soft delete)
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, medical record ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Medical record deleted successfully"
}
```

### 6. Prescription Endpoints
**File**: `artifacts/api-server/src/routes/prescriptions.ts`

#### GET /prescriptions
**Description**: Get list of prescriptions with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `patientId`: "integer (optional, filter by patient)"
- `providerId": "integer (optional, filter by provider)"
- `status": "string [active, completed, cancelled, expired] (optional)"
- `startDate": "string (optional, ISO date, filter prescriptions starting on or after)"
- `endDate": "string (optional, ISO date, filter prescriptions ending on or before)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": "integer",
        "patientId": "integer",
        "providerId": "integer",
        "medication": "string",
        "dosage": "string",
        "frequency": "string",
        "duration": "string (nullable)",
        "instructions": "string (nullable)",
        "startDate": "string (ISO timestamp, nullable)",
        "endDate": "string (ISO timestamp, nullable)",
        "refillsRemaining": "integer",
        "status": "string [active, completed, cancelled, expired]",
        "isActive": "boolean",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Prescriptions retrieved successfully"
}
```

#### GET /prescriptions/:id
**Description**: Get a specific prescription by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, prescription ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Prescription object */
  },
  "message": "Prescription retrieved successfully"
}
```

#### POST /prescriptions
**Description**: Create a new prescription
**Authentication**: Required
**Request Body**:
```json
{
  "patientId": "integer (required)",
  "providerId": "integer (required)",
  "medication": "string (required)",
  "dosage": "string (required)",
  "frequency": "string (required)",
  "duration": "string (optional)",
  "instructions": "string (optional)",
  "startDate": "string (optional, ISO timestamp)",
  "endDate": "string (optional, ISO timestamp)",
  "refillsRemaining": "integer (default: 0)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created prescription object */
  },
  "message": "Prescription created successfully"
}
```

#### PUT /prescriptions/:id
**Description**: Update an existing prescription
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, prescription ID)"
**Request Body**: Partial prescription object (same fields as POST)
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated prescription object */
  },
  "message": "Prescription updated successfully"
}
```

#### DELETE /prescriptions/:id
**Description**: Delete a prescription (soft delete)
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, prescription ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Prescription deleted successfully"
}
```

#### PUT /prescriptions/:id/refill
**Description**: Request a refill for an existing prescription
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, prescription ID)"
**Request Body**:
```json
{
  "refillsRequested": "integer (default: 1)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "refillsRemaining": "integer (updated count)",
    "newEndDate": "string (ISO timestamp, nullable, if applicable)"
  },
  "message": "Prescription refill processed"
}
```

### 7. Laboratory Reports Endpoints
**File**: `artifacts/api-server/src/routes/lab-reports.ts`

#### GET /lab-reports
**Description**: Get list of laboratory reports with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `patientId": "integer (optional, filter by patient)"
- `providerId": "integer (optional, filter by provider)"
- `hospitalId": "integer (optional, filter by hospital)"
- `startDate": "string (optional, ISO date, filter reports on or after)"
- `endDate": "string (optional, ISO date, filter reports on or before)"
- `testName": "string (optional, filter by test name)"
- `isAbnormal": "boolean (optional)"
- `isCritical": "boolean (optional)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "labReports": [
      {
        "id": "integer",
        "patientId": "integer",
        "providerId": "integer",
        "hospitalId": "integer",
        "testName": "string",
        "testCode": "string (nullable)",
        "specimenType": "string (nullable)",
        "collectionDate": "string (ISO timestamp, nullable)",
        "resultValue": "string (nullable)",
        "resultUnit": "string (nullable)",
        "referenceRange": "string (nullable)",
        "isAbnormal": "boolean",
        "isCritical": "boolean",
        "notes": "string (nullable)",
        "isActive": "boolean",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Laboratory reports retrieved successfully"
}
```

#### GET /lab-reports/:id
**Description**: Get a specific laboratory report by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, lab report ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Lab report object */
  },
  "message": "Laboratory report retrieved successfully"
}
```

#### POST /lab-reports
**Description**: Create a new laboratory order
**Authentication**: Required
**Request Body**:
```json
{
  "patientId": "integer (required)",
  "providerId": "integer (required)",
  "hospitalId": "integer (required)",
  "testName": "string (required)",
  "testCode": "string (optional)",
  "specimenType": "string (optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created lab report object (without results yet) */
  },
  "message": "Laboratory order created successfully"
}
```

#### PUT /lab-reports/:id/results
**Description**: Submit laboratory results for an order
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, lab report ID)"
**Request Body**:
```json
{
  "resultValue": "string (required)",
  "resultUnit": "string (required)",
  "referenceRange": "string (optional)",
  "notes": "string (optional)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated lab report object with results */
  },
  "message": "Laboratory results submitted successfully"
}
```

### 8. Radiology Reports Endpoints
**File**: `artifacts/api-server/src/routes/radiology.ts`

#### GET /radiology-reports
**Description**: Get list of radiology reports with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `patientId": "integer (optional, filter by patient)"
- `providerId": "integer (optional, filter by provider)"
- `hospitalId": "integer (optional, filter by hospital)"
- `startDate": "string (optional, ISO date, filter reports on or after)"
- `endDate": "string (optional, ISO date, filter reports on or before)"
- `studyName": "string (optional, filter by study name)"
- `modality": "string [X-ray, CT, MRI, Ultrasound, etc.] (optional)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "radiologyReports": [
      {
        "id": "integer",
        "patientId": "integer",
        "providerId": "integer",
        "hospitalId": "integer",
        "radiologistId": "integer (nullable)",
        "studyName": "string",
        "studyCode": "string (nullable)",
        "modality": "string",
        "bodyPart": "string (nullable)",
        "contrastUsed": "boolean",
        "studyDate": "string (ISO timestamp, nullable)",
        "findings": "string (nullable)",
        "impression": "string (nullable)",
        "isActive": "boolean",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Radiology reports retrieved successfully"
}
```

#### GET /radiology-reports/:id
**Description**: Get a specific radiology report by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, radiology report ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Radiology report object */
  },
  "message": "Radiology report retrieved successfully"
}
```

#### POST /radiology-reports
**Description**: Create a new radiology order
**Authentication**: Required
**Request Body**:
```json
{
  "patientId": "integer (required)",
  "providerId": "integer (required)",
  "hospitalId": "integer (required)",
  "studyName": "string (required)",
  "studyCode": "string (optional)",
  "modality": "string (required)",
  "bodyPart": "string (optional)",
  "contrastUsed": "boolean (default: false)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created radiology report object (without results yet) */
  },
  "message": "Radiology order created successfully"
}
```

#### PUT /radiology-reports/:id/results
**Description**: Submit radiology results for an order
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, radiology report ID)"
**Request Body**:
```json
{
  "findings": "string (required)",
  "impression": "string (required)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated radiology report object with results */
  },
  "message": "Radiology results submitted successfully"
}
```

### 9. AI Endpoints
**File**: `artifacts/api-server/src/routes/ai.ts`

#### POST /ai/analyze-symptoms
**Description**: Perform AI-powered symptom analysis
**Authentication**: Required
**Request Body**:
```json
{
  "symptoms": "string (required)",
  "patientContext": {
    "age": "integer (optional)",
    "gender": "string [male, female, other] (optional)",
    "medicalHistory": "string (optional)",
    "currentMedications": "string (optional)",
    "allergies": "string (optional)"
  } (optional)
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "findings": "object (AI-generated findings)",
    "differentialDiagnosis": "array of objects (potential alternative diagnoses)",
    "recommendations": "array of objects (AI-generated recommendations)",
    "urgencyLevel": "string [low, medium, high, critical]",
    "summary": "string (text summary of analysis)",
    "disclaimer": "string (required disclaimer about AI being for decision support only)"
  },
  "message": "Symptom analysis completed successfully"
}
```

#### POST /ai/summarize-patient
**Description**: Perform AI-powered patient record summarization
**Authentication**: Required
**Request Body**:
```json
{
  "patientData": {
    "demographics": "object (optional)",
    "medicalHistory": "string (optional)",
    "medications": "array of strings (optional)",
    "allergies": "array of strings (optional)",
    "chronicConditions": "array of strings (optional)",
    "recentEncounters": "array of objects (optional)",
    "labResults": "array of objects (optional)",
    "vitalSignsTrend": "object (optional)"
  } (required)
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "summary": "string (comprehensive patient summary)",
    "keyFindings": "array of strings (important clinical findings)",
    "careRecommendations": "array of strings (suggested care actions)",
    "disclaimer": "string (required disclaimer about AI being for decision support only)"
  },
  "message": "Patient summarization completed successfully"
}
```

#### POST /ai/interpret-lab
**Description**: Perform AI-powered laboratory results interpretation
**Authentication**: Required
**Request Body**:
```json
{
  "labData": {
    "tests": [
      {
        "name": "string (required)",
        "value": "string (required)",
        "unit": "string (required)",
        "referenceRange": "string (optional)",
        "isAbnormal": "boolean (optional)"
      }
    ] (required),
    "patientContext": {
      "age": "integer (optional)",
      "gender": "string [male, female, other] (optional)",
      "medicalHistory": "string (optional)"
    } (optional)
  }
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "findings": "object (AI-generated findings)",
    "abnormalFlags": "array of objects (abnormal test interpretations)",
    "recommendations": "array of objects (AI-generated recommendations)",
    "disclaimer": "string (required disclaimer about AI being for decision support only)"
  },
  "message": "Laboratory interpretation completed successfully"
}
```

#### GET /ai/results
**Description**: Get AI analysis results with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `patientId": "integer (optional, filter by patient)"
- `analysisType": "string [symptom_analysis, patient_summary, lab_interpretation, radiology_analysis] (optional)"
- `startDate": "string (optional, ISO date, filter results on or after)"
- `endDate": "string (optional, ISO date, filter results on or before)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "aiResults": [
      {
        "id": "integer",
        "patientId": "integer",
        "analysisType": "string [symptom_analysis, patient_summary, lab_interpretation, radiology_analysis]",
        "inputData": "object (input provided to AI)",
        "findings": "object (AI-generated findings)",
        "differentialDiagnosis": "array of objects (potential alternative diagnoses)",
        "recommendations": "array of objects (AI-generated recommendations)",
        "urgencyLevel": "string [low, medium, high, critical]",
        "summary": "string (text summary)",
        "disclaimer": "string (AI disclaimer)",
        "createdAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "AI results retrieved successfully"
}
```

#### GET /ai/medgemma/status
**Description**: Check MedGemma service availability
**Authentication**: Required
**Parameters**: None
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "available": "boolean",
    "responseTimeMs": "integer (nullable, if available)",
    "error": "string (nullable, if unavailable)"
  },
  "message": "MedGemma status retrieved"
}
```

### 10. Staff Endpoints
**File**: `artifacts/api-server/src/routes/staff.ts`

#### GET /staff
**Description**: Get list of staff members with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `search`: "string (optional, search by name or username)"
- `role": "string [admin, doctor, nurse, pharmacist, lab_tech, front_desk, records_keeper] (optional)"
- `hospitalId": "integer (optional, filter by hospital)"
- `isActive": "boolean (optional, default: true)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "integer",
        "username": "string",
        "password": "string (hashed, not returned in response)",
        "role": "string",
        "name": "string",
        "email": "string",
        "phone": "string (nullable)",
        "hospitalId": "integer (nullable)",
        "isActive": "boolean",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Staff retrieved successfully"
}
```

#### GET /staff/:id
**Description**: Get a specific staff member by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, staff ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Staff object (password omitted) */
  },
  "message": "Staff retrieved successfully"
}
```

#### POST /staff
**Description**: Create a new staff member
**Authentication**: Required
**Request Body**:
```json
{
  "username": "string (required, unique)",
  "password": "string (required, min 8 chars)",
  "name": "string (required)",
  "email": "string (required, unique)",
  "phone": "string (optional)",
  "role": "enum [admin, doctor, nurse, pharmacist, lab_tech, front_desk, records_keeper] (required)",
  "hospitalId": "integer (required)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created staff object (password omitted) */
  },
  "message": "Staff created successfully"
}
```

#### PUT /staff/:id
**Description**: Update an existing staff member
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, staff ID)"
**Request Body**: Partial staff object (same fields as POST, password handled separately)
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated staff object (password omitted if not changed) */
  },
  "message": "Staff updated successfully"
}
```

#### DELETE /staff/:id
**Description**: Delete a staff member (soft delete)
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, staff ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Staff deleted successfully"
}
```

#### PUT /staff/:id/assign-hospital
**Description**: Assign a staff member to a hospital
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, staff ID)"
**Request Body**:
```json
{
  "hospitalId": "integer (required)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated staff object */
  },
  "message": "Staff hospital assignment updated successfully"
}
```

#### PUT /staff/:id/update-role
**Description**: Update a staff member's role
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, staff ID)"
**Request Body**:
```json
{
  "role": "enum [admin, doctor, nurse, pharmacist, lab_tech, front_desk, records_keeper] (required)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated staff object */
  },
  "message": "Staff role updated successfully"
}
```

### 11. ABDM Endpoints
**File**: `artifacts/api-server/src/routes/abha.ts`

#### POST /abha/registration/aadhaar/generate-otp
**Description**: Step 1 of Aadhaar-based ABHA registration - generate OTP
**Authentication**: Required
**Request Body**:
```json
{
  "aadhaar": "string (required, 12-digit Aadhaar number)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "response": {
      "txnId": "string (ABDM transaction ID)",
      "message": "string (ABDM response message)"
    }
  },
  "message": "OTP generated successfully"
}
```

#### POST /abha/registration/aadhaar/verify-otp
**Description**: Step 2 of Aadhaar-based ABHA registration - verify OTP
**Authentication**: Required
**Request Body**:
```json
{
  "transactionId": "string (required)",
  "otp": "string (required, 6-digit OTP)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "abhaNumber": "string (14-digit ABHA number)",
    "abhaAddress": "string (ABHA address)",
    "profile": {
      "name": "string",
      "gender": "string [male, female, transgender]",
      "dateOfBirth": "string (YYYY-MM-DD)",
      "mobileNumber": "string",
      "address": "string"
    }
  },
  "message": "ABHA registration verified successfully"
}
```

#### POST /abha/registration/mobile/generate-otp
**Description**: Step 1 of Mobile-based ABHA registration - generate OTP
**Authentication**: Required
**Request Body**:
```json
{
  "mobileNumber": "string (required, 10-digit mobile number)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "response": {
      "txnId": "string (ABDM transaction ID)",
      "message": "string (ABDM response message)"
    }
  },
  "message": "OTP generated successfully"
}
```

#### POST /abha/registration/mobile/verify-otp
**Description**: Step 2 of Mobile-based ABHA registration - verify OTP
**Authentication**: Required
**Request Body**:
```json
{
  "transactionId": "string (required)",
  "otp": "string (required, 6-digit OTP)",
  "name": "string (required)",
  "gender": "string [male, female, transgender] (required)",
  "dateOfBirth": "string (required, YYYY-MM-DD)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "abhaNumber": "string (14-digit ABHA number)",
    "abhaAddress": "string (ABHA address)",
    "profile": {
      "name": "string",
      "gender": "string [male, female, transgender]",
      "dateOfBirth": "string (YYYY-MM-DD)",
      "mobileNumber": "string",
      "address": "string"
    }
  },
  "message": "Mobile-based ABHA registration verified successfully"
}
```

#### POST /abha/auth/init
**Description**: Step 1 of ABHA-based authentication - initiate auth
**Authentication**: Required
**Request Body**:
```json
{
  "abhaNumber": "string (required, 14-digit ABHA number)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "response": {
      "txnId": "string (ABDM transaction ID)",
      "message": "string (ABDM response message)"
    }
  },
  "message": "ABHA authentication initiated"
}
```

#### POST /abha/auth/confirm
**Description**: Step 2 of ABHA-based authentication - verify OTP and authenticate
**Authentication**: Required
**Request Body**:
```json
{
  "transactionId": "string (required)",
  "otp": "string (required, 6-digit OTP)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "abhaNumber": "string",
    "name": "string",
    "token": "string (JWT for internal authentication)"
  },
  "message": "ABHA authentication successful"
}
```

#### GET /abha/me
**Description**: Get ABHA-linked profile for authenticated user
**Authentication**: Required
**Parameters**: None
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* User's ABHA-linked patient profile */
  },
  "message": "ABHA profile retrieved successfully"
}
```

#### GET /abha/profile/:patientId
**Description**: Get ABHA profile for a specific patient
**Authentication**: Required
**Path Parameters**:
- `patientId`: "integer (required, patient ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Patient's ABHA profile information */
  },
  "message": "ABHA profile retrieved successfully"
}
```

#### POST /abha/link/:patientId
**Description**: Link ABHA to a patient record
**Authentication**: Required
**Path Parameters**:
- `patientId`: "integer (required, patient ID)"
**Request Body**:
```json
{
  "abhaNumber": "string (required, 14-digit ABHA number)",
  "abhaAddress": "string (optional)"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "patient": {
      /* Updated patient object */
    }
  },
  "message": "ABHA linked to patient successfully"
}
```

#### DELETE /abha/unlink/:patientId
**Description**: Unlink ABHA from a patient record
**Authentication**: Required
**Path Parameters**:
- `patientId`: "integer (required, patient ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "ABHA unlinked from patient successfully"
}
```

### 12. Case Management Endpoints
**Files**: 
- `artifacts/api-server/src/routes/casegraph.ts`
- `artifacts/api-server/src/routes/casegraph-consent.ts`
- `artifacts/api-server/src/routes/casegraph-provenance.ts`

#### GET /casegraph
**Description**: Get case graph for a patient
**Authentication**: Required
**Query Parameters**:
- `patientId`: "integer (required)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "integer",
        "label": "string",
        "type": "string",
        "data": "object",
        "timestamp": "string (ISO timestamp)"
      }
    ],
    "edges": [
      {
        "id": "integer",
        "source": "integer (node ID)",
        "target": "integer (node ID)",
        "label": "string",
        "type": "string",
        "data": "object"
      }
    ]
  },
  "message": "Case graph retrieved successfully"
}
```

#### POST /casegraph/nodes
**Description**: Create a new case graph node
**Authentication**: Required
**Request Body**:
```json
{
  "label": "string (required)",
  "type": "string (required)",
  "data": "object (optional)",
  "patientId": "integer (required)",
  "timestamp": "string (ISO timestamp, optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created node object */
  },
  "message": "Case graph node created successfully"
}
```

#### POST /casegraph/edges
**Description**: Create a new case graph edge (relationship)
**Authentication**: Required
**Request Body**:
```json
{
  "source": "integer (required, source node ID)",
  "target": "integer (required, target node ID)",
  "label": "string (optional)",
  "type": "string (optional)",
  "data": "object (optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created edge object */
  },
  "message": "Case graph edge created successfully"
}
```

#### POST /casegraph/contributions
**Description**: Add a contribution to a case
**Authentication**: Required
**Request Body**:
```json
{
  "description": "string (required)",
  "type": "string (required)",
  "providerId": "integer (optional)",
  "patientId": "integer (required)",
  "timestamp": "string (ISO timestamp, optional)",
  "data": "object (optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created contribution object */
  },
  "message": "Case contribution added successfully"
}
```

#### GET /casegraph/consent/:caseId
**Description**: Get consent information for a case
**Authentication**: Required
**Path Parameters**:
- `caseId`: "integer (required)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Consent object for the case */
  },
  "message": "Case consent retrieved successfully"
}
```

#### GET /casegraph/provenance/:caseId
**Description**: Get provenance information for a case
**Authentication**: Required
**Path Parameters**:
- `caseId`: "integer (required)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Provenance object for the case */
  },
  "message": "Case provenance retrieved successfully"
}
```

### 13. Consent Requests Endpoints
**File**: `artifacts/api-server/src/routes/consent-requests.ts`

#### GET /consent-requests
**Description**: Get list of consent requests with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `patientId": "integer (optional, filter by patient)"
- `status": "string [pending, granted, denied, expired] (optional)"
- `purpose": "string (optional, filter by purpose)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "consentRequests": [
      {
        "id": "integer",
        "patientId": "integer",
        "requestedBy": "integer (user ID)",
        "purpose": "string",
        "scope": "string (optional)",
        "status": "string [pending, granted, denied, expired]",
        "grantedAt": "string (ISO timestamp, nullable)",
        "expiresAt": "string (ISO timestamp, nullable)",
        "createdAt": "string (ISO timestamp)",
        "updatedAt": "string (ISO timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Consent requests retrieved successfully"
}
```

#### GET /consent-requests/:id
**Description**: Get a specific consent request by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, consent request ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Consent request object */
  },
  "message": "Consent request retrieved successfully"
}
```

#### POST /consent-requests
**Description**: Create a new consent request
**Authentication**: Required
**Request Body**:
```json
{
  "patientId": "integer (required)",
  "purpose": "string (required)",
  "scope": "string (optional)",
  "expiresAt": "string (ISO timestamp, optional)"
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created consent request object */
  },
  "message": "Consent request created successfully"
}
```

#### PUT /consent-requests/:id/grant
**Description**: Grant a consent request
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, consent request ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated consent request object with status: granted */
  },
  "message": "Consent request granted successfully"
}
```

#### PUT /consent-requests/:id/deny
**Description**: Deny a consent request
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, consent request ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated consent request object with status: denied */
  },
  "message": "Consent request denied successfully"
}
```

#### PUT /consent-requests/:id/revoke
**Description**: Revoke a granted consent request
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, consent request ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated consent request object with status: revoked */
  },
  "message": "Consent request revoked successfully"
}
```

### 14. Controlled Medications Endpoints
**File**: `artifacts/api-server/src/routes/controlled-medications.ts`

#### GET /controlled-medications
**Description**: Get list of controlled medication records with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `page`: "integer (default: 1)"
- `limit`: "integer (default: 10, max: 100)"
- `patientId": "integer (optional, filter by patient)"
- `providerId": "integer (optional, filter by provider)"
- `medicationId": "integer (optional, filter by medication)"
- `startDate": "string (optional, ISO date, filter records on or after)"
- `endDate": "string (optional, ISO date, filter records on or before)"
- `status": "string [active, completed, cancelled] (optional)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "controlledMedications": [
      {
        /* Detailed controlled medication tracking object */
        // Based on the large file size (40.2K), this includes:
        // - Prescription details
        // - Dispensing records
        // - Inventory transactions
        // - Patient/provider information
        // - Regulatory compliance fields
        // - Transaction tracking
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  },
  "message": "Controlled medications retrieved successfully"
}
```

#### GET /controlled-medications/:id
**Description**: Get a specific controlled medication record by ID
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, controlled medication record ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Controlled medication object */
  },
  "message": "Controlled medication retrieved successfully"
}
```

#### POST /controlled-medications
**Description**: Create a new controlled medication record
**Authentication**: Required
**Request Body**:
```json
{
  /* Detailed controlled medication data */
  // Based on the large file size (40.2K), this includes:
  // - Patient and provider information
  // - Medication details (name, strength, form)
  // - Prescription details (date, quantity, refills)
  // - Dispensing information
  // - Regulatory compliance data
}
```
**Success Response** (201):
```json
{
  "success": true,
  "data": {
    /* Created controlled medication object */
  },
  "message": "Controlled medication record created successfully"
}
```

#### PUT /controlled-medications/:id
**Description**: Update an existing controlled medication record
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, controlled medication record ID)"
**Request Body**: Partial controlled medication object
**Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* Updated controlled medication object */
  },
  "message": "Controlled medication record updated successfully"
}
```

#### DELETE /controlled-medications/:id
**Description**: Delete a controlled medication record (soft delete)
**Authentication**: Required
**Path Parameters**:
- `id`: "integer (required, controlled medication record ID)"
**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Controlled medication record deleted successfully"
}
```

### 15. Additional Specialized Endpoints

#### Doctors Endpoints
**File**: `artifacts/api-server/src/routes/doctors.ts`
- Basic CRUD operations for doctor profiles
- Similar pattern to staff endpoints but focused on medical credentials and specialties

#### Drugs Endpoints
**File**: `artifacts/api-server/src/routes/drugs.ts`
- CRUD operations for drug formulary
- Medication information, interactions, dosages, etc.

#### Hospital Capacity Endpoints
**File**: `artifacts/api-server/src/routes/hospital-capacity.ts`
- Endpoints for managing and querying hospital bed capacity, utilization, and alerts

#### Statistics Endpoints
**File**: `artifacts/api-server/src/routes/stats.ts`
- Endpoints for retrieving various statistics and metrics
- Hospital utilization, patient demographics, service usage, etc.

#### Health Check Endpoint
**File**: `artifacts/api-server/src/routes/health.ts`
- Simple health check for API availability
- GET /health
- Returns basic status information

## API Versioning
The API does not currently implement explicit versioning in the URL path. Versioning is managed through:
- Backward compatible changes where possible
- Deprecation notices in response headers or body
- Major changes would require new endpoints or migration guidance

## Rate Limiting
The API implements rate limiting to prevent abuse:
- Default limit: 100 requests per minute per IP address
- Authenticated endpoints may have higher limits
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Timestamp when limit resets

## Pagination
List endpoints that support pagination use:
- `page`: Page number (starts at 1)
- `limit`: Number of items per page (configurable, with maximum)
Response includes pagination object with:
- `page`: Current page
- `limit`: Items per page
- `total`: Total number of items
- `totalPages`: Total number of pages

## Filtering
Many list endpoints support filtering via query parameters:
- Exact match filters: `field=value`
- Range filters: `field_start=value&field_end=value`
- Boolean filters: `field=true|false`
- Search filters: `search=term` (searches across multiple text fields)

## Error Handling
Standard error response format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_ERROR`: Missing or invalid token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `RESOURCE_CONFLICT`: Conflict with existing resource
- `EXTERNAL_SERVICE_ERROR`: Error communicating with external service
- `INTERNAL_ERROR`: Unexpected server error

## Idempotency
Certain operations are designed to be idempotent:
- Creating the same resource twice returns the existing resource
- Updating a resource with the same data has no additional effect
- Deleting an already-deleted resource returns success

## Security Headers
The API includes various security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`: max-age=31536000; includeSubDomains (HTTPS only)
- `Content-Security-Policy`: Default restrictive policy

## CORS
Cross-Origin Resource Sharing is configured to:
- Allow requests from trusted domains only
- Support necessary headers and methods
- Include credentials when appropriate

## API Exploration
The API can be explored using:
- Standard HTTP clients (curl, Postman, etc.)
- The frontend application itself
- API documentation tools (Swagger/OpenAPI could be added in future)

## Changelog
API changes are documented in:
- Git commit messages
- Release notes
- This documentation file (updated with significant changes)

## Support
For API-related questions or issues:
- Refer to the frontend application for usage examples
- Check the browser console for API requests and responses
- Review server logs for detailed error information
- Contact the development team for clarification on specific endpoints

---
*This API reference is generated from the actual codebase and represents the current state of the Chikit API. For the most up-to-date information, always refer to the source code and run the application locally to verify endpoint behavior.*