# Sasti Dawai: Audit and Blueprint

## Problem Statement Summary
Sasti Dawai focuses on enabling affordable access to medications through price transparency, generic substitution, prescription optimization, and assistance programs. Key requirements include:
- Price comparison across pharmacies and online platforms
- Generic substitution alerts and recommendations
- Prescription optimization (deprescribing, dose optimization, therapeutic interchange)
- Integration with insurance and benefit verification
- Patient assistance program (PAP) enrollment support
- Medication adherence tools (reminders, pill organizers, refill alerts)
- Out-of-pocket cost prediction before prescription is written
- Formulary coverage checking
- Drug interaction and allergy checking
- Medication therapy management (MTM) support
- Supply chain transparency for shortages and recalls

## Current State in Chikit Repository

### Existing Components
1. **Prescription Storage**
   - Prescriptions table (`prescriptions.ts`) exists with fields for medication, dosage, frequency, start/end dates, etc.
   - No fields for cost, generic alternatives, insurance info, etc.

2. **Medication Database**
   - No master medication database or integration with drug databases (e.g., RxNorm, NDC, DrugBank)
   - No storage of medication prices, formulary information, or assistance program details

3. **Price Comparison**
   - No price comparison functionality
   - No integration with pharmacy pricing APIs

4. **Generic Substitution**
   - No alerts or recommendations for generic alternatives
   - No ability to suggest therapeutically equivalent alternatives

5. **Prescription Optimization**
   - No deprescribing or dose optimization suggestions
   - No therapeutic interchange checking

6. **Insurance/Benefit Verification**
   - No integration with insurance systems for eligibility, coverage, or prior authorization

7. **Patient Assistance Programs**
   - No PAP enrollment support or tracking

8. **Medication Adherence Tools**
   - No reminder system for medication intake
   - No refill alerts
   - No pill organizer or adherence tracking

9. **Out-of-pocket Cost Prediction**
   - No ability to predict patient cost before prescription is written

10. **Formulary Coverage Checking**
    - No formulary lookup or coverage verification

11. **Drug Interaction and Allergy Checking**
    - Basic allergy checking may exist in prescription service (to be verified)
    - No comprehensive interaction checking (drug-drug, drug-food, drug-condition)

12. **Medication Therapy Management**
    - No MTM service or comprehensive medication review

13. **Supply Chain Transparency**
    - No integration with shortage or recall databases

### Working Components
- Prescription table and basic CRUD (inferred)
- Patient identity system
- Authentication system
- Hospital tenancy middleware

### Partially Implemented/Broken/Simulated/Missing
- **Medication Master Database**: Missing
- **Price Comparison Functionality**: Missing
- **Generic Substitution Alerts**: Missing
- **Prescription Optimization**: Missing
- **Insurance/Benefit Verification**: Missing
- **Patient Assistance Program Support**: Missing
- **Medication Adherence Tools**: Missing
- **Out-of-pocket Cost Prediction**: Missing
- **Formulary Coverage Checking**: Missing
- **Drug Interaction and Allergy Checking**: Partial (allergy checking may exist, but not comprehensive)
- **Medication Therapy Management**: Missing
- **Supply Chain Transparency (Shortages/Recalls)**: Missing
- **TypeScript Compilation**: Some unresolved issues (e.g., missing `hospital` property)

## Detailed Implementation Blueprint

### 1. Medication Master Database
#### Backend
- Create medication service that integrates with authoritative sources:
  - RxNorm for standardized medication names and identifiers
  - NDC Directory for product-level information
  - DrugBank or similar for drug properties, interactions, and alternatives
- Store essential medication data:
  - Generic name, brand names, strength, form, route
  - NDC numbers, RxCUIs
  - Therapeutic classes (ATC, VA, etc.)
  - Controlled substance schedule
- API endpoints:
  - GET `/api/medications/search` (search by name, NDC, RxCUI)
  - GET `/api/medications/:id` (get detailed medication information)
  - GET `/api/medications/:id/alternatives` (get generic and therapeutic alternatives)
  - GET `/api/medications/:id/interactions` (get drug-drug, drug-food, drug-condition interactions)
  - GET `/api/medications/:id/allergies` (get allergy information, cross-reactivity)
- Implement caching for frequently accessed medications
- Update schedule for medication data (monthly or quarterly)

#### Frontend
- Create medication search component for prescribing interface
- Display medication details (generic/brand, strength, form)
- Show alternatives and interactions when prescribing

