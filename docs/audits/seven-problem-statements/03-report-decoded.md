# Report, Decoded: Audit and Blueprint

## Problem Statement Summary
Report, Decoded focuses on enabling patients to understand their medical reports (lab results, imaging, prescriptions) through plain language explanations, visualizations, and contextual information. Key requirements include:
- Automatic translation of medical jargon into plain language
- Visual representation of trends (e.g., lab values over time)
- Contextual information (what is normal, why it matters, next steps)
- Multilingual support (English, Hindi, regional languages)
- Accessibility features (voice output, screen reader friendly)
- Integration with lab and imaging systems to fetch reports
- Ability to annotate reports and ask questions
- Offline access to previously viewed reports

## Current State in Chikit Repository

### Existing Components
1. **Report Storage**
   - Lab reports table (`lab_reports.ts`) exists with fields for test name, value, units, reference range, etc.
   - Medical records table (`medical_records.ts`) for clinical notes
   - Prescriptions table (`prescriptions.ts`) for medications
   - No table for imaging reports (could be under medical records or separate)

2. **Report Fetching**
   - No API endpoints to retrieve lab reports, imaging, or prescriptions for a patient
   - No integration with external lab or imaging systems (simulated DigiLocker service exists for document fetching but not for reports)

3. **Plain Language Explanation**
   - No service or component for translating medical jargon to plain language
   - No medical terminology database or NLP model integrated

4. **Visualization**
   - No charting components for lab trends
   - No visualization library integrated (e.g., Chart.js, D3, Recharts)

5. **Multilingual Support**
   - No i18n framework (e.g., react-i18next) implemented
   - UI strings are hardcoded in English

6. **Accessibility**
   - No voice output (text-to-speech) implementation
   - Limited ARIA labels and keyboard navigation (to be audited)

7. **Report Annotation & Q&A**
   - No functionality to annotate reports or ask questions

8. **Offline Access**
   - No offline storage for reports

### Working Components
- Database schema for lab reports and prescriptions
- Patient identity system to link reports to patients
- Authentication system

### Partially Implemented/Broken/Simulated/Missing
- **Lab Report Retrieval API**: Missing
- **Imaging Report Retrieval API**: Missing (imaging may be under medical records)
- **Prescription Retrieval API**: Missing
- **Plain Language Explanation Service**: Missing
- **Visualization Components**: Missing
- **Multilingual Support**: Missing
- **Text-to-Speech**: Missing
- **Report Annotation**: Missing
- **Offline Report Storage**: Missing
- **External Lab/Imaging System Integration**: Missing (beyond simulated DigiLocker)
- **TypeScript Compilation**: Some unresolved issues (e.g., missing `hospital` property)

## Detailed Implementation Blueprint

### 1. Report Retrieval and Aggregation
#### Backend
- Create API endpoints:
  - GET `/api/patients/:id/lab-reports` (paginated, filterable by date, test type, abnormal flag)
  - GET `/api/patients/:id/imaging-reports` (if separate table) or extend medical records to include imaging
  - GET `/api/patients/:id/prescriptions` (active and history)
- Each endpoint should return structured data with:
  - Raw values (for verification)
  - Reference ranges and interpretation flags (high/low/normal)
  - Date and performing facility
- Implement caching for frequently accessed reports
- Scope to patient's hospital (if applicable)

#### Frontend
- Create report retrieval services/hooks
- Implement loading and error states
- Fetch reports when patient is selected or via direct link

### 2. Plain Language Explanation Service
#### Backend
- Create a service that maps medical terms to plain language explanations
- Could be rule-based initially (dictionary of terms) with potential for NLP enhancement
- Provide explanations for:
  - Lab test names (e.g., "Hemoglobin A1c" -> "Average blood sugar level over the past 3 months")
  - Value interpretations (e.g., "HbA1c: 7.2%" -> "Your average blood sugar has been slightly elevated over the past 3 months")
  - Common medical abbreviations (BP, WBC, etc.)
- Expose via API: POST `/api/reports/explain` with medical text, returns plain language version
- Consider multilingual explanations (see section 4)

#### Frontend
- Create component to display report with toggle between technical and plain language views
- Integrate explanation service API
- Allow users to click on terms for inline explanations

### 3. Visualization and Trends
#### Backend
- Enhance lab reports API to support time-series queries:
  - GET `/api/patients/:id/lab-reports/:testName/trend` (returns values over time)
- Consider storing normalized values for trending (e.g., convert all glucose measurements to mg/dL)

#### Frontend
- Integrate a charting library (e.g., Recharts, Chart.js)
- Create components for:
  - Single metric trend (line chart with reference range bands)
  - Multiple metric comparison (e.g., lipid panel)
  - Categorical views (e.g., blood cell counts)
- Allow users to select time range (last 7 days, 30 days, 6 months, 1 year)
- Show abnormal values with visual indicators (color, icons)

