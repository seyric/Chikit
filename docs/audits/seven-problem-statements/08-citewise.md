# CiteWise: Audit and Blueprint

## Problem Statement Summary
CiteWise focuses on enabling healthcare professionals to efficiently find, evaluate, and apply medical evidence at the point of care. Key requirements include:
- Fast, reliable medical literature search (PubMed, Cochrane, clinical guidelines)
- Access to full-text articles through institutional subscriptions
- Evidence grading and quality assessment (e.g., GRADE system)
- Recommendation strength and consensus levels
- Integration with EHR for context-aware suggestions (patient-specific)
- Citation management and reference formatting
- Offline access to saved articles and guidelines
- Multimedia content (videos, images, algorithms)
- Multilingual support for guidelines and summaries
- Alerts for new evidence and guideline updates
- Evidence-based order sets and care plans
- Feedback mechanism on evidence usefulness

## Current State in Chikit Repository

### Existing Components
1. **Medical Literature Search**
   - No integrated medical literature search functionality
   - No connection to PubMed, Cochrane, or other medical databases

2. **Full-text Access**
   - No integration with institutional subscriptions or open access repositories

3. **Evidence Grading**
   - No evidence grading system (e.g., GRADE, USPSTF)

4. **Recommendation Strength**
   - No storage or display of recommendation strength or consensus

5. **Integration with EHR for Context-aware Suggestions**
   - No context-aware evidence suggestions based on patient data (diagnosis, medications, etc.)

6. **Citation Management**
   - No citation management or reference formatting tools

7. **Offline Access**
   - No offline saving of articles or guidelines

8. **Multimedia Content**
   - No storage or delivery of medical videos, images, or algorithms

9. **Multilingual Support**
   - No multilingual support for guidelines or summaries

10. **Alerts for New Evidence**
    - No alerting system for new evidence or guideline updates

11. **Evidence-based Order Sets and Care Plans**
    - No evidence-based order sets or care plans

12. **Feedback Mechanism**
    - No feedback mechanism on evidence usefulness

### Working Components
- Patient identity system
- Authentication system
- Hospital tenancy middleware
- Basic medical records and prescriptions storage

### Partially Implemented/Broken/Simulated/Missing
- **Medical Literature Search Engine**: Missing
- **Full-text Article Access**: Missing
- **Evidence Grading System**: Missing
- **Recommendation Strength Storage**: Missing
- **Context-aware Evidence Suggestions**: Missing
- **Citation Management**: Missing
- **Offline Access to Articles**: Missing
- **Multimedia Content Storage/Delivery**: Missing
- **Multilingual Support for Guidelines**: Missing
- **Alerting System for New Evidence**: Missing
- **Evidence-based Order Sets and Care Plans**: Missing
- **Feedback Mechanism on Evidence Usefulness**: Missing
- **TypeScript Compilation**: Some unresolved issues (e.g., missing `hospital` property)

## Detailed Implementation Blueprint

### 1. Medical Literature Search Engine
#### Backend
- Create medical literature search service:
  - Integrate with PubMed API (NCBI E-utilities) for biomedical literature
  - Integrate with Cochrane Library API (if available) for systematic reviews
  - Integrate with clinical guidelines repositories (e.g., NGC, NICE, WHO)
  - Support for advanced search (MeSH terms, boolean operators, filters)
  - Relevance ranking and duplicate removal
- API endpoints:
  - GET `/api/literature/search` (query: string, filters: date range, article type, species, language, limit, offset)
  - GET `/api/literature/article/:id` (get article details by PMID/DOI)
  - POST `/api/literature/fetch-fulltext` (attempt to retrieve full-text via institutional login or open access)
  - GET `/api/literature/trending` (get recently popular articles in specialty)
- Implement caching for frequent searches and article metadata
- Consider rate limiting to respect source APIs
- Support for saving searches and alerts

#### Frontend
- Create literature search interface:
  - Search bar with autocomplete (suggest MeSH terms, previous searches)
  - Filters for date, article type (review, trial, guideline), language
  - Display results with title, authors, journal, PMID, DOI
  - Show availability indicator (open access, institutional access, paywall)
  - Ability to save articles to personal library
  - Export citations in various formats (Vancouver, APA, etc.)
- Create article detail view:
  - Show abstract, full-text if available
  - Show MeSH terms, publication types, grant information
  - Show cited by and related articles
  - Ability to add notes and tags

### 2. Full-text Article Access
#### Backend
- Create access management service:
  - Store institutional subscription credentials (encrypted)
  - Integrate with EZproxy, OpenAthens, or similar for seamless access
  - Fallback to open access repositories (PubMed Central, arXiv, etc.)
  - Support for interlibrary loan requests (if applicable)
- API endpoints:
  - POST `/api/literature/access` (input: PMID/DOI; output: access status, full-text URL or error)
  - GET `/api/literature/open-access/:id` (check if article is available via open access)
- Implement link resolver functionality
- Consider copyright compliance and fair use

