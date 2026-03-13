# Chikit - AI Medical ERP

## Overview

Chikit is an offline-first AI medical assistant and multi-hospital ERP system designed for doctors, hospitals, and patients, with focus on rural/limited-connectivity environments. Built for India with support for 30,000+ hospitals, Chikit Health IDs, government ID verification, and consent-based cross-hospital record access.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Frontend state**: React Query + Context API
- **Routing**: Wouter
- **Charts**: Recharts

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── chikit/             # React + Vite frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/
    └── import-hospitals.mjs  # CSV import script for national hospital registry
```

## Key Features (Completed)

### Task #1 — Auth, Portals, Theme (DONE)
1. **Medical Green Theme** — HSL 142/152, dual portal login (Staff/Patient)
2. **3-Step Auth Flow** — portal → method → form (Email/OTP/Google)
3. **OTP Backend** — `otp_codes` table, send/verify endpoints
4. **Patient Portal** — standalone layout at `/patient-portal`
5. **Role-Based Navigation** — lab_tech, pharmacist, receptionist, nurse, doctor, admin

### Task #2 — Hospital Directory, Chikit Health ID, Consent (DONE)
1. **National Hospital Registry** — 29,774 hospitals imported from CSV (30,274 rows)
   - Searchable, filterable by state/category, paginated (20/page)
   - Hospital Directory page at `/hospitals`
2. **Chikit Health ID** — Auto-generated `CHK-YYYY-XXXXXX` format on patient registration
3. **Patient Registration Flow** — Full form at `/patients/register` with govt ID verification
4. **Patients Page** — Updated with Chikit ID column, links to registration page
5. **Consent Requests** — `consent_requests` table + CRUD API endpoints
   - Doctor requests access → patient approves/denies
   - 7-day expiry window, access scope controls

### Task #4 — Drug Database & Prescription Integration (DONE)
1. **Drug Database** — 143 Indian medicines seeded (drugs table)
   - Drug search API: `GET /api/drugs?q=&limit=` (searches name, genericName, brandNames, drugClass)
   - Interaction check API: `POST /api/drugs/check-interactions` (accepts drugNames array)
   - Drug Database page at `/drug-database` with search, filters, and drug info cards
2. **Prescription Autocomplete** — DrugSearchInput component in patient consultation
   - Live search dropdown when typing drug name, auto-fills dosage on selection
   - Real-time interaction checking when drugs are selected
   - Warning banner displayed in prescription panel for known interactions
3. **Patient Overview Alerts** — Active prescription drug interactions shown as red alert banner

## Demo Credentials

- **Admin**: admin@chikit.health / admin123
- **Doctor**: dr.sharma@chikit.health / doctor123

## API Routes

All routes are under `/api/`:
- `/auth/login`, `/auth/register`, `/auth/me`, `/auth/send-otp`, `/auth/verify-otp` — Authentication
- `/hospitals` — Hospital management (search/filter/paginate)
- `/hospitals/import` — Bulk import from CSV (POST)
- `/hospitals/states` — List of states
- `/doctors` — Doctor management
- `/patients` — Patient management with Chikit Health ID
- `/patients/lookup` — Lookup by healthId, phone, or govtId
- `/patients/:id/timeline` — Complete patient history
- `/appointments` — Appointment scheduling
- `/medical-records` — Medical records
- `/lab-reports` — Lab reports
- `/radiology-reports` — Radiology
- `/prescriptions` — E-prescriptions
- `/ai/analyze-symptoms` — AI symptom analysis
- `/ai/summarize-patient` — AI patient summary
- `/ai/interpret-lab` — AI lab interpretation
- `/ai/results` — AI analysis history
- `/audit-logs` — Audit trail
- `/stats/dashboard` — Dashboard statistics
- `/consent-requests` — Cross-hospital consent management (GET, POST, PATCH)
- `/drugs?q=&limit=` — Drug search (GET)
- `/drugs/check-interactions` — Drug interaction check (POST, body: { drugNames: string[] })

## Security

- JWT tokens (base64 + HMAC-SHA256 signature)
- SHA-256 password hashing with salt
- All medical record access logged to audit trail
- Role-based access control enforced at route level
- Auth token auto-added via global `window.fetch` interceptor in auth.tsx

## Database Tables

- `users` — System users with roles
- `hospitals` — Hospital facilities (29,774 from national registry; columns: district, pincode, category, careType, discipline, specialties, numDoctors, bedCount, sourceId)
- `doctors` — Doctor profiles linked to users + hospitals
- `patients` — Patient registry (columns: chikitHealthId, govtIdType, govtIdNumber)
- `appointments` — Appointment scheduling
- `medical_records` — Clinical visit records
- `lab_reports` — Laboratory test results
- `radiology_reports` — Imaging studies
- `prescriptions` — E-prescriptions with medications
- `ai_analysis_results` — AI decision support results
- `audit_logs` — Full audit trail
- `otp_codes` — OTP verification codes
- `consent_requests` — Cross-hospital consent requests (patientId, requestingDoctorId, status, expiresAt)
- `drugs` — Drug database (143 Indian medicines: name, genericName, brandNames, drugClass, strength, interactions, contraindications, sideEffects, pregnancyRisk)

## Important Notes

- **Auth Pattern**: Do NOT use `token` from `useAuth()` — it's not exposed. Use `enabled: !!user` and rely on the global fetch interceptor to add Bearer tokens.
- **DB Schema changes**: Use raw SQL `ALTER TABLE` instead of `drizzle-kit push` for interactive-prompt columns. For schema sync after raw SQL: check `lib/db/src/schema/*.ts` files.
- **Hospital Import**: Use `node scripts/import-hospitals.mjs` for re-import. Has unique constraint on `source_id` to prevent duplicates.
- **Chikit Health ID**: Format `CHK-YYYY-XXXXXX`, generated in `routes/patients.ts:generateChikitHealthId()`

## Development

```bash
# Run API server
pnpm --filter @workspace/api-server run dev

# Run frontend
pnpm --filter @workspace/chikit run dev

# Push DB schema changes (interactive)
pnpm --filter @workspace/db run push

# Import hospital registry (30k+ hospitals)
node scripts/import-hospitals.mjs

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```
