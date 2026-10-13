# Chikit by Solar - Scripts and Utilities Reference

This document provides a comprehensive reference of all scripts, utility functions, and helper tools available in the Chikit application. These scripts assist with development, testing, deployment, and maintenance of the healthcare platform.

## Scripts Overview

The Chikit application includes various scripts organized in different locations:

1. **Root-level scripts**: Package.json scripts for common operations
2. **Workspace scripts**: Dedicated scripts package (@workspace/scripts)
3. **Utility functions**: Helper functions throughout the codebase
4. **Database scripts**: Seeding and migration scripts
5. **Build scripts**: Compilation and packaging scripts

## Package.json Scripts

### Root Package.json (inferred from references)
Common scripts available at the workspace level:

### API Server Scripts
**File**: `artifacts/api-server/package.json`
```jsonc
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx ./src/index.ts",
    "build": "tsx ./build.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "seed-drugs": "tsx ./src/seed-drugs.ts"
  }
}
```

#### Script Descriptions
- **dev**: Start the backend server in development mode with automatic restart
- **build**: Execute the build script (likely compiles TypeScript to JavaScript)
- **typecheck**: Run TypeScript type checking without emitting output
- **seed-drugs**: Populate the database with initial drug formulary data

### Frontend Scripts
**File**: `artifacts/chikit/package.json`
```jsonc
{
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0",
    "build": "vite build --config vite.config.ts",
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

#### Script Descriptions
- **dev**: Start the frontend development server with hot module replacement
- **build**: Create a production-ready build of the frontend application
- **serve**: Preview the production build locally
- **typecheck**: Run TypeScript type checking for the frontend

### Shared Package Scripts
**File**: `lib/api-client-react/package.json`
```jsonc
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

**File**: `lib/api-zod/package.json`
```jsonc
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

**File**: `lib/db/package.json`
```jsonc
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

### Scripts Package
**File**: `scripts/package.json`
```jsonc
{
  "scripts": {
    "hello": "tsx ./src/hello.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

#### Script Descriptions
- **hello**: Simple test script that prints "Hello from @workspace/scripts"
- **typecheck**: Run TypeScript type checking for the scripts package

## Utility Functions

### Frontend Utilities
**File**: `artifacts/chikit/src/lib/utils.ts`

#### cn() Function
A utility for combining Tailwind CSS classes conditionally:
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage**:
```typescript
// Basic usage
cn("btn", "btn-primary") // Returns: "btn btn-primary"

// Conditional classes
cn("btn", isActive && "btn-active", isDisabled && "btn-disabled")
// Returns appropriate classes based on boolean values

// Object syntax support (via clsx)
cn(
  "btn",
  { "btn-active": isActive, "btn-disabled": isDisabled },
  size === "large" && "btn-large"
)
```

**Dependencies**:
- `clsx`: For conditional class joining
- `tailwind-merge`: For resolving Tailwind CSS class conflicts

### Backend Utilities
Utility functions are distributed throughout the backend codebase in various service files.

#### ID Generation Functions
**Patient ID Generation** (`src/routes/patients.ts`):
```typescript
function generatePatientCode(): string {
  return "PT" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100).toString().padStart(2, "0");
}

