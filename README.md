# Chikit Healthcare ERP Platform

## 🏥 Project Overview

Chikit is an offline-first AI medical assistant and multi-hospital healthcare ERP platform designed to streamline healthcare operations, improve patient care, and facilitate seamless communication between hospitals, doctors, patients, and administrative staff. The platform integrates advanced AI capabilities with comprehensive hospital management features to create a unified healthcare ecosystem.

## 📸 Live Virtual Hospital Demo (AIIMS Jodhpur)

| 1. Universal Portal Selection | 2. Multi-Method Staff Authentication |
| :---: | :---: |
| ![Portal Selection](docs/demo-screenshots/01_portal_selection.png) | ![Staff Auth](docs/demo-screenshots/02_staff_auth_methods.png) |

| 3. Staff Credentials Sign-In | 4. AIIMS Jodhpur Virtual Control Center |
| :---: | :---: |
| ![Credentials Login](docs/demo-screenshots/03_staff_credentials_login.png) | ![AIIMS Jodhpur Dashboard](docs/demo-screenshots/04_aiims_jodhpur_command_center.png) |

## 👥 Team Members

- **Aayush Lakhara** - Full Stack Development & System Architecture
- **Tarnnum Khan** - Frontend Development & UI/UX Design
- **Siddhant Patil** - Backend Development & API Integration

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **State Management**: React Query (TanStack Query)
- **UI Components**: Radix UI primitives, Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Notifications**: Sonner
- **Date Handling**: date-fns
- **HTTP Client**: Fetch API / React Query

### Backend (Server)
- **Runtime**: Node.js v24.x
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (development: SQLite)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt hashing
- **Validation**: Zod
- **HTTP Utilities**: cross-env, tsx
- **API Documentation**: RESTful API design

### Development Tools
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier
- **Type Checking**: TypeScript
- **Build Tool**: Vite (frontend), esbuild (backend)
- **Version Control**: Git/GitHub

## ✨ Key Features

### Core Functionalities
- **Multi-Hospital Architecture**: Secure data isolation between hospitals
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for different user types
- **Offline-First Design**: Core functionality available without internet connectivity
- **AI-Powered Assistance**: Integrated AI features for clinical decision support
- **Comprehensive Audit Logging**: Full traceability of all system actions
- **Real-Time Updates**: Live data synchronization where applicable

### User Roles & Permissions
- **Admin**: Full system access (user management, hospital configuration, reporting)
- **Doctor**: Patient management, prescriptions, medical records, appointments
- **Nurse**: Patient care tasks, vitals monitoring, medication administration
- **Pharmacist**: Pharmacy inventory, prescription dispensing, drug interactions
- **Lab Technician**: Test ordering, result entry, laboratory workflow
- **Receptionist**: Appointment scheduling, patient registration, front desk operations
- **Patient**: Personal health portal, appointment booking, medical records access
- **Government Authority**: Limited oversight for regulatory compliance

### Implemented Features (Latest Sprint)
- **Patient Search Endpoint**: Efficient backend search with pagination (`/api/patients/search`)
- **Patient Summary API**: Concise Two-Minute Doctor view (`/api/patients/:id/summary`)
- **PatientSummary React Component**: Unified patient overview interface
- **Integrated Summary Tab**: Easy access to patient summary in detail views
- **Role-Based Navigation**: Dynamic menu generation based on user permissions
- **Authentication System**: Multi-factor authentication (email/password, OTP, Google OAuth, ABHA)

## 📋 Setup Instructions

### Prerequisites
- Node.js v20+ (v24 recommended)
- pnpm v8+ (comes with Node.js v20+)
- PostgreSQL v14+ (for production) or SQLite (for development)
- Git v2.30+

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/seyric/Chikit.git
   cd Chikit
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   Copy the example environment file and configure as needed:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3100
   
   # Database Connection (Development)
   DATABASE_URL="sqlite:///./dev.db"
   
   # Database Connection (Production - PostgreSQL Example)
   # DATABASE_URL="postgresql://username:password@localhost:5432/chikit_db"
   
   # JWT Security
   JWT_SECRET=your_jwt_secret_here_change_in_production
   
   # ABDM Configuration (Optional)
   ABDM_BASE_URL=https://abha.abdm.gov.in
   ABDM_API_KEY=your_abdm_api_key_here
   ABDM_API_SECRET=your_abdm_api_secret_here
   
   # MedGemma Offline AI Configuration (Optional)
   MEDGEMMA_INFERENCE_URL=http://localhost:8000
   MEDGEMMA_MODEL_NAME=medgemma-4b-it
   ```

4. **Initialize Database (Development)**
   The SQLite database will be created automatically on first server start.
   For PostgreSQL, ensure the database exists and run migrations:
   ```bash
   # For PostgreSQL production setup
   pnpm db:push  # or your preferred migration command
   ```

5. **Start Development Servers**
   ```bash
   # In one terminal - Backend API
   pnpm dev:api
   
   # In another terminal - Frontend Application
   pnpm dev:web
   ```
   
   Or use the concurrent script:
   ```bash
   pnpm dev  # starts both servers
   ```

### Alternative: Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:5175
# Backend API: http://localhost:3100
```

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/login` | Authenticate user (email/password) | No |
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/send-otp` | Send OTP for phone verification | No |
| `POST` | `/api/auth/verify-otp` | Verify OTP code | No |
| `POST` | `/api/auth/google` | Google OAuth authentication | No |
| `GET` | `/api/auth/me` | Get current user profile | Yes |