#### Frontend
- Create access indicator in search results:
  - Icons for open access, institutional access, paywall
  - Button to attempt access
- Create article reading view:
  - Display full-text with ability to scroll, search within
  - Show citation tools (copy citation, export reference)
  - Ability to save for offline reading
  - Show access source (institution, open access, etc.)

### 3. Evidence Grading System
#### Backend
- Create evidence grading service:
  - Implement GRADE framework (Grading of Recommendations Assessment, Development and Evaluation)
  - Store evidence profiles for clinical questions
  - Store systematic reviews and meta-analyses with GRADE assessments
  - Support for other grading systems (USPSTF, ACE inhibitors, etc.) if needed
- API endpoints:
  - GET `/api/evidence/grade/:questionId` (get GRADE evidence profile for clinical question)
  - POST `/api/evidence/grade` (input: evidence data; output: GRADE assessment)
  - GET `/api/evidence/recommendations/:questionId` (get strength and direction of recommendation)
- Implement evidence update mechanism when new studies are published
- Consider storing evidence in structured format (PICO: Population, Intervention, Comparison, Outcome)

#### Frontend
- Create evidence grade display:
  - Show quality of evidence for each outcome (high, moderate, low, very low)
  - Show strength of recommendation (strong, conditional)
  - Show direction of recommendation (for, against)
  - Show implied values and preferences
  - Show balance of desirable and undesirable outcomes
- Create evidence summary view:
  - Plain language summary of evidence
  - Key findings and certainty levels
  - Reference to full evidence profile

### 4. Recommendation Strength and Consensus
#### Backend
- Store recommendation details:
  - Strength (strong, conditional)
  - Direction (for, against, either, no recommendation)
  - Consensus level (unanimous, majority, etc.)
  - Underlying evidence quality
  - Values and preferences consideration
- API endpoints:
  - GET `/api/recommendations/:questionId` (get recommendation details)
  - POST `/api/recommendations` (create or update recommendation)
- Implement linkage to evidence grading and literature search

#### Frontend
- Create recommendation display:
  - Clear statement of recommendation
  - Evidence quality and strength indicators
  - Link to evidence profile
  - Context-specific factors that may change recommendation
  - Reference to original guideline source

### 5. Integration with EHR for Context-aware Suggestions
#### Backend
- Create context-aware evidence service:
  - Analyze patient data (diagnosis, medications, labs, demographics) to generate clinical questions
  - Map patient data to relevant evidence (e.g., if patient has diabetes and hypertension, suggest evidence for BP targets in diabetes)
  - Use ontology mappings (SNOMED CT, ICD, LOINC, RxNorm) to normalize data
  - Prioritize evidence based on patient risk factors and comorbidities
- API endpoints:
  - POST `/api/evidence/contextual-suggestions` (input: patient context; output: relevant clinical questions, evidence summaries, recommendations)
  - GET `/api/evidence/question-templates` (get templates for generating questions from patient data)
- Implement caching for frequent patient contexts
- Consider patient privacy and anonymization for analytics

#### Frontend
- Create context-aware evidence sidebar:
  - Appear in patient chart or during note-writing
  - Show suggested clinical questions based on patient data
  - Show evidence summaries and recommendations
  - Ability to search further or save for later
- Create trigger for evidence suggestions:
  - On patient load
  - On diagnosis entry
  - On medication change
  - On note-writing activation
- Create mini-evidence view within the sidebar:
  - Show question, evidence grade, recommendation
  - Expand to full detail

### 6. Citation Management and Reference Formatting
#### Backend
- Create citation service:
  - Store references with metadata (authors, title, journal, volume, pages, PMID, DOI)
  - Support for multiple citation styles (Vancouver, APA, AMA, etc.)
  - Generate bibliographies and in-text citations
- API endpoints:
  - POST `/api/citations/format` (input: references, style; output: formatted text)
  - GET `/api/citations/styles` (list available citation styles)
  - POST `/api/citations/import` (input: PMID list or RIS/BibTeX; output: imported references)
  - GET `/api/citations/:id` (get reference details)
- Implement deduplication and metadata enrichment (e.g., fetch missing details from CrossRef)

#### Frontend
- Create citation manager:
  - Add references via PMID/DOI search or manual entry
  - Edit reference details
  - Organize into folders or by project
  - Generate bibliography in selected style
  - Copy formatted citations
- Create inline citation insertion:
  - In note-writing or document editor, insert citation and generate bibliography
  - Ability to update bibliography when references change
- Create reference library:
  - Search saved references
  - Tag and organize
  - Share reference lists with colleagues

### 7. Offline Access to Saved Articles and Guidelines
#### Backend
- Create offline storage service:
  - Allow users to mark articles or guidelines for offline access
  - Store metadata and optionally full-text (if licensing permits)
  - Generate secure, time-limited access tokens for offline viewing