function generateChikitHealthId(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CHK-${year}-${suffix}`;
}
```

**ABHA Number Generation** (`src/abdm/service.ts`):
```typescript
private generateAbhaNumber(): string {
  // Generate 14-digit ABHA number (as per ABDM specs)
  const randomDigits = () => Math.floor(Math.random() * 9000) + 1000; // 4-digit number
  return `${randomDigits()}-${randomDigits()}-${randomDigits()}-${randomDigits()}`;
}

private generateAbhaAddress(name: string): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, ".");
  const randomSuffix = Math.floor(Math.random() * 900) + 100; // 3-digit number
  return `${cleanName}${randomSuffix}@abdm`;
}
```

#### Data Cleaning and Validation
**CSV Parsing Utilities** (`scripts/import-hospitals.mjs`):
```typescript
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function clean(val) {
  if (!val || val.trim() === "0" || val.trim() === "" || val.trim() === "N/A") return null;
  return val.trim() || null;
}

function cleanInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) || n === 0 ? null : n;
}
```

**Usage**: These functions are used to parse and clean CSV data during hospital import operations.

#### Embedding Generation
**MedGemma Service Utilities** (`src/medgemma/service.ts`):
```typescript
private stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

private generateSimulatedEmbedding(text: string): number[] {
  // Create a deterministic but varied embedding based on text content
  const textHash = this.stringToHash(text);
  const vectorSize = 384; // Typical embedding size for models like MedGemma
  const embedding: number[] = new Array(vectorSize);
  
  // Simple pseudo-random generation based on hash
  let seed = textHash;
  for (let i = 0; i < vectorSize; i++) {
    // Xorshift-like algorithm for deterministic pseudo-random
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    // Normalize to [-1, 1] range
    embedding[i] = ((seed & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  }
  
  return embedding;
}

private generateFallbackEmbedding(text: string): number[] {
  const vectorSize = 384;
  const embedding: number[] = new Array(vectorSize).fill(0);
  
  // Simple feature-based embedding for fallback
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const charCodes = text.split("").map((c) => c.charCodeAt(0));
  
  // Basic text features
  embedding[0] = Math.min(words.length / 100, 1); // Word count normalized
  embedding[1] = Math.min(text.length / 1000, 1); // Text length normalized
  embedding[2] =
    words.filter((w) => w.length > 10).length / Math.max(words.length, 1); // Long word ratio
  
  // Character distribution features
  const letterCount = charCodes.filter(
    (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122),
  ).length;
  embedding[3] = letterCount / Math.max(charCodes.length, 1);
  
  // Hash-based features for distribution
  const hash = this.stringToHash(text);
  for (let i = 4; i < Math.min(20, vectorSize); i++) {
    embedding[i] = (((hash >> ((i - 4) * 4)) & 0xf) / 15) * 2 - 1; // Normalize to [-1, 1]
  }
  
  // Fill remaining positions with small deterministic variations
  for (let i = 20; i < vectorSize; i++) {
    embedding[i] = Math.sin(i * hash * 0.001) * 0.1;
  }
  
  return embedding;
}
```

## Database Scripts

### Drug Seeding Script
**File**: `artifacts/api-server/src/seed-drugs.ts`

This script populates the drugs table with a comprehensive formulary of medications. Key features:

#### Data Structure
Each drug entry includes:
- `name`: Brand/common name
- `genericName`: Generic/active ingredient
- `brandNames`: Array of brand names
- `drugClass`: Therapeutic classification
- `dosageForms`: Available forms (tablet, injection, etc.)
- `strength`: Dosage strengths
- `contraindications`: Medical conditions where drug should not be used
- `sideEffects`: Common adverse reactions
- `pregnancyRisk`: Pregnancy safety category (A, B, C, D, X)
- `interactions`: Drugs that may interact negatively

#### Script Functionality
1. **Import**: Loads database connection and drugs table schema
2. **Data Array**: Contains approximately 150+ drug entries with detailed information
3. **Insert Operation**: Uses Drizzle ORM to insert all drugs into the database
4. **Error Handling**: Includes try/catch blocks for database operations
5. **Feedback**: Provides console output on success or failure

#### Usage
Run with: `npm run seed-drugs` (from api-server directory) or `tsx ./src/seed-drugs.ts`

### Hospital Import Script
**File**: `scripts/import-hospitals.mjs`

This script imports hospital data from a CSV file into the hospitals table.

#### Features
- **CSV Parsing**: Custom CSV parser handling quoted fields and commas within quotes
- **Data Cleaning**: Functions to clean and validate imported data
- **Duplicate Prevention**: Checks for existing records by source_id to avoid duplicates
- **Batch Processing**: Processes records in batches of 500 for efficiency
- **Progress Reporting**: Shows import progress during execution
- **Early Exit**: Skips import if already have >30,000 hospitals (assumes complete import)

#### Data Mapping
Maps CSV columns to database fields:
- Source ID → source_id
- Location → location
- Hospital name → name
- Category → category
- Care type → careType
- Discipline → discipline
- Address → address
- State → state
- District → district
- PIN code → pincode
- Phone → phone
- Email → email
- Website → website
- Specialties → specialties
- Number of doctors → numDoctors
- Bed count → bedCount
- Type → hardcoded to "general"
- City → derived from location/state/district

#### Usage
Run with: `node ./import-hospitals.mjs` (from scripts directory)

## Build and Development Utilities

### Vite Plugins (Frontend)
The frontend uses several Vite plugins for enhanced development experience:

1. **@vitejs/plugin-react**: React Fast Refresh support
2. **tailwindcss()**: Tailwind CSS integration
3. **@replit/vite-plugin-runtime-error-modal**: Development error overlay
4. **@replit/vite-plugin-cartographer**: Code mapping (Replit-specific)
5. **@replit/vite-plugin-dev-banner**: Development banner (Replit-specific)

### TypeScript Configuration
All packages use extended base TypeScript configuration:
- Strict type checking enabled
- Module resolution configured for bundlers
- ES2022 target with ES modules
- Workspace-specific custom conditions
- Import .ts files directly supported

### Cross-Env Utility
Used in API server scripts to set environment variables cross-platform:
- `cross-env NODE_ENV=development tsx ./src/index.ts`
- Ensures NODE_ENV is set correctly on Windows, Linux, and macOS

### Tsx Utility
Used for direct TypeScript execution without separate compilation step:
- `tsx ./src/index.ts`: Runs TypeScript directly
- `tsx ./build.ts`: Executes build script
- `tsx ./src/hello.ts`: Runs scripts package hello script

## Testing and Debugging Utilities

### Console Logging Patterns
Throughout the codebase, consistent logging patterns are used:

**Error Logging**:
```typescript
catch (err) {
  console.error("[Service] Operation failed:", err);
  // Handle error appropriately
}
```

**Warning Logging**:
```typescript
if (!isAvailable) {
  console.warn(
    "MedGemma service not configured. AI features will use rule-based fallback.",
  );
  console.warn(
    "To enable MedGemma, set MEDGEMMA_INFERENCE_URL environment variable.",
  );
}
```

**Debug Logging**:
```typescript
console.log(`Currently have ${count} hospitals, importing remaining...`);
```

### Error Handling Patterns
Standardized error handling in route controllers:
```typescript
try {
  // Perform operation
  // Return success response
} catch (err) {
  // Log error for debugging
  console.error("Failed to fetch patients:", err);
  // Return standardized error response
  res.status(500).json({ 
    error: "internal_error", 
    message: "Failed to fetch patients" 
  });
}
```

### Audit Logging Utility
**File**: `src/lib/audit.ts` (inferred from usage)
```typescript
// Function signature inferred from usage in route files
export function createAuditLog(
  req: Request, 
  action: string, 
  entityType: string, 
  entityId: number, 
  description?: string
): Promise<void> {
  // Creates audit log entry in database
  // Captures: user, action, entity, timestamp, description
}
```

**Usage Examples**:
```typescript
await createAuditLog(req, "create", "patient", patient.id, `Created patient ${name}`);
await createAuditLog(req, "view", "patient", patient.id);
await createAuditLog(req, "update", "patient", patient.id);
```

## Configuration Utilities

### Environment Variable Access
Standard pattern for accessing environment variables:
```typescript
// String with default
const apiKey = process.env.API_KEY || "";

// Number with default
const port = Number(process.env.PORT) || 3100;

// Boolean
const featureEnabled = process.env.FEATURE_FLAG === "true";

// Required variable (throws if missing)
if (!process.env.REQUIRED_VAR) {
  throw new Error("REQUIRED_VAR environment variable is required");
}
```

### Configuration Validation
Using Zod for complex configuration validation (ABDM config):
```typescript
import { z } from "zod";

const abdmConfigSchema = z.object({
  baseUrl: z.string().url().default("https://abha.abdm.gov.in"),
  apiKey: z.string().min(1),
  // ... other fields
});

export type ABDMConfig = z.infer<typeof abdmConfigSchema>;

export const getABDMConfig = (): ABDMConfig => {
  return {
    baseUrl: process.env.ABDM_BASE_URL || "https://abha.abdm.gov.in",
    apiKey: process.env.ABDM_API_KEY || "",
    // ... other fields
  };
};

export const validateABDMConfig = (config: ABDMConfig) => {
  return abdmConfigSchema.safeParse(config);
};
```

## Development Workflow Scripts

### Database Development
1. **Schema Updates**: Run migrations or sync schema changes
2. **Seeding**: `npm run seed-drugs` to populate reference data
3. **Testing**: Import sample data for development testing

### API Development
1. **Backend**: `npm run dev` to start API server
2. **Frontend**: `npm run dev` to start frontend dev server
3. **Proxying**: Frontend Vite config proxies `/api` to backend
4. **Hot Reloading**: Both servers support hot module replacement

### Build Process
1. **Backend**: `npm run build` (executes build.ts)
2. **Frontend**: `npm run build` (creates optimized bundle)
3. **Type Checking**: `npm run typecheck` in each package
4. **Production Preview**: `npm run serve` to test production build locally

## Script Execution Guidelines

### Environment Setup
Before running scripts, ensure required environment variables are set:
- For API server: PORT, MEDGEMMA_INFERENCE_URL (optional), JWT_SECRET, DATABASE_URL
- For ABDM features: ABDM_API_KEY, ABDM_API_SECRET, ABDM_HIP_ID, ABDM_CALLBACK_URL
- For database: DATABASE_URL (PostgreSQL connection string)

### Execution Order
1. Set up database (PostgreSQL instance running)
2. Run database migrations if applicable
3. Seed reference data: `npm run seed-drugs` (API server)
4. Import hospitals if needed: `node ./import-hospitals.mjs` (scripts directory)
5. Start development servers:
   - API server: `npm run dev` (API server directory)
   - Frontend: `npm run dev` (frontend directory)
   - Or start both simultaneously in separate terminals

### Production Deployment
1. Set all required environment variables for production
2. Build both applications:
   - API server: `npm run build`
   - Frontend: `npm run build`
3. Deploy built artifacts to production hosting
4. Configure reverse proxy/load balancer as needed
5. Start production servers with appropriate process management

## Script Maintenance and Best Practices

### Naming Conventions
- **Scripts**: Descriptive, lowercase-with-hyphens (seed-drugs, import-hospitals)
- **Functions**: camelCase (generatePatientCode, createAuditLog)
- **Constants**: UPPER_SNAKE_CASE (DEFAULT_PORT, MAX_RETRIES)
- **Types**: PascalCase (ABDMConfig, MedGemmaService)

### Documentation
- **Comments**: JSDoc style for complex functions
- **README**: Package-level documentation in package.json files
- **Inline**: Clear variable names and logical grouping

### Error Handling
- **Try/Catch**: For asynchronous operations and external service calls
- **Validation**: Input validation before processing
- **Fallbacks**: Graceful degradation when optional services unavailable
- **Logging**: Appropriate log levels (error, warn, info, debug)

### Security
- **Secrets**: Never hardcode secrets; use environment variables
- **Validation**: Validate and sanitize all inputs
- **Privilege**: Run scripts with least necessary privileges
- **Audit**: Log significant operations for security monitoring

### Performance
- **Batching**: Process large datasets in batches (hospital import: 500 records/batch)
- **Caching**: Cache expensive operations when appropriate
- **Async/Await**: Use for non-blocking I/O operations
- **Parallelization**: Use Promise.all() for independent operations

## Troubleshooting Script Issues

### Common Problems and Solutions

#### "Command not found" errors
- Ensure you're in the correct directory when running scripts
- Check that npm scripts are defined in the relevant package.json
- Verify node_modules are installed (`npm install`)

#### "Missing environment variable" errors
- Check .env file or system environment for required variables
- Verify variable names match exactly (case-sensitive)
- Ensure required variables are set before running script

#### "Database connection failed" errors
- Verify PostgreSQL server is running and accessible
- Check DATABASE_URL format and credentials
- Confirm network connectivity and firewall rules
- Validate that the target database exists

#### "Port already in use" errors
- Check what process is using the port (`lsof -i :PORT` or `netstat -ano`)
- Stop conflicting service or change port in configuration
- Ensure previous instances of the script are fully terminated

#### "Module not found" errors
- Run `npm install` to install dependencies
- Check TypeScript paths and module resolution
- Verify that referenced packages are built and linked

#### "Out of memory" errors
- Increase Node.js memory limit: `node --max-old-space-size=4096 script.js`
- Process large datasets in smaller batches
- Consider streaming approaches for very large files

#### Permission errors
- Ensure script has execute permissions if needed (`chmod +x script.sh`)
- Check file access permissions for read/write operations
- Verify user has sufficient privileges for database operations

## Future Script and Utility Enhancements

### Proposed Additions
1. **Database Migration Scripts**: Formal migration system (e.g., using Drizzle-Zod or Knex)
2. **Backup/Restore Scripts**: Automated database backup and restoration
3. **Health Check Scripts**: Comprehensive system health verification
4. **Performance Profiling**: Scripts to identify bottlenecks
5. **Security Auditing**: Automated security scanning scripts
6. **Data Validation**: Scripts to validate data integrity and consistency
7. **API Testing**: Automated API contract and integration tests
8. **Load Testing**: Scripts to simulate production load conditions
9. **Log Analysis**: Utilities to analyze and summarize application logs
10. **Deployment Automation**: Scripts for zero-downtime deployment

### Improvements to Existing Scripts
1. **Enhanced Logging**: Structured logging with levels and contexts
2. **Better Error Messages**: More specific, actionable error messages
3. **Progress Indicators**: Improved progress reporting for long operations
4. **Configuration Validation**: Pre-flight checks for all required configuration
5. **Help Documentation**: Built-in help (-h/--help) for all scripts
6. **Version Information**: Script version reporting
7. **Dry Run Mode**: Preview changes without applying them
8. **Interactive Mode**: Prompt for confirmation on destructive operations

### Standardization Opportunities
1. **Common Argument Parsing**: Standard library for script arguments
2. **Exit Codes**: Consistent exit codes for success/failure scenarios
3. **Signal Handling**: Proper cleanup on SIGINT/SIGTERM
4. **Timeout Handling**: Automatic termination of hung operations
5. **Resource Cleanup**: Guaranteed cleanup of temporary files/resources
6. **Testing Harnesses**: Standardized approach to test script execution

---
*This scripts and utilities reference is generated from the actual codebase and represents the current state of the Chikit application's development and maintenance tools. For the most up-to-date information, always refer to the source code and any provided documentation.*