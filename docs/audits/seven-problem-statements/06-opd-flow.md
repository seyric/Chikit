# OPD Flow: Audit and Blueprint

## Problem Statement Summary
OPD (Outpatient Department) Flow focuses on optimizing the patient journey in outpatient clinics, reducing wait times, improving resource utilization, and enhancing patient and staff experience. Key requirements include:
- Appointment scheduling and management (booking, rescheduling, cancellation)
- Patient check-in and queue management (virtual waiting room, SMS updates)
- Resource allocation optimization (doctors, rooms, equipment)
- Real-time dashboards for clinic operations (wait times, room utilization, staff workload)
- Patient flow tracking (registration → vitals → consultation → diagnostics → pharmacy)
- Automated reminders and notifications (appointment reminders, prep instructions)
- Integration with laboratory and imaging for order placement and result notification
- Telemedicine support for virtual consultations
- No-show prediction and overbooking optimization
- Feedback collection and satisfaction measurement
- Accessibility and language accommodations

## Current State in Chikit Repository

### Existing Components
1. **Appointment Scheduling**
   - Appointments table (`appointments.ts`) exists with fields for patientId, doctorId, dateTime, type, status
   - Basic CRUD operations likely exist (inferred from hospitals routes pattern)
   - No advanced scheduling features (recurring appointments, buffer times, etc.)

2. **Patient Check-in and Queue Management**
   - No virtual waiting room or queue management system
   - No SMS updates for wait times
   - No self-check-in kiosk or mobile check-in

3. **Resource Allocation Optimization**
   - No resource scheduling system (doctors, rooms, equipment)
   - No optimization algorithms for minimizing wait times

4. **Real-time Dashboards**
   - No operational dashboards for clinic flow
   - No real-time tracking of patient status in journey

5. **Patient Flow Tracking**
   - No tracking of patient location or stage in OPD journey
   - No automated progression from registration to vitals to consultation

6. **Automated Reminders and Notifications**
   - No automated SMS/email reminders for appointments
   - No prep instructions automation

7. **Laboratory and Imaging Integration**
   - No integration for order placement from OPD
   - No result notification to patients or doctors

8. **Telemedicine Support**
   - No video consultation infrastructure
   - No virtual waiting room for telemedicine

9. **No-show Prediction**
   - No machine learning model for no-show prediction
   - No overbooking optimization based on predictions

10. **Feedback Collection**
    - No feedback collection system (post-visit surveys)

11. **Accessibility and Language Accommodations**
    - No specific accommodations beyond basic UI

### Working Components
- Appointments table and basic CRUD (inferred)
- Patient identity system
- Authentication system
- Hospital tenancy middleware
- Doctor and staff user roles (likely)

### Partially Implemented/Broken/Simulated/Missing
- **Appointment Scheduling System**: Partial (basic table exists, but no advanced features)
- **Virtual Waiting Room/Queue Management**: Missing
- **Resource Scheduling (Doctors, Rooms, Equipment)**: Missing
- **Real-time Operational Dashboards**: Missing
- **Patient Flow Tracking**: Missing
- **Automated Reminders/Notifications**: Missing
- **Lab/Imaging Order Integration**: Missing
- **Telemedicine Infrastructure**: Missing
- **No-show Prediction Model**: Missing
- **Feedback Collection System**: Missing
- **Accessibility and Language Accommodations for OPD**: Missing
- **Self-check-in (Mobile/Kiosk)**: Missing
- **Room Assignment and Tracking**: Missing
- **Equipment Checkout System**: Missing
- **TypeScript Compilation**: Some unresolved issues (e.g., missing `hospital` property)

## Detailed Implementation Blueprint

### 1. Appointment Scheduling and Management
#### Backend
- Create enhanced appointment service:
  - Support for recurring appointments (e.g., weekly physiotherapy)
  - Buffer times between appointments for room turnover
  - Different appointment types (new patient, follow-up, procedure) with configurable durations
  - Doctor availability management (schedules, time off, on-call)
- API endpoints:
  - POST `/api/appointments` (create appointment with validation against doctor schedule)
  - GET `/api/appointments` (filter by patient/doctor/date/status)
  - PUT `/api/appointments/:id` (reschedule with validation)
  - DELETE `/api/appointments/:id` (cancel with cancellation policy)
  - GET `/api/doctors/:id/availability` (get free slots for a date range)
  - POST `/api/appointments/:id/check-in` (patient checks in for appointment)
- Implement waiting list for fully booked slots
- Support for group appointments (e.g., diabetes education class)

