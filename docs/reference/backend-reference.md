# Chikit by Solar - Backend Reference

This document provides a comprehensive reference of the Chikit backend application built with Node.js, Express, TypeScript, and PostgreSQL. The backend provides a RESTful API for the Chikit healthcare platform, integrating with external systems like ABDM (Ayushman Bharat Digital Mission) and MedGemma for AI capabilities.

## Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **Authentication**: Custom JWT-based implementation
- **ORM**: Drizzle ORM for type-safe database operations
- **API Documentation**: OpenAPI/Swagger (inferred from code structure)
- **External Integrations**: 
  - ABDM API for ABHA health ID integration
  - MedGemma for offline AI capabilities (symptom analysis, patient summarization, lab interpretation)
- **Audit Logging**: Custom audit trail implementation
- **Testing**: Not explicitly shown but inferred structure

## Project Structure
```
artifacts/api-server/
├── src/
│   ├── app.ts              # Express app setup and middleware
│   ├── index.ts            # Server entry point
│   ├── lib/                # Core libraries and utilities
│   │   ├── auth.ts         # Authentication utilities (JWT, middleware)
│   │   └── audit.ts        # Audit logging functionality
│   ├── abdm/               # ABDM (Ayushman Bharat Digital Mission) integration
│   │   ├── service.ts      # ABDM service implementation
│   │   ├── config.ts       # ABDM configuration
│   │   └── index.ts        # ABDM module exports
│   ├── medgemma/           # MedGemma AI integration
│   │   ├── service.ts      # MedGemma service implementation
│   │   └── index.ts        # MedGemma module exports
│   ├── casegraph/          # Case management and consent services
│   │   ├── service.ts      # Main casegraph service
│   │   ├── consent.service.ts
│   │   ├── provenance.service.ts
│   │   ├── search.service.ts
│   │   └── deidentify.service.ts
│   ├── routes/             # API route controllers
│   │   ├── index.ts        # Main router export
│   │   ├── auth.ts         # Authentication endpoints
│   │   ├── patients.ts     # Patient management
│   │   ├── hospitals.ts    # Hospital management
│   │   ├── appointments.ts # Appointment scheduling
│   │   ├── medical-records.ts # Clinical documentation
│   │   ├── prescriptions.ts # Medication management
│   │   ├── lab-reports.ts  # Laboratory results
│   │   ├── radiology.ts    # Radiology reports
│   │   ├── staff.ts        # Staff management
│   │   ├── drugs.ts        # Drug formulary
│   │   ├── doctors.ts      # Doctor management
│   │   ├── billing.ts      # Billing and payments
│   │   ├── reports.ts      # Reporting and analytics
│   │   ├── ai.ts           # AI analysis endpoints
│   │   ├── abha.ts         # ABHA-specific endpoints
│   │   ├── controlled-medications.ts # Controlled substance tracking
│   │   ├── consent-requests.ts # Consent management
│   │   ├── casegraph.ts    # Case graph endpoints
│   │   ├── casegraph-consent.ts # Consent endpoints
│   │   ├── casegraph-provenance.ts # Provenance endpoints
│   │   ├── hospital-capacity.ts # Hospital capacity management
│   │   └── stats.ts        # Statistics and metrics
│   └── ...                 # Additional files and configurations
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── build.ts                # Build script
└── seed-drugs.ts           # Drug database seeding script
```

## Core Architecture

### Server Entry Point
**File**: `src/index.ts`
- Sets up PORT environment variable requirement
- Creates and starts the Express server
- Logs server startup information

### Application Setup
**File**: `src/app.ts`
- Configures Express application
- Applies CORS middleware
- Sets up JSON and URL-encoded body parsing
- Mounts API router under `/api` prefix
- Exports configured Express app

### Routing System
**File**: `src/routes/index.ts` (inferred from app.ts usage)
- Centralized route exporting
- Individual route files imported and combined
- Uses Express Router for modular route definitions

## Authentication System
**File**: `src/lib/auth.ts`

The authentication system implements a custom JWT-based solution:

### Data Types
```typescript
export interface AuthUser {
  id: number;
  email: string | null;
  name: string;
  role: string;
  hospitalId: number | null;
}
```