- API endpoints:
  - POST `/api/literature/:id/offline/save` (save for offline access)
  - GET `/api/literature/offline/list` (list saved items for user)
  - DELETE `/api/literature/:id/offline` (remove from offline)
  - GET `/api/literature/offline/:id/access` (get secure access token or metadata)
- Implement encryption for stored offline content if required
- Consider licensing restrictions for full-text storage

#### Frontend
- Create offline library:
  - List of saved articles and guidelines
  - Show availability (fully saved, metadata only)
  - Ability to download for offline reading (if permitted)
  - Show last sync time and size
- Create offline reading view:
  - Display saved content
  - Show licensing notice if applicable
  - Ability to sync when online returns
- Create sync service:
  - Automatically sync saved items when online (if changed)
  - Handle conflicts (local changes vs server)

### 8. Multimedia Content Storage and Delivery
#### Backend
- Create multimedia service:
  - Store medical videos (procedure demonstrations, lectures)
  - Store medical images (anatomy, pathology, radiology)
  - Store clinical algorithms and decision trees
  - Support for streaming and adaptive bitrate
  - Licensing and rights management
- API endpoints:
  - GET `/api/multimedia/:id` (get metadata and streaming URL)
  - POST `/api/multimedia/upload` (upload new content with metadata)
  - GET `/api/multimedia/search` (search by title, description, tags, type)
  - GET `/api/multimedia/:id/transcript` (get transcript for video)
  - GET `/api/multimedia/:id/chapters` (get chapter markers for video)
- Implement CDN for efficient delivery
- Consider HIPAA compliance for any patient-specific multimedia

#### Frontend
- Create multimedia library:
  - Browse by type (video, image, algorithm) and specialty
  - Search with filters
  - Show preview and description
- Create video player:
  - Playback controls, speed adjustment, subtitles
  - Show transcript and chapters
  - Picture-in-picture mode
  - Ability to save for offline viewing (if permitted)
- Create image viewer:
  - Zoom, pan, rotate
  - Show metadata and annotations
  - Ability to save or share
- Create algorithm viewer:
  - Interactive decision tree
  - Show supporting evidence and references
  - Ability to save or share

### 9. Multilingual Support for Guidelines and Summaries
#### Backend
- Store translations of guidelines, evidence summaries, and patient materials
- Implement language detection and fallback
- API endpoints:
  - GET `/api/guidelines/:id` (get guideline in requested language)
  - GET `/api/evidence/summary/:questionId` (get evidence summary in requested language)
  - GET `/api/languages/supported` (list of supported languages)
- Consider community translation efforts for low-resource languages

#### Frontend
- Implement i18n framework for evidence interface:
  - Translate all UI strings, buttons, menus
  - Language selector in user preferences
  - Automatic language detection from browser
- Create language toggle for evidence content:
  - Switch between available languages for guidelines, summaries, etc.
  - Show original language and translation source
- Ensure multimedia content has subtitles or dubbing in supported languages
- Provide language-specific search (e.g., search Hindi guidelines)

### 10. Alerts for New Evidence and Guideline Updates
#### Backend
- Create alerting service:
  - Monitor PubMed for new articles matching saved searches
  - Monitor guideline repositories for updates
  - Monitor for retractions and erratas
  - Send notifications via email, SMS, or in-app
