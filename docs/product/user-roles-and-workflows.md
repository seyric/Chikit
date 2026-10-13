# Chikit by Solar - User Roles and Workflows

This document details the different user roles in the Chikit system and the workflows associated with each role, based on code inspection and implementation evidence.

## Overview of Role-Based Access Control

Chikit implements a role-based access control (RBAC) system where:
- Users are assigned to specific roles based on their responsibilities
- Roles determine what actions users can perform and what data they can access
- Hospital-scoping ensures users only access data from their assigned hospital (where applicable)
- Authentication is handled via JWT tokens with role verification

## User Roles Identified in Codebase

### 1. Patient
**Description**: Individuals receiving healthcare services who maintain health records in Chikit.

**Permissions & Access**:
- View own health profile and medical records
- Update personal contact information and preferences
- Link/unlink ABHA to own patient record
- View own ABHA profile information
- Schedule, view, and manage own appointments
- View own prescription history and medication instructions
- View own laboratory and radiology results
- Provide consent for data sharing (where implemented)
- Receive notifications and reminders (inferred)
- Access patient portal features (inferred from frontend structure)

**Restrictions**:
- Cannot access other patients' records
- Cannot modify clinical data entered by providers
- Cannot access administrative or hospital management functions
- Cannot view staff or provider information beyond what's necessary for care
- Cannot access billing or financial information (beyond own)

**Evidence**:
- Patient-specific routes would be protected by patient authentication
- ABHA linking/verification routes are patient-initiated
- Medical records access would be patient-scoped
- Frontend likely includes patient-facing views

### 2. Doctor / Clinical Provider
**Description**: Licensed healthcare professionals providing direct patient care.

**Permissions & Access**:
- View patient records for assigned patients
- Create and update medical records, clinical notes
- Order laboratory tests and imaging studies
- Create and manage prescriptions
- Enter diagnosis and procedure information
- View and interpret AI-assisted analysis results
- Manage patient appointments and encounters
- Access clinical decision support tools
- Document procedures and treatments
- Update patient status and discharge information
- Access patient history and longitudinal records
- Record clinical observations and vital signs
- Manage referrals and consultations
- Access treatment protocols and guidelines (inferred)

**Restrictions**:
- Cannot access records of patients not assigned to them (without proper authorization)
- Cannot modify hospital configuration or settings
- Cannot access financial/billing systems (typically)
- Cannot manage other staff members' schedules or assignments
- Cannot access administrative reports beyond departmental scope
- Cannot modify core system configuration

**Evidence**:
- Medical records routes (2.7K lines) suggest clinical documentation capabilities
- Prescriptions routes (1.5K lines) suggest prescribing capabilities  
- Lab reports and radiology routes suggest ordering capabilities
- AI analysis routes suggest clinical decision support access
- Routes would be protected by provider authentication middleware

### 3. Nurse
**Description**: Licensed nursing professionals providing patient care and support.

**Permissions & Access**:
- View patient records for assigned patients
- Record vital signs and patient observations
- Administer medications and treatments as prescribed
- Update patient status and care plans
- Assist with procedures and examinations
- Coordinate patient care activities
- Provide patient education and support
- Manage patient admission, transfer, and discharge processes
- Monitor patient conditions and report changes
- Maintain patient care documentation
- Access care plans and treatment protocols
- Communicate with other care team members

**Restrictions**:
- Cannot prescribe medications (unless authorized as nurse practitioner)
- Cannot make independent medical diagnoses
- Cannot modify hospital-wide policies or procedures
- Cannot access financial systems
- Cannot perform certain restricted procedures (based on licensure)
- Cannot access records outside assigned patients without authorization

**Evidence**:
- Vital signs and observation tracking inferred from clinical workflows
- Medication administration tracking implied through prescriptions
- Patient status updates inferred from medical records
- Care coordination features suggested by case management systems

### 4. Pharmacist
**Description**: Licensed professionals responsible for medication management and dispensing.

