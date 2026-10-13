# Chikit by Solar - Configuration Reference

This document provides a comprehensive reference of all configuration files, environment variables, and build settings used in the Chikit application. Proper configuration is essential for development, testing, and production deployment of the healthcare platform.

## Configuration Overview

The Chikit application uses a monorepo architecture with multiple packages, each having its own configuration. Configuration is managed through:

1. **TypeScript Configuration**: tsconfig files for type checking and compilation
2. **Build Tools**: Vite for frontend, tsx for backend execution
3. **Styling**: Tailwind CSS for frontend styling
4. **Service Configuration**: Specific configurations for external integrations (ABDM, MedGemma)
5. **Environment Variables**: Runtime configuration for different deployment environments
6. **Package Management**: pnpm workspace configuration and package.json files

## TypeScript Configuration

### Base Configuration
**File**: `tsconfig.base.json`
Shared TypeScript configuration extended by all packages:

```jsonc
{
  "compilerOptions": {
    "isolatedModules": true,              // Required for Babel/tsx compatibility
    "lib": ["es2022"],                    // ES2022 library features
    "module": "esnext",                   // ES modules
    "moduleResolution": "bundler",        // Bundler-style resolution (Vite/webpack)
    "noEmitOnError": true,                // Don't emit output on type errors
    "noFallthroughCasesInSwitch": true,   // Prevent fallthrough in switch statements
    "noImplicitOverride": false,          // Allow implicit override (safe for current code)
    "noImplicitReturns": true,            // Warn on missing returns
    "noUnusedLocals": false,              // Don't report unused locals (flexibility)
    "noImplicitAny": true,                // Disallow implicit 'any' types
    "noImplicitThis": true,               // Disallow implicit 'any' in 'this'
    "strictNullChecks": true,             // Strict null checking
    "strictFunctionTypes": false,         // Disable strict function types (flexibility)
    "strictBindCallApply": true,          // Strict bind/call/apply checking
    "strictPropertyInitialization": true, // Strict class property initialization
    "useUnknownInCatchVariables": true,   // Unknown type for catch variables
    "alwaysStrict": true,                 // Always use strict mode
    "skipLibCheck": true,                 // Skip type checking of declaration files
    "target": "es2022",                   // Compile to ES2022
    "types": [],                          // No automatic type imports
    "customConditions": ["workspace"],    // Custom condition for package exports
    "allowImportingTsExtensions": true    // Allow importing .ts files directly
  }
}
```

### Root Configuration
**File**: `tsconfig.json`
Workspace configuration referencing sub-packages:

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compileOnSave": false,
  "files": [],
  "references": [
    { "path": "./lib/db" },
    { "path": "./lib/api-client-react" },
    { "path": "./lib/api-zod" }
  ]
}
```

### Package-Specific Configurations
Each package extends the base configuration:

- **lib/db/tsconfig.json**: Database package
- **lib/api-client-react/tsconfig.json**: React API client package
- **lib/api-zod/tsconfig.json**: Zod schemas package
- **artifacts/api-server/tsconfig.json**: Backend server package
- **artifacts/chikit/tsconfig.json**: Frontend application package
- **scripts/tsconfig.json**: Scripts package

## Build Tool Configuration

### Frontend Build Tool (Vite)
**File**: `artifacts/chikit/vite.config.ts`

Configuration for the React frontend application:

#### Key Sections
- **Plugins**:
  - `@vitejs/plugin-react`: React Fast Refresh support
  - `tailwindcss()`: Tailwind CSS integration
  - `@replit/vite-plugin-runtime-error-modal`: Development error overlay
  - Conditional plugins for Replit environment:
    - `@replit/vite-plugin-cartographer`: Code mapping
    - `@replit/vite-plugin-dev-banner`: Development banner

- **Resolve Aliases**:
  - `"@"`: Resolves to `/src` directory
  - `"@assets"`: Resolves to attached assets directory

- **Server Configuration**:
  - Port from `PORT` environment variable (default: 5173)
  - Host: `0.0.0.0` (accessible on network)
  - Proxy: `/api` requests forwarded to `http://localhost:3100` (backend)
  - File system restrictions for security