#### Frontend
- Create appointment booking interface:
  - Calendar view of available slots
  - Ability to select appointment type and provider
  - Rescheduling and cancellation with policy display
  - Waiting list opt-in
- Create provider schedule management:
  - View and set availability
  - Block time for procedures, admin, etc.
  - See booked appointments
- Create appointment details view with prep instructions and reminders

### 2. Patient Check-in and Queue Management
#### Backend
- Create queue management service:
  - Virtual waiting room concept (patients check in remotely)
  - Real-time queue position and estimated wait time
  - SMS/push notifications for updates (when to come in, delays)
  - Ability to notify patients when it's their turn
- API endpoints:
  - POST `/api/queue/check-in` (patient checks in, returns queue position and ETA)
  - GET `/api/queue/status/:patientId` (get current queue status)
  - PUT `/api/queue/:queueId/notify` (notify patient to come in)
  - POST `/api/queue/:queueId/defer` (patient defers visit, returns new ETA)
  - GET `/api/clinic/:clinicId/queue-status` (dashboard view of all queues)
- Implement no-show detection (if patient doesn't check in within window)
- Support for pre-arrival questionnaires and consent forms

#### Frontend
- Create mobile check-in interface:
  - Check in for upcoming appointment
  - See queue position and estimated wait time
  - Receive notifications (via push or SMS) when to come to clinic
  - Ability to defer or cancel check-in
- Create clinic dashboard for staff:
  - Real-time view of all queues (by doctor, by service)
  - Average wait times, number waiting, etc.
  - Ability to call next patient, notify patient, mark as no-show
- Create patient-facing waiting room:
  - Show current position and estimated time to be seen
  - Show delays or messages from clinic
  - Option to leave feedback on wait time

### 3. Resource Allocation Optimization
#### Backend
- Create resource scheduling service:
  - Define resources (exam rooms, procedure rooms, equipment like ultrasound, EKG)
  - Track resource availability and maintenance schedules
  - Optimize assignment of patients to resources based on appointment type and duration
- API endpoints:
  - GET `/api/resources` (list resources with availability)
  - POST `/api/resources/:id/reserve` (reserve resource for time slot)
  - DELETE `/api/resources/:id/reserve/:reservationId` (release resource)
  - GET `/api/resources/:id/utilization` (get utilization metrics)
- Implement automatic room assignment based on appointment type
- Support for equipment checkout and return tracking

#### Frontend
- Create resource management interface for administrators:
  - View resource inventory and status
  - Schedule maintenance blocks
  - See utilization reports
- Create staff view for resource reservation:
  - See available rooms/equipment when booking appointment
  - Reserve resources for procedures
  - Return equipment after use

### 4. Real-time Dashboards for Clinic Operations
#### Backend
- Create operations analytics service:
  - Aggregate real-time data on patient flow, resource utilization, wait times
  - Provide historical trends and forecasting
- API endpoints:
  - GET `/api/dashboard/clinic-summary` (current status: patients waiting, avg wait time, room utilization)
  - GET `/api/dashboard/doctor-workload` (current and upcoming appointments per doctor)
  - GET `/api/dashboard/queue-analytics` (wait time trends, no-show rates)
  - GET `/api/dashboard/resource-utilization` (room and equipment usage)
  - GET `/api/dashboard/patient-flow` (distribution of patients across journey stages)
- Implement WebSocket connections for real-time updates to frontend
- Store aggregated metrics in time-series database (or cache with TTL)

#### Frontend
- Create operations dashboard for clinic administrators and managers:
  - Real-time overview panels (wait times, room utilization, staff workload)
  - Detailed views for each metric with historical trends
  - Alerts for thresholds exceeded (e.g., average wait time > 30 min)
  - Ability to drill down to specific doctors, resources, or time periods
- Create staff dashboard:
  - Personal schedule and patient queue
  - Quick actions (call next patient, mark vitals done, etc.)
  - Today's metrics and targets

### 5. Patient Flow Tracking
#### Backend
- Create patient flow tracking service:
  - Define stages of OPD journey (registration, vitals, consultation, diagnostics, pharmacy, discharge)
  - Automatically track patient progression through stages
  - Identify bottlenecks and delays at each stage
- API endpoints:
  - POST `/api/flow/track` (update patient stage, called by frontend or backend processes)
  - GET `/api/flow/patient/:patientId` (get current stage and timestamps for journey)
  - GET `/api/flow/stage-stats` (get average time spent in each stage, bottleneck identification)
  - POST `/api/flow/stage-transition` (log transition between stages for analytics)
- Implement automatic stage progression based on completed actions (e.g., vitals entered → move to consultation)
- Support for manual override by staff

#### Frontend
- Create patient journey view for staff:
  - Show list of patients checked in, grouped by current stage
  - Ability to update stage manually (e.g., after vitals are done)
  - Show time spent in current stage
  - Alerts for patients stuck in a stage too long
- Create patient-facing progress indicator:
  - Show current step in journey (e.g., "Waiting for vitals")
  - Show estimated time for current step
  - Show completed steps
- Integrate with queue management and appointment systems

### 6. Automated Reminders and Notifications
#### Backend
- Create notification service:
  - Template-based messages (SMS, email, push)
  - Triggered by events (appointment booked, 24hr reminder, 2hr reminder, check-in prompt)
  - Support for multilingual messages
  - Track delivery status and responses
- API endpoints:
  - POST `/api/notifications/send` (send notification via preferred channel)
  - GET `/api/notifications/templates` (retrieve message templates)
  - PUT `/api/notifications/templates/:id` (update template)
  - POST `/api/notifications/preferences` (set user notification preferences)
- Implement appointment reminders:
  - 24 hours before: reminder with prep instructions
  - 2 hours before: reminder to check in
  - After check-in: update on wait time
  - Post-visit: feedback request and after-visit instructions
- Support for patient-selected preferred notification channel (SMS, email, app notification)

#### Frontend
- Create notification preferences interface:
  - Enable/disable SMS, email, push notifications
  - Set language preference for notifications
  - Set timing preferences (how early for reminders)
- Create notification center:
  - View history of sent notifications
  - Mark as read, delete
- Integrate with appointment booking to set up reminder schedule
- Allow patients to opt-in for SMS updates on wait time after check-in

### 7. Laboratory and Imaging Integration
#### Backend
- Create order placement service:
  - Allow doctors to place lab and imaging orders during consultation
  - Integration with LIS/RIS (if available) or manual entry fallback
  - Track order status (placed, collected, in progress, results ready)
- API endpoints:
  - POST `/api/orders/lab` (place lab order)
  - POST `/api/orders/imaging` (place imaging order)
  - GET `/api/orders/:id/status` (get order status)
  - POST `/api/orders/:id/collect` (mark specimen collected)
  - POST `/api/orders/:id/results` (upload results, link to patient record)
  - GET `/api/patients/:id/orders` (get patient's active and recent orders)
- Implement result notification to doctors and patients
- Support for printing labels and barcodes for specimen collection

#### Frontend
- Create order placement interface during consultation:
  - Search for tests by name or category
  - Add orders with clinical indication
  - See order status and results when available
- Create patient order tracking view:
  - See pending orders (lab, imaging)
  - Get notifications when specimen is due or results are ready
  - View results with plain language explanation (see Report, Decoded audit)
- Create staff view for order management:
  - List of orders awaiting specimen collection
  - List of orders with results ready for review
  - Ability to mark orders as urgent

### 8. Telemedicine Support
#### Backend
- Create telemedicine service:
  - Support for video consultations (WebRTC or third-party API integration)
  - Virtual waiting room for telemedicine appointments
  - Ability to share screen, files, and whiteboard
  - Session recording (with consent) for medical records
- API endpoints:
  - POST `/api/telemedicine/sessions` (create session for appointment)
  - GET `/api/telemedicine/sessions/:id/join` (get join token/URL for patient and doctor)
  - POST `/api/telemedicine/sessions/:id/end` (end session, optionally save recording)
  - GET `/api/telemedicine/sessions/:id/recording` (retrieve recording if available)
- Implement secure and HIPAA-compliant video connection
- Support for asynchronous telemedicine (store-and-forward) for follow-ups

#### Frontend
- Create telemedicine appointment booking:
  - Select telemedicine as appointment type
  - Receive joining instructions and link
- Create virtual waiting room for telemedicine:
  - Check in and see estimated wait time
  - Receive notification when doctor is ready to join
- Create video consultation interface:
  - Video feeds for patient and doctor
  - Screen sharing and file sharing controls
  - Chat for text communication during call
  - Ability to end call and schedule follow-up
- Create session recording management:
  - Patient consent for recording
  - Access to recording (if allowed by policy)
  - Integration with medical records for visit documentation

### 9. No-show Prediction and Overbooking Optimization
#### Backend
- Create prediction service:
  - Collect features: patient history (past no-shows), appointment type, time of day, day of week, weather, reminders sent, etc.
  - Train ML model to predict probability of no-show
  - Provide risk score for each appointment
- API endpoints:
  - POST `/api/predictions/no-show` (input: appointment details; output: no-show probability)
  - GET `/api/predictions/model-info` (get model version, features, accuracy)
- Implement overbooking optimization:
  - Schedule buffer slots based on predicted no-shows
  - Automatically offer overbooking slots to patients on waiting list
  - Adjust based on actual no-show rates
- Implement continuous learning from actual outcomes

#### Frontend
- Create provider view for no-show risk:
  - Show risk score for upcoming appointments
  - Suggest overbooking or waiting list activation
  - Show historical accuracy of predictions
- Create waiting list interface:
  - Show position and estimated chance of getting in
  - Notify when slot becomes available due to predicted no-show

### 10. Feedback Collection and Satisfaction Measurement
#### Backend
- Create feedback service:
  - Post-visit surveys (SMS, email, app)
  - Real-time feedback options (touchless kiosk, tablet at checkout)
  - NPS (Net Promoter Score) and condition-specific questions
  - Track feedback over time and by provider/department
- API endpoints:
  - POST `/api/feedback` (submit feedback)
  - GET `/api/feedback/summary` (get aggregate scores and trends)
  - GET `/api/feedback/recent` (get recent feedback with comments)
  - POST `/api/feedback/respond` (provider response to feedback)
- Implement automated triggering after visit completion
- Support for anonymous feedback

#### Frontend
- Create feedback collection interface:
  - Simple rating scale (1-5 stars) with optional comment
  - Condition-specific questions (if applicable)
  - Ability to give feedback anonymously
  - Show thank you message and incentive if applicable
- Create feedback dashboard for administrators:
  - Overall satisfaction trends
  - Breakdown by provider, department, visit type
  - Recent comments and responses
  - Alerts for low scores
- Integrate with appointment completion to trigger feedback request

### 11. Accessibility and Language Accommodations
#### Backend
- Support multilingual interfaces:
  - Store translations for all OPD-related UI strings
  - Detect patient language preference from profile or browser
  - Provide OPD instructions and notifications in preferred language
- Support for accessibility features:
  - Screen reader friendly OPD interfaces
  - High contrast mode
  - Font scaling
  - Alternative input methods (voice, switch control)

#### Frontend
- Implement i18n framework for OPD-specific components:
  - Appointment booking, check-in, queue management, feedback forms
- Create accessibility controls:
  - High contrast toggle
  - Font size adjuster
  - Screen reader mode activator
  - Voice navigation for key workflows
- Ensure all OPD flows are usable with assistive technologies
- Provide language selection in patient profile and at point of use (check-in, feedback)

## Required Database Changes
1. **Enhanced Appointments Table** (add columns if missing):
   - `appointmentType` (varchar): new patient, follow-up, procedure, telemedicine, etc.
   - `durationMinutes` (integer): scheduled duration
   - `bufferAfterMinutes` (integer): buffer time after appointment for room turnover
   - `recurringRule` (varchar): for recurring appointments (iCal RRULE or custom)
   - `prepInstructions` (text): automated instructions sent before appointment
   - `noShowProbability` (float): predicted no-show score
   - `overbookingEligible` (boolean): can be overbooked based on prediction
2. **Queue Management Tables**:
   ```sql
   CREATE TABLE queues (
     id SERIAL PRIMARY KEY,
     clinic_id INTEGER NOT NULL,
     doctor_id INTEGER,
     service_type VARCHAR(50), -- general, pediatrics, cardiology, etc.
     status VARCHAR(20) DEFAULT 'active', -- active, paused, closed
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE
   );

   CREATE TABLE queue_entries (
     id SERIAL PRIMARY KEY,
     queue_id INTEGER NOT NULL,
     patient_id INTEGER NOT NULL,
     appointment_id INTEGER,
     checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL,
     notified_at TIMESTAMP WITH TIME ZONE,
     seen_at TIMESTAMP WITH TIME ZONE,
     left_without_seeing BOOLEAN DEFAULT FALSE,
     position INTEGER NOT NULL, -- position in queue when checked in
     estimated_wait_minutes INTEGER,
     actual_wait_minutes INTEGER
   );
   ```
3. **Resource Scheduling Tables**:
   ```sql
   CREATE TABLE resources (
     id SERIAL PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     type VARCHAR(50) NOT NULL, -- exam_room, procedure_room, equipment
     subtype VARCHAR(50), -- for equipment: ultrasound, ekg, etc.
     location VARCHAR(100),
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE
   );

   CREATE TABLE resource_reservations (
     id SERIAL PRIMARY KEY,
     resource_id INTEGER NOT NULL,
     start_time TIMESTAMP WITH TIME ZONE NOT NULL,
     end_time TIMESTAMP WITH TIME ZONE NOT NULL,
     appointment_id INTEGER, -- if tied to appointment
     purpose VARCHAR(100), -- e.g., 'consultation', 'procedure X'
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     created_by INTEGER
   );
   ```
4. **Operations Metrics Tables** (for storing time-series dashboard data):
   ```sql
   CREATE TABLE clinic_metrics (
     id SERIAL PRIMARY KEY,
     clinic_id INTEGER NOT NULL,
     recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
     patients_waiting INTEGER,
     avg_wait_time_minutes DECIMAL(5,2),
     room_utilization_percent DECIMAL(5,2),
     doctor_utilization_percent DECIMAL(5,2),
     throughput_per_hour DECIMAL(5,2)
   );

   CREATE TABLE doctor_workload (
     id SERIAL PRIMARY KEY,
     doctor_id INTEGER NOT NULL,
     date DATE NOT NULL,
     scheduled_appointments INTEGER,
     completed_appointments INTEGER,
     no_shows INTEGER,
     total_patient_minutes INTEGER,
     idle_time_minutes INTEGER
   );
   ```
5. **Patient Flow Tracking Table**:
   ```sql
   CREATE TABLE patient_flow (
     id SERIAL PRIMARY KEY,
     patient_id INTEGER NOT NULL,
     encounter_id INTEGER NOT NULL,
     stage VARCHAR(50) NOT NULL, -- registration, vitals, consultation, diagnostics, pharmacy, discharge
     entered_at TIMESTAMP WITH TIME ZONE NOT NULL,
     exited_at TIMESTAMP WITH TIME ZONE,
     notes TEXT
   );
   ```
6. **Notification Tables**:
   ```sql
   CREATE TABLE notification_templates (
     id SERIAL PRIMARY KEY,
     type VARCHAR(50) NOT NULL, -- appointment_reminder, check_in_prompt, wait_time_update, feedback_request
     channel VARCHAR(20) NOT NULL, -- sms, email, push
     language VARCHAR(10) NOT NULL,
     subject VARCHAR(200),
     body TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE
   );

   CREATE TABLE notification_log (
     id SERIAL PRIMARY KEY,
     recipient_id INTEGER NOT NULL,
     template_id INTEGER NOT NULL,
     channel VARCHAR(20) NOT NULL,
     sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
     delivered_at TIMESTAMP WITH TIME ZONE,
     read_at TIMESTAMP WITH TIME ZONE,
     status VARCHAR(20) NOT NULL, -- sent, delivered, read, failed
     metadata JSONB -- for tracking external IDs, etc.
   );
   ```
7. **Order Tables** (if not already present from other audits):
   ```sql
   CREATE TABLE lab_orders (
     id SERIAL PRIMARY KEY,
     patient_id INTEGER NOT NULL,
     ordered_by INTEGER NOT NULL,
     ordered_at TIMESTAMP WITH TIME ZONE NOT NULL,
     specimen_collected_at TIMESTAMP WITH TIME ZONE,
     results_ready_at TIMESTAMP WITH TIME ZONE,
     status VARCHAR(20) NOT NULL, -- ordered, collected, in_progress, results_ready, cancelled
     test_name VARCHAR(100) NOT NULL,
     test_code VARCHAR(50), -- LOINC or local code
     clinical_indication TEXT,
     results_json JSONB, -- structured results
     file_url TEXT -- for PDF/image results
   );

   CREATE TABLE imaging_orders (
     -- similar structure to lab_orders
   );
   ```
8. **Telemedicine Tables**:
   ```sql
   CREATE TABLE telemedicine_sessions (
     id SERIAL PRIMARY KEY,
     appointment_id INTEGER NOT NULL,
     session_id VARCHAR(100) NOT NULL, -- external session ID if using third-party
     start_time TIMESTAMP WITH TIME ZONE,
     end_time TIMESTAMP WITH TIME ZONE,
     recording_url TEXT,
     consent_for_recording BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
9. **Prediction Tables**:
   ```sql
   CREATE TABLE no_show_predictions (
     id SERIAL PRIMARY KEY,
     appointment_id INTEGER NOT NULL,
     predicted_at TIMESTAMP WITH TIME ZONE NOT NULL,
     no_show_probability DECIMAL(4,3) NOT NULL,
     features_used JSONB, -- the input features for transparency
     actual_outcome BOOLEAN -- null until appointment passes
   );
   ```
10. **Feedback Table**:
    ```sql
    CREATE TABLE feedback (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      encounter_id INTEGER NOT NULL,
      rating INTEGER CHECK (rating >= 0 AND rating <= 5),
      comments TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      language VARCHAR(10) -- language of feedback
    );
    ```

## Required API Contracts
### Appointment Booking
```
POST /api/appointments
Body: { patientId: number, doctorId: number, startTime: string (ISO), appointmentType: string, durationMinutes?: number, notes?: string }
Response: { id: number, ...input, createdAt: string }
```

### Appointment Availability
```
GET /api/doctors/:doctorId/availability
Query: date (YYYY-MM-DD), appointmentType?: string
Response: [{ startTime: string, endTime: string, durationMinutes: number }]
```

### Patient Check-in
```
POST /api/queue/check-in
Body: { appointmentId: number }
Response: { queuePosition: number, estimatedWaitMinutes: number, queueId: number, checkedInAt: string }
```

### Queue Status
```
GET /api/queue/status/:patientId
Response: { queueId: number, queuePosition: number, estimatedWaitMinutes: number, status: string, checkedInAt: string }
```

### Resource Reservation
```
POST /api/resources/:resourceId/reserve
Body: { startTime: string (ISO), endTime: string (ISO), appointmentId?: number, purpose?: string }
Response: { id: number, resourceId: number, ...input, createdAt: string }
```

### Dashboard Clinic Summary
```
GET /api/dashboard/clinic-summary
Response: {
  patientsWaiting: number,
  avgWaitTimeMinutes: number,
  roomUtilizationPercent: number,
  doctorUtilizationPercent: number,
  throughputPerHour: number,
  lastUpdated: string
}
```

### Patient Flow Tracking
```
POST /api/flow/track
Body: { patientId: number, encounterId: number, stage: string, notes?: string }
Response: { success: true, enteredAt: string }
```

### Telemedicine Session Creation
```
POST /api/telemedicine/sessions
Body: { appointmentId: number }
Response: { sessionId: string, joinUrlPatient: string, joinUrlDoctor: string, expiresAt: string }
```

### No-show Prediction
```
POST /api/predictions/no-show
Body: { appointmentId: number, patientId: number, doctorId: number, appointmentTime: string, appointmentType: string, remindersSent: number, ... }
Response: { noShowProbability: number, confidence: number, factors: [...] }
```

### Feedback Submission
```
POST /api/feedback
Body: { patientId: number, encounterId: number, rating: number, comments?: string, language?: string }
Response: { id: number, ...input, createdAt: string }
```

## Required AI/ML Implementation
1. **No-show Prediction Model**:
   - Train model on historical appointment data (features: patient no-show history, appointment type, time/day, doctor, reminders sent, weather, etc.)
   - Continuously retrain with new outcomes
   - Provide explainability (which factors contributed most to prediction)
2. **Wait Time Estimation**:
   - Use ML to predict actual wait time based on current queue, provider pace, room turnover times, etc.
   - Better than simple average or linear extrapolation
3. **Resource Optimization**:
   - Use optimization algorithms (e.g., integer programming) to assign patients to rooms and doctors to minimize wait times and maximize utilization
   - Consider appointment types, durations, and resource requirements
4. **Telemedicine Quality Prediction**:
   - Predict likelihood of technical issues based on patient device, network conditions, etc.
   - Suggest alternatives (phone call, reschedule) if predicted poor quality
5. **Feedback Sentiment Analysis**:
   - Analyze free-text feedback for sentiment and topics to identify areas for improvement
   - Automatically categorize feedback (staff friendliness, wait time, facilities, etc.)
6. **Dynamic Buffer Time Allocation**:
   - ML model to predict optimal buffer time between appointments based on appointment type, provider, historical overrun rates

## Required UI/UX Changes
1. **Appointment Booking Interface**:
   - Calendar view with color-coded availability (free, busy, reserved)
   - Ability to select appointment type and see duration
   - Show prep instructions after booking
   - Waiting list opt-in with position and estimated chance
2. **Provider Schedule Management**:
   - View daily/weekly schedule with appointments
   - Drag-and-drop to reschedule (if allowed)
   - Block time for personal/admin
   - See no-show predictions for upcoming appointments
3. **Patient Check-in Interface**:
   - Check in for upcoming appointment
   - See queue position and estimated wait time
   - Receive push/SMS notifications for updates
   - Ability to defer check-in and get new ETA
4. **Clinic Operations Dashboard**:
   - Real-time overview widgets (patients waiting, avg wait time, room utilization)
   - Detailed views with historical trends and drill-down
   - Alerts for thresholds (wait time, utilization)
   - Ability to view by doctor, resource, or time period
5. **Staff Queue Management View**:
   - List of patients checked in by queue
   - See position, time waited, estimated time to be seen
   - Actions: call next patient, notify patient, mark as no-show, skip to next
   - Show alerts for patients waiting too long
6. **Patient-Facing Waiting Room**:
   - Show current position and estimated time to be seen
   - Show messages from clinic (e.g., "Running 15 min behind")
   - Option to leave feedback on wait time
   - Ability to check out and defer visit
7. **Order Placement Interface**:
   - Search for lab/imaging tests
   - Add orders with clinical indication
   - See order status and results
   - Print labels for specimen collection
8. **Telemedicine Interface**:
   - Virtual waiting room with check-in
   - Video consultation controls (mic, camera, screen share)
   - Chat and file sharing
   - Session recording indicator and consent
9. **Feedback Collection Interface**:
   - Simple rating scale with optional comment
   - Condition-specific questions if applicable
   - Thank you message and incentive display
   - Accessibility features (large print, voice input)
10. **Accessibility Controls**:
    - High contrast toggle
    - Font size adjuster
    - Screen reader mode
    - Language selector for OPD interfaces
11. **Resource Management Interface**:
    - View resource inventory and status
    - See utilization reports
    - Schedule maintenance blocks

## Required AI/ML Implementation
1. **No-show Prediction Model**:
   - Train model on historical appointment data (features: patient no-show history, appointment type, time/day, doctor, reminders sent, weather, etc.)
   - Continuously retrain with new outcomes
   - Provide explainability (which factors contributed most to prediction)
2. **Wait Time Estimation**:
   - Use ML to predict actual wait time based on current queue, provider pace, room turnover times, etc.
   - Better than simple average or linear extrapolation
3. **Resource Optimization**:
   - Use optimization algorithms (e.g., integer programming) to assign patients to rooms and doctors to minimize wait times and maximize utilization
   - Consider appointment types, durations, and resource requirements
4. **Telemedicine Quality Prediction**:
   - Predict likelihood of technical issues based on patient device, network conditions, etc.
   - Suggest alternatives (phone call, reschedule) if predicted poor quality
5. **Feedback Sentiment Analysis**:
   - Analyze free-text feedback for sentiment and topics to identify areas for improvement
   - Automatically categorize feedback (staff friendliness, wait time, facilities, etc.)
6. **Dynamic Buffer Time Allocation**:
   - ML model to predict optimal buffer time between appointments based on appointment type, provider, historical overrun rates

## Security and Privacy Considerations
1. **Authorization**: Ensure patients can only see their own appointments, queue position, and feedback
2. **Data Encryption**: Encrypt sensitive data at rest (PHI, contact information, feedback)
3. **Audit Logging**: Log all appointment bookings, check-ins, resource reservations, notifications sent
4. **Secure Communication**: Use HTTPS and consider end-to-end encryption for telemedicine and messaging
5. **Data Minimization**: Store only necessary data for OPD flow (avoid storing excessive metadata)
6. **Consent Management**: Track patient consent for telemedicine recording, SMS notifications, feedback collection
7. **Input Sanitization**: Prevent XSS in appointment notes, feedback comments, etc.
8. **Rate Limiting**: Protect booking and check-in APIs from abuse (especially during high demand)
9. **Secure Telemedicine**: Ensure video connections are encrypted and HIPAA-compliant
10. **Notification Security**: Protect notification templates and prevent spam/abuse

## Testing Strategy
1. **Unit Tests**:
   - Appointment validation logic (no double-booking, buffer times)
   - Queue position and wait time calculation algorithms
   - Resource assignment optimization
   - No-show prediction accuracy
   - Notification template rendering
2. **Integration Tests**:
   - End-to-end appointment booking, check-in, and visit flow
   - Resource reservation and release cycle
   - Notification triggering and delivery
   - Telemedicine session creation and joining
   - Feedback submission and aggregation
3. **Frontend Tests**:
   - Appointment booking calendar rendering and interaction
   - Provider schedule management drag-and-drop
   - Patient check-in interface and notifications
   - Clinic operations dashboard widgets
   - Staff queue management view
   - Patient-facing waiting room
   - Telemedicine interface
   - Feedback collection form
4. **Performance Tests**:
   - Appointment booking response time (<500ms)
   - Check-in and queue position calculation (<200ms)
   - Dashboard data retrieval (<1s for real-time views)
   - Notification sending latency (<1s)
   - Telemedicine session joining time (<2s)
5. **Security Tests**:
   - Authorization bypass attempts
   - Input validation for SQL/XSS
   - Rate limiting effectiveness
   - Data encryption verification
   - Telemedicine connection security
6. **Usability Tests**:
   - Patient usability of appointment booking and check-in
   - Provider usability of schedule management and queue view
   - Staff usability of operations dashboard
   - Accessibility feature effectiveness
   - Telemedicine usability for patients and providers
   - Feedback collection ease

## Deployment Considerations
1. **Environment Variables**:
   - Enable/disable telemedicine features
   - Configure notification gateways (SMS, email, push providers)
   - Set prediction model retraining schedule
   - Configure resource optimization parameters
   - Set feedback collection incentives and timing
2. **Database**:
   - Ensure indexes on frequently queried fields (appointment date/time, patientId, doctorId, queueId)
   - Consider partitioning for high-volume tables (appointments, queue entries, notifications)
   - Monitor table sizes and set up archiving for old data
3. **Backend**:
   - Implement background jobs for prediction model retraining
   - Use caching for frequently accessed data (doctor schedules, resource availability)
   - Implement message queue for notification sending and telemedicine signaling
   - Secure storage for encryption keys and API credentials (notification gateways, telemedicine providers)
4. **Frontend**:
   - Service worker for caching static assets and API responses
   - IndexedDB for offline functionality (appointment details, notification preferences)
   - Lazy loading of heavy components (calendar, video consultation)
   - Multilingual font loading
   - Voice feature detection and fallback
5. **Monitoring**:
   - Track appointment booking and cancellation rates
   - Monitor no-show prediction accuracy and overbooking effectiveness
   - Track average wait times and patient satisfaction scores
   - Monitor telemedicine session quality and technical issues
   - Track resource utilization rates (rooms, equipment)
   - Measure feedback response rates and sentiment trends
   - Audit log review for compliance and abnormal patterns

## Gap Summary
| Component | Status | Notes |
|----------|--------|-------|
| Appointment Scheduling System | Partial | Basic table exists, but no advanced features (recurring, buffering, validation) |
| Virtual Waiting Room/Queue Management | Missing | No queue management or self-check-in system |
| Resource Scheduling (Doctors, Rooms, Equipment) | Missing | No resource tracking or optimization |
| Real-time Operational Dashboards | Missing | No real-time tracking of clinic operations |
| Patient Flow Tracking | Missing | No tracking of patient stages in OPD journey |
| Automated Reminders/Notifications | Missing | No automated SMS/email reminders or prep instructions |
| Lab/Imaging Order Integration | Missing | No integration for order placement from OPD |
| Telemedicine Infrastructure | Missing | No video consultation or virtual waiting room for telemedicine |
| No-show Prediction Model | Missing | No ML model for predicting no-shows |
| Feedback Collection System | Missing | No feedback collection or satisfaction measurement |
| Accessibility and Language Accommodations for OPD | Missing | No specific accommodations beyond basic UI |
| Self-check-in (Mobile/Kiosk) | Missing | No mobile or kiosk check-in for appointments |
| Room Assignment and Tracking | Missing | No automatic room assignment based on appointment type |
| Equipment Checkout System | Missing | No tracking of equipment checkout and return |
| Database Indexes for New Tables | Missing | No indexes on key fields for performance |
| Error Handling | Partial | Some services lack comprehensive error handling |
| TypeScript Compilation | Issues | Some unresolved type errors (e.g., `hospital` property) |

## Recommendations
1. Begin by implementing the enhanced appointment scheduling system with validation against doctor schedules and buffer times.
2. Add queue management and mobile check-in to enable virtual waiting room and real-time updates.
3. Implement resource scheduling for doctors, rooms, and equipment to optimize utilization.
4. Create real-time dashboards for clinic operations to monitor wait times and resource usage.
5. Add patient flow tracking to identify bottlenecks in the OPD journey.
6. Implement automated reminders and notifications for appointments and prep instructions.
7. Add lab/imaging order integration to allow doctors to place orders during consultation.
8. Build telemedicine infrastructure for virtual consultations.
9. Develop no-show prediction model and overbooking optimization.
10. Create feedback collection system to measure patient satisfaction.
11. Add accessibility and language accommodations for inclusive OPD experience.
12. Address TypeScript compilation errors and add database indexes for new tables.