### 2. Price Comparison Across Pharmacies
#### Backend
- Create pharmacy price service:
  - Integrate with pharmacy pricing APIs (GoodRx, Blink Health, etc.) or direct pharmacy feeds
  - Store cash prices, insurance prices, and discount program prices
  - Support for local and national chains, online pharmacies
- API endpoints:
  - GET `/api/medications/:id/price` (get price across pharmacies)
    Query: location (zipcode, coordinates), insuranceInfo?, discountProgram?
    Response: [{ pharmacy: string, price: number, currency: string, availability: string, distance: number }]
  - POST `/api/medications/:id/price/subscribe` (subscribe to price change alerts)
- Implement rate limiting and caching for price APIs
- Consider user location for localized pricing

#### Frontend
- Create price comparison view during prescribing:
  - Show list of prices from local pharmacies
  - Ability to filter by pharmacy type, distance, price
  - Show savings with generic vs brand
  - Option to send prescription to selected pharmacy
- Create patient-facing price lookup:
  - Search medication and see prices
  - Set location preferences
  - Save favorite pharmacies

### 3. Generic Substitution Alerts and Recommendations
#### Backend
- Create substitution service:
  - Identify generic equivalents (same active ingredient, strength, form)
  - Identify therapeutically equivalent alternatives (different molecule, same indication)
  - Consider inactive ingredients, allergens, and device differences (for inhalers, etc.)
- API endpoints:
  - GET `/api/medications/:id/generic-equivalents` (list of generic versions)
  - GET `/api/medications/:id/therapeutic-alternatives` (list of alternatives with efficacy/safety comparison)
  - POST `/api/prescriptions/:id/substitute` (attempt to substitute with alternative)
- Implement alerts for narrow therapeutic index drugs where substitution requires caution
- Consider state-specific substitution laws

#### Frontend
- Create prescribing interface with substitution alerts:
  - When prescribing a brand medication, show generic equivalent and cost difference
  - Show therapeutic alternatives with comparison table (efficacy, side effects, cost)
  - One-click generic substitution
  - Alert if substitution may not be appropriate (e.g., anti-epileptics)
- Create patient education on generic equivalence
- Allow patients to set generic preference in profile

### 4. Prescription Optimization
#### Backend
- Create optimization service:
  - Deprescribing guidelines (e.g., Beers Criteria for elderly, STOPP/START)
  - Dose optimization based on renal/hepatic function, age, weight
  - Therapeutic interchange (e.g., PPI to H2 blocker, statin switching)
  - Duration optimization (e.g., antibiotics, opioids)
- API endpoints:
  - POST `/api/prescriptions/:id/optimize` (input: prescription, patient context; output: optimization suggestions)
  - GET `/api/optimization/rules` (get active optimization rulesets)
- Implement clinical decision support alerts during prescription entry
- Consider patient-specific factors (comorbidities, current medications)

#### Frontend
- Create optimization alerts during prescribing:
  - Suggest dose reduction if appropriate
  - Flag potentially inappropriate medications (PIMs) for elderly
  - Recommend therapeutic interchange with cost savings
  - Suggest discontinuation if no longer indicated
- Create medication review interface for periodic comprehensive review
- Show optimization history and accepted/rejected suggestions

### 5. Insurance and Benefit Verification
#### Backend
- Create insurance service:
  - Integrate with insurance clearinghouses or pharmacy benefit managers (PBMs)
  - Verify eligibility, coverage, prior authorization requirements
  - Get formulary tier and out-of-pocket cost
  - Support for major insurance providers and Medicare/Medicaid
- API endpoints:
  - POST `/api/insurance/verify` (input: patient insurance info, medication; output: coverage, cost, PA needed)
  - GET `/api/formulary/:planId` (get formulary for insurance plan)
  - POST `/api/prior-authorization/submit` (submit PA request)
- Implement secure storage of insurance information (encrypted)
- Consider consent for insurance verification

#### Frontend
- Create insurance verification during prescribing:
  - Show coverage status and estimated patient cost
  - Display prior authorization requirements and enable one-click submission
  - Show formulary tier and suggest alternatives if not covered
  - Display patient cost with and without deductible
- Create insurance information management:
  - Allow patients to add/update insurance info
  - Show coverage summary and benefits
- Create prior authorization tracking view

### 6. Patient Assistance Program (PAP) Enrollment Support
#### Backend
- Create PAP service:
  - Store information about manufacturer assistance programs, copay foundations, state programs
  - Eligibility criteria (income, insurance status, diagnosis)
  - Application forms and submission tracking
- API endpoints:
  - GET `/api/medications/:id/pap` (get available PAPs for medication)
  - POST `/api/pap/enroll` (submit enrollment application)
  - GET `/api/pap/applications/:id` (track application status)