### Password Handling
- `hashPassword(password)`: SHA-256 hashing with application-specific salt
- Uses synchronous crypto operations for simplicity

### Token Management
- `generateToken(user)`: Creates JWT token with 7-day expiration
  - Payload: User data + expiration timestamp
  - Encoding: Base64 URL-safe encoding
  - Signature: HMAC-SHA256 with application secret
- `verifyToken(token)`: Validates and decodes JWT token
  - Signature verification
  - Expiration check
  - Returns AuthUser payload or null if invalid
- Token format: `base64payload.signature`

### Middleware
- `requireAuth`: Express middleware for route protection
  - Extracts Bearer token from Authorization header
  - Validates token using verifyToken
  - Attaches user object to request (req.user)
  - Returns 401 for missing/invalid tokens
- `requireRole`: Role-based authorization middleware
  - Checks if user role matches required roles
  - Returns 403 for insufficient permissions
  - Supports multiple role specifications

### Token Security Notes
- Uses hardcoded secret in development (should be env var in production)
- 7-day expiration for tokens
- SHA-256 for password hashing (consider bcrypt/scrypt for production)
- No token refresh mechanism shown (would need implementation)

## Database Layer

### ORM: Drizzle ORM
- Type-safe SQL query builder
- Imported as `@workspace/db`
- Provides both relational and SQL-building APIs
- Used throughout route controllers and services

### Database Connection
- Centralized database instance (`db`) from `@workspace/db`
- Configured elsewhere (likely in workspace root)
- Shared across all modules

### Query Patterns
- Select queries: `db.select().from(table).where(conditions)`
- Insert queries: `db.insert(table).values(data).returning()`
- Update queries: `db.update(table).set(data).where(conditions).returning()`
- Delete queries: `db.delete(table).where(conditions)`
- Joins: Multiple `.leftJoin()` calls for relational data
- Aggregations: `db.select({ count: count() }).from(table).where(conditions)`

### Transaction Handling
- Uses Promise.all() for parallel queries where appropriate
- Individual query error handling with try/catch
- No explicit transaction wrappers shown (may be handled elsewhere)

## Service Layer Architecture

### ABDM Service
**File**: `src/abdm/service.ts`
Handles integration with Ayushman Bharat Digital Mission for ABHA (Ayushman Bharat Health Account) management.

#### Key Features
- ABHA registration via Aadhaar or mobile number
- ABHA authentication (login)
- Linking ABHA to patient records
- Fetching ABHA profile information
- Transaction ID generation for audit trails
- Development/demo mode with simulated responses
- JWT token generation for internal authentication post-ABHA verification

#### Main Methods
- `initiateAbhaRegistrationWithAadhaar(aadhaarNumber)`: Step 1 of Aadhaar-based ABHA registration
- `verifyAbhaRegistrationWithAadhaar(transactionId, otp)`: Step 2 of Aadhaar-based ABHA registration
- `initiateAbhaRegistrationWithMobile(mobileNumber)`: Step 1 of Mobile-based ABHA registration
- `verifyAbhaRegistrationWithMobile(transactionId, otp, name?, gender?, dateOfBirth?)`: Step 2 of Mobile-based ABHA registration
- `initiateAbhaAuth(abhaNumber)`: Step 1 of ABHA-based authentication
- `verifyAbhaAuth(transactionId, otp)`: Step 2 of ABHA-based authentication
- `linkAbhaToPatient(patientId, abhaNumber, abhaAddress?)`: Link ABHA to existing patient
- `getAbhaProfile(abhaNumber)`: Fetch ABHA profile/details

#### Development Features
- Simulated ABDM API responses when actual SDK not available
- Demo OTP handling ("123456") in non-production environments
- Informational notes about sandbox vs production behavior
- Fallback logic for missing dependencies

### MedGemma Service
**File**: `src/medgemma/service.ts`
Provides offline AI capabilities through integration with local MedGemma inference server.

#### Key Features
- Symptom analysis using medical AI
- Patient record summarization
- Laboratory results interpretation
- Fallback to rule-based system when MedGemma unavailable
- Embedding generation for semantic search and similarity
- Configurable inference URL and model name

