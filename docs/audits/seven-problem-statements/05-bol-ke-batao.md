# Bol Ke Batao: Audit and Blueprint

## Problem Statement Summary
Bol Ke Batao focuses on enabling patients to communicate their symptoms, concerns, and health status effectively, especially for those with limited literacy, language barriers, or disabilities. Key requirements include:
- Symptom input via voice, icons, and simple language
- Multilingual support with dialect handling
- Accessibility for visual, auditory, motor, and cognitive impairments
- Symptom tracking over time with visualizations
- Integration with triage systems to assess urgency
- Communication tools for patients to message care teams
- Language translation for provider-patient communication
- Offline capability for symptom logging
- Privacy and security for sensitive symptom data
- Escalation based on symptom severity

## Current State in Chikit Repository

### Existing Components
1. **Symptom Tracking**
   - No dedicated symptom tracking system
   - Symptoms may be stored as free text in medical records or encounter notes
   - No structured symptom ontology or standardized input

2. **Voice Input**
   - No voice input components or integration with Web Speech API

3. **Icon-Based Input**
   - No icon or pictogram-based symptom input system

4. **Multilingual Support**
   - No i18n framework implemented
   - UI strings are hardcoded in English

5. **Accessibility Features**
   - Limited accessibility audit performed (to be done)
   - No screen reader optimization, no high contrast mode, no font resizing

6. **Symptom Tracking Over Time**
   - No time-series symptom tracking
   - No visualization of symptom trends

7. **Triage Integration**
   - No triage system or symptom-based urgency assessment

8. **Patient-Provider Messaging**
   - Basic authentication exists, but no messaging system between patients and providers

9. **Language Translation**
   - No real-time translation service for conversations

10. **Offline Capability**
    - No offline storage for symptom logs

11. **Privacy and Security**
    - Authentication and authorization exist, but symptom-specific protections may be lacking

12. **Escalation Based on Severity**
    - No automated symptom severity scoring or escalation

### Working Components
- Patient identity system
- Authentication system (JWT-based)
- Hospital tenancy middleware
- Encounter/medical records storage (unstructured)

### Partially Implemented/Broken/Simulated/Missing
- **Symptom Input Interface**: Missing (voice, icons, simple language)
- **Multilingual Support**: Missing
- **Accessibility Features**: Missing
- **Structured Symptom Tracking**: Missing
- **Symptom Visualization**: Missing
- **Triage System**: Missing
- **Patient-Provider Messaging**: Missing
- **Language Translation**: Missing
- **Offline Symptom Logging**: Missing
- **Privacy-Enhanced Symptom Storage**: Missing
- **Symptom Severity Scoring**: Missing
- **Escalation Automation**: Missing
- **TypeScript Compilation**: Some unresolved issues (e.g., missing `hospital` property)

## Detailed Implementation Blueprint

### 1. Symptom Input Interface
#### Frontend
- Create multiple input modalities:
  - **Voice Input**: Integrate Web Speech API for speech-to-text in multiple languages
  - **Icon-Based Input**: Create a palette of medical symptom icons (pain, fever, cough, etc.) with severity scales
  - **Simple Language Input**: Provide dropdown of common symptoms in plain language with ability to add free text
  - **Drawing Input**: Allow patients to mark areas of discomfort on body diagrams
- Implement input validation and guidance (e.g., "When did this start?", "How severe is it?")
- Create reusable symptom input component for use in various contexts (triage, monitoring, encounters)

#### Backend
- Create symptom ontology service:
  - Map layman terms to clinical terminology (e.g., "stomach ache" → "abdominal pain")
  - Provide severity scales and associated questions
  - Support multiple languages and dialects
- API endpoints:
  - POST `/api/symptoms/normalize` (convert input to structured symptom data)
  - GET `/api/symptoms/ontology` (retrieve symptom dictionary for frontend)

### 2. Multilingual Support
#### Backend
- Store symptom ontology and common phrases in multiple languages
- Implement language detection from input (if possible)
- Provide translation APIs for symptom descriptions