- Implement automated eligibility screening based on patient data
- Consider integration with PAP portals or paperless enrollment

#### Frontend
- Create PAP awareness during prescribing:
  - Alert if medication has available PAP and patient may be eligible
  - Show link to apply or offer to start application
- Create PAP application interface:
  - Fill out eligibility questions
  - Upload required documents (income proof, prescription, etc.)
  - Track application status
  - Receive notifications on approval/denial
- Create patient PAP dashboard:
  - Show active PAP enrollments
  - Show renewal dates and requirements
  - Track medication shipments from PAP

### 7. Medication Adherence Tools
#### Backend
- Create adherence service:
  - Medication schedule generation (from prescription frequency)
  - Reminder scheduling (SMS, push, email)
  - Refill prediction based on dosage and quantity
  - Adherence tracking (if patient reports intake)
- API endpoints:
  - POST `/api/adherence/schedule` (input: prescription; output: reminder schedule)
  - POST `/api/adherence/reminder/send` (send reminder for medication intake)
  - POST `/api/adherence/refill-alert` (predict refill needed and alert patient/pharmacy)
  - POST `/api/adherence/log` (log medication intake, side effects)
  - GET `/api/adherence/:patientId/summary` (get adherence metrics)
- Implement smart refill alerts (consider actual usage patterns)
- Support for adherence packaging integration (if available)

#### Frontend
- Create medication reminder interface:
  - Allow patients to set reminder times for each medication
  - Choose reminder type (notification, SMS, call)
  - Show upcoming medications due
  - Log intake with one-click (taken, skipped, side effect)
- Create refill alert view:
  - Show predicted refill date
  - Ability to request refill early
  - Show pharmacy contact and prescription status
- Create adherence dashboard:
  - Show percentage of doses taken over time
  - Show streaks and missed doses
  - Side effect log
  - Share adherence report with provider (if desired)
- Create pill organizer integration guide (if using smart pill box)

### 8. Out-of-pocket Cost Prediction
#### Backend
- Create cost prediction service:
  - Combine medication price, insurance coverage, copay, deductible, and out-of-pocket maximum
  - Predict cost at point of prescribing
  - Consider accumulator programs and maximizer adjustments
- API endpoints:
  - POST `/api/prescriptions/:id/predict-cost` (input: prescription, patient insurance, pharmacy; output: estimated patient cost)
  - GET `/api/cost-prediction/factors` (get factors considered in prediction)
- Implement real-time eligibility check for accurate cost prediction
- Consider patient assistance programs in prediction

#### Frontend
- Create cost display during prescribing:
  - Show estimated patient cost before prescription is finalized
  - Breakdown: drug cost, insurance copay, deductible applied
  - Show cost at different pharmacies if available
  - Alert if cost exceeds threshold (e.g., >$50)
- Create cost comparison view:
  - Compare cost with generic vs brand
  - Compare cost with therapeutic alternatives
  - Show impact of using manufacturer coupon vs insurance
- Create patient cost estimator:
  - Search medication and see estimated cost with their insurance
  - Try different pharmacies or discount programs

### 9. Formulary Coverage Checking
#### Backend
- Create formulary service:
  - Store formularies for major insurance plans, Medicaid, Medicare Part D
  - Update regularly (monthly)
  - Provide coverage status, prior authorization requirements, step therapy, quantity limits
- API endpoints:
  - GET `/api/formulary/:planId/medication/:id` (get coverage status for medication)
  - GET `/api/formulary/:planId` (get entire formulary, paginated)
  - POST `/api/formulary/:planId/medication/:id/alternatives` (get covered alternatives)
- Implement formulary caching and update mechanism
- Consider patient-specific formulary based on their insurance

#### Frontend
- Create formulary check during prescribing:
  - Show if medication is covered, not covered, or requires PA/step therapy
  - Display formulary tier and associated cost
  - Suggest covered alternatives if current medication not covered
  - Show requirements for coverage (PA, step therapy, etc.)
- Create formulary lookup:
  - Search medication and see coverage across patient's insurance plans
  - Link to alternative medications that are covered

### 10. Drug Interaction and Allergy Checking
#### Backend
- Create interaction service:
  - Drug-drug interactions (DDI) with severity levels (contraindicated, major, moderate, minor)
  - Drug-food interactions (e.g., statins and grapefruit)
  - Drug-condition interactions (e.g., NSAIDs and heart failure)
  - Allergy checking (including cross-reactivity, e.g., cephalosporins and penicillin allergy)