#### Main Methods
- `isMedGemmaAvailable()`: Check service availability
- `generateEmbedding(text)`: Create text embeddings
- `generateCaseEmbedding(caseData)`: Create embeddings from structured case data
- `generateMedGemmaResponse(prompt, context?)`: Generate AI response from prompt
- `analyzeSymptomsMedGemma(patientId, symptoms, duration?, severity?, additionalContext?)`: Symptom analysis
- `summarizePatientMedGemma(patientId, includeRecentOnly?)`: Patient summarization
- `interpretLabResultsMedGemma(patientId, labReportId, results, patientContext?)`: Lab interpretation

#### Development Features
- Simulated embeddings and responses when MedGemma not available
- Rule-based fallback systems for all AI functions
- Deterministic pseudo-random generation for consistent testing
- Feature-based fallback embeddings
- Warning logs when MedGemma not configured

#### Technical Implementation
- Environment variable configuration:
  - `MEDGEMMA_INFERENCE_URL`: Inference service endpoint
  - `MEDGEMMA_MODEL_NAME`: Model identifier (default: "medgemma-4b-it")
- Embedding vector size: 384 dimensions (typical for MedGemma)
- Text-to-hash conversion for deterministic generation
- Fallback embedding based on text statistics (word count, length, character distribution)

### Casegraph Service
**File**: `src/casegraph/service.ts` and related files
Manages clinical case graphs, consent tracking, provenance, and de-identification for research and care coordination.

#### Components
- **Main Service**: Case graph creation and management
- **Consent Service**: Consent tracking and management
- **Provenance Service**: Data lineage and audit trail
- **Search Service**: Search capabilities across case data
- **Deidentify Service**: Data de-identification for research use

#### Key Capabilities
- Create case graph nodes and edges (clinical events and relationships)
- Track patient journey through healthcare encounters
- Manage consent for data sharing and usage
- Maintain provenance metadata for data trustworthiness
- Enable secure data sharing for research while preserving privacy
- Support clinical decision relationship mapping

## Route Controller Layer

Each route file follows a consistent pattern:

### Structure
1. **Imports**: Express Router, database tables, Drizzle functions, auth middleware, utilities
2. **Router Initialization**: `const router = Router();`
3. **Helper Functions**: Local utilities (ID generation, formatting, etc.)
4. **Route Definitions**: HTTP method handlers with middleware
5. **Export**: `export default router;`

### Common Pattern
```typescript
router.get("/path", requireAuth, async (req, res) => {
  try {
    // Extract query params, path params, or body
    // Perform database operations using Drizzle
    // Apply business logic
    // Return JSON response
    // Create audit log if appropriate
  } catch (err) {
    // Handle errors and return appropriate error response
    res.status(500).json({ error: "internal_error", message: "Failed to..." });
  }
});
```

### Authentication
- Nearly all routes use `requireAuth` middleware
- Some routes may use `requireRole` for specific permissions
- Authenticated requests have `req.user` available with AuthUser data

### Error Handling
- Try/catch blocks around asynchronous operations
- 500 status for internal errors with generic messages
- Specific error handling for not found (404), validation (400), etc.
- Audit logging attempted before error responses where appropriate

### Response Format
- Successful responses: JSON data (varies by endpoint)
- Error responses: `{ error: "ERROR_CODE", message: "Human-readable message" }`
- Consistency: Most endpoints follow this pattern
- Audit logging: Created for significant operations using `createAuditLog`

## Audit Logging System
**File**: `src/lib/audit.ts` (inferred from usage)

### Function
- `createAuditLog(req, action, entityType, entityId, description?)`: Creates audit log entry
- Called after significant create/update/delete/view operations
- Captures: who (req.user), what (action), on what (entityType/entityId), when (timestamp), description
- Stores in audit table in database

### Usage Pattern
```typescript
await createAuditLog(req, "create", "patient", patient.id, `Created patient ${name}`);
```

## Validation System

### Zod Usage
- Imported as `zod` from workspace
- Used for request body validation in some routes
- Schema definition and parsing
- Automatic type inference from schemas

### Manual Validation
- Route-level validation for query parameters and path params
- Business logic validation (e.g., checking if ABHA is already linked)
- Format validation (e.g., Aadhaar number must be 12 digits)
- Consistency checks (e.g., dates in valid ranges)

## Middleware and Utilities

