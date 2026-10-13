# Chikit by Solar - Product Overview

## System Architecture Overview

Chikit by Solar is a modular healthcare platform built using a monorepo architecture with pnpm workspace management. The system consists of several interconnected subsystems that work together to provide a comprehensive healthcare solution.

### High-Level Components

1. **Backend API Server** (`artifacts/api-server/`)
   - Built with Node.js, Express, and TypeScript
   - Exposes RESTful APIs for all healthcare functionalities
   - Implements business logic, data validation, and integration services
   - Uses Drizzle ORM for PostgreSQL database interactions

2. **Frontend Application** (`artifacts/chikit/`)
   - Built with React, Vite, and TypeScript
   - Provides user interfaces for patients, providers, and administrators
   - Uses Tailwind CSS for styling and responsive design

3. **Shared Libraries** (`lib/`)
   - Database schemas and ORM configurations (`lib/db/`)
   - API client libraries (`lib/api-client-react/`)
   - API specifications (`lib/api-spec/`)
   - API validation schemas (`lib/api-zod/`)

4. **Integration Services**
   - ABDM/ABHA integration service
   - MedGemma offline AI integration service
   - Hospital management and registration systems

5. **Utility Scripts** (`scripts/`)
   - Data import utilities (e.g., hospital CSV import)
   - Deployment and operational scripts

### Subsystem Interaction

The Chikit platform follows a layered architecture where:

1. **Presentation Layer**: React frontend components interact with users
2. **API Layer**: Express routes handle HTTP requests and responses
3. **Service Layer**: Business logic implementations (ABDM, MedGemma, etc.)
4. **Data Layer**: Drizzle ORM models and database operations
5. **Integration Layer**: External service connections (ABDM APIs, MedGemma inference server)

### Data Flow Example

When a patient links their ABHA to their Chikit record:

1. **Frontend**: User enters ABHA number and initiates linking process
2. **API Route**: `/api/abha/link/:patientId` receives the request
3. **Auth Middleware**: Verifies user authentication and permissions
4. **ABDM Service**: Processes the linking request through ABDM APIs
5. **Database**: Updates patient record with ABHA information
6. **Audit Log**: Creates audit trail entry for the linking operation
7. **Response**: Returns success/failure to frontend for user feedback

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Validation**: Zod
- **Package Manager**: pnpm

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context/Hooks (inferred from structure)
- **HTTP Client**: Custom API client or fetch/axios

### Infrastructure
- **Containerization**: Docker support (inferred from documentation)
- **AI Inference**: Local MedGemma server (Hugging Face TGI, llama.cpp, or Transformers)
- **External APIs**: ABDM sandbox/production endpoints

## Key Features by Subsystem

### 1. Patient Management
- Patient registration and profile management
- ABHA linking and verification
- Longitudinal health record maintenance
- Consent management for data sharing

### 2. Clinical Documentation
- AI-assisted symptom analysis
- Patient record summarization
- Laboratory and radiology interpretation
- Clinical note generation and management

### 3. Hospital & Facility Management
- Multi-hospital patient record scoping
- Hospital directory import and management
- Resource and capacity tracking
- Staff assignment and role management

### 4. Appointment & Workflow Management
- Appointment scheduling and tracking
- Encounter and visit management
- Prescription and medication tracking
- Laboratory and imaging order management

### 5. Administrative & Reporting
- Audit logging and compliance tracking
- User and role management
- Configuration and settings management
- Operational reporting and analytics

### 6. Integration & Interoperability
- ABDM/ABHA integration for national health ID
- MedGemma offline AI for clinical decision support
- FHIR-compatible data structures (planned/in progress)
- Consent management for health information exchange

## Deployment Architecture

The platform supports multiple deployment configurations:

### Development
- Local development with hot reloading
- Sandbox mode for ABDM integration
- Fallback to rule-based AI when MedGemma unavailable
- SQLite or local PostgreSQL for database

### Production
- Containerized deployment (Docker/Kubernetes)
- Production ABDM credentials
- GPU-accelerated MedGemma inference server
- Managed PostgreSQL database
- Load balancing and horizontal scaling
- SSL/TLS termination and security hardening

## Security Model

### Authentication & Authorization
- JWT-based authentication for API access
- Role-based access control (RBAC) for resource permissions
- Hospital-scoped data access for multi-tenancy
- Session management and timeout handling

### Data Protection
- Encryption at rest for sensitive data (where implemented)
- Transport layer security (HTTPS) for all communications
- Input validation and sanitization to prevent injection attacks
- Secure handling of credentials and secrets via environment variables
- Audit logging for all sensitive operations

### Privacy Compliance
- Patient consent management for data sharing
- Data minimization principles
- Right to access and delete personal data
- Compliance with healthcare data protection regulations

## Scalability & Performance

### Horizontal Scaling
- Stateless API services suitable for load balancing
- Database read replicas for query distribution
- Caching strategies for frequently accessed data
- Asynchronous processing for non-critical operations

### Performance Optimizations
- Database indexing for common query patterns
- Pagination for large dataset handling
- Efficient serialization/deserialization of API responses
- Optimized AI inference through local processing
- Batched operations for bulk data imports

## Monitoring & Observability

### Logging
- Structured logging for debugging and auditing
- Error tracking and exception handling
- Performance logging for slow operations
- Security event logging for anomaly detection

### Metrics
- API response time and throughput monitoring
- Database query performance tracking
- AI inference latency and availability
- Resource utilization (CPU, memory, disk, network)

### Health Checks
- Service readiness and liveness probes
- External dependency availability (ABDM, MedGemma, database)
- Background job and queue status monitoring

## Extensibility & Customization

### Plugin Architecture
- Modular service design for easy extension
- Configuration-driven behavior through environment variables
- Clear separation of concerns between components
- Well-defined interfaces for internal and external integrations

### Configuration Management
- Environment-based configuration for deployment flexibility
- Feature flags for gradual rollouts
- Centralized configuration management
- Schema validation for configuration integrity

## Limitations & Constraints

### Current Implementation Constraints
- MedGemma inference server requires separate deployment and GPU resources
- ABDM integration requires official credentials for production use
- Some advanced features (FHIR, consent management) are planned but not fully implemented
- Offline capabilities depend on local device storage and processing power

### Known Limitations from Code Inspection
- Fallback mechanisms ensure functionality but may reduce AI capabilities
- Environment-specific behavior (sandbox vs production) requires careful configuration
- Database migrations and schema evolution need to be managed carefully
- Frontend-backend contract stability depends on API versioning practices

## Roadmap Alignment

The current implementation aligns with the foundational phases of the Chikit implementation strategy:
- ✅ Phase A: Foundation (ABDM, AI, Hospital systems)
- 🔜 Phase B: EMR and clinical workflows enhancement
- 🔜 Phase C: FHIR, consent, and health information exchange
- 🔜 Phase D: Hospital ERP and operational systems
- 🔜 Phase E: Laboratory, pharmacy, billing, and insurance
- 🔜 Phase F: Patient portal and engagement tools
- 🔜 Phase G: Offline synchronization and local AI enhancement
- 🔜 Phase H: Analytics, reporting, and security hardening
- 🔜 Phase I: Testing, documentation, and deployment readiness

This foundation enables progressive enhancement while maintaining system stability and data integrity.