- **Build Configuration**:
  - Output directory: `dist/public`
  - Clean output directory before build

- **Preview Configuration**:
  - Same port and host as development server

#### Environment Variables
- `PORT`: Server port (defaults to 5173)
- `BASE_PATH`: Base URL path for deployment
- `NODE_ENV`: Development/production mode
- `REPL_ID`: Replit-specific environment detection

### Backend Execution
The backend uses `tsx` for direct TypeScript execution:
- **Dev Script**: `cross-env NODE_ENV=development tsx ./src/index.ts`
- **Build Script**: `tsx ./build.ts` (likely compiles to JavaScript)
- **Typecheck**: `tsc -p tsconfig.json --noEmit`

### API Specification Configuration
**File**: `lib/api-spec/orval.config.ts`
Configuration for API client generation (inferred from file existence):
- Likely uses Orval to generate React Query hooks from OpenAPI spec
- Configures input (API spec), output location, and client generation options

## Styling Configuration

### Tailwind CSS
**File**: `artifacts/chikit/tailwind.config.js`

Minimal Tailwind configuration:
```javascript
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
};
```

#### Configuration Details
- **Content Path**: Scans all source files for class names to include in CSS
- **No Custom Theme**: Uses default Tailwind configuration
- **Just-in-Time Mode**: Enabled by default in Tailwind v3+
- **No Presets**: No additional plugins or presets configured

## Service-Specific Configuration

### ABDM (Ayushman Bharat Digital Mission) Configuration
**File**: `artifacts/api-server/src/abdm/config.ts`

Configuration for ABDM API integration:

#### Configuration Schema (Zod)
```typescript
export const abdmConfigSchema = z.object({
  baseUrl: z.string().url().default("https://abha.abdm.gov.in"),
  sandboxBaseUrl: z.string().url().default("https://sandbox.abdm.gov.in"),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  hipId: z.string().min(1), // Health Facility ID
  hipName: z.string().min(1),
  callbackUrl: z.string().url(),
  tokenExpiryMinutes: z.number().default(60),
});
```

#### Configuration Loading
**Function**: `getABDMConfig()`
Loads configuration from environment variables with defaults:
- `ABDM_BASE_URL`: Production ABDM API base URL
- `ABDM_SANDBOX_BASE_URL`: Sandbox API base URL
- `ABDM_API_KEY`: API key for authentication
- `ABDM_API_SECRET`: API secret for authentication
- `ABDM_HIP_ID`: Health Facility Identifier
- `ABDM_HIP_NAME`: Facility name (defaults to "Chikit Facility")
- `ABDM_CALLBACK_URL`: Callback URL for ABDM interactions
- `ABDM_TOKEN_EXPIRY_MINUTES`: Token expiration time (default: 60 minutes)

#### Validation
**Function**: `validateABDMConfig(config)`
Validates configuration against the Zod schema, returning success/error result.

### MedGemma Configuration
MedGemma configuration is handled entirely through environment variables:

#### Environment Variables
- `MEDGEMMA_INFERENCE_URL`: URL of local MedGemma inference server
  - Example: `http://localhost:8000`
  - When unset, MedGemma service falls back to rule-based system
- `MEDGEMMA_MODEL_NAME`: Name of the MedGemma model to use
  - Default: `"medgemma-4b-it"`
  - Examples: `"medgemma-4b-it"`, `"medgemma-8b"`, etc.

#### Service Behavior
The MedGemma service checks for `MEDGEMMA_INFERENCE_URL`:
- If set: Attempts to connect to the inference server
- If not set: Logs warning and uses rule-based fallback for all AI functions
- Includes health checking to verify service availability
- Provides simulated responses during development when server unavailable

## Environment Variables Reference