- API endpoints:
  - POST `/api/interactions/check` (input: list of medications, patient conditions/allergies; output: interactions)
  - GET `/api/interactions/:id1/:id2` (get interaction between two medications)
  - POST `/api/allergies/check` (input: medication, patient allergies; output: allergy risk, cross-reactivity)
- Implement real-time checking during prescription entry and medication reconciliation
- Consider patient-specific factors (age, pregnancy, lactation)
- Update interaction database regularly

#### Frontend
- Create interaction alerts during prescribing:
  - Show interactions with currently prescribed medications
  - Show interactions with patient's reported conditions
  - Show allergy risks and cross-reactivity
  - Provide severity levels and management suggestions (e.g., monitor, avoid, alternative)
- Create interaction report for medication reconciliation:
  - List all potential interactions in patient's medication list
  - Prioritize by severity
- Create allergy management interface:
  - List patient allergies with reaction severity
  - Add/delete allergies
  - Mark as resolved if appropriate

### 11. Medication Therapy Management (MTM) Support
#### Backend
- Create MTM service:
  - Comprehensive medication review (CMR) service
  - Identify medication-related problems (MRPs): untreated conditions, improper drug selection, subtherapeutic dosage, overdose, adverse drug reactions, non-adherence, etc.
  - Create action plan with patient and prescriber
- API endpoints:
  - POST `/api/mtm/review` (input: patient medications, conditions, labs; output: MRPs, recommendations)
  - GET `/api/mtm/:patientId/reviews` (get past MTM reviews)
  - POST `/api/mtm/action-plan` (create and update action plan)
- Implement MTM eligibility screening (based on number of chronic medications, etc.)
- Consider integrating with community pharmacists or clinical pharmacists

#### Frontend
- Create MTM initiation workflow:
  - Identify eligible patients (polypharmacy, high-risk medications, etc.)
  - Offer MTM service and schedule review
- Create MTM review interface for clinicians:
  - Review all medications, supplements, OTCs
  - Identify MRPs and create recommendations
  - Share with patient and primary prescriber
- Create patient-facing MTM summary:
  - Show medication list with purpose
  - Show identified problems and recommended actions
  - Show action plan and goals
- Create MTM follow-up tracking:
  - Track implementation of recommendations
  - Schedule next review

### 12. Supply Chain Transparency (Shortages and Recalls)
#### Backend
- Create shortage and recall service:
  - Integrate with FDA shortage website, manufacturer notifications, and recall databases
  - Track resolved shortages and recall classifications
- API endpoints:
  - GET `/api/medications/:id/shortage` (get shortage status, estimated resolution date)
  - GET `/api/medications/:id/recall` (get recall information, reason, instructions)
  - GET `/api/shortages/list` (get current shortages, filterable by medication type)
  - GET `/api/recalls/list` (get recent recalls, filterable by class)
- Implement real-time alerts for active prescriptions
- Consider patient notification for recalls affecting their medications

#### Frontend
- Create shortage alert during prescribing:
  - Warn if medication is in shortage
  - Show estimated resolution date
  - Suggest alternatives if available
- Create recall alert:
  - Show if prescribed medication is recalled
  - Show reason and patient instructions (return, destroy, etc.)
  - Provide contact information for questions
- Create patient medication dashboard:
  - Show active prescriptions
  - Indicate if any are in shortage or recalled
  - Link to details and alternatives
- Create pharmacist-facing shortage dashboard:
  - List current shortages and impact
  - Show expected resupply dates
  - Track mitigation strategies

## Required Database Changes
1. **Medications Table** (master medication database):
   ```sql
   CREATE TABLE medications (
     id SERIAL PRIMARY KEY,
     rxnorm_cui VARCHAR(20) UNIQUE,
     ndc_code VARCHAR(11),
     generic_name VARCHAR(200) NOT NULL,
     brand_names TEXT[], -- array of brand names
     strength VARCHAR(50),
     form VARCHAR(50), -- tablet, capsule, liquid, etc.
     route VARCHAR(50), -- oral, topical, inhaler, etc.
     atc_code VARCHAR(10),
     va_class TEXT,
     controlled_substance_schedule VARCHAR(10),
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE
   );
   ```
2. **Medication Prices Table**:
   ```sql
   CREATE TABLE medication_prices (
     id SERIAL PRIMARY KEY,
     medication_id INTEGER NOT NULL,
     pharmacy_name VARCHAR(200),
     pharmacy_type VARCHAR(50), -- retail, mail_order, online
     location_zipcode VARCHAR(10),
     price DECIMAL(8,2),
     currency VARCHAR(3) DEFAULT 'USD',
     price_type VARCHAR(20), -- cash, insurance, discount_program
     availability VARCHAR(50), -- in_stock, limited, out_of_stock
     last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     FOREIGN KEY (medication_id) REFERENCES medications(id)
   );
   ```