**Permissions & Access**:
- View patient prescription information
- Verify prescription accuracy and completeness
- Check for drug interactions and allergies
- Dispense medications according to prescriptions
- Maintain medication inventory records
- Provide medication counseling to patients
- Manage controlled substance documentation and tracking
- Monitor for prescription abuse or diversion
- Collaborate with providers on medication therapy
- Manage vaccine storage and administration (where applicable)
- Handle medication recalls and safety alerts

**Restrictions**:
- Cannot prescribe medications
- Cannot modify patient medical records
- Cannot override provider prescribing decisions (without consultation)
- Cannot access non-medication-related patient records
- Cannot access financial systems beyond medication billing
- Cannot make clinical diagnoses or treatment decisions

**Evidence**:
- Controlled medications routes (40.2K lines) suggest extensive pharmacist functionality
- Drugs routes (4.6K lines) suggest medication management capabilities
- Prescription verification and dispensing logic inferred
- Inventory tracking suggested by controlled substances management

### 5. Laboratory Technician
**Description**: Professionals responsible for conducting laboratory tests and processing results.

**Permissions & Access**:
- View laboratory test orders
- Collect and process patient specimens
- Perform laboratory analyses and testing
- Enter and validate laboratory results
- Flag abnormal or critical values
- Maintain laboratory equipment and quality control
- Manage specimen storage and tracking
- Ensure proper handling and disposal of biohazardous materials
- Communicate critical results to providers
- Maintain laboratory information systems
- Follow safety protocols and regulations

**Restrictions**:
- Cannot modify patient medical records directly
- Cannot change prescribed treatments or medications
- Cannot access non-laboratory-related patient information
- Cannot perform clinical diagnoses
- Cannot access financial systems
- Cannot modify laboratory testing protocols without authorization

**Evidence**:
- Lab reports routes (4.4K lines) suggest laboratory result entry and tracking
- Specimen processing and tracking inferred
- Quality control and validation suggested by result handling
- Critical value flagging inferred from result interpretation

### 6. Radiology Technologist
**Description**: Professionals responsible for performing medical imaging procedures.

**Permissions & Access**:
- View imaging study orders
- Prepare patients for imaging procedures
- Perform diagnostic imaging studies (X-ray, CT, MRI, ultrasound, etc.)
- Ensure patient safety and comfort during procedures
- Monitor for adverse reactions during procedures
- Maintain imaging equipment and quality assurance
- Manage image storage and retrieval systems
- Follow radiation safety protocols
- Communicate critical findings to providers
- Assist radiologists in image interpretation
- Maintain procedure logs and documentation

**Restrictions**:
- Cannot interpret imaging studies (requires radiologist)
- Cannot modify patient medical records
- Cannot change prescribed treatments
- Cannot access non-imaging-related patient information
- Cannot perform clinical diagnoses
- Cannot access financial systems
- Cannot modify imaging procedures without authorization

**Evidence**:
- Radiology routes (4.7K lines) suggest imaging order and result management
- Equipment and safety tracking inferred
- Procedure documentation suggested
- Quality assurance and safety protocols implied

### 7. Hospital Administrator
**Description**: Management personnel responsible for hospital operations and resource management.

**Permissions & Access**:
- View hospital-wide operational metrics and reports
- Manage hospital configuration and settings
- Oversee departmental budgets and resource allocation
- Manage staff schedules and assignments
- Track hospital capacity and utilization
- Manage medical equipment and supplies
- Oversee admission, discharge, and transfer processes
- Ensure regulatory compliance and accreditation standards
- Manage vendor relationships and contracts
- Oversee quality improvement and patient safety initiatives
- Access financial reports and billing information
- Manage patient feedback and complaint resolution
- Oversee emergency preparedness and disaster planning
- Manage information technology systems and resources
- Ensure data privacy and security compliance

**Restrictions**:
- Cannot access individual patient clinical records without proper authorization
- Cannot make clinical diagnoses or treatment decisions
- Cannot override clinical judgments of providers
- Cannot access records of other hospitals (without proper authorization)
- Cannot modify core system functionality beyond configuration
- Cannot access systems or data outside hospital scope

