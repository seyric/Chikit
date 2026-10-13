# The Two-Minute Doctor: Audit and Blueprint

## Problem Statement Summary
The Two-Minute Doctor aims to enable doctors to quickly access patient information, update records, and make clinical decisions within a two-minute window during patient consultations. Key requirements include:
- Rapid patient lookup by multiple identifiers (phone, ABHA, government ID, name)
- Quick view of patient summary (demographics, active conditions, recent encounters)
- Fast data entry for vitals, symptoms, diagnosis, and prescription
- Seamless navigation to detailed records (lab reports, imaging, history)
- Offline capability for intermittent connectivity
- Voice-to-text input for hands-free documentation
- Integration with hospital systems for order placement and result retrieval

## Current State in Chikit Repository

### Existing Components
1. **Patient Lookup**
   - Patient identity service (`src/lib/patient-identity-service.ts`) provides duplicate detection based on phone, ABHA, government ID, name, and DOB
   - Patient registration service creates records with immutable identifiers (patientCode, chikitHealthId)
   - No dedicated patient search API endpoint exists

2. **Patient Summary View**
   - Patients table includes demographics (name, DOB, gender, blood group, contact info)
   - No consolidated patient summary API or frontend component
   - Medical records, lab reports, prescriptions tables exist but no aggregation service

3. **Clinical Data Entry**
   - Tables exist for medical records (`medical_records.ts`), lab reports (`lab_reports.ts`), prescriptions (`prescriptions.ts`)
   - No API endpoints for creating/updating these records
   - No frontend forms for clinical data entry

4. **Navigation to Detailed Records**
   - No API endpoints for retrieving lab reports, imaging, or history by patient
   - No frontend views for detailed records

5. **Offline Capability**
   - No offline storage mechanism (IndexedDB, Service Worker) implemented in frontend
   - Backend assumes constant database connectivity

6. **Voice-to-Text Input**
   - No voice input components or integration with Web Speech API

7. **Hospital System Integration**
   - No integration with hospital systems for order placement or result retrieval
   - ABDM/ABHA integration exists for health ID linkage but not for order/results exchange

### Working Components
- Patient registration and identity verification flow (partially implemented)
- Hospital tenancy middleware (functional)
- Authentication system (JWT-based)
- Database schema for core clinical entities

### Partially Implemented/Broken/Simulated/Missing
- **Patient Search API**: Missing
- **Patient Summary API**: Missing
- **Clinical Data Entry APIs**: Missing (medical records, lab reports, prescriptions)
- **Frontend Patient Search**: Missing
- **Frontend Patient Summary Dashboard**: Missing
- **Frontend Clinical Data Entry Forms**: Missing
- **Offline Storage**: Missing
- **Voice-to-Text**: Missing
- **Hospital System Integration**: Missing (beyond ABDM/ABHA for identity)
- **Error Handling**: Some services have incomplete error handling (e.g., missing try/catch)
- **TypeScript Compilation**: Some files have unresolved type errors (e.g., missing `hospital` property on Request)

## Detailed Implementation Blueprint

### 1. Patient Lookup Functionality
#### Backend
- Create `/api/patients/search` endpoint accepting query parameters (phone, abhaNumber, govtIdType, govtIdNumber, name)
- Implement fuzzy matching for name and DOB
- Return minimal patient summary (id, patientCode, chikitHealthId, name, DOB, gender, phone)
- Add pagination and rate limiting
- Scope results to authenticated user's hospital (if applicable)

#### Frontend
- Create patient search component with multi-field input (phone, ABHA, ID, name)
- Implement debounced search to avoid excessive API calls
- Display search results with patient summary cards
- Allow selecting a patient to load their full dashboard

### 2. Patient Summary View
#### Backend
- Create `/api/patients/:id/summary` endpoint
- Aggregate data from:
  - Patients table (demographics)
  - Active medical records (latest encounter)
  - Recent lab reports (last 3)
  - Active prescriptions
  - Upcoming appointments
- Return structured JSON with sections for vitals, conditions, medications, recent activity

#### Frontend
- Create PatientSummaryView component
- Display key demographics prominently
- Show recent vitals (BP, weight, temperature) if available
- List active conditions and medications
- Show recent lab results with abnormal flags
- Provide quick navigation to detailed views