### Backend Server (.env or system environment)
Used by `artifacts/api-server/`:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3100` | Yes |
| `MEDGEMMA_INFERENCE_URL` | MedGemma inference server URL | `http://localhost:8000` | No (fallback to rule-based) |
| `MEDGEMMA_MODEL_NAME` | MedGemma model name | `medgemma-4b-it` | No (defaults to medgemma-4b-it) |
| `JWT_SECRET` | Secret for JWT token signing | `chikit_jwt_secret_2024` | No (defaults in dev) |
| `NODE_ENV` | Node environment | `development` or `production` | No (defaults to development) |

### ABDM Configuration
Used by `artifacts/api-server/src/abdm/config.ts`:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ABDM_BASE_URL` | Production ABDM API base URL | `https://abha.abdm.gov.in` | No (has default) |
| `ABDM_SANDBOX_BASE_URL` | Sandbox ABDM API base URL | `https://sandbox.abdm.gov.in` | No (has default) |
| `ABDM_API_KEY` | API key for ABDM authentication | `your-api-key-here` | Yes (min length 1) |
| `ABDM_API_SECRET` | API secret for ABDM authentication | `your-api-secret-here` | Yes (min length 1) |
| `ABDM_HIP_ID` | Health Facility ID | `HIP123456` | Yes (min length 1) |
| `ABDM_HIP_NAME` | Facility name | `Chikit Hospital` | No (defaults to "Chikit Facility") |
| `ABDM_CALLBACK_URL` | Callback URL for ABDM | `https://chikit.example.com/callback` | Yes |
| `ABDM_TOKEN_EXPIRY_MINUTES` | Token expiration in minutes | `60` | No (defaults to 60) |

### Frontend Configuration
Used by `artifacts/chikit/vite.config.ts`:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Frontend server port | `5173` | No (defaults to 5173) |
| `BASE_PATH` | Base path for deployment | `/` or `/app/` | No (defaults to "/") |
| `NODE_ENV` | Development/production mode | `development` or `production` | No (defaults to development) |
| `REPL_ID` | Replit environment identifier | *(set by Replit)* | No (Replit-specific) |