**Evidence**:
- Hospital routes (7.7K lines) suggest hospital management capabilities
- Hospital capacity tables (5.7K lines) suggest resource tracking
- Staff routes (5.9K lines) suggest personnel management
- Audit logging suggests compliance tracking
- Configuration files suggest environment management
- Statistics routes (6.8K lines) suggest reporting capabilities

### 8. Front Desk / Registration Staff
**Description**: Personnel responsible for patient intake, scheduling, and administrative support.

**Permissions & Access**:
- Register new patients and create patient profiles
- Schedule, reschedule, and cancel patient appointments
- Verify patient insurance and eligibility
- Collect co-pays and process payments
- Check patients in and out for appointments
- Manage waiting room and patient flow
- Provide general information and directions
- Handle phone inquiries and appointment requests
- Maintain appointment schedules and provider calendars
- Process referrals and prior authorizations
- Manage patient communications and reminders
- Handle medical records requests and releases
- Maintain front desk supplies and equipment
- Follow privacy and confidentiality procedures

**Restrictions**:
- Cannot access detailed clinical patient records
- Cannot make clinical judgments or medical decisions
- Cannot modify treatment plans or prescriptions
- Cannot access financial systems beyond payment processing
- Cannot override clinical provider decisions
- Cannot access staff personnel records
- Cannot modify hospital policies or procedures

**Evidence**:
- Appointments routes (15.8K lines) suggest extensive scheduling capabilities
- Patient registration inferred from patients table and routes
- Insurance and eligibility verification inferred
- Payment processing suggested by billing routes
- Patient communications inferred from workflow needs

### 9. Medical Records Administrator / Health Information Manager
**Description**: Professionals responsible for managing patient health information and records.

**Permissions & Access**:
- Manage patient health record systems and databases
- Ensure completeness, accuracy, and accessibility of medical records
- Oversee record retention and destruction policies
- Manage release of information requests and authorizations
- Ensure compliance with privacy regulations (HIPAA, GDPR, etc.)
- Maintain clinical coding and classification systems
- Oversee transcription and dictation services
- Manage registries and databases for reporting
- Coordinate with IT on system maintenance and upgrades
- Train staff on documentation standards and procedures
- Manage health information exchange agreements
- Oversee data analytics and reporting from clinical records
- Ensure interoperability standards compliance

**Restrictions**:
- Cannot modify clinical judgments or diagnoses in records
- Cannot alter clinical content without proper authorization and documentation
- Cannot access records for non-authorized purposes
- Cannot modify core clinical documentation standards
- Cannot access financial systems beyond records management
- Cannot override provider documentation requirements

**Evidence**:
- Medical records routes (2.7K lines) suggest record management capabilities
- Audit logging suggests change tracking
- Consent management tables suggest release of information handling
- Case management suggests longitudinal record oversight
- Data quality and completeness implied through validation

### 10. Public Health Official
**Description**: Government or agency personnel responsible for population health monitoring and intervention.

**Permissions & Access**:
- Access aggregated and de-identified population health data
- View reportable disease statistics and trends
- Monitor vaccination rates and immunization coverage
- Track maternal and child health indicators
- Access public health surveillance systems
- Receive alerts for outbreak detection and public health emergencies
- Access health equity and disparity metrics
- Monitor healthcare access and utilization patterns
- View environmental health data and exposures
- Access vital statistics and mortality data
- Participate in disease investigation and contact tracing
- Develop and implement public health interventions
- Evaluate effectiveness of health programs and policies
- Coordinate with healthcare providers on public health initiatives
- Access healthcare facility licensing and inspection data

**Restrictions**:
- Cannot access individually identifiable patient information without authorization
- Cannot modify clinical records or patient data
- Cannot make clinical diagnoses or treatment decisions
- Cannot access confidential or sensitive patient information
- Cannot override provider clinical judgments
- Cannot access financial or billing information
- Cannot access proprietary or confidential business information
- Cannot access personnel records without authorization

**Evidence**:
- Statistics routes (6.8K lines) suggest population health reporting capabilities
- Public health reporting not explicitly verified but implied through analytics
- De-identified data access inferred from aggregation capabilities
- Reportable disease tracking suggested by surveillance needs
- Vaccination tracking inferred from preventive care needs
- However, specific public health features not fully verified in current codebase