- API endpoints:
  - POST `/api/alerts/subscribe` (input: search query, frequency; output: subscription ID)
  - GET `/api/alerts/subscriptions` (list user's subscriptions)
  - DELETE `/api/alerts/subscription/:id` (unsubscribe)
  - POST `/api/alerts/trigger-check` (manually trigger check for new evidence)
- Implement deduplication and throttling of alerts
- Allow users to set alert severity thresholds (e.g., only high-impact studies)

#### Frontend
- Create alert management interface:
  - List of active subscriptions
  - Show recent alerts and ability to mark as read
  - Create new subscription with search query and filters
  - Set delivery method and frequency
- Create alert notification:
  - In-app bell icon with count
  - Modal or toast for new alerts
  - Link to evidence or guideline update
  - Ability to snooze or dismiss
- Create email/SMS alert template customization
- Provide option for digest alerts (daily/weekly)

### 11. Evidence-based Order Sets and Care Plans
#### Backend
- Create order set service:
  - Store evidence-based order sets for common conditions (e.g., sepsis, asthma exacerbation)
  - Link each order to supporting evidence and guidelines
  - Support for customization and local adaptations
- API endpoints:
  - GET `/api/order-sets` (list available order sets)
  - GET `/api/order-sets/:id` (get order set details with evidence links)
  - POST `/api/order-sets/:id/instantiate` (input: patient context; output: patient-specific order set)
  - POST `/api/order-sets/:id/customize` (save local adaptation)
- Create care plan service:
  - Store evidence-based care plans for chronic conditions (e.g., diabetes, heart failure)
  - Link goals, interventions, and metrics to evidence
- API endpoints:
  - GET `/api/care-plans` (list care plans)
  - GET `/api/care-plans/:id` (get care plan details)
  - POST `/api/care-plans/:id/assign` (assign to patient with customization)
  - PUT `/api/care-plans/:id/:patientId/progress` (update progress on goals)

#### Frontend
- Create order set browser:
  - Browse by specialty or condition
  - Show evidence grade and recommendation for each order
  - Ability to instantiate for specific patient
  - Customize and save local version
- Create order set instantiation view:
  - Show patient context
  - Show evidence-based orders with ability to adjust
  - Generate printable or electronic order set
- Create care plan browser:
  - Browse by condition
  - Show evidence supporting goals and interventions
  - Assign to patient and set goals
- Create care plan tracking view:
  - Show progress toward goals
  - Show upcoming interventions and assessments
  - Allow patient and provider to update progress

### 12. Feedback Mechanism on Evidence Usefulness
#### Backend
- Create feedback service:
  - Collect feedback on evidence usefulness, relevance, and applicability
  - Track impact on clinical decisions (if possible via EHR integration)
  - Aggregate feedback to identify high-value evidence
- API endpoints:
  - POST `/api/evidence/:id/feedback` (input: userId, rating, comments, usefulness; output: feedback ID)
  - GET `/api/evidence/:id/feedback` (get feedback summary for evidence)
  - POST `/api/evidence/:id/impact` (record clinical action taken based on evidence)
- Implement feedback weighting (expertise, clinical context)
- Consider anonymity options for feedback

#### Frontend
- Create feedback prompts:
  - After viewing evidence or guideline: "Was this helpful?"
  - Rating scale (1-5 stars) with optional comment
  - Specific usefulness questions (e.g., "Did this change your plan?")
  - Ability to report applicability to patient case
- Create feedback dashboard for evidence curators:
  - Show usefulness ratings and trends
  - Show comments and suggested improvements
  - Link to evidence with low usefulness for review
- Create impact tracking:
  - Show clinical actions taken based on evidence (if consented and tracked)
  - Show outcomes if available

## Required Database Changes
1. **Literature Search Cache Table**:
   ```sql
   CREATE TABLE literature_search_cache (
     id SERIAL PRIMARY KEY,
     search_hash VARCHAR(64) NOT NULL, -- hash of query and filters
     results JSONB NOT NULL, -- cached results
     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
2. **Article Metadata Table**:
   ```sql
   CREATE TABLE literature_articles (
     id SERIAL PRIMARY KEY,
     pmid VARCHAR(20) UNIQUE,
     doi VARCHAR(100),
     title TEXT NOT NULL,
     authors TEXT[],
     journal VARCHAR(200),
     volume VARCHAR(20),
     issue VARCHAR(20),
     pages VARCHAR(50),
     pub_date DATE,
     abstract TEXT,
     mesh_terms TEXT[],
     publication_types TEXT[],
     language VARCHAR(10),
     pmcid VARCHAR(20),
     open_access BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
3. **User Saved Articles Table**:
   ```sql
   CREATE TABLE user_saved_articles (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL,
     article_id INTEGER NOT NULL,
     saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     notes TEXT,
     tags TEXT[],
     FOREIGN KEY (user_id) REFERENCES users(id),
     FOREIGN KEY (article_id) REFERENCES literature_articles(id)
   );
   ```
4. **Evidence Profiles Table** (for GRADE and other assessments):
   ```sql
   CREATE TABLE evidence_profiles (
     id SERIAL PRIMARY KEY,
     clinical_question TEXT NOT NULL,
     population TEXT,
     intervention TEXT,
     comparator TEXT,
     outcome TEXT,
     evidence_quality JSONB, -- { outcome: 'high', ... }
     recommendation_strength VARCHAR(20), -- strong, conditional
     recommendation_direction VARCHAR(20), -- for, against, either
     consensus_level VARCHAR(20),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
5. **Recommendations Table**:
   ```sql
   CREATE TABLE recommendations (
     id SERIAL PRIMARY KEY,
     evidence_profile_id INTEGER NOT NULL,
     guideline_source VARCHAR(200),
     guideline_url TEXT,
     recommendation_text TEXT NOT NULL,
     strength VARCHAR(20),
     direction VARCHAR(20),
     consensus VARCHAR(20),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     FOREIGN KEY (evidence_profile_id) REFERENCES evidence_profiles(id)
   );
   ```
6. **Contextual Suggestion Cache Table**:
   ```sql
   CREATE TABLE contextual_suggestion_cache (
     id SERIAL PRIMARY KEY,
     patient_context_hash VARCHAR(64) NOT NULL,
     suggestions JSONB NOT NULL,
     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
7. **Citation Table**:
   ```sql
   CREATE TABLE citations (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     authors TEXT[],
     journal VARCHAR(200),
     volume VARCHAR(20),
     issue VARCHAR(20),
     pages VARCHAR(50),
     year INTEGER,
     pmid VARCHAR(20),
     doi VARCHAR(100),
     url TEXT,
     accessed_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
8. **User Saved Citations Table**:
   ```sql
   CREATE TABLE user_saved_citations (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL,
     citation_id INTEGER NOT NULL,
     saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     folder VARCHAR(100),
     FOREIGN KEY (user_id) REFERENCES users(id),
     FOREIGN KEY (citation_id) REFERENCES citations(id)
   );
   ```
9. **Offline Literature Table**:
   ```sql
   CREATE TABLE offline_literature (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL,
     article_id INTEGER,
     guideline_id INTEGER,
     saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     expires_at TIMESTAMP WITH TIME ZONE, -- for time-limited access
     encrypted BOOLEAN DEFAULT FALSE,
     FOREIGN KEY (user_id) REFERENCES users(id),
     FOREIGN KEY (article_id) REFERENCES literature_articles(id)
   );
   ```
10. **Multimedia Table**:
    ```sql
    CREATE TABLE multimedia (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type VARCHAR(20) NOT NULL, -- video, image, algorithm
      url TEXT NOT NULL, -- streaming URL or file path
      thumbnail_url TEXT,
      duration INTEGER, -- for video in seconds
      tags TEXT[],
      language VARCHAR(10),
      transcript TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ```
11. **User Saved Multimedia Table**:
    ```sql
    CREATE TABLE user_saved_multimedia (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      multimedia_id INTEGER NOT NULL,
      saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (multimedia_id) REFERENCES multimedia(id)
    );
    ```
12. **Guidelines Table**:
    ```sql
    CREATE TABLE guidelines (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      issuing_body VARCHAR(200),
      guideline_url TEXT,
      language VARCHAR(10) NOT NULL,
      specialty VARCHAR(100),
      publication_date DATE,
      content TEXT, -- or URL to content
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ```
13. **User Saved Guidelines Table**:
    ```sql
    CREATE TABLE user_saved_guidelines (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      guideline_id INTEGER NOT NULL,
      saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (guideline_id) REFERENCES guidelines(id)
    );
    ```
14. **Alert Subscriptions Table**:
    ```sql
    CREATE TABLE alert_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      search_query TEXT NOT NULL,
      filters JSONB, -- date range, article types, etc.
      frequency VARCHAR(20) NOT NULL, -- immediate, hourly, daily, weekly
      channel VARCHAR(20) NOT NULL, -- in_app, email, sms
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    ```
15. **Alert History Table**:
    ```sql
    CREATE TABLE alert_history (
      id SERIAL PRIMARY KEY,
      subscription_id INTEGER NOT NULL,
      triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
      new_items JSONB, -- list of new article/guideline IDs
      notified_at TIMESTAMP WITH TIME ZONE,
      FOREIGN KEY (subscription_id) REFERENCES alert_subscriptions(id)
    );
    ```
16. **Order Sets Table**:
    ```sql
    CREATE TABLE order_sets (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      condition VARCHAR(100),
      evidence_base TEXT, -- summary of evidence
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ```
17. **Order Set Items Table**:
    ```sql
    CREATE TABLE order_set_items (
      id SERIAL PRIMARY KEY,
      order_set_id INTEGER NOT NULL,
      item_type VARCHAR(20) NOT NULL, -- medication, lab, imaging, procedure
      item_details JSONB NOT NULL, -- specifics of the order
      evidence_support TEXT, -- reference to evidence supporting this item
      FOREIGN KEY (order_set_id) REFERENCES order_sets(id)
    );
    ```
18. **Care Plans Table**:
    ```sql
    CREATE TABLE care_plans (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      condition VARCHAR(100),
      evidence_base TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ```
19. **Care Plan Assignments Table**:
    ```sql
    CREATE TABLE care_plan_assignments (
      id SERIAL PRIMARY KEY,
      care_plan_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      goals JSONB, -- array of goal objects
      interventions JSONB, -- array of intervention objects
      FOREIGN KEY (care_plan_id) REFERENCES care_plans(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );
    ```
20. **Feedback on Evidence Table**:
    ```sql
    CREATE TABLE evidence_feedback (
      id SERIAL PRIMARY KEY,
      evidence_id INTEGER NOT NULL, -- could be article, guideline, recommendation
      user_id INTEGER NOT NULL,
      rating INTEGER CHECK (rating >= 0 AND rating <= 5),
      usefulness BOOLEAN,
      comments TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    ```
21. **Impact Tracking Table**:
    ```sql
    CREATE TABLE evidence_impact (
      id SERIAL PRIMARY KEY,
      evidence_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      action_taken TEXT NOT NULL,
      patient_id INTEGER, -- if applicable and consented
      outcome TEXT,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    ```

## Required API Contracts
### Literature Search
```
GET /api/literature/search
Query: q, filters (JSON string), limit, offset
Response: [{
  id: number,
  pmid: string,
  title: string,
  authors: string[],
  journal: string,
  pubDate: string,
  abstract: string,
  meshTerms: string[],
  publicationTypes: string[],
  openAccess: boolean,
  ...basic fields
}, ...], total: number, limit: number, offset: number
```

### Article Details
```
GET /api/literature/article/:id
Response: { id: number, pmid: string, doi: string, title: string, authors: string[], journal: string, volume: string, issue: string, pages: string, pubDate: string, abstract: string, meshTerms: string[], publicationTypes: string[], language: string, pmcid: string, openAccess: boolean }
```

### Full-text Access Attempt
```
POST /api/literature/fetch-fulltext
Body: { pmid: string, doi: string }
Response: { access: boolean, url: string|null, error: string|null }
```

### Evidence Grade
```
GET /api/evidence/grade/:questionId
Response: { question: string, population: string, intervention: string, comparator: string, outcome: string, evidenceQuality: {...}, recommendationStrength: string, recommendationDirection: string, consensusLevel: string }
```

### Contextual Suggestions
```
POST /api/evidence/contextual-suggestions
Body: { patientContext: { diagnosis: string[], medications: string[], labs: {...}, demographics: {...} } }
Response: { suggestions: [{ questionId: number, question: string, evidenceSummary: string, recommendation: string }] }
```

### Citation Formatting
```
POST /api/citations/format
Body: { references: Array<{ id: number }>, style: string }
Response: { formattedText: string, bibliography: string }
```

### Offline Literature Save
```
POST /api/literature/:id/offline/save
Body: { userId: number }
Response: { success: true, savedAt: string }
```

### Offline Literature List
```
GET /api/literature/offline/list
Query: userId: number
Response: [{ id: number, title: string, pmid: string, savedAt: string, expiresAt: string|null }]
```

### Multimedia Search
```
GET /api/multimedia/search
Query: q, type, language, limit, offset
Response: [{ id: number, title: string, type: string, language: string, url: string, thumbnailUrl: string, ... }]
```

### Guideline Retrieval
```
GET /api/guidelines/:id
Query: language?: string
Response: { id: number, title: string, issuingBody: string, guidelineUrl: string, language: string, specialty: string, publicationDate: string, content: string }
```

### Alert Subscription
```
POST /api/alerts/subscribe
Body: { userId: number, searchQuery: string, filters?: JSON, frequency: string, channel: string }
Response: { id: number, ...input, createdAt: string }
```

### Order Set Instantiation
```
POST /api/order-sets/:id/instantiate
Body: { patientContext: { diagnosis: string[], medications: string[], allergies: string[] } }
Response: { orderSetId: number, items: [{ type: string, details: {...}, evidenceSupport: string }], generatedAt: string }
```

### Care Plan Assignment
```
POST /api/care-plans/:id/assign
Body: { patientId: number, goals?: JSON, interventions?: JSON }
Response: { id: number, carePlanId: number, patientId: number, assignedAt: string }
```

### Evidence Feedback
```
POST /api/evidence/:id/feedback
Body: { userId: number, rating: number, usefulness: boolean, comments?: string }
Response: { id: number, ...input, createdAt: string }
```

## Required AI/ML Implementation
1. **Literature Recommendation Engine**:
   - Use ML to suggest relevant articles based on user's search history, saved articles, and clinical context
   - Consider collaborative filtering (what similar users found useful)
   - Content-based filtering (MeSH terms, publication types)
2. **Evidence Grading Assistance**:
   - Use ML to assist in GRADE assessment by analyzing study quality, consistency, directness, and precision
   - Train on graded evidence profiles to predict grades for new evidence
3. **Contextual Question Generation**:
   - Use NLP to generate clinical questions from patient data (diagnoses, medications, labs)
   - Map to standardized question templates (PICO format)
   - Consider patient-specific factors (age, comorbidities, pregnancy)
4. **Evidence Summarization**:
   - Use ML to generate plain language summaries of abstracts or full-text articles
   - Tailor summary to user's role (clinician, patient, student)
   - Consider length and readability constraints
5. **Guideline Update Detection**:
   - Use ML to detect significant changes in guideline updates (beyond version number)
   - Flag updates that change recommendations or evidence base
6. **Citation Recommendation**:
   - Suggest relevant citations when writing notes or documents based on context
   - Consider co-citation and bibliographic coupling
7. **Multimedia Content Tagging**:
   - Use ML to automatically tag medical images and videos with MeSH terms or specialty
   - Transcribe videos and extract keywords for search
8. **Language Translation Quality Estimation**:
   - Estimate quality of machine translation for medical text and flag low-quality translations
9. **Alert Prioritization**:
   - Use ML to predict which new evidence alerts are most likely to be useful based on user's specialty and past behavior
   - Reduce alert fatigue by prioritizing high-relevance alerts
10. **Evidence Impact Prediction**:
    - Predict likelihood that evidence will change clinical practice based on study design, journal impact, and consensus
    - Help prioritize evidence for rapid integration

## Required UI/UX Changes
1. **Literature Search Interface**:
   - Search bar with autocomplete (MeSH terms, previous searches)
   - Filters panel (date, article type, language, species, human/animal)
   - Results list with relevance sorting and ability to save
   - Article preview on hover or click
   - Export citations button
   - Save search and set alert button
2. **Article Detail View**:
   - Tabbed interface (abstract, full-text, references, metrics)
   - Show MeSH terms and publication types
   - Show open access/institutional access/paywall status
   - Ability to add notes, tags, and save to library
   - Citation tools (copy, export, format)
   - Full-text viewer with search within and scroll
3. **Evidence Grade Display**:
   - Visual evidence profile table (outcomes vs quality)
   - Strength and direction of recommendation badges
   - Consensus level indicator
   - Link to full evidence profile and guideline source
4. **Context-aware Evidence Sidebar**:
   - Appear in patient chart or note-writing context
   - Show list of suggested clinical questions based on patient data
   - Expand each question to show evidence summary and recommendation
   - Ability to search further or save for later
   - Mini-evidence view with grade and recommendation
5. **Citation Manager**:
   - Library view with folders/tags
   - Add via PMID/DOI search or manual entry
   - Edit reference details
   - Generate bibliography in selected style
   - Copy formatted citations
   - Share reference list
6. **Offline Library**:
   - List of saved articles/guidelines for offline access
   - Show availability (full content vs metadata only)
   - Download for offline reading (if permitted)
   - Show last sync and size
7. **Multimedia Library**:
   - Browse by type (video, image, algorithm) and specialty
   - Search with filters
   - Preview thumbnails and descriptions
   - Video player with transcript and chapters
   - Image viewer with zoom and metadata
   - Algorithm viewer with interactive decision tree
8. **Guideline Browser**:
   - Browse by specialty, issuing body, or date
   - Show evidence grade and recommendation strength
   - Ability to save for offline reading
   - Translate to available languages
9. **Alert Management**:
   - List of active subscriptions with search query and frequency
   - Show recent alerts with ability to mark as read
   - Create new subscription with guided search builder
   - Set delivery method and frequency
   - Digest alert options
10. **Order Set Browser**:
    - Browse by condition or specialty
    - Show evidence base and item count
    - Instantiate for patient with context
    - Customize and save local version
11. **Care Plan Browser**:
    - Browse by condition
    - Show evidence supporting goals and interventions
    - Assign to patient with customization
    - Track progress toward goals
12. **Feedback Prompts**:
    - After viewing evidence: "Was this helpful?" with rating and comment
    - Specific usefulness questions (changed plan, learned something new)
    - Ability to report applicability to current patient case
13. **Accessibility Controls**:
    - High contrast toggle
    - Font size adjuster
    - Screen reader mode
    - Language selector for evidence interface
14. **Provider Evidence Dashboard**:
    - Show literature search history
    - Show saved articles and guidelines
    - Show alert subscriptions and recent alerts
    - Show feedback given and impact tracked
    - Show order sets and care plans used

## Security and Privacy Considerations
1. **Authorization**: Ensure users can only see their own saved searches, saved articles, alerts, and feedback
2. **Data Encryption**: Encrypt sensitive data at rest (search history, annotations, feedback)
3. **Audit Logging**: Log all literature searches, article accesses, saves, and feedback
4. **Data Minimization**: Store only necessary data for literature functionality (avoid storing full-text unless licensed and required)
5. **Consent Management**: Track user consent for offline storage, alert notifications, and data sharing for improvement
6. **Input Sanitization**: Prevent XSS in search queries, notes, comments, etc.
7. **Rate Limiting**: Protect literature search and article APIs from abuse (especially during epidemics or trending topics)
8. **Secure Data Transmission**: Use HTTPS and consider encryption for licensed full-text access
9. **Copyright Compliance**: Ensure respect for copyright and licensing when storing or transmitting full-text content
10. **Notification Security**: Protect alert notifications from spoofing or abuse
11. **Encryption Keys**: Securely manage encryption keys for any encrypted data (e.g., offline content)

## Testing Strategy
1. **Unit Tests**:
   - Literature search relevance and ranking
   - Evidence grading algorithms
   - Contextual question generation accuracy
   - Citation formatting correctness
   - Offline access token generation and validation
   - Multimedia metadata extraction
   - Alert deduplication and throttling
   - Order set instantiation logic
   - Evidence feedback aggregation
2. **Integration Tests**:
   - End-to-end literature search, save, and offline access
   - Evidence grade display and contextual suggestion integration
   - Citation manager workflow (add, format, export)
   - Multimedia library and playback
   - Alert subscription and notification
   - Order set instantiation from patient context
   - Care plan assignment and progress tracking
   - Evidence feedback and impact tracking
3. **Frontend Tests**:
   - Literature search interface rendering and interaction
   - Article detail view tabs and full-text viewer
   - Evidence grade display and recommendation badges
   - Context-aware evidence sidebar in patient chart
   - Citation manager library and tools
   - Offline library download and sync
   - Multimedia browser and players
   - Guideline browser and translation toggle
   - Alert management interface
   - Order set and care plan browsers
   - Feedback prompts and dashboard
4. **Performance Tests**:
   - Literature search response time (<2s for common queries)
   - Article details retrieval (<500ms)
   - Evidence grade retrieval (<500ms)
   - Contextual suggestion generation (<1s)
   - Citation formatting (<500ms for 10 references)
   - Multimedia search and thumbnail loading (<1s)
   - Guideline retrieval (<500ms)
   - Alert subscription creation (<500ms)
   - Order set instantiation (<1s)
   - Care plan assignment (<500ms)
5. **Security Tests**:
   - Authorization bypass attempts
   - Input validation for SQL/XSS in search queries and notes
   - Rate limiting effectiveness
   - Data encryption verification
   - Secure transmission verification
   - Copyright compliance checks (simulated)
6. **Usability Tests**:
   - Clinician usability of literature search and article view
   - Patient usability of evidence summaries and guidelines
   - Researcher usability of citation manager and offline library
   - Effectiveness of contextual evidence suggestions
   - Accessibility feature usability
   - Alert fatigue mitigation (prioritization and digest options)
   - Order set and care plan usability
   - Feedback mechanism clarity and usefulness

## Deployment Considerations
1. **Environment Variables**:
   - Enable/disable specific features (literature search, multimedia, alerts, etc.)
   - Configure API credentials for external services (PubMed, Cochrane, guideline repositories)
   - Set update schedules for literature cache, guideline databases, multimedia libraries
   - Configure alert frequencies and channels
   - Set order set and care plan review schedules
2. **Database**:
   - Ensure indexes on frequently queried fields (literature search hash, article pmid/doi, userId)
   - Consider partitioning for high-volume tables (literature search cache, user saved articles, alert history)
   - Monitor table sizes and set up archiving for old data
   - Ensure indexes on evidence profiles and recommendations for quick retrieval
3. **Backend**:
   - Implement background jobs for literature cache updates and guideline checks
   - Use caching for frequently accessed literature metadata, evidence grades, and guideline contents
   - Implement message queue for alert notifications and multimedia processing
   - Secure storage for encryption keys and API credentials
   - Implement batch processing for costly operations (e.g., full-text fetch attempts)
4. **Frontend**:
   - Service worker for caching static assets and API responses
   - IndexedDB for offline functionality (saved searches, article metadata, citation libraries)
   - Lazy loading of heavy components (literature search results, multimedia players)
   - Font loading for multilingual support
   - Voice feature detection and fallback
5. **Monitoring**:
   - Track literature search volume and zero-result rates
   - Monitor article access success rates (open access, institutional, paywall)
   - Measure evidence grade retrieval latency and accuracy
   - Track contextual suggestion usage and clinical impact (if consented)
   - Monitor citation manager usage and export formats
   - Track offline sync success/failure rates
   - Monitor multimedia playback and loading times
   - Track guideline update alerts and user engagement
   - Measure order set and care plan usage rates
   - Analyze feedback on evidence usefulness and impact
   - Audit log review for compliance and abnormal patterns

## Gap Summary
| Component | Status | Notes |
|----------|--------|-------|
| Medical Literature Search Engine | Missing | No integrated search to PubMed, Cochrane, etc. |
| Full-text Article Access | Missing | No integration with institutional subscriptions or open access |
| Evidence Grading System | Missing | No GRADE or other evidence grading |
| Recommendation Strength Storage | Missing | No storage of recommendation strength or consensus |
| Context-aware Evidence Suggestions | Missing | No EHR integration for context-aware suggestions |
| Citation Management | Missing | No citation management or reference formatting |
| Offline Access to Articles | Missing | No offline saving of articles or guidelines |
| Multimedia Content Storage/Delivery | Missing | No storage or delivery of medical videos, images, algorithms |
| Multilingual Support for Guidelines | Missing | No multilingual support for guidelines or summaries |
| Alerting System for New Evidence | Missing | No alerting system for new evidence or guideline updates |
| Evidence-based Order Sets and Care Plans | Missing | No evidence-based order sets or care plans |
| Feedback Mechanism on Evidence Usefulness | Missing | No feedback mechanism on evidence usefulness |
| Database Indexes for New Tables | Missing | No indexes on key fields for performance |
| Error Handling | Partial | Some services lack comprehensive error handling |
| TypeScript Compilation | Issues | Some unresolved type errors (e.g., `hospital` property) |

## Recommendations
1. Begin by implementing the literature search engine and article details retrieval to establish a foundation for medical evidence access.
2. Add evidence grading and recommendation storage to enable evidence appraisal.
3. Implement contextual evidence suggestions to integrate with patient data.
4. Build citation management and offline access for saving and formatting references.
5. Add multimedia content storage and delivery for enriched learning.
6. Implement multilingual support and alerting system for updates and accessibility.
7. Create evidence-based order sets and care plans to apply evidence at the point of care.
8. Add feedback mechanism to continuously improve the evidence service.
9. Address TypeScript compilation errors and add database indexes for new tables.
10. Implement comprehensive error handling and audit logging for compliance.