### Database Configuration
Inferred from `@workspace/db` usage (likely in root or lib/db):

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/chikit` | Yes |
| `DB_HOST` | Database host | `localhost` | Alternative to URL |
| `DB_PORT` | Database port | `5432` | Alternative to URL |
| `DB_NAME` | Database name | `chikit` | Alternative to URL |
| `DB_USER` | Database username | `postgres` | Alternative to URL |
| `DB_PASSWORD` | Database password | `password` | Alternative to URL |

### Scripts and Utilities
Used by various scripts:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node environment for scripts | `development` | No (defaults to development) |

## Package.json Configuration

### Workspace Root
**File**: `package.json` (inferred from references)
Manages workspace configuration and shared dependencies.

### Individual Packages
Each package has its own package.json:

#### API Server (`artifacts/api-server/package.json`)
```jsonc
{
  "name": "@workspace/api-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx ./src/index.ts",
    "build": "tsx ./build.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "seed-drugs": "tsx ./src/seed-drugs.ts"
  },
  "dependencies": {
    "@workspace/api-zod": "workspace:*",
    "@workspace/db": "workspace:*",
    "cookie-parser": "^1.4.7",
    "cors": "^2",
    "drizzle-orm": "catalog:",
    "express": "^5",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "catalog:",
    "cross-env": "^10.1.0",
    "esbuild": "^0.27.3",
    "tsx": "catalog:"
  }
}
```

#### Frontend Application (`artifacts/chikit/package.json`)
```jsonc
{
  "name": "@workspace/chikit",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0",
    "build": "vite build --config vite.config.ts",
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    // ... (UI components)
    "@tanstack/react-query": "catalog:",
    "@workspace/api-client-react": "workspace:*",
    "class-variance-authority": "catalog:",
    "clsx": "catalog:",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "catalog:",
    "input-otp": "^1.4.2",
    "lucide-react": "catalog:",
    "next-themes": "^0.4.6",
    "react": "catalog:",
    "react-dom": "catalog:",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "catalog:",
    "tw-animate-css": "^1.4.0",
    "vaul": "^1.1.2",
    "wouter": "^3.3.5",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "catalog:",
    "@replit/vite-plugin-dev-banner": "catalog:",
    "@replit/vite-plugin-runtime-error-modal": "catalog:",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "tailwindcss": "catalog:",
    "vite": "catalog:"
  }
}
```

#### Shared Packages
- `@workspace/db`: Database schemas and Drizzle configuration
- `@workspace/api-client-react`: Generated React Query hooks for API
- `@workspace/api-zod`: Shared Zod schemas for validation
- `@workspace/api-spec`: API specification (OpenAPI/Swagger) files

## Configuration Loading Patterns

### Backend Configuration Loading
Environment variables are accessed directly via `process.env`:
- String values: `process.env.VARIABLE_NAME || defaultValue`
- Numeric values: `Number(process.env.VARIABLE_NAME) || defaultValue`
- Boolean values: `process.env.VARIABLE_NAME === "true"` or similar

### Validation Approach
- Uses Zod for schema validation where complex validation needed (ABDM config)
- Manual validation for simple cases (format checking, range validation)
- Development/production behavior differences for external service simulation

### Default Values
- Sensible defaults provided for development
- Production deployment should override all defaults with actual values
- Missing required values typically cause startup errors or fallback behavior

## Development vs Production Configuration

### Development Characteristics
- Uses sandbox/stub services when external APIs unavailable
- Accepts invalid or missing configuration with warnings
- Enables debugging features (error overlays, dev tools)
- May use hot module replacement (Vite)
- Less strict error handling
- Default values for missing configuration

### Production Requirements
- All required environment variables must be set
- External service endpoints must be accessible
- Proper secrets management (not hardcoded)
- Error handling and logging configured
- Performance optimizations enabled
- Security headers and restrictions applied
- CORS restrictions to trusted domains
- Database connection pooling configured

## Configuration Management Best Practices

### Environment Separation
- Use `.env` files for different environments (development, staging, production)
- Never commit `.env` files containing secrets to version control
- Use environment-specific configuration loading
- Validate configuration at startup

### Secret Management
- Store secrets in environment variables, not code
- Use secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate secrets regularly
- Audit access to secrets

### Configuration Validation
- Validate all configuration at application startup
- Provide clear error messages for missing/invalid configuration
- Fail fast when required configuration is missing
- Log configuration summary (excluding secrets) on startup

### Documentation
- Document all environment variables and their purposes
- Provide example configuration files (`.env.example`)
- Keep configuration documentation up to date
- Include validation rules and constraints

## Configuration Files Summary

### Root Level
- `tsconfig.base.json`: Base TypeScript configuration
- `tsconfig.json`: Workspace TypeScript references
- `package.json`: Workspace manifest (inferred)

### Backend (`artifacts/api-server/`)
- `tsconfig.json`: TypeScript configuration
- `package.json`: Dependencies and scripts
- `src/abdm/config.ts`: ABDM service configuration
- `vitconfig.ts`: Vite configuration (inferred - actually frontend)

### Frontend (`artifacts/chikit/`)
- `tsconfig.json`: TypeScript configuration
- `package.json`: Dependencies and scripts
- `vite.config.ts`: Vite build configuration
- `tailwind.config.js`: Tailwind CSS configuration

### Shared Libraries
- `lib/api-client-react/tsconfig.json`: API client TypeScript config
- `lib/api-zod/tsconfig.json`: Shared schemas TypeScript config
- `lib/db/tsconfig.json`: Database TypeScript config
- `lib/db/drizzle.config.ts`: Drizzle ORM configuration (inferred)

### Scripts
- `scripts/tsconfig.json`: Scripts TypeScript configuration
- `seed-drugs.ts`: Drug database seeding script

## Example Configuration Files

### Example .env for Development
```
# Server Ports
PORT=3100

# Backend API (for frontend proxy)
# Note: Frontend Vite config already points to localhost:3100 for /api

# MedGemma Configuration (optional - falls back to rule-based)
MEDGEMMA_INFERENCE_URL=http://localhost:8000
MEDGEMMA_MODEL_NAME=medgemma-4b-it