### Patient Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/patients/search` | Search patients with pagination, filtering, and sorting | Yes |
| `GET` | `/api/patients/:id` | Get patient by ID | Yes |
| `GET` | `/api/patients/:id/summary` | Get patient summary (Two-Minute Doctor feature) | Yes |
| `POST` | `/api/patients` | Create new patient record | Yes |
| `PUT` | `/api/patients/:id` | Update patient record | Yes |
| `DELETE` | `/api/patients/:id` | Delete patient record | Yes |

### Hospital & Staff Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/hospitals` | List hospitals (admin only) | Yes + Admin |
| `POST` | `/api/hospitals` | Create new hospital | Yes + Admin |
| `GET` | `/api/staff` | List hospital staff | Yes |
| `POST` | `/api/staff` | Add new staff member | Yes |

### Appointments
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/appointments` | List appointments with filtering | Yes |
| `POST` | `/api/appointments` | Create new appointment | Yes |
| `PUT` | `/api/appointments/:id` | Update appointment | Yes |
| `DELETE` | `/api/appointments/:id` | Delete appointment | Yes |

### Medical Records
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/medical-records/:patientId` | Get patient's medical records | Yes |
| `POST` | `/api/medical-records` | Create new medical record | Yes |
| `GET` | `/api/lab-reports/:patientId` | Get patient's lab reports | Yes |
| `POST` | `/api/lab-reports` | Create new lab report | Yes |