3. **Prescription Enhancements** (add columns if missing):
   - `generic_substituted` (boolean): whether generic was dispensed
   - `therapeutic_alternative_considered` (boolean)
   - `cost_predicted` (decimal): predicted out-of-pocket cost
   - `insurance_verified` (boolean)
   - `prior_authorization_required` (boolean)
   - `pap_eligible` (boolean)
   - `adherence_scheduled` (boolean): whether reminder schedule set
   - `shortage_status` (varchar): none, shortage, resolved
   - `recall_status` (varchar): none, recall, withdrawn
4. **Interaction Tables**:
   ```sql
   CREATE TABLE medication_interactions (
     id SERIAL PRIMARY KEY,
     medication_id_1 INTEGER NOT NULL,
     medication_id_2 INTEGER NOT NULL,
     interaction_type VARCHAR(20) NOT NULL, -- DDG, DFG, DCG
     severity VARCHAR(20) NOT NULL, -- contraindicated, major, moderate, minor
     description TEXT NOT NULL,
     management TEXT,
     source VARCHAR(100), -- DrugBank, Micromedex, etc.
     FOREIGN KEY (medication_id_1) REFERENCES medications(id),
     FOREIGN KEY (medication_id_2) REFERENCES medications(id)
   );
   ```
5. **Allergies Table**:
   ```sql
   CREATE TABLE patient_allergies (
     id SERIAL PRIMARY KEY,
     patient_id INTEGER NOT NULL,
     allergen_type VARCHAR(50) NOT NULL, -- medication, food, latex, etc.
     allergen_name VARCHAR(200) NOT NULL,
     reaction VARCHAR(200) NOT NULL,
     severity VARCHAR(20) NOT NULL, -- mild, moderate, severe, life_threatening
     recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     recorded_by INTEGER,
     FOREIGN KEY (patient_id) REFERENCES patients(id)
   );
   ```
6. **Patient Assistance Programs Table**:
   ```sql
   CREATE TABLE pap_programs (
     id SERIAL PRIMARY KEY,
     medication_id INTEGER NOT NULL,
     program_name VARCHAR(200) NOT NULL,
     sponsor VARCHAR(200) NOT NULL, -- manufacturer, foundation, state
     eligibility_criteria TEXT,
     benefits TEXT, -- what is covered (medication, copay, etc.)
     application_url TEXT,
     contact_info TEXT,
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE,
     FOREIGN KEY (medication_id) REFERENCES medications(id)
   );
   ```
7. **Adherence Schedule Table**:
   ```sql
   CREATE TABLE adherence_schedules (
     id SERIAL PRIMARY KEY,
     prescription_id INTEGER NOT NULL,
     reminder_time TIME NOT NULL, -- time of day for reminder
     reminder_type VARCHAR(20) NOT NULL, -- notification, sms, call
     start_date DATE NOT NULL,
     end_date DATE,
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
   );
   ```