### 11. Researcher
**Description**: Professionals conducting clinical or health services research using Chikit data.

**Permissions & Access**:
- Access de-identified datasets for research purposes
- View aggregated clinical metrics and outcomes
- Access anonymized patient cohorts for study recruitment
- Review clinical trial data and research findings
- Access protocol development and management tools
- View adverse event reporting and safety data
- Access literature and knowledge management systems
- Collaborate with clinical teams on research studies
- Access research funding and grant management systems
- View research compliance and ethics documentation
- Access data use agreements and material transfer agreements
- Oversee research study monitoring and auditing
- Ensure compliance with research regulations and IRB requirements

**Restrictions**:
- Cannot access individually identifiable patient information without proper authorization and IRB approval
- Cannot modify clinical records or patient data
- Cannot access confidential patient information without consent
- Cannot override clinical judgments or research protocols
- Cannot access proprietary or confidential information
- Cannot access financial systems beyond research budgets
- Cannot access personnel records without authorization
- Cannot bypass research ethics and safety requirements

**Evidence**:
- Statistics routes suggest research data access capabilities
- Audit logging may support research compliance tracking
- Case management and graphs suggest cohort identification capabilities
- Consent management suggests research consent tracking
- However, explicit research features not fully verified in current codebase
- Likely requires enhanced data sharing and governance features

### 12. System Administrator / IT Support
**Description**: Technical personnel responsible for maintaining and supporting the Chikit system.

**Permissions & Access**:
- Access system configuration and administration interfaces
- Manage user accounts, roles, and permissions
- Oversee system performance and monitoring
- Manage database administration and backups
- Handle system updates, patches, and upgrades
- Manage integrations with external systems (ABDM, MedGemma, etc.)
- Oversee security monitoring and incident response
- Manage user support and help desk functions
- Ensure system availability and disaster recovery
- Manage licensing and subscription information
- Oversee compliance reporting and audit preparation
- Manage system documentation and knowledge base
- Coordinate with vendors on service and support
- Ensure data backup and integrity
- Manage system scalability and performance optimization

**Restrictions**:
- Cannot access individual patient clinical records without proper authorization
- Cannot modify clinical content or medical judgments
- Cannot override clinical workflows or documentation standards
- Cannot access confidential patient information unnecessarily
- Cannot make clinical diagnoses or treatment decisions
- Cannot access proprietary clinical information without need
- Cannot modify core healthcare functionality
- Cannot access records for non-system-related purposes
- Cannot bypass security controls or access restrictions

**Evidence**:
- Configuration files (.env.example, tsconfig, etc.) suggest system management capabilities
- Database configuration and management inferred
- External service integration (ABDM, MedGemma) suggests integration management
- Audit logging suggests security monitoring capabilities
- Environment-based configuration suggests deployment management
- However, explicit sysadmin features not fully verified in current codebase
- Infrastructure as code and deployment automation implied

## Key Workflows

### 1. Patient Registration and ABHA Linking Workflow

**Trigger**: New patient seeks healthcare services at a participating facility

**Steps**:
1. **Front Desk Staff**: Collects patient demographic and contact information
2. **Front Desk Staff**: Creates patient profile in Chikit system
3. **Patient**: Receives patient credentials and accesses patient portal
4. **Patient (Optional)**: Initiates ABHA linking process through patient portal
5. **System**: Sends OTP to patient's Aadhaar-linked mobile number
6. **Patient**: Receives OTP and enters it in the portal
7. **System**: Verifies OTP with ABDM servers and generates ABHA number
8. **System**: Links ABHA number to patient record in Chikit
9. **Patient**: Receives confirmation of successful ABHA linking
10. **Clinical Team**: Can now access patient's ABHA-linked health information (with consent)

**Roles Involved**: Front Desk Staff, Patient, System (ABDM Service)
**Systems Used**: Patient registration, ABHA linking service, audit logging
**Data Created**: Patient profile, ABHA linking records, audit trail
**Documents Generated**: Patient ID, ABHA acknowledgment (if applicable)