# JWT Secret (change in production!)
JWT_SECRET=chikit_jwt_secret_2024

# ABDM Configuration (required for ABDM features)
ABDM_API_KEY=your_abdm_api_key_here
ABDM_API_SECRET=your_abdm_api_secret_here
ABDM_HIP_ID=HIP123456
ABDM_HIP_NAME=Chikit Hospital
ABDM_CALLBACK_URL=https://yourdomain.com/abdm/callback
ABDM_TOKEN_EXPIRY_MINUTES=60

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/chikit

# Node Environment
NODE_ENV=development
```

### Example .env for Production
```
# Server Ports
PORT=3100

# MedGemma Configuration
MEDGEMMA_INFERENCE_URL=https://medgemma.internal.chikit.example.com
MEDGEMMA_MODEL_NAME=medgemma-4b-it

# JWT Secret (MUST be changed and kept secret)
JWT_SECRET=your_production_jwt_secret_here_change_this

# ABDM Configuration (REQUIRED)
ABDM_API_KEY=your_production_abdm_api_key
ABDM_API_SECRET=your_production_abdm_api_secret
ABDM_HIP_ID=HIP999999
ABDM_HIP_NAME=Chikit Medical Center
ABDM_CALLBACK_URL=https://medical.chikit.example.com/abdm/callback
ABDM_TOKEN_EXPIRY_MINUTES=60

# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://chikit_user:secure_password@db.chikit.example.com:5432/chikit_production

# Node Environment
NODE_ENV=production
```

## Configuration Validation and Testing

### Startup Validation
Applications should:
1. Check for required environment variables at startup
2. Validate format and values of configuration
3. Log configuration summary (redacting secrets)
4. Fail fast if critical configuration is missing or invalid
5. Provide clear guidance on what configuration is needed

### Runtime Checking
- External service availability checks (MedGemma ping, ABDM endpoint test)
- Database connectivity verification on startup
- Periodic health checks for long-running applications
- Configuration change detection (for hot-reload scenarios)

### Testing Considerations
- Use separate configuration for testing environment
- Mock external services in unit tests
- Use test databases with known state
- Clear test environment between test runs
- Validate that tests don't depend on specific configuration values

## Troubleshooting Configuration Issues

### Common Problems and Solutions

#### "Missing environment variable" errors
- Check that `.env` file is loaded correctly
- Verify variable names match exactly (case-sensitive)
- Ensure required variables are set in the target environment

#### "Invalid configuration" errors
- Check values against expected formats (URLs, numbers, etc.)
- Verify numeric values are actually numbers
- Ensure strings meet minimum length requirements
- Validate URLs are properly formatted

#### External service connection issues
- Verify service is running and accessible
- Check network connectivity and firewall rules
- Validate credentials and permissions
- Confirm service version compatibility
- Check logs on both client and server sides

#### Database connection problems
- Verify database server is running
- Check connection string format and credentials
- Confirm network accessibility and port availability
- Validate database exists and user has permissions
- Check for connection limits or timeout issues

#### Port conflicts
- Ensure no other service is using the same port
- Check for port already in use errors
- Consider using port ranges or dynamic port assignment
- Verify proxy configuration matches actual backend port

## Configuration Evolution and Versioning

### Backward Compatibility
- Configuration changes should maintain backward compatibility where possible
- Deprecation warnings for old configuration names
- Migration guides for breaking changes
- Versioned configuration schemas where appropriate

### Environment Variable Management
- Prefix application-specific variables to avoid collisions
- Use consistent naming conventions (SCREAMING_SNAKE_CASE)
- Group related variables with common prefixes
- Document deprecated variables and removal timeline

### Configuration-as-Code
- Consider storing configuration in version control (excluding secrets)
- Use templating systems for environment-specific configs
- Implement configuration validation in CI/CD pipeline
- Track configuration changes over time

---
*This configuration reference is generated from the actual codebase and represents the current state of the Chikit application configuration. For the most up-to-date information, always refer to the source code and any provided example configuration files.*