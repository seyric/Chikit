# Repository Inventory

This document provides an inventory of the Chikit repository structure, highlighting key directories, files, and their purposes.

## Root Level

- `.env` - Environment variables (not tracked, see example)
- `.gitignore` - Git ignore rules
- `package.json` - Root package.json for pnpm workspace
- `pnpm-workspace.yaml` - PNPM workspace configuration
- `README.md` - Project overview and setup instructions
- `CLAUDE.md` - User-specific Claude Code instructions
- `RTK.md` - Rust Token Killer (token optimization) instructions
- `scripts/` - Development and utility scripts
- `attached_assets/` - Static assets (CSV files for data import, etc.)

## Directories

### `artifacts/`
Contains the two main applications:

#### `artifacts/api-server/`
Backend API server (Node.js, Express, TypeScript, Drizzle ORM)
- `src/` - Source code
  - `lib/` - Shared services and utilities
    - `auth.ts` - Authentication utilities (JWT, password hashing, etc.)
    - `audit.js` - Audit logging
    - `digi-locker-service.ts` - DigiLocker connection and document retrieval (simulated)
    - `identity-verification-service.ts` - Identity verification (Aadhaar, etc.) - *to be created*
    - `patient-identity-service.ts` - Patient registration and duplicate resolution
    - `abdm/service.ts` - ABDM/ABHA integration service
    - `verification-provider.ts` - Provider abstraction for Aadhaar verification - *to be created*
    - `consent-service.ts` - Consent management - *to be created*
  - `middlewares/` - Express middleware
    - `hospitalResolution.ts` - Hospital tenancy middleware (resolves hospital from hostname/header)
    - `auth.js` - Authentication middleware (JWT verification)
    - `requireAuth.js` - Route protection middleware
  - `routes/` - API route handlers
    - `auth.ts` - Authentication endpoints (login, register, OTP, Google)
    - `patient-auth.ts` - Patient-specific authentication endpoints - *to be created*
    - `patient-registration.ts` - Patient registration endpoints - *to be created*
    - `hospitals.ts` - Hospital CRUD and import endpoints
    - `abdm.ts` - ABDM/ABHA integration endpoints
    - `identity-verification.ts` - Identity verification endpoints (Aadhaar, etc.) - *to be created*
    - `digi-locker.ts` - DigiLocker connection endpoints - *to be created*
    - `consent.ts` - Consent management endpoints - *to be created*
    - `index.ts` - Main API router aggregation
  - `express.d.ts` - Module augmentation for Express Request (adds `hospital` property)
  - `server.ts` - Server entry point

#### `artifacts/chikit/`
Frontend web application (React, Vite, TypeScript)
- `src/` - Source code
  - `pages/` - Page components (routes)
    - `register.tsx` - Registration page (choose role: patient, doctor, staff)
    - `register-patient.tsx` - Patient registration form - *to be created/reviewed*
    - `login.tsx` - Login page
    - `dashboard.tsx` - Dashboard (hospital-specific)
    - `patient-register.tsx` - Patient registration wizard - *to be created*
  - `components/` - Reusable UI components
    - `registration-wizard.tsx` - Multi-step registration wizard - *to be created*
    - `aadhaar-verification.tsx` - Aadhaar verification component - *to be created*
    - `digi-locker-connection.tsx` - DigiLocker connection component - *to be created*
    - `consent-modal.tsx` - Consent presentation component - *to be created*
    - `auth/` - Authentication-related components
    - `layout/` - Layout components (header, footer, sidebar)
  - `hooks/` - Custom React hooks
    - `use-patient-registration.tsx` - Hook for patient registration logic - *to be created*
    - `use-auth.tsx` - Authentication hook
    - `use-hospital.ts` - Hospital context hook
  - `lib/` - Frontend utilities and services
    - `api.ts` - API client wrapper
    - `auth.ts` - Frontend authentication helpers
    - `hospital.ts` - Hospital-related utilities
  - `styles/` - CSS/Tailwind configuration
  - `assets/` - Images, icons, etc.
  - `main.tsx` - Application entry point

### `lib/`
Shared libraries and database schema
- `db/` - Database schema and ORM configuration
  - `src/` - Drizzle ORM schema definitions
    - `schema/` - Individual table definitions
      - `hospitals.ts` - Hospitals table (id, name, slug, address, etc.)
      - `patients.ts` - Patients table (patientCode, chikitHealthId, name, dob, etc.)
      - `users.ts` - Users table (id, email, passwordHash, role, hospitalId, etc.)
      - `appointments.ts` - Appointments table
      - `medical_records.ts` - Medical records table
      - `lab_reports.ts` - Lab reports table
      - `prescriptions.ts` - Prescriptions table
      - `consent_management.ts` - Research consent table
      - `identity-verification-consent.ts` - Identity verification consent table - *to be created*
      - `patient-verification-attempts.ts` - Verification attempt logging table - *to be created*
      - `digi-locker-connections.ts` - DigiLocker connection metadata table - *to be created*
      - `abha-verifications.ts` - ABHA verification table - *to be reviewed*
      - `index.ts` - Barrel export of all schema tables
    - `index.ts` - Database connection and Drizzle instance
- `services/` - Shared business logic (if any)
- `utils/` - Utility functions (logging, encryption, etc.)
- `types/` - Shared TypeScript interfaces and types

## Key Observations

1. **Multi-tenancy**: Hospital tenancy is implemented via middleware (`hospitalResolution.ts`) that resolves hospital from subdomain (`X-Hospital-Slug` header or hostname) and attaches to `req.hospital`.

2. **Authentication**: Supports email/password, OTP, and Google OAuth. Patient registration is currently handled via the general `/auth/register` endpoint but needs to be extended for patient-specific flows.

3. **Patient Identity**: Existing `patients` table includes fields for `patientCode`, `chikitHealthId`, `abhaNumber`, and verification timestamps. The `patient-identity-service.ts` provides duplicate detection and patient creation.

4. **Simulated Services**: Some services (e.g., DigiLocker) are currently simulated with mock data and lack real integration.

5. **Missing Components**: Several components mentioned in the plan (consent service, verification provider, identity verification service, specific routes) are not yet present and need to be created.

6. **TypeScript Issues**: Current codebase has TypeScript compilation errors due to missing imports, incorrect types, and missing properties on Request objects (e.g., `hospital` property). These have been partially addressed but need verification.

## Next Steps for Inventory

This inventory will be used as a reference during the audit of each problem statement. We will now proceed to examine each problem statement in detail, referencing this inventory to locate relevant files and identify gaps.