### 2. Appointment Scheduling and Management Workflow

**Trigger**: Patient requests appointment or provider schedules follow-up visit

**Steps**:
1. **Patient/Front Desk**: Requests appointment for specific reason/provider
2. **Front Desk**: Checks provider availability and schedules appointment
3. **System**: Creates appointment record with date, time, reason, provider
4. **System**: Sends appointment confirmation and reminders to patient
5. **Patient**: Receives appointment details and preparation instructions
6. **Day of Appointment**: Patient checks in at front desk
7. **Front Desk**: Updates appointment status to "checked-in"
8. **Clinical Provider**: Sees patient and conducts encounter
9. **Clinical Provider**: Updates medical records with encounter findings
10. **Clinical Provider**: Orders any needed tests, procedures, or prescriptions
11. **Clinical Provider**: Schedules follow-up appointment if needed
12. **System**: Updates appointment status to "completed"
13. **System**: Creates audit trail for appointment completion
14. **Billing**: Generates charges for visit and services rendered (if applicable)

**Roles Involved**: Patient, Front Desk Staff, Clinical Provider, System, Billing (if applicable)
**Systems Used**: Appointment management, patient notification, medical records, audit logging
**Data Created**: Appointment records, encounter notes, orders, prescriptions, audit trail
**Documents Generated**: Appointment confirmation, visit summary, instructions, prescriptions

### 3. Clinical Encounter and Documentation Workflow

**Trigger**: Patient presents for healthcare visit (scheduled or unscheduled)

**Steps**:
1. **Patient**: Arrives for appointment or walk-in visit
2. **Front Desk**: Verifies patient identity and checks in for visit
3. **Nurse/Medical Assistant**: Takes vital signs and updates patient status
4. **Clinical Provider**: Reviews patient history and reason for visit
5. **Clinical Provider**: Conducts patient examination and assessment
6. **Clinical Provider**: Documents findings in medical record (subjective, objective, assessment, plan)
7. **Clinical Provider**: Orders laboratory tests, imaging studies, or other diagnostics
8. **Clinical Provider**: Creates and signs prescriptions for medications
9. **Clinical Provider**: Makes referrals to specialists or other providers
10. **Clinical Provider**: Provides patient education and instructions
11. **Clinical Provider**: Schedules follow-up visits or procedures
12. **System**: Saves encounter documentation to patient's medical record
13. **System**: Creates audit trail for clinical documentation
14. **System**: Triggers any ordered services (lab, imaging, referrals)
15. **Patient**: Receives visit summary and next steps instructions
16. **Ancillary Staff**: Perform ordered tests or prepare for procedures
13. **System**: Updates encounter status and notifies relevant teams

**Roles Involved**: Patient, Front Desk Staff, Nurse, Clinical Provider, Ancillary Staff, System
**Systems Used**: Medical records, vital signs tracking, order entry, prescription writing, audit logging
**Data Created**: Encounter notes, vital signs, orders, prescriptions, referrals, audit trail
**Documents Generated**: Visit summary, test orders, prescriptions, referral letters, instructions

### 4. Laboratory Test Ordering and Results Workflow

**Trigger**: Clinical provider orders laboratory tests during patient encounter

**Steps**:
1. **Clinical Provider**: Orders specific laboratory tests during encounter
2. **System**: Creates laboratory order with patient, provider, and test details
3. **System**: Notifies laboratory of pending order
4. **Laboratory Technician**: Receives worklist of orders to perform
5. **Laboratory Technician**: Prepares patient and collects specimen
6. **Laboratory Technician**: Performs laboratory analysis on specimen
7. **Laboratory Technician**: Enters results into laboratory information system
8. **System**: Receives and validates laboratory results
9. **System**: Flags abnormal or critical values for provider review
10. **System**: Stores results in patient's medical record
11. **System**: Notifies ordering provider of results availability
12. **Clinical Provider**: Reviews laboratory results and interprets findings
13. **Clinical Provider**: May order additional tests based on results
14. **Clinical Provider**: Adjusts treatment plan based on laboratory findings
15. **Patient**: Is notified of results and any needed actions
16. **System**: Creates audit trail for result entry and reporting
17. **Billing**: Generates charges for laboratory tests performed (if applicable)