### 4. Multilingual Support
#### Backend
- Store plain language explanations in multiple languages (if using service approach)
- Or implement explanation generation with language parameter

#### Frontend
- Implement i18n framework (react-i18next or similar)
- Create translation files for English (en), Hindi (hi), and other regional languages as needed
- Translate all UI strings (buttons, labels, messages)
- Implement language selector in user settings
- Ensure date/number formatting follows locale

### 5. Accessibility Features
#### Frontend
- Implement text-to-speech using Web Speech API or library
  - Button to have report read aloud
  - Highlighting as text is spoken
- Ensure all interactive elements are keyboard navigable
- Add ARIA labels to charts and visualizations (consider using accessible charting libraries or providing text alternatives)
- Support screen readers with proper semantic structure
- Implement high contrast mode and resizable text

### 6. Report Annotation and Q&A
#### Backend
- Create annotations table (if not exists) with:
  - id, reportId (lab report or medical record), userId (patient or doctor), comment, createdAt
- API endpoints:
  - POST `/api/reports/:reportId/annotations` (add comment)
  - GET `/api/reports/:reportId/annotations` (fetch comments)
  - DELETE `/api/reports/:reportId/annotations/:annotationId` (delete own comment)
- Implement moderation (patients can't delete doctor comments, etc.)

#### Frontend
- Create annotation component:
  - Allow highlighting text in report and adding comment
  - Display comments as marginalia or in a sidebar
  - Allow replying to comments (discussion thread)
  - Indicate unread comments
- Implement Q&A functionality:
  - Allow patients to ask questions about reports
  - Route questions to assigned doctor or healthcare provider
  - Store in notifications/messages system

### 7. Offline Access to Reports
#### Frontend
- Cache fetched reports in IndexedDB
- Implement service worker to cache report API responses
- Allow users to mark reports for offline access (pin)
- Sync annotations and Q&A when online returns
- Show offline indicator and last synced time

### 8. Integration with External Systems
#### Backend
- Create adapters for common lab and information systems (LIS, RIS, PACS)
- Implement secure credential storage
- Create endpoints to trigger report fetching from external systems (if not already pushed)
- Consider implementing HL7 FHIR consumers for standard systems
- For now, simulate with sample data or allow manual upload

## Required Database Changes
1. **Annotations Table** (if not exists):
   ```sql
   CREATE TABLE report_annotations (
     id SERIAL PRIMARY KEY,
     report_id INTEGER NOT NULL, -- foreign key to lab_reports or medical_records
     user_id INTEGER NOT NULL, -- foreign key to users
     comment TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
2. **Enhanced Lab Reports Table** (if missing fields):
   - Add `interpretation` field (enum: normal, high, low, critical)
   - Add `reference_range_low` and `reference_range_high` (numeric)
   - Add `reference_range_units` (text)
   - Add `abnormal_flags` (JSONB for flags like critical, panic value)
3. **Indexes** for patientId and date on lab reports table for performance

## Required API Contracts
### Lab Reports Retrieval
```
GET /api/patients/:id/lab-reports
Query: limit, offset, startDate, endDate, testType, abnormalOnly
Response:
{
  labReports: [{
    id: number,
    testName: string,
    testCode: string, // LOINC or local code
    value: number | string,
    units: string,
    referenceRangeLow: number | null,
    referenceRangeHigh: number | null,
    referenceRangeText: string, // e.g., "70-99 mg/dL"
    interpretation: string, // normal, high, low, critical
    abnormalFlags: string[], // ["critical", "panic"]
    performedAt: string, // ISO date
    performedAtFacility: string,
    reportedAt: string,
    reportedBy: string,
    fileUrl: string | null, // if PDF/image available
    rawData: any | null // optional original payload
  }],
  total: number,
  limit: number,
  offset: number
}
```

### Plain Language Explanation
```
POST /api/reports/explain
Body: { text: string, targetLanguage: string } // targetLanguage optional, defaults to request language
Response: { plainText: string }
```

### Lab Report Trend
```
GET /api/patients/:id/lab-reports/:testName/trend
Query: period (7d, 30d, 6m, 1y) or startDate, endDate
Response:
{
  testName: string,
  unit: string,
  referenceRange: { low: number, high: number },
  dataPoints: [{ date: string, value: number, interpretation: string }]
}
```

### Annotations
```
GET /api/reports/:reportId/annotations
Response: [{ id: number, userId: number, comment: string, createdAt: string, userName: string }]

POST /api/reports/:reportId/annotations
Body: { comment: string }
Response: { id: number, ...input, createdAt: string }
```

## Required AI/ML Implementation
1. **Medical NLP for Explanation**:
   - Train or fine-tune a model to convert medical jargon to plain language (domain-specific translation)
   - Alternatively, use rule-based system with potential for ML enhancement
2. **Abnormality Detection**:
   - ML model to flag critical values based on trends and patient history (beyond static reference ranges)
3. **Voice Output**:
   - Use existing text-to-speech (may not require custom ML)
   - For multilingual TTS, consider language-specific models
4. **Report Classification**:
   - Auto-categorize reports (lipid panel, CBC, etc.) for consistent explanation

## Required UI/UX Changes
1. **Report Viewer**:
   - Toggle between technical/plain language views
   - Visualization panel for trends
   - Annotation sidebar
   - Text-to-speech button
   - Language selector
2. **Report List**:
   - Filter by date, type, abnormal status
   - Group by category (liver panel, kidney function, etc.)
   - Show abnormal flags with icons
3. **Trend Charts**:
   - Interactive (hover for details, zoom)
   - Show reference range as shaded area
   - Indicate abnormal points with color
4. **Annotation UI**:
   - Inline commenting (highlight text -> comment)
   - Threaded discussions
   - Edit/delete own comments
5. **Offline Indicators**:
   - Banner showing offline status
   - Pin icon for reports available offline
6. **Accessibility**:
   - High contrast mode toggle
   - Font size adjuster
   - Screen reader friendly labels

## Security and Privacy Considerations
1. **Authorization**: Ensure patients can only access their own reports
2. **Consent**: Respect patient preferences for report sharing and explanations
3. **Data Minimization**: Store only necessary data for explanations (avoid storing raw audio if possible)
4. **Secure Transmission**: Use HTTPS for all report data
5. **Audit Logging**: Log report accesses, explanation generations, and annotation activities
6. **Input Sanitization**: Prevent XSS in annotation comments
7. **Rate Limiting**: Protect explanation and trend APIs from abuse

## Testing Strategy
1. **Unit Tests**:
   - Plain language explanation service (dictionary accuracy)
   - Trend calculation algorithms
   - Annotation validation
2. **Integration Tests**:
   - End-to-end report retrieval and display
   - Explanation service integration
   - Chart rendering with sample data
   - Annotation CRUD operations
3. **Frontend Tests**:
   - Report viewer component with mock data
   - Toggle between technical/plain language
   - Chart interactivity
   - Annotation UI
   - Text-to-speech functionality
   - Language switching
4. **Performance Tests**:
   - Report retrieval time (<1s)
   - Explanation generation latency (<500ms)
   - Chart rendering performance
   - Offline sync efficiency
5. **Accessibility Tests**:
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast compliance
   - Text-to-speech intelligibility
6. **Security Tests**:
   - Authorization bypass attempts
   - Input validation for SQL/XSS in annotations
   - Rate limiting effectiveness
   - Data encryption at rest

## Deployment Considerations
1. **Environment Variables**:
   - Enable/disable ML explanation features
   - Configure i18n languages
   - Set caching timeouts for reports
   - Configure text-to-speech service options
2. **Database**:
   - Ensure indexes on lab reports (patientId, date)
   - Consider partitioning for large report volumes
   - Monitor annotations table growth
3. **Backend**:
   - Cache explanation results for common terms
   - Implement rate limiting on explanation API
   - Use background jobs for report trend precomputation if needed
4. **Frontend**:
   - Service worker caching strategies for report APIs
   - IndexedDB schema for offline reports and annotations
   - Lazy loading of heavy visualization libraries
   - Font loading for multilingual support
5. **Monitoring**:
   - Track report API latency and error rates
   - Monitor explanation service usage and accuracy (via feedback)
   - Monitor annotation engagement
   - Track offline sync success/failure
   - Measure time to understand report (via user testing)

## Gap Summary
| Component | Status | Notes |
|----------|--------|-------|
| Lab Report Retrieval API | Missing | No endpoint exists |
| Imaging Report Retrieval API | Missing | May be under medical records |
| Prescription Retrieval API | Missing | No endpoint |
| Plain Language Explanation Service | Missing | No service or dictionary |
| Visualization Components | Missing | No charting integration |
| Multilingual Support | Missing | No i18n framework |
| Text-to-Speech | Missing | No Web Speech API integration |
| Report Annotation | Missing | No annotation system |
| Offline Report Storage | Missing | No service worker or IndexedDB |
| External Lab/Imaging Integration | Missing | Beyond simulated DigiLocker |
| Database Indexes for Reports | Missing | No indexes on patientId/date |
| Error Handling | Partial | Some services lack comprehensive error handling |
| TypeScript Compilation | Issues | Some unresolved type errors (e.g., `hospital` property) |

## Recommendations
1. Start by implementing lab report retrieval APIs and frontend viewer to establish baseline.
2. Add plain language explanation service (rule-based first) and toggle in viewer.
3. Integrate charting library and add trend visualization for lab reports.
4. Implement multilingual support (i18n) and text-to-speech.
5. Add annotation and Q&A functionality.
6. Implement offline storage for reports and annotations.
7. Address TypeScript compilation errors and add database indexes.
8. Implement external system adapters as needed for lab/imaging integration.