#### Frontend
- Implement i18n framework (react-i18next or similar)
- Create translation files for English (en), Hindi (hi), and other regional languages/dialects as needed
- Translate all UI strings, symptom ontology, and input guidance
- Implement language selector in user preferences
- Detect browser/system language as default

### 3. Accessibility Features
#### Frontend
- **Visual Impairments**:
  - High contrast mode toggle
  - Font size adjuster (rem-based scaling)
  - Screen reader friendly labels and ARIA attributes
  - Avoid color-only indicators (use icons + text)
- **Auditory Impairments**:
  - Visual alternatives for audio cues
  - Captions for any audio/video content
  - Support for hearing aid compatibility (if using Web Speech API, provide visual feedback)
- **Motor Impairments**:
  - Large touch targets
  - Voice navigation options
  - Switch control compatibility
  - Keyboard navigable interface
- **Cognitive Impairments**:
  - Simplified interface with progressive disclosure
  - Clear instructions and feedback
  - Consistent navigation and layout
  - Ability to repeat or go back steps
- Implement accessibility testing axe core or similar

### 4. Structured Symptom Tracking Over Time
#### Backend
- Create symptoms table:
  - id, patientId, symptomCode (from ontology), severity (0-10), duration, onsetTime, notes, source (voice/icon/text), recordedAt
- API endpoints:
  - POST `/api/patients/:id/symptoms` (log a symptom)
  - GET `/api/patients/:id/symptoms` (retrieve symptom history, filterable by symptomCode, date range)
  - GET `/api/patients/:id/symptoms/:symptomCode/trend` (severity over time)
- Implement data retention policies (symptom logs may be kept shorter than clinical records)
- Scope to patient's hospital (if applicable)

#### Frontend
- Create symptom tracking dashboard:
  - Calendar view of logged symptoms
  - List view with ability to add new symptoms
  - Detailed view for a specific symptom instance
- Create symptom trend visualization:
  - Line chart of severity over time for a selected symptom
  - Show frequency of occurrence (bar chart)
  - Allow filtering by date range
- Implement reminders for regular symptom logging (if part of monitoring plan)

### 5. Symptom Visualization
#### Frontend
- Integrate charting library (e.g., Recharts, Chart.js)
- Create components for:
  - Symptom severity timeline (line chart)
  - Symptom frequency heatmap (calendar view)
  - Body map with symptom locations (using icon placement)
  - Multiple symptom comparison (radar chart or parallel coordinates)
- Allow exporting visualizations as images or PDF
- Ensure visualizations are accessible (provide data tables, screen reader friendly)

### 6. Triage System Integration
#### Backend
- Create triage service:
  - Implement rule-based triage (e.g., based on symptom combinations, severity, vital signs)
  - Support for standard triage protocols (e.g., ESI, Manchester) if applicable
  - Provide urgency level (e.g., emergent, urgent, non-urgent)
- API endpoints:
  - POST `/api/triage/assess` (input: symptoms, vitals, patient history; output: urgency level, recommended action)
  - GET `/api/triage/protocols` (retrieve supported triage protocols)
- Integrate with symptom logging endpoint to optionally auto-triage
- Create alerts for high-urgency symptoms

#### Frontend
- Create triage assessment tool:
  - For patients: symptom input → urgency assessment → guidance (call 911, contact doctor, self-care)
  - For providers: view patient-submitted triage assessments
- Display triage result with clear actions and timing
- Integrate with patient-provider messaging for follow-up

### 7. Patient-Provider Messaging
#### Backend
- Create messages table:
  - id, senderId, recipientId, conversationId, messageText, messageType (text, image, voice), sentAt, readAt
- API endpoints:
  - GET `/api/messages/conversations` (list conversations for user)
  - GET `/api/messages/conversation/:id` (get messages in conversation)
  - POST `/api/messages/conversation/:id/messages` (send message)
  - PUT `/api/messages/:id/read` (mark as read)
  - DELETE `/api/messages/:id` (delete own message)
- Implement message encryption at rest if required
- Support attachments (images, voice notes) with storage service
- Implement rate limiting and abuse prevention

#### Frontend
- Create messaging interface:
  - Conversation list (like email inbox)
  - Conversation view with threading
  - Message composition with voice input, image attachment, symptom attachment
  - Read receipts and typing indicators
  - Push notifications for new messages
- Implement message search and filtering
- Allow patients to initiate conversations with their care team
- Allow providers to message patients (e.g., follow-up after visit)

### 8. Language Translation
#### Backend
- Create translation service:
  - Use machine translation API (if available and HIPAA-compliant) or rule-based for medical phrases
  - Cache translations for common phrases
  - Provide language detection
- API endpoints:
  - POST `/api/translate` (input: text, sourceLanguage, targetLanguage; output: translatedText)
  - GET `/api/languages/supported` (list of supported language pairs)

#### Frontend
- Integrate translation service into:
  - Symptom input (allow patient to speak in their language, translate to provider's language)
  - Messaging (translate messages in real-time or on-demand)
  - Education materials (toggle language)
  - Discharge instructions (toggle language)
- Provide UI toggle for translation (auto-translate or manual translate button)
- Indicate when content is machine-translated with disclaimer

### 9. Offline Symptom Logging
#### Frontend
- Implement service worker for caching static assets and API responses
- Use IndexedDB (via library like idb) to store symptom logs when offline
- Queue symptom entries when offline, sync when connectivity restored
- Implement conflict resolution (last-write-wins for symptom logs)
- Show offline status indicator and last sync time
- Allow patients to view their symptom history offline

### 10. Privacy and Security for Symptom Data
#### Backend
- Encrypt symptom data at rest (if considered highly sensitive)
- Implement fine-grained access controls:
  - Patients can only see their own symptoms
  - Providers can only see symptoms of patients in their hospital (unless cross-consent)
- Audit logging for symptom access and logging
- Data minimization: store only necessary symptom data (avoid storing raw audio if possible)
- Secure deletion options for patients
- Symptom data retention policies aligned with regulations

#### Frontend
- Secure handling of voice input (consider on-device processing to avoid sending audio to external services)
- Clear consent for symptom logging and sharing with care team
- Ability for patients to delete their symptom logs
- Transparent privacy policy accessible from symptom input

### 11. Escalation Based on Symptom Severity
#### Backend
- Create symptom severity scoring:
  - Combine symptom severity, vital signs, and patient history into a risk score
  - Define thresholds for automatic escalation (e.g., chest pain + high severity → alert)
- Integrate with alerting engine (see Going Home Right audit) or create dedicated escalation service
- API endpoints:
  - POST `/api/symptoms/:id/escalate` (manually escalate a symptom log)
  - GET `/api/escalations` (filter by patient/status/provider)
- Implement escalation pathways (notify patient, notify provider, trigger emergency services)

#### Frontend
- Create escalation dashboard for providers:
  - Show escalated symptoms by urgency
  - Allow acknowledgment and assignment
  - Show escalation history and resolution
- Create patient escalation alerts:
  - Notify patient via app if they should seek immediate care
  - Provide guidance (call emergency contact, go to ED, etc.)
  - Allow patient to cancel false escalations

## Required Database Changes
1. **Symptoms Table**:
   ```sql
   CREATE TABLE symptoms (
     id SERIAL PRIMARY KEY,
     patient_id INTEGER NOT NULL,
     symptom_code VARCHAR(50) NOT NULL, -- references symptom_ontology.code
     severity INTEGER CHECK (severity >= 0 AND severity <= 10),
     duration VARCHAR(50), -- e.g., '2 days', '3 hours'
     onset_time TIMESTAMP WITH TIME ZONE,
     notes TEXT,
     source VARCHAR(20) NOT NULL, -- voice, icon, text, drawing
     recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
2. **Symptom Ontology Table** (for standardized symptom codes and multilingual support):
   ```sql
   CREATE TABLE symptom_ontology (
     code VARCHAR(50) PRIMARY KEY,
     clinical_term TEXT NOT NULL, -- e.g., 'abdominal pain'
     categories TEXT[], -- e.g., ['pain', 'gastrointestinal']
     translations JSONB -- { en: 'Stomach ache', hi: 'पेट दर्द', ... }
   );
   ```
3. **Messages Table**:
   ```sql
   CREATE TABLE messages (
     id SERIAL PRIMARY KEY,
     sender_id INTEGER NOT NULL,
     recipient_id INTEGER NOT NULL,
     conversation_id INTEGER NOT NULL,
     message_text TEXT,
     message_type VARCHAR(20) DEFAULT 'text', -- text, image, voice, symptom
     sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     read_at TIMESTAMP WITH TIME ZONE
   );
   ```
4. **Conversations Table** (optional, for grouping messages):
   ```sql
   CREATE TABLE conversations (
     id SERIAL PRIMARY KEY,
     participant_1_id INTEGER NOT NULL,
     participant_2_id INTEGER NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE
   );
   ```
5. **Triage Assessments Table**:
   ```sql
   CREATE TABLE triage_assessments (
     id SERIAL PRIMARY KEY,
     patient_id INTEGER NOT NULL,
     assessed_by INTEGER, -- patientId or providerId
     symptoms_json JSONB, -- the symptoms that were assessed
     vital_signs_json JSONB, -- optional vitals at time of assessment
     urgency_level VARCHAR(20) NOT NULL, -- emergent, urgent, non-urgent
     recommended_action TEXT,
     assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
6. **Escalations Table**:
   ```sql
   CREATE TABLE escalations (
     id SERIAL PRIMARY KEY,
     symptom_id INTEGER NOT NULL,
     escalated_by INTEGER, -- patientId or providerId
     reason TEXT NOT NULL,
     status VARCHAR(20) NOT NULL, -- open, acknowledged, escalated, resolved
     escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     acknowledged_at TIMESTAMP WITH TIME ZONE,
     acknowledged_by INTEGER,
     resolved_at TIMESTAMP WITH TIME ZONE,
     resolved_by INTEGER,
     resolution_note TEXT
   );
   ```

## Required API Contracts
### Symptom Logging
```
POST /api/patients/:id/symptoms
Body: { symptomCode: string, severity: number, duration?: string, onsetTime?: string, notes?: string, source: string }
Response: { id: number, patientId: number, ...input, recordedAt: string }
```

### Symptom History Retrieval
```
GET /api/patients/:id/symptoms
Query: symptomCode, startDate, endDate, limit, offset
Response: [{
  id: number,
  symptomCode: string,
  clinicalTerm: string, // from ontology
  severity: number,
  duration: string | null,
  onsetTime: string | null,
  notes: string | null,
  source: string,
  recordedAt: string
}, ...], total: number, limit: number, offset: number
```

### Symptom Normalization (Input to Structured Data)
```
POST /api/symptoms/normalize
Body: { inputText: string, inputLanguage: string } // inputLanguage optional, detected if not provided
Response: { symptomCode: string, confidence: number, suggestedSeverity: number, suggestedQuestions: string[] }
```

### Triage Assessment
```
POST /api/triage/assess
Body: { symptoms: Array<{ symptomCode: string, severity: number }>, vitals?: {...}, patientHistory?: {...} }
Response: { urgencyLevel: string, recommendedAction: string, details: {...} }
```

### Messaging
```
GET /api/messages/conversations
Response: [{ id: number, otherPartyId: number, otherPartyName: string, lastMessage: string, lastMessageAt: string, unreadCount: number }]

GET /api/messages/conversation/:id
Response: [{ id: number, senderId: number, messageText: string, messageType: string, sentAt: string, readAt: string }]

POST /api/messages/conversation/:id/messages
Body: { messageText: string, messageType: string, attachmentUrl?: string }
Response: { id: number, conversationId: number, ...input, sentAt: string }
```

### Translation
```
POST /api/translate
Body: { text: string, sourceLanguage: string, targetLanguage: string }
Response: { translatedText: string }
```

### Symptom Escalation
```
POST /api/symptoms/:id/escalate
Body: { escalatedBy: number, reason?: string }
Response: { success: true, escalationId: number, escalatedAt: string }
```

## Required AI/ML Implementation
1. **Symptom Normalization NLP**:
   - Train model to map free-text symptom descriptions to standardized symptom codes (multilingual)
   - Handle variations in dialect and colloquial terms
2. **Symptom Severity Prediction**:
   - Use ML to predict clinical severity based on patient-reported symptoms, vitals, and history
   - Continuously learn from provider feedback and outcomes
3. **Triage Recommendation Engine**:
   - Implement ML-based triage that improves over time with outcomes data
   - Integrate with existing rule-based system as fallback
4. **Voice Input Enhancement**:
   - Use domain-specific speech-to-text طبي (medical) models for better accuracy in symptom description
   - Implement language identification for code-switching speech
5. **Automatic Translation Quality Estimation**:
   - Estimate quality of machine translation for medical phrases and flag low-quality translations for review
6. **Sentiment Analysis for Symptom Reports**:
   - Detect anxiety or distress in symptom descriptions to prioritize provider review

## Required UI/UX Changes
1. **Symptom Input Modal**:
   - Tabs for Voice, Icons, Simple Language, Drawing
   - Voice input button with visual feedback (listening, processing)
   - Icon grid with symptom categories and severity sliders
   - Simple language dropdown with search and ability to add custom symptoms
   - Body diagram for drawing pain locations
   - Guidance questions for each symptom (duration, triggers, etc.)
2. **Symptom Tracking Dashboard**:
   - Calendar heatmap of symptom frequency
   - List of recent symptoms with ability to add new
   - Detailed symptom card with timestamp, severity, source
   - Trend chart for selected symptom
3. **Triage Assessment View**:
   - Progress through symptom input → vitals input (if available) → urgency assessment → guidance
   - Clear display of urgency level with color and icon
   - Recommended actions with timing (e.g., "Contact your doctor within 24 hours")
4. **Messaging Interface**:
   - Conversation list with avatars and preview
   - Conversation view with message bubbles
   - Message composition with voice, image, and symptom attachment buttons
   - Read receipts and typing indicators
5. **Accessibility Controls**:
   - High contrast toggle
   - Font size adjuster
   - Screen reader mode
   - Language selector
6. **Offline Indicators**:
   - Banner showing offline status
   - Sync status and last successful sync time
7. **Escalation Notifications**:
   - In-app notification for escalated symptoms
   - Modal with guidance and ability to contact provider or emergency services

## Security and Privacy Considerations
1. **Authorization**: Ensure patients can only log symptoms for themselves and view their own symptom history
2. **Data Encryption**: Encrypt symptom logs at rest (consider encryption key per patient for enhanced privacy)
3. **Audit Logging**: Log all symptom logging, access, sharing, and escalation events
4. **Voice Data Handling**: If using external speech-to-text API, ensure HIPAA-compliant vendor or use on-device processing
5. **Message Encryption**: Consider end-to-end encryption for patient-provider messaging if required
6. **Data Minimization**: Store only necessary symptom data (avoid storing raw audio clips unless required for review)
7. **Consent Management**: Track patient consent for symptom logging, sharing with care team, and use in triage
8. **Input Sanitization**: Prevent XSS in symptom notes and messages
9. **Rate Limiting**: Protect symptom logging and messaging APIs from abuse
10. **Secure Storage**: Use secure storage for any encryption keys or credentials

## Testing Strategy
1. **Unit Tests**:
   - Symptom normalization accuracy (various inputs to correct codes)
   - Triage rule evaluation
   - Symptom severity scoring algorithms
   - Message sending and retrieval
   - Translation service accuracy
2. **Integration Tests**:
   - End-to-end symptom logging from voice input to storage and retrieval
   - Triage assessment flow from symptom input to urgency determination
   - Messaging conversation creation and synchronization
   - Offline logging and sync behavior
   - Escalation triggering and notification
3. **Frontend Tests**:
   - Symptom input component rendering and interaction
   - Voice input integration and visual feedback
   - Icon-based selection and severity adjustment
   - Drawing input on body diagram
   - Symptom tracking dashboard rendering
   - Messaging interface rendering and message sending
   - Accessibility feature toggles
   - Offline symptom viewing
4. **Performance Tests**:
   - Symptom logging latency (<500ms)
   - Triage assessment response time (<1s)
   - Messaging send/receive latency (<1s)
   - Translation response time (<1s)
   - Offline sync efficiency
5. **Security Tests**:
   - Authorization bypass attempts
   - Input validation for SQL/XSS in symptom notes and messages
   - Rate limiting effectiveness
   - Data encryption verification
   - Voice data handling security (if external API used)
6. **Accessibility Tests**:
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast compliance
   - Font scaling effectiveness
   - Voice input accessibility
7. **Usability Tests**:
   - Patient usability of symptom input modalities
   - Clarity of triage guidance and recommendations
   - Ease of use of messaging interface
   - Effectiveness of accessibility features
   - Offline use case usability

## Deployment Considerations
1. **Environment Variables**:
   - Enable/disable specific input modalities (voice, icons, etc.)
   - Configure speech-to-text API credentials (if using external service)
   - Set translation service credentials and fallback to rule-based
   - Configure triage rule sets and escalation thresholds
   - Set message retention and attachment storage policies
2. **Database**:
   - Ensure indexes on symptoms table (patientId, symptomCode, recordedAt)
   - Consider partitioning for high-volume symptom logs
   - Monitor symptoms table size and implement archiving for old data
   - Ensure indexes on messages table (conversationId, senderId, sentAt)
3. **Backend**:
   - Implement background jobs for symptom normalization if using heavy ML models
   - Use caching for symptom ontology and common translations
   - Implement message queue for real-time messaging notifications
   - Secure storage for encryption keys and API credentials
4. **Frontend**:
   - Service worker for caching static assets and API responses
   - IndexedDB schema for offline symptom logs and message drafts
   - Lazy loading of heavy components (charts, voice input libraries)
   - Font loading for multilingual support
   - Voice feature detection and fallback to typing
5. **Monitoring**:
   - Track symptom logging volume and input modality usage
   - Monitor triage assessment distribution (emergent, urgent, non-urgent)
   - Track messaging volume and response times
   - Monitor translation usage and quality metrics (if available)
   - Measure offline sync success/failure rates
   - Monitor escalation triggering and resolution times
   - Audit symptom data access for compliance
   - Track patient engagement with symptom logging (frequency, completeness)

## Gap Summary
| Component | Status | Notes |
|----------|--------|-------|
| Symptom Input Interface | Missing | No voice, icon, or simple language input system |
| Multilingual Support | Missing | No i18n framework or multilingual symptom ontology |
| Accessibility Features | Missing | No accessibility optimizations (visual, auditory, motor, cognitive) |
| Structured Symptom Tracking | Missing | No symptoms table or API for logging/retrieval |
| Symptom Visualization | Missing | No charting components for symptom trends |
| Triage System | Missing | No triage assessment or urgency determination |
| Patient-Provider Messaging | Missing | No messaging system between patients and providers |
| Language Translation | Missing | No translation service for symptom or communication |
| Offline Symptom Logging | Missing | No service worker or IndexedDB for offline logging |
| Privacy-Enhanced Symptom Storage | Missing | No encryption or fine-grained access controls for symptoms |
| Symptom Severity Scoring | Missing | No scoring mechanism for symptom urgency |
| Escalation Automation | Missing | No automatic escalation based on symptom severity |
| Database Indexes for New Tables | Missing | No indexes on key fields for performance |
| Error Handling | Partial | Some services lack comprehensive error handling |
| TypeScript Compilation | Issues | Some unresolved type errors (e.g., `hospital` property) |

## Recommendations
1. Begin by implementing the symptom ontology and normalized input API to establish a foundation for structured symptom data.
2. Develop the symptom input interface with voice, icon, and simple language options to enable effective patient input.
3. Add symptom tracking APIs and frontend dashboard to allow patients to log and view symptoms over time.
4. Implement multilingual support (i18n) and accessibility features to ensure inclusivity.
5. Build the triage system and patient-provider messaging to facilitate communication and urgency assessment.
6. Add language translation capabilities for symptom input and messaging.
7. Implement offline storage for symptom logs and message drafts.
8. Enhance privacy and security measures for sensitive symptom data.
9. Implement symptom severity scoring and escalation automation for proactive care.
10. Address TypeScript compilation errors and add database indexes for new tables.