### 3. Clinical Data Entry
#### Backend
- Create API endpoints for:
  - POST `/api/patients/:id/vitals` (systolic, diastolic, pulse, temperature, weight, height, SpO2)
  - POST `/api/patients/:id/encounters` (chief complaint, symptoms, diagnosis, notes)
  - POST `/api/patients/:id/prescriptions` (medication, dosage, frequency, duration)
  - POST `/api/patients/:id/lab-orders` (test type, priority, notes)
- Each endpoint should validate input, store in respective table, and return created record
- Implement doctor authentication and authorization (only assigned doctor can update)

#### Frontend
- Create clinical data entry forms:
  - Vitals form (inline or modal)
  - Encounter form (SOAP notes structure)
  - Prescription search and entry form
  - Lab/order request form
- Integrate with patient summary view for seamless workflow
- Implement form validation and error handling

### 4. Navigation to Detailed Records
#### Backend
- Create API endpoints for:
  - GET `/api/patients/:id/medical-records` (paginated, filterable by date/type)
  - GET `/api/patients/:id/lab-reports` (paginated, filterable by date/type)
  - GET `/api/patients/:id/prescriptions` (active and history)
  - GET `/api/patients/:id/appointments` (upcoming and past)
- Return detailed records with relevant fields

#### Frontend
- Create detailed views for each record type:
  - Medical Records Timeline (chronological view)
  - Lab Reports Grid (with reference ranges and flags)
  - Prescription List (current and historical)
  - Appointment Calendar/View
- Implement from patient summary view via clickable sections

### 5. Offline Capability
#### Frontend
- Implement service worker for caching static assets and API responses
- Use IndexedDB (via library like idb) to store patient summary and recent encounters
- Queue clinical data entries when offline, sync when connectivity restored
- Implement conflict resolution (last-write-wins or manual review for clinical data)
- Show offline status indicator to user

### 6. Voice-to-Text Input
#### Frontend
- Integrate Web Speech API for voice input in clinical notes fields
- Create voice input button with visual feedback (listening, processing)
- Provide fallback to manual typing
- Implement voice commands for common actions (e.g., "save vitals", "next field")
- Ensure HIPAA-compliant processing (consider on-device processing where possible)

### 7. Hospital System Integration
#### Backend
- Create abstraction layer for hospital system interfaces (HL7 FHIR, proprietary APIs)
- Implement adapters for common hospital systems (if known)
- Create endpoints for:
  - POST `/api/orders/lab` (to place lab order with hospital system)
  - GET `/api/results/lab/:orderId` (to retrieve results from hospital system)
  - Similar for imaging, prescriptions
- Implement secure credential storage for hospital system connections

## Required Database Changes
No new tables required for core functionality (existing tables sufficient). However:
1. Add indexes to patients table for search fields:
   - `phone`, `abhaNumber`, `govtIdType`, `govtIdNumber`, `name`
2. Consider adding `updatedAt` timestamps to clinical tables if not present
3. Add foreign key constraints where missing (e.g., medicalRecords.patientId → patients.id)

## Required API Contracts
### Patient Search
```
GET /api/patients/search
Query: phone, abhaNumber, govtIdType, govtIdNumber, name, limit, offset
Response: 
{
  patients: [{
    id: number,
    patientCode: string,
    chikitHealthId: string,
    name: string,
    dateOfBirth: string,
    gender: string,
    phone: string | null
  }],
  total: number,
  limit: number,
  offset: number
}
```

### Patient Summary
```
GET /api/patients/:id/summary
Response:
{
  demographics: {...},
  vitals: {...} | null,
  activeConditions: [string],
  recentEncounters: [{
    id: number,
    date: string,
    chiefComplaint: string,
    diagnosis: string
  }],
  activePrescriptions: [...],
  recentLabReports: [...],
  upcomingAppointments: [...]
}
```

### Clinical Data Entry (example for vitals)
```
POST /api/patients/:id/vitals
Body: { systolic: number, diastolic: number, pulse: number, temperature: number, weight: number, height: number, spo2: number }
Response: { id: number, patientId: number, ...vitals, recordedAt: string, recordedBy: number }
```