**Roles Involved**: Clinical Provider, Laboratory Technician, System, Patient, Billing (if applicable)
**Systems Used**: Laboratory orders, specimen tracking, result entry, notification, audit logging
**Data Created**: Laboratory orders, specimen records, test results, audit trail
**Documents Generated**: Test orders, specimen labels, result reports, provider notifications

### 5. Prescription Creation and Management Workflow

**Trigger**: Clinical provider determines medication is needed during patient encounter

**Steps**:
1. **Clinical Provider**: Selects appropriate medication based on diagnosis and patient factors
2. **Clinical Provider**: Specifies dosage, frequency, duration, and instructions
3. **Clinical Provider**: Checks for allergies, drug interactions, and contraindications
4. **System**: Validates prescription against formulary and guidelines (if implemented)
5. **System**: Creates prescription record with patient, provider, and medication details
6. **System**: Checks for prior authorization requirements (if applicable)
7. **System**: Sends prescription to pharmacy (electronically or via print/fax)
8. **Pharmacist**: Receives prescription and verifies accuracy and completeness
9. **Pharmacist**: Checks for drug interactions, allergies, and appropriateness
10. **Pharmacist**: Dispenses medication according to prescription specifications
11. **Pharmacist**: Provides medication counseling to patient
12. **System**: Updates prescription status to "dispensed" or "active"
13. **System**: Creates audit trail for prescription creation and dispensing
14. **Patient**: Receives medication and instructions for use
15. **Patient**: Takes medication as prescribed and reports any side effects
16. **System**: Tracks refills and renewal requests
17. **Provider**: Reviews ongoing need and renews prescription as appropriate
18. **Billing**: Generates charges for medication and dispensing fees (if applicable)

**Roles Involved**: Clinical Provider, Pharmacist, System, Patient, Insurance (if applicable), Billing (if applicable)
**Systems Used**: Prescription writing, dispensing verification, patient notification, audit logging
**Data Created**: Prescription records, dispensing logs, patient instructions, audit trail
**Documents Generated**: Prescription, medication label, patient information sheet, refill authorization

### 6. AI-Assisted Clinical Decision Support Workflow

**Trigger**: Clinical provider requests AI analysis during patient encounter or record review

**Steps**:
1. **Clinical Provider**: Initiates request for AI analysis (symptoms, patient summary, labs)
2. **System**: Verifies provider authentication and authorization for patient access
3. **System**: Routes request to appropriate AI service (MedGemma or rule-based fallback)
4. **MedGemma Service**: Checks availability of local MedGemma inference server
5. **If MedGemma Available**:
   - Service crafts optimized prompt for medical AI model
   - Sends request to local MedGemma inference server
   - Receives and processes AI response
   - Parses response into structured format (findings, recommendations, etc.)
   - Applies medical disclaimers and confidence indicators
6. **If MedGemma Unavailable**:
   - Service falls back to rule-based AI algorithms
   - Processes request using deterministic logic and medical rules
   - Generates structured response based on clinical guidelines
7. **System**: Stores AI analysis results in patient's record with metadata
8. **System**: Creates audit trail for AI analysis request and response
9. **System**: Returns structured AI analysis to clinical provider
10. **Clinical Provider**: Reviews AI analysis as decision support tool
11. **Clinical Provider**: Integrates AI insights with clinical judgment
12. **Clinical Provider**: Documents consideration of AI findings in medical record
13. **Patient**: Is informed that AI was used as decision support (if policy requires)
14. **System**: May trigger additional actions based on AI recommendations (orders, referrals)

**Roles Involved**: Clinical Provider, System (AI Service), Patient (indirectly)
**Systems Used**: AI service (MedGemma/rule-based), medical records, audit logging, notification systems
**Data Created**: AI analysis results, audit trail, potential follow-up orders
**Documents Generated**: AI analysis report, clinical notes referencing AI, follow-up orders

### 7. Hospital Admission and Discharge Workflow

**Trigger**: Patient requires inpatient care or completes hospital stay