### Prescriptions
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/prescriptions/:patientId` | Get patient's prescriptions | Yes |
| `POST` | `/api/prescriptions` | Create new prescription | Yes |
| `PUT` | `/api/prescriptions/:id` | Update prescription | Yes |
| `DELETE` | `/api/prescriptions/:id` | Delete prescription | Yes |

## 🗂️ Project Structure

```
Chikit/
├── .claude/                    # Claude Code configurations and skills
├── artifacts/
│   ├── api-server/             # Backend API server
│   │   ├── src/
│   │   │   ├── lib/            # Backend utilities and services
│   │   │   │   ├── auth.ts             # Authentication middleware and utilities
│   │   │   │   ├── patient-identity-service.ts   # Patient identity management
│   │   │   │   ├── digi-locker-service.ts        # DigiLocker integration
│   │   │   │   ├── verification-provider.ts      # Aadhaar verification abstraction
│   │   │   │   └── consent-service.ts            # Consent management
│   │   │   ├── routes/         # API route definitions
│   │   │   │   ├── auth.ts             # Authentication routes
│   │   │   │   ├── patient-registration.ts       # Patient registration flows
│   │   │   │   ├── patient-auth.ts           # Patient-specific authentication
│   │   │   │   ├── identity-verification.ts    # Identity verification endpoints
│   │   │   │   ├── patients.ts             # Patient management (search, summary)
│   │   │   │   └── hospitals.ts            # Hospital management
│   │   │   ├── index.ts              # Server entry point
│   │   │   └── build.ts              # Build script
│   │   ├── tsconfig.json             # TypeScript configuration
│   │   └── package.json              # Backend dependencies
│   └── chikit/                   # Frontend application
│       ├── src/
│       │   ├── components/         # Reusable UI components
│       │   │   ├── layout.tsx              # Application layout with role-based navigation
│       │   │   └── PatientSummary.tsx      # Two-Minute Doctor patient summary component
│       │   ├── pages/              # Page components
│       │   │   ├── login.tsx                 # Authentication page
│       │   │   ├── register.tsx            # User registration page
│       │   │   ├── patient-portal.tsx      # Patient-specific interface
│       │   │   ├── doctors.tsx             # Doctor dashboard
│       │   │   ├── medical-records.tsx     # Medical records view
│       │   │   └── ai-assistant.tsx        # AI assistant interface
│       │   ├── lib/                  # Frontend utilities and hooks
│       │   │   ├── auth.tsx                # Authentication context and utilities
│       │   │   ├── demoData.ts             # Demo data for development
│       │   │   └── demoInterceptor.ts      # Request/response interceptors
│       │   ├── App.tsx                 # Main application component
│       │   └── main.tsx                # Application entry point
│       ├── index.html                # HTML template
│       ├── tsconfig.json             # TypeScript configuration
│       ├── vite.config.ts            # Vite configuration with API proxy
│       └── package.json              # Frontend dependencies
├── .env.example                    # Example environment variables
├── .gitignore                      # Git ignore rules
├── pnpm-workspace.yaml             # PNPM workspace configuration
└── package.json                    # Root package.json
```

## 🔐 Authentication System

Chikit implements a secure JWT-based authentication system with multiple factors:

### Login Methods
1. **Email/Password**: Traditional authentication with demo credentials
2. **Phone OTP**: One-time password sent via SMS (demo mode returns OTP in response)
3. **Google OAuth**: Sign-in with Google account (simulated in development)
4. **ABHA Authentication**: Ayushman Bharat Health Account integration (sandbox mode)

### Token Management
- JWT tokens stored in httpOnly cookies and localStorage
- Automatic token refresh mechanism
- Secure token transmission via HTTPS in production
- Role and permissions embedded in JWT payload

### Role-Based Access Control (RBAC)
- Middleware: `requireAuth()` and `requireRole(...)`
- Roles validated on every protected route
- Hospital-scoped data access (users only see data from their assigned hospital)
- Separate API namespaces for staff (`/api/*`) and patient (`/patient-auth/*`) flows

### Demo Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin@chikit.health` | `admin123` |
| Doctor | `dr.sharma@chikit.health` | `doctor123` |
| *(Register new users via the registration page)* | | |

## ⚙️ Environment Variables

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port number | `3100` |
| `DATABASE_URL` | Database connection string | `sqlite:///./dev.db` |
| `JWT_SECRET` | Secret for JWT signing | `your_strong_secret_here` |

### Optional Features
| Variable | Description | Example |
|----------|-------------|---------|
| `ABDM_BASE_URL` | ABDM API base URL | `https://abha.abdm.gov.in` |
| `ABDM_API_KEY` | ABDM API key | `your_key_here` |
| `ABDM_API_SECRET` | ABDM API secret | `your_secret_here` |
| `ABDM_HIP_ID` | Health Provider ID | `your_hip_id` |
| `MEDGEMMA_INFERENCE_URL` | MedGemma inference server URL | `http://localhost:8000` |
| `MEDGEMMA_MODEL_NAME` | MedGemma model variant | `medgemma-4b-it` |

### Development vs Production
- **Development**: Uses SQLite database, enables debug features, uses demo credentials
- **Production**: Requires PostgreSQL, strong JWT secret, proper SSL/TLS configuration

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Install dependencies (first time only)
pnpm install

# Start both servers concurrently
pnpm dev

# Or start individually:
# Terminal 1: Backend API
pnpm dev:api

# Terminal 2: Frontend Application
pnpm dev:web
```

The application will be available at:
- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:3100
- **API Documentation**: http://localhost:3100/api-docs (if enabled)

### Production Build
```bash
# Build frontend for production
pnpm build:web

# Build backend for production
pnpm build:api

# Start production servers
pnpm start
```

### Environment-Specific Scripts
| Script | Description |
|--------|-------------|
| `pnpm dev` | Start both servers in development mode |
| `pnpm dev:api` | Start only the backend API server |
| `pnpm dev:web` | Start only the frontend development server |
| `pnpm build:web` | Build frontend for production |
| `pnpm build:api` | Build backend for production |
| `pnpm start` | Start production servers |
| `pnpm test` | Run test suite |
| `pnpm lint` | Run ESLint for code quality |
| `pnpm format` | Format code with Prettier |

## 🧪 Testing

### Test Suite
```bash
# Run all tests
pnpm test

# Run frontend tests only
pnpm test:web

# Run backend tests only
pnpm test:api
```

### Test Accounts
Use the demo credentials to test different user roles:
- **Admin**: `admin@chikit.health` / `admin123`
- **Doctor**: `dr.sharma@chikit.health` / `doctor123`
- **Register new patients/users** via the registration interface

## 📦 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application:
# Frontend: http://localhost:5175
# Backend API: http://localhost:3100
```

### Manual Deployment
1. Build the application:
   ```bash
   pnpm build
   ```
2. Set production environment variables
3. Start the servers:
   ```bash
   pnpm start
   ```
4. Configure reverse proxy (NGINX/Apache) for SSL termination and load balancing
5. Set up process manager (PM2, systemd) for process management

## 🔒 Security Considerations

### Data Protection
- Passwords hashed using bcrypt with salt
- JWT tokens signed with HS256 algorithm
- Sensitive data encrypted at rest (where applicable)
- SQL injection prevention via parameterized queries (Drizzle ORM)
- XSS protection through proper output encoding
- CSRF protection for state-changing operations

### API Security
- All endpoints require authentication (except public auth routes)
- Rate limiting on authentication endpoints
- Input validation and sanitization on all inputs
- CORS policy restricted to trusted origins
- Security headers implemented (Helmet.js equivalent)

### Data Privacy
- GDPR and HIPAA compliance considerations
- Patient data minimization principles
- Consent management for data sharing
- Right to erasure and data portability features
- Audit trails for all data access and modifications

## 🤝 Contributing

We welcome contributions to improve Chikit! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features and bug fixes
- Update documentation when necessary
- Ensure all tests pass before submitting PR
- Respect the project's Code of Conduct

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors and contributors
- Built with ❤️ for improving healthcare accessibility
- Special thanks to the open-source community for amazing tools and libraries
- Inspired by the need for better healthcare technology in underserved communities

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check the documentation for troubleshooting guides

---

*Last updated: October 2026*  
*Chikit - Empowering healthcare through technology*