## Required AI/ML Implementation
For The Two-Minute Doctor, AI/ML is not strictly required but could enhance:
1. **Voice-to-Text Accuracy**: Use domain-specific medical language models for better transcription
2. **Clinical Decision Support**: Suggest diagnoses based on symptoms (requires separate implementation)
3. **Voice Commands**: Natural language processing for voice-controlled navigation
These would be enhancements beyond the core two-minute requirement.

## Required UI/UX Changes
1. **Patient Search Bar**: Prominent in header or dashboard
2. **Patient Summary Dashboard**: Default view when patient selected
3. **Clinical Data Entry Buttons**: Floating action buttons for vitals, encounter, prescription
4. **Detailed Record Tabs**: Tabs for medical records, lab reports, prescriptions, appointments
5. **Offline Indicator**: Visual cue when offline
6. **Voice Input Button**: Microphone icon in text fields
7. **Loading States**: Skeletons and spinners for data fetching
8. **Error Handling**: User-friendly error messages and retry options

## Security and Privacy Considerations
1. **Authorization**: Ensure doctors can only access patients in their hospital (unless cross-consultation allowed)
2. **Audit Logging**: Log all patient data access and modifications
3. **Data Encryption**: Encrypt sensitive data at rest (if not already)
4. **Secure Voice Processing**: Consider on-device voice processing to avoid sending audio to external services
5. **Rate Limiting**: Prevent abuse of search and data entry endpoints
6. **Input Sanitization**: Prevent injection attacks in search fields

## Testing Strategy
1. **Unit Tests**: 
   - Patient search algorithms
   - Data validation for clinical entry endpoints
   - Summary aggregation logic
2. **Integration Tests**:
   - End-to-end patient search and selection flow
   - Clinical data entry and persistence
   - Offline queue and sync behavior
3. **Frontend Tests**:
   - Component rendering with mock data
   - Form validation and submission
   - Voice input integration
4. **Performance Tests**:
   - Search response time (<1s for summary)
   - Data entry latency (<500ms)
   - Offline sync efficiency
5. **Security Tests**:
   - Authorization bypass attempts
   - Input validation for SQL/XSS
   - API rate limiting effectiveness

## Deployment Considerations
1. **Environment Variables**:
   - Enable/disable voice features
   - Configure offline sync intervals
   - Set rate limiting thresholds
2. **Database**:
   - Ensure indexes are created for search fields
   - Monitor table sizes for patient and clinical tables
3. **Backend**:
   - Scale API servers based on expected concurrent users
   - Implement caching for patient summary (Redis)
4. **Frontend**:
   - Service worker registration and caching strategies
   - IndexedDB quota management
   - Voice feature detection and fallback
5. **Monitoring**:
   - Track API response times for search and summary endpoints
   - Monitor offline sync success/failure rates
   - Audit clinical data entry volume

## Gap Summary
| Component | Status | Notes |
|----------|--------|-------|
| Patient Search API | Missing | No endpoint exists |
| Patient Summary API | Missing | No aggregation service |
| Clinical Data Entry APIs | Missing | No endpoints for vitals, encounters, etc. |
| Frontend Patient Search | Missing | No search UI |
| Frontend Patient Summary | Missing | No summary dashboard |
| Frontend Clinical Data Entry Forms | Missing | No forms for data entry |
| Offline Storage | Missing | No service worker or IndexedDB implementation |
| Voice-to-Text Input | Missing | No Web Speech API integration |
| Hospital System Integration | Missing | Beyond ABDM/ABHA for identity |
| Authentication & Authorization | Partial | Exists but needs hospital-scoped enforcement for clinical data |
| Database Indexes | Missing | No indexes on search fields for performance |
| Error Handling | Partial | Some services lack comprehensive error handling |
| TypeScript Compilation | Issues | Some unresolved type errors (e.g., `hospital` property) |

## Recommendations
1. Begin by implementing the patient search and summary APIs to enable quick patient lookup.
2. Develop the frontend search and summary components to verify backend functionality.
3. Add clinical data entry APIs and forms incrementally (start with vitals and encounters).
4. Implement offline storage and voice input as enhancements once core workflow is functional.
5. Address TypeScript compilation errors to ensure code quality.
6. Add database indexes for search performance.
7. Implement comprehensive error handling and audit logging.