**Admission Steps**:
1. **Clinical Provider**: Determines need for hospital admission
2. **Clinical Provider**: Creates admission order with diagnosis and care plan
3. **Admission Coordinator**: Verifies bed availability and assigns appropriate bed
4. **Admission Coordinator**: Completes admission paperwork and consent forms
5. **Front Desk**: Completes registration if not already registered patient
6. **Nursing Staff**: Prepares bed and room for patient arrival
7. **Patient**: Transferred to inpatient unit and settled in room
8. **Nursing Staff**: Performs admission assessment and vital signs
9. **Clinical Team**: Implements admission orders and initiates care plan
10. **System**: Creates admission record and updates patient status to "admitted"
11. **System**: Creates audit trail for admission
12. **Billing**: Initiates charges for room, board, and services (if applicable)

**Discharge Steps**:
1. **Clinical Provider**: Determines patient meets discharge criteria
2. **Clinical Provider**: Creates discharge summary and instructions
3. **Clinical Provider**: Writes discharge prescriptions and orders follow-up care
4. **Discharge Planner**: Arranges for post-acute care or home health services (if needed)
5. **Pharmacy**: Processes discharge prescriptions and provides medications
6. **Nursing Staff**: Provides discharge education and medication reconciliation
7. **Patient**: Receives discharge instructions and follow-up appointments
8. **System**: Updates patient status to "discharged" and creates discharge record
9. **System**: Creates audit trail for discharge
10. **Billing**: Finalizes charges and generates final invoice (if applicable)
11. **Front Desk**: Processes patient departure and updates system status
12. **Ancillary Services**: Retrieve equipment and restore room to ready state

**Roles Involved**: Clinical Provider, Admission Coordinator, Front Desk, Nursing Staff, Pharmacy, Discharge Planner, System, Billing (if applicable)
**Systems Used**: Admission/discharge management, bed management, medical records, prescription writing, audit logging, billing
**Data Created**: Admission records, discharge summaries, orders, prescriptions, audit trail, billing records
**Documents Generated**: Admission orders, discharge summary, medication list, follow-up instructions, care plans

### 8. Referral and Consultation Workflow

**Trigger**: Clinical provider determines patient needs specialist care or consultation

**Steps**:
1. **Clinical Provider**: Identifies need for specialty consultation or referral
2. **Clinical Provider**: Documents reason for referral and relevant clinical information
3. **Clinical Provider**: Selects appropriate specialist or consulting service
4. **System**: Creates referral record with patient, provider, specialist, and reason details
5. **System**: Sends referral notification to specialist's office or consulting service
6. **Specialist Office**: Receives referral and schedules consultation appointment
7. **Specialist Office**: Sends appointment details to patient and referring provider
8. **Patient**: Receives referral information and appointment scheduling instructions
9. **Patient**: Attends consultation appointment with specialist
10. **Specialist**: Conducts evaluation and provides recommendations
11. **Specialist**: Sends consultation report back to referring provider
12. **Referring Provider**: Reviews consultation report and integrates recommendations
13. **Referring Provider**: Updates patient care plan based on specialist input
14. **System**: Creates audit trail for referral initiation, consultation, and report receipt
15. **Patient**: Is informed of consultation outcomes and next steps
16. **Billing**: Generates charges for consultation services (if applicable)

**Roles Involved**: Referring Provider, Specialist, Patient, System, Office Staff, Billing (if applicable)
**Systems Used**: Referral management, appointment scheduling, medical records, audit logging, notification
**Data Created**: Referral records, consultation reports, appointment records, audit trail
**Documents Generated**: Referral letter, consultation report, appointment instructions, care plan updates

### 9. Consent Management Workflow (where implemented)

**Trigger**: Patient needs to provide or modify consent for data sharing or specific procedures