8. **Medication Therapy Management Table**:
   ```sql
   CREATE TABLE mtm_reviews (
     id SERIAL PRIMARY KEY,
     patient_id INTEGER NOT NULL,
     reviewed_by INTEGER NOT NULL, -- pharmacist or clinician
     review_date DATE NOT NULL,
     medications_reviewed TEXT[], -- list of medication IDs or names
     medication_related_problems JSONB, -- structured MRPs
     recommendations JSONB, -- structured recommendations
     action_plan TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
9. **Shortage and Recall Tables**:
   ```sql
   CREATE TABLE medication_shortages (
     id SERIAL PRIMARY KEY,
     medication_id INTEGER NOT NULL,
     shortage_start DATE,
     estimated_resolution DATE,
     reason TEXT,
     severity VARCHAR(20), -- critical, moderate, mild
     source VARCHAR(100), -- FDA, manufacturer
     reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     FOREIGN KEY (medication_id) REFERENCES medications(id)
   );

   CREATE TABLE medication_recalls (
     id SERIAL PRIMARY KEY,
     medication_id INTEGER NOT NULL,
     recall_date DATE NOT NULL,
     recall_class VARCHAR(10) NOT NULL, -- I, II, III
     reason TEXT NOT NULL,
     instructions TEXT NOT NULL,
     source VARCHAR(100) NOT NULL, -- FDA, manufacturer
     reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     FOREIGN KEY (medication_id) REFERENCES medications(id)
   );
   ```

## Required API Contracts
### Medication Search
```
GET /api/medications/search
Query: q (search query), limit, offset
Response: [{
  id: number,
  rxnorm_cui: string,
  ndc_code: string,
  generic_name: string,
  brand_names: string[],
  strength: string,
  form: string,
  route: string,
  ...basic fields
}, ...], total: number, limit: number, offset: number
```

### Medication Details
```
GET /api/medications/:id
Response: { id: number, rxnorm_cui: string, generic_name: string, brand_names: string[], strength: string, form: string, route: string, atc_code: string, ... }
```

### Generic Equivalents
```
GET /api/medications/:id/generic-equivalents
Response: [{ id: number, generic_name: string, brand_names: string[], strength: string, form: string, ndc_code: string }]
```

### Therapeutic Alternatives
```
GET /api/medications/:id/therapeutic-alternatives
Response: [{ id: number, generic_name: string, brand_names: string[], strength: string, form: string, indication_overlap: string, efficacy_comparison: string, cost_comparison: string }]
```

### Price Comparison
```
GET /api/medications/:id/price
Query: latitude, longitude, radius, insuranceInfo?, discountProgram?
Response: [{ pharmacy: string, pharmacy_type: string, price: number, currency: string, availability: string, distance: number }]
```

### Insurance Verification
```
POST /api/insurance/verify
Body: { patientInsurance: { id: string, group: string, bin: string, pcn: string }, medicationId: number, quantity: number, daysSupply: number }
Response: { covered: boolean, copay: number, deductibleApplied: boolean, priorAuthRequired: boolean, formularyTier: string, estimatedPatientCost: number }
```

### Prescription Optimization
```
POST /api/prescriptions/:id/optimize
Body: { prescription: {...}, patientContext: {...} } // patientContext: age, weight, renalFunction, hepaticFunction, currentMeds, conditions
Response: { suggestions: [{ type: string, description: string, proposedChange: string, rationale: string, riskLevel: string }] }
```

### PAP Eligibility
```
GET /api/medications/:id/pap
Response: [{ programName: string, sponsor: string, eligibility: string, benefits: string, applicationUrl: string }]
```

### Adherence Schedule
```
POST /api/adherence/schedule
Body: { prescriptionId: number, dosage: string, frequency: string, startDate: string }
Response: { schedule: [{ time: string, type: string }] }
```

### Interaction Check
```
POST /api/interactions/check
Body: { medications: Array<{ id: number, dosage: string }>, conditions: Array<string>, allergies: Array<string> }
Response: { interactions: [{ medication1: string, medication2: string, type: string, severity: string, description: string, management: string }] }
```

### Allergy Check
```
POST /api/allergies/check
Body: { medicationId: number, patientAllergies: Array<{ allergenName: string, reaction: string }> }
Response: { allergyRisk: string, crossReactivity: string[], severity: string }
```

### Medication Therapy Management Review
```
POST /api/mtm/review
Body: { patientId: number, medications: Array<{ id: number, dosage: string, frequency: string }>, conditions: Array<string>, labs: {...} }
Response: { mrps: [{ type: string, description: string, severity: string }], recommendations: [{ action: string, rationale: string, priority: string }] }
```

### Shortage Status
```
GET /api/medications/:id/shortage
Response: { shortage: boolean, estimatedResolution: string|null, reason: string|null, severity: string|null }
```

### Recall Status
```
GET /api/medications/:id/recall
Response: { recall: boolean, recallClass: string|null, reason: string|null, instructions: string|null }
```

## Required AI/ML Implementation
1. **Medication Recommendation Engine**:
   - Use ML to suggest optimal medications based on patient characteristics, comorbidities, current medications, and cost
   - Consider efficacy, safety, interactions, and patient preferences
2. **Price Prediction Models**:
   - Predict future medication prices based on historical trends, generic entry, patent expiration, etc.
   - Help patients and providers plan for cost changes
3. **Adherence Prediction**:
   - Predict likelihood of non-adherence based on medication regimen, patient demographics, psychosocial factors, etc.
   - Target adherence interventions effectively
4. **Interaction Severity Prediction**:
   - Use ML to predict clinical significance of interactions beyond static databases
   - Consider patient-specific factors (age, genetics, organ function)
5. **Generic Entry Impact Prediction**:
   - Predict impact of generic entry on medication prices and availability
   - Help with formulary planning and patient counseling
6. **Prior Authorization Likelihood**:
   - Predict probability of PA approval based on medication, diagnosis, patient history, and payer policies
   - Guide prescribers toward more approvable alternatives
7. **Medication Risk Stratification**:
   - Stratify patients by medication risk (polypharmacy, high-risk medications, renal/hepatic impairment) for targeted MTM
8. **Shortage Forecasting**:
   - Predict likelihood and duration of shortages based on manufacturer reports, raw material availability, regulatory issues

## Required UI/UX Changes
1. **Prescribing Interface Enhancements**:
   - Medication search with autocomplete (generic/brand)
   - Display generic equivalent and cost difference when selecting brand
   - Show therapeutic alternatives with comparison
   - Display insurance coverage and estimated patient cost
   - Show interaction and allergy alerts in real-time
   - Display PAP eligibility if applicable
   - Show optimization suggestions (deprescribing, dose adjustment)
   - Indicate shortage or recall status
   - One-click buttons for common actions (generic substitution, check coverage, schedule refill)
2. **Medication Information View**:
   - Comprehensive medication details (generic/brand, strength, form, route)
   - Price information from multiple pharmacies
   - Generic and therapeutic alternatives
   - Interaction and allergy information
   - PAP and assistance program details
   - Shortage and recall status
   - Formulary coverage for patient's insurance
3. **Adherence Management Interface**:
   - Medication schedule with reminder times
   - Refill prediction and one-click refill request
   - Intake logging with side effect reporting
   - Adherence dashboard (percentage taken, streaks)
   - Share adherence report with provider
4. **Cost Estimator Tool**:
   - Search medication and see estimated cost with patient's insurance
   - Try different pharmacies, discount programs, and generics
   - See impact of deductible and copay
   - Link to PAP if eligible
5. **Medication Review Interface (MTM)**:
   - List all medications, supplements, OTCs
   - Identify medication-related problems
   - Create recommendations and action plan
   - Track implementation over time
6. **Patient Medication Dashboard**:
   - List active medications with purpose
   - Show adherence status
   - Show refill alerts
   - Show cost-saving opportunities (generic, alternatives, PAP)
   - Show interaction and allergy alerts
   - Show shortage/recall warnings
7. **Insurance Information View**:
   - List active insurance plans
   - Show coverage summary and benefits
   - Show prior authorization requirements
   - Show PAP eligibility based on insurance status
8. **Shortage and Recall Alerts**:
   - Banner or icon during prescribing if medication is in shortage or recalled
   - Link to details and alternatives
   - Patient notification if active prescription affected
9. **Accessibility Controls**:
   - High contrast toggle
   - Font size adjuster
   - Screen reader mode
   - Language selector for medication information
10. **Provider Alert Dashboard**:
    - List of patients with high-risk medications, potential interactions, non-adherence, etc.
    - Filter by severity and action required

## Security and Privacy Considerations
1. **Authorization**: Ensure patients can only see their own medication information, adherence data, and cost predictions
2. **Data Encryption**: Encrypt sensitive data at rest (medication lists, insurance information, financial data)
3. **Audit Logging**: Log all medication prescriptions, changes, adherence logs, cost predictions, and assistance program applications
4. **Data Minimization**: Store only necessary medication data (avoid storing unnecessary details like full pill images unless required)
5. **Consent Management**: Track patient consent for medication adherence reminders, insurance verification, and data sharing with assistance programs
6. **Input Sanitization**: Prevent XSS in medication notes, allergy descriptions, etc.
7. **Rate Limiting**: Protect medication search, price, and insurance APIs from abuse
8. **Secure Data Sharing**: Use secure methods when sharing medication information with pharmacies or assistance programs
9. **Notification Security**: Protect adherence reminders and refill alerts from spoofing or abuse
10. **Encryption Keys**: Securely manage encryption keys for any encrypted data

## Testing Strategy
1. **Unit Tests**:
   - Medication search accuracy and relevance
   - Generic equivalent identification
   - Price comparison logic
   - Insurance verification logic
   - Interaction and allergy checking algorithms
   - Adherence schedule generation
   - Cost prediction accuracy
   - PAP eligibility determination
   - MTM recommendation logic
   - Shortage and recall status determination
2. **Integration Tests**:
   - End-to-end prescribing flow with all checks (generic, coverage, cost, interactions)
   - Adherence reminder scheduling and sending
   - Refill alert generation and patient notification
   - PAP application submission and tracking
   - MTM review and action plan creation
   - Shortage/recall alert triggering for active prescriptions
3. **Frontend Tests**:
   - Prescribing interface rendering and interaction
   - Medication search and selection
   - Generic substitution workflow
   - Insurance coverage display
   - Cost prediction display
   - Adherence schedule and reminder UI
   - Medication review interface
   - Patient medication dashboard
   - Shortage and recall alert visibility
4. **Performance Tests**:
   - Medication search response time (<500ms)
   - Price comparison retrieval (<1s)
   - Insurance verification response time (<1s)
   - Interaction check latency (<500ms)
   - Adherence schedule generation (<200ms)
   - Cost prediction latency (<500ms)
   - MTM review generation (<2s)
5. **Security Tests**:
   - Authorization bypass attempts
   - Input validation for SQL/XSS in medication notes and allergy fields
   - Rate limiting effectiveness
   - Data encryption verification
   - Secure transmission verification
   - Protection against medication tampering or fraud
6. **Usability Tests**:
   - Prescriber usability of enhanced prescribing interface
   - Patient usability of medication information and adherence tools
   - Clinician usability of MTM review interface
   - Effectiveness of cost estimator tool
   - Accessibility feature usability
   - Alert fatigue mitigation (prioritizing critical alerts)

## Deployment Considerations
1. **Environment Variables**:
   - Enable/disable specific features (price comparison, PAP, MTM, etc.)
   - Configure API credentials for external services (RxNorm, DrugBank, insurance verification, price APIs)
   - Set update schedules for medication database, formularies, shortage/recall feeds
   - Configure adherence reminder frequencies and timing
   - Set cost prediction model retraining schedule
2. **Database**:
   - Ensure indexes on frequently queried fields (medication generic name, rxnorm_cui, ndc_code)
   - Consider partitioning for high-volume tables (medication prices, adherence logs)
   - Monitor table sizes and set up archiving for old data
   - Ensure indexes on prescription fields for optimization checks
3. **Backend**:
   - Implement background jobs for database updates (medication, formulary, shortage/recall)
   - Use caching for frequently accessed medication data, interaction checks, and formulary lookups
   - Implement message queue for adherence reminders and refill alerts
   - Secure storage for encryption keys and API credentials
   - Implement batch processing for costly operations (e.g., interaction checks for large medication lists)
4. **Frontend**:
   - Service worker for caching static assets and API responses
   - IndexedDB for offline functionality (medication search, adherence schedules)
   - Lazy loading of heavy components (medication database views, interaction graphs)
   - Font loading for multilingual support
   - Voice feature detection and fallback
5. **Monitoring**:
   - Track medication search volume and popular queries
   - Monitor price API usage and success rates
   - Track insurance verification volume and accuracy
   - Measure adherence reminder engagement and refill request rates
   - Monitor MTM review completion rates and action plan implementation
   - Track shortage and recall alert frequency and patient/provider response
   - Audit log review for compliance and abnormal prescribing patterns
   - Monitor cost prediction accuracy via patient feedback
   - Track generic substitution rates and cost savings

## Gap Summary
| Component | Status | Notes |
|----------|--------|-------|
| Medication Master Database | Missing | No master medication database or integration with drug databases |
| Price Comparison Functionality | Missing | No price comparison across pharmacies |
| Generic Substitution Alerts | Missing | No alerts or recommendations for generic alternatives |
| Prescription Optimization | Missing | No deprescribing, dose optimization, or therapeutic interchange |
| Insurance/Benefit Verification | Missing | No integration with insurance systems |
| Patient Assistance Program Support | Missing | No PAP enrollment support or tracking |
| Medication Adherence Tools | Missing | No reminder system, refill alerts, or adherence tracking |
| Out-of-pocket Cost Prediction | Missing | No ability to predict patient cost before prescription |
| Formulary Coverage Checking | Missing | No formulary lookup or coverage verification |
| Drug Interaction and Allergy Checking | Partial | Basic allergy checking may exist, but not comprehensive |
| Medication Therapy Management | Missing | No MTM service or comprehensive medication review |
| Supply Chain Transparency (Shortages/Recalls) | Missing | No integration with shortage or recall databases |
| Database Indexes for New Tables | Missing | No indexes on key fields for performance |
| Error Handling | Partial | Some services lack comprehensive error handling |
| TypeScript Compilation | Issues | Some unresolved type errors (e.g., `hospital` property) |

## Recommendations
1. Begin by implementing the medication master database and search functionality to establish a foundation for medication data.
2. Add price comparison and generic substitution alerts to enable affordable prescribing.
3. Implement insurance verification and cost prediction to support financial transparency.
4. Add prescription optimization and interaction checking to improve medication safety.
5. Build PAP support and adherence tools to support patient access and adherence.
6. Implement formulary coverage checking and MTM services for comprehensive medication management.
7. Add shortage and recall transparency to ensure patient safety.
8. Address TypeScript compilation errors and add database indexes for new tables.
9. Implement comprehensive error handling and audit logging for compliance.