### CORS Middleware
- Applied globally to allow cross-origin requests
- Configuration not shown (likely default permissive for development)

### Body Parsing
- `express.json()`: Parses JSON request bodies
- `express.urlencoded({ extended: true })`: Parses URL-encoded form data

### Utility Functions
- Located in various service files (ID generation, formatting, etc.)
- Common patterns:
  - ID generation: Timestamp-based with random components
  - Formatting: Standardizing IDs (ABHA formatting, etc.)
  - Validation: Format and business rule checking
  - Date handling: Calculation, formatting, comparison

## Security Considerations

### Authentication
- JWT-based stateless authentication
- Token protection: HttpOnly cookies not shown (token likely stored in localStorage/frontend)
- Secret management: Hardcoded in dev, should be environment variable in prod
- Token expiration: 7 days (reasonable for healthcare application)

### Authorization
- Role-based access control (RBAC)
- Hospital-scoped data access (inferred from hospitalId filtering)
- Role-specific UI elements in frontend
- Backend enforcement of role permissions

### Data Protection
- HTTPS assumed in production (not shown in dev code)
- Password hashing (though SHA-256 is not ideal for passwords)
- Input validation to prevent injection
- Parameterized queries via Drizzle ORM (SQL injection protection)
- ABHA and sensitive health data handling

### Audit and Compliance
- Comprehensive audit logging for traceability
- Consent management for data sharing compliance
- De-identification capabilities for research use
- ABDM integration for national health ID standards

## External Integrations

### ABDM Integration
- **Purpose**: Integration with India's Ayushman Bharat Digital Mission
- **Features**: ABHA creation, verification, linking, authentication
- **Environment**: Sandbox/development mode simulation
- **Production**: Would require actual ABDM API credentials and endpoints
- **Standards**: Follows ABDM API specifications for requests/responses

### MedGemma Integration
- **Purpose**: Offline AI capabilities for medical analysis
- **Features**: Symptom analysis, patient summarization, lab interpretation
- **Deployment**: Local inference server (not cloud-dependent)
- **Environment**: Configurable URL and model name
- **Fallback**: Rule-based system ensures functionality without AI server
- **Privacy**: Data remains on-premises, no external API calls for AI processing

### Database
- **Type**: PostgreSQL (production-ready relational database)
- **ORM**: Drizzle for type safety and migration support
- **Schema**: Normalized design with appropriate relationships
- **Scalability**: Suitable for healthcare application workloads

## Error Handling and Logging