**Steps**:
1. **Clinical Provider/Admin**: Identifies need for specific consent (treatment, research, HIE)
2. **System**: Presents appropriate consent form with details and options
3. **Patient**: Reviews consent information and asks questions as needed
4. **Patient**: Indicates consent choices (grant, deny, limit scope, set expiration)
5. **System**: Records patient's consent decisions with timestamp and metadata
6. **System**: Creates audit trail for consent transaction
7. **System**: Applies consent decisions to data access and sharing permissions
8. **System**: Schedules consent expiration or renewal reminders (if applicable)
9. **Patient**: Receives copy of consent document for records
10. **System**: Enforces consent restrictions on data usage and sharing
11. **Any Data Access**: System checks consent before allowing access or sharing
12. **On Expiration/Renewal**: System prompts for consent review and refresh

**Roles Involved**: Patient, Clinical Provider/Admin, System
**Systems Used**: Consent management, audit logging, data access controls, notification systems
**Data Created**: Consent records, audit trail, consent metadata
**Documents Generated**: Consent form, consent receipt, renewal reminders

### 10. Audit and Compliance Monitoring Workflow

**Trigger**: Ongoing system operation or specific compliance review requirement

**Steps**:
1. **System**: Automatically logs all significant operations and data accesses
2. **System**: Captures who, what, when, where, and why for each auditable event
3. **System**: Stores before/after values for data modifications (where applicable)
4. **System**: Secures audit logs against tampering and unauthorized access
5. **Compliance Officer/Admin**: Requests audit reports for specific time periods or events
6. **System**: Retrieves and formats audit logs according to request parameters
7. **Compliance Officer/Admin**: Reviews audit logs for policy violations or anomalies
8. **Compliance Officer/Admin**: Investigates any suspicious or non-compliant activities
9. **Compliance Officer/Admin**: Documents findings and recommends corrective actions
10. **System**: Implements recommended changes to controls or procedures
11. **System**: Creates audit trail for compliance actions and modifications
12. **Leadership**: Reviews compliance reports and trends for governance
13. **Leadership**: Makes decisions about resource allocation and risk management
14. **System**: Continuously monitors and logs all activities for ongoing compliance

**Roles Involved**: System (automatic logging), Compliance Officer/Admin, Leadership, IT/Support
**Systems Used**: Audit logging, log storage and retrieval, reporting, change management
**Data Created**: Audit logs, compliance reports, investigation records, action plans
**Documents Generated**: Audit reports, compliance findings, corrective action plans, meeting minutes

## Cross-Cutting Workflow Elements

### Authentication and Authorization
- Present in virtually all workflows
- Verifies user identity before granting access to data or functions
- Checks role-based permissions for requested actions
- Enforces hospital-scoping where applicable
- Creates audit trail for authentication events
- Handles session management and timeout
- Supports multi-factor authentication (ABHA OTP example)

### Data Validation and Integrity
- Input validation using Zod schemas throughout API endpoints
- Database constraints and data types enforce data quality
- Referential integrity maintains relationships between entities
- Validation occurs at API boundary before processing
- Error handling provides meaningful feedback to users
- Audit logging captures validation failures and errors

### Notification and Communication
- Appointment reminders and confirmations (inferred)
- Critical result notifications for laboratory and imaging
- Referral notifications between providers
- Consent expiration and renewal reminders
- System maintenance and downtime notifications
- Security alerts for suspicious activities
- Patient portal messages and instructions
- Care team communication and collaboration tools
- Billing and payment notifications (if applicable)

### Error Handling and Recovery
- Graceful degradation when external services unavailable (MedGemma fallback)
- Meaningful error messages for user correction
- Transaction rollback for failed database operations
- Retry mechanisms for transient failures (inferred)
- Fallback mechanisms ensure continuous operation
- Error logging for diagnostics and improvement
- User-friendly error pages and support guidance

### Performance and Scalability
- Database indexing for common query patterns
- Pagination for large dataset handling (appointments, hospitals, etc.)
- Batched operations for bulk data imports (hospital CSV)
- Asynchronous processing for non-critical operations
- Resource monitoring and alerting (inferred)
- Load balancing readiness for horizontal scaling
- Caching strategies for frequently accessed data
- Query optimization and performance tuning capabilities

This workflow documentation provides a comprehensive view of how different user roles interact with the Chikit system to accomplish healthcare tasks, based on evidence from code inspection and reasonable inferences about system behavior.