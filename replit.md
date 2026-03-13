# Chikit - AI Medical ERP

## Overview

Chikit is an offline-first AI medical assistant and multi-hospital ERP system designed for doctors, hospitals, and patients, with focus on rural/limited-connectivity environments.

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
└── scripts/                # Utility scripts
```

## Key Features

1. **Patient Management** - Full CRUD, lifelong medical history, patient timelines
2. **AI Clinical Decision Support** - Symptom analysis, patient summaries, lab interpretation
3. **Multi-Hospital ERP** - Hospital and doctor management across facilities
4. **Medical Records** - Visit records, vital signs, diagnoses, treatment plans
5. **Lab Reports** - Upload and AI interpretation of laboratory results
6. **Radiology Reports** - Imaging studies (X-ray, MRI, CT, ultrasound etc.)
7. **E-Prescriptions** - Digital prescriptions with medication details, printable
8. **Appointment Scheduling** - Book, manage, and track appointments
9. **Role-Based Access Control** - Admin, Doctor, Nurse, Patient roles
10. **Audit Logs** - Complete audit trail of all medical record access

## Demo Credentials

- **Admin**: admin@chikit.health / admin123
- **Doctor**: dr.sharma@chikit.health / doctor123

## API Routes

All routes are under `/api/`:
- `/auth/login`, `/auth/register`, `/auth/me` - Authentication
- `/hospitals` - Hospital management
- `/doctors` - Doctor management
- `/patients` - Patient management (+ `/patients/:id/timeline`)
- `/appointments` - Appointment scheduling
- `/medical-records` - Medical records
- `/lab-reports` - Lab reports
- `/radiology-reports` - Radiology
- `/prescriptions` - E-prescriptions
- `/ai/analyze-symptoms` - AI symptom analysis
- `/ai/summarize-patient` - AI patient summary
- `/ai/interpret-lab` - AI lab interpretation
- `/ai/results` - AI analysis history
- `/audit-logs` - Audit trail
- `/stats/dashboard` - Dashboard statistics

## Security

- JWT tokens (base64 + HMAC-SHA256 signature)
- SHA-256 password hashing with salt
- All medical record access logged to audit trail
- Role-based access control enforced at route level

## Database Tables

- `users` - System users with roles
- `hospitals` - Hospital facilities
- `doctors` - Doctor profiles linked to users + hospitals
- `patients` - Patient registry with medical info
- `appointments` - Appointment scheduling
- `medical_records` - Clinical visit records
- `lab_reports` - Laboratory test results
- `radiology_reports` - Imaging studies
- `prescriptions` - E-prescriptions with medications
- `ai_analysis_results` - AI decision support results
- `audit_logs` - Full audit trail

## Development

```bash
# Run API server
pnpm --filter @workspace/api-server run dev

# Run frontend
pnpm --filter @workspace/chikit run dev

# Push DB schema changes
pnpm --filter @workspace/db run push

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```