### Error Responses
Consistent error format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable descriptive message"
}
```

### Common Error Codes
- `invalid_request`: Malformed or missing request data
- `unauthorized`: Missing or invalid authentication
- `forbidden`: Authenticated but insufficient permissions
- `not_found`: Requested resource does not exist
- `internal_error`: Unexpected server error
- `conflict`: Resource conflict (e.g., duplicate unique field)

### Logging
- Console logging for development and warnings
- Error logging in catch blocks
- Audit logging for operational traceability
- No centralized logging framework shown (may be implied)

## Configuration and Environment

### Environment Variables
Inferred from code usage:
- `PORT`: Server port number
- `MEDGEMMA_INFERENCE_URL`: MedGemma service endpoint
- `MEDGEMMA_MODEL_NAME`: MedGemma model identifier
- `JWT_SECRET`: Secret for JWT token signing (should be env var)
- ABDM-related variables (inferred from config.ts):
  - Base URL, API key, HIP ID, etc.

### Configuration Files
- `src/abdm/config.ts`: ABDM service configuration
- `src/medgemma/`: Implicit configuration via environment
- No general app configuration file shown (may be in workspace root)

## Development and Deployment

### Development Scripts
**From package.json**:
- `dev`: `cross-env NODE_ENV=development tsx ./src/index.ts`
- `build`: `tsx ./build.ts`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `seed-drugs`: `tsx ./src/seed-drugs.ts`

### Production Considerations
- Environment variables for all configuration
- Proper secret management (JWT secrets, API keys)
- HTTPS termination at reverse proxy or load balancer
- Database connection pooling and optimization
- CORS restrictions for production domains
- Logging to files or external service
- Process management (PM2, Docker, Kubernetes)
- Monitoring and alerting setup
- Backup and disaster recovery procedures

### Build Process
- TypeScript compilation to JavaScript
- Likely bundling or direct execution of compiled output
- Environment-specific configuration handling
- Asset optimization (if serving static files)

## Data Flow and Integration

### Request Lifecycle
1. **HTTP Request** arrives at Express server
2. **Middleware** processes:
   - CORS headers
   - Body parsing (JSON/URL-encoded)
3. **Routing** matches path to controller
4. **Authentication** middleware validates token
5. **Controller** executes business logic:
   - Parameter extraction and validation
   - Database operations via Drizzle ORM
   - Service layer interactions (ABDM, MedGemma, etc.)
   - Audit log creation
6. **Response** formatting and sending
7. **Error Handling** catches exceptions and formats error responses

### Service Interaction Patterns
- **Controllers** orchestrate requests
- **Services** encapsulate external integration logic
- **Database** accessed through Drizzle ORM throughout
- **Utilities** provide cross-cutting concerns (auth, audit, formatting)
- **Audit Logging** decorates significant operations

### External API Interactions
- **ABDM**: HTTP calls to government health ID infrastructure
- **MedGemma**: HTTP calls to local inference server
- **Both** wrapped in service classes with fallback implementations
- **Error handling** for network failures and service unavailability

## Scalability and Performance Considerations

### Database Optimization
- Proper indexing on queried fields (inferred from schema)
- Efficient joins and query patterns
- Pagination for large result sets
- Connection pooling (managed by deployment environment)

### Caching Opportunities
- React Query on frontend handles client-side caching
- Potential for server-side caching of expensive operations
- MedGemma response caching could be implemented
- Frequently accessed reference data (hospitals, drugs) could be cached

### Horizontal Scaling
- Stateless design facilitates horizontal scaling
- JWT tokens enable stateless authentication
- Shared database as central state
- File uploads would need shared storage solution
- Local MedGemma service would need deployment strategy

### Performance Optimization
- Async/await for non-blocking I/O
- Parallel execution where appropriate (Promise.all)
- Efficient database queries
- Minimal middleware overhead
- JSON serialization optimized for typical payloads

## Testing and Quality Assurance

### Testing Approach (Inferred)
- Unit tests for utility functions and services
- Integration tests for route controllers
- End-to-end tests for critical user journeys
- Mocking of external services (ABDM, MedGemma)
- Database testing with transactions or test containers
- Validation of error handling and edge cases

### Code Quality
- TypeScript for static type checking
- Consistent code formatting (implied by Prettier/ESlint)
- Modular organization separating concerns
- Documentation via comments and README files
- Error handling patterns consistent throughout

## Future Enhancement Areas

### Security Improvements
- Implement proper password hashing (bcrypt/scrypt)
- Add rate limiting to prevent abuse
- Implement token refresh mechanism
- Add request/response logging for audit trails
- Implement CSRF protection for state-changing operations
- Add security headers (Helmet.js or equivalent)
- Regular dependency security scanning

### Functional Enhancements
- Add file upload capability for medical documents
- Implement scheduled jobs for data cleanup/maintenance
- Add export functionality for reports and data
- Implement webhooks for external system notifications
- Add multilingual support for international deployment
- Enhance search capabilities with full-text search
- Add advanced analytics and reporting features
- Implement data export standards (FHIR, HL7) for interoperability

### Technical Improvements
- Add OpenAPI/Swagger documentation for API exploration
- Implement API versioning strategy
- Add health check endpoints for monitoring
- Implement circuit breaker pattern for external dependencies
- Add feature flags for gradual rollouts
- Implement request tracing for distributed systems
- Add metrics collection (Prometheus/Grafana)
- Implement database connection pooling monitoring
- Add structured logging with levels and contexts

### DevOps Improvements
- Implement CI/CD pipeline for automated testing and deployment
- Add containerization (Docker) for consistent deployment
- Implement infrastructure as code (Terraform/CDK)
- Add blue-green or canary deployment capabilities
- Implement comprehensive monitoring and alerting
- Add chaos engineering for resilience testing
- Implement backup validation and disaster recovery drills

---
*This backend reference is generated from the actual codebase and represents the current state of the Chikit backend application. For the most up-to-date information, always refer to the source code and run the application locally to verify behavior and test API endpoints.*