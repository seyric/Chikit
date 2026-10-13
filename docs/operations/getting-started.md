# Getting Started with Chikit

We built Chikit as a comprehensive healthcare platform integrating modern web technologies with critical healthcare systems. To get started with development, exploration, or deployment, follow these steps.

## Prerequisites

Before we begin, we need to ensure our development environment has the following tools installed:

- **Node.js** (v18+): We use Node.js for both frontend and backend development
- **PostgreSQL** (v13+): Our primary database for storing patient records, hospital data, and clinical information
- **Git**: For version control and cloning the repository
- **pnpm**: Our package manager of choice for faster, more efficient installations

We verified our environment with these commands:
```bash
node --version  # Should show v18 or higher
postgres --version  # Should show PostgreSQL 13 or higher
git --version
pnpm --version
```

## Environment Setup

### 1. Clone the Repository
We start by cloning the Chikit repository to our local machine:
```bash
git clone https://github.com/seyric/Chikit.git
cd Chikit
```

### 2. Install Dependencies
We use pnpm to install all workspace dependencies from the root directory:
```bash
pnpm install
```

This command installs dependencies for:
- The API server (@workspace/api-server)
- The frontend application (@workspace/chikit)
- Shared packages (@workspace/db, @workspace/api-client-react, @workspace/api-zod)
- Scripts package (@workspace/scripts)

### 3. Configure Environment Variables
We create a `.env` file in the root directory based on the provided example. For initial development, we can copy the example:
```bash
cp .env.example .env
```

Then we edit the `.env` file to set:
- `PORT=3100` (backend API port)
- `MEDGEMMA_INFERENCE_URL` (optional - leave blank for rule-based AI fallback)
- `JWT_SECRET` (we generate a secure secret for development)
- `DATABASE_URL` (PostgreSQL connection string)
- ABDM configuration if we plan to test ABHA features

Example `.env` for development:
```
# Server Ports
PORT=3100

# MedGemma Configuration (optional)
MEDGEMMA_INFERENCE_URL=
MEDGEMMA_MODEL_NAME=medgemma-4b-it

# JWT Secret (change for production!)
JWT_SECRET=dev-secret-change-in-production-12345

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/chikit

# Node Environment
NODE_ENV=development
```

### 4. Set Up the Database
We need to create the database and run any necessary migrations:

```bash
# Create the database (assuming PostgreSQL is running)
createdb chikit

# If we have migration scripts, we would run them here
# For now, our schema is defined in @workspace/db and will be created on first connect
```

### 5. Seed Reference Data
We populate the database with essential reference data like the drug formulary:
```bash
# From the api-server directory
cd artifacts/api-server
pnpm run seed-drugs
cd ../..
```

This script loads over 150 medications with detailed information including contraindications, side effects, and pregnancy risks.

### 6. Import Hospital Data (Optional)
If we want to work with real hospital data, we can import the attached CSV:
```bash
# From the scripts directory
cd scripts
node import-hospitals.mjs
cd ../..
```

This script imports thousands of hospital records from the attached CSV file, cleaning and validating the data as it goes.

## Running the Application

### Development Mode
We typically run both frontend and backend in development mode simultaneously:

**Terminal 1 - Backend API Server:**
```bash
cd artifacts/api-server
pnpm run dev
```
We should see: "Server listening on port 3100"

**Terminal 2 - Frontend Development Server:**
```bash
cd artifacts/chikit
pnpm run dev
```
We should see: "VITE vX.X.X  ready in XXX ms" and the local development URL (usually http://localhost:5173)

### Accessing the Application
Once both servers are running, we can access the application:
- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:3100/api (if we have API docs enabled)
- **Health Check**: http://localhost:3100/api/health

### Production Build
When we're ready to test or deploy a production build:

**Backend:**
```bash
cd artifacts/api-server
pnpm run build
```

**Frontend:**
```bash
cd artifacts/chikit
pnpm run build
```

To preview the production build locally:
```bash
cd artifacts/chikit
pnpm run serve
```

## Verifying the Installation

We verify our setup is working correctly by:

1. **Checking the Health Endpoint**:
   ```bash
   curl http://localhost:3100/api/health
   ```
   Should return a 200 OK response with status information.

2. **Testing Authentication**:
   We can test the login endpoint with:
   ```bash
   curl -X POST http://localhost:3100/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```
   (Note: Default credentials may vary - we should check our seed data or create a test user)

3. **Exploring the API**:
   We can use tools like Postman or curl to explore the API endpoints we documented in our API reference.

4. **Checking the Frontend**:
   We open http://localhost:5173 in our browser and verify the login page loads correctly.

## Troubleshooting Common Issues

### "Database connection failed"
- Verify PostgreSQL is running: `sudo service postgresql start` (Linux) or check your PostgreSQL app
- Confirm the DATABASE_URL in .env matches your PostgreSQL setup
- Ensure the database `chikit` exists: `psql -l` should list it

### "Port already in use"
- Check what's using port 3100: `lsof -i :3100` or `netstat -tulpn | grep :3100`
- Stop the conflicting service or change the PORT in .env
- Ensure we don't have multiple instances of the API server running

### "MedGemma service unavailable"
- This is expected if we didn't set MEDGEMMA_INFERENCE_URL
- The system will automatically fall back to rule-based AI functions
- To enable MedGemma, we need to set up a local inference server and set the URL

### "Frontend can't connect to backend"
- Verify the backend is running on port 3100
- Check that the frontend Vite proxy is configured correctly (in vite.config.ts)
- Ensure we're not running into CORS issues (development setup should handle this)

## Next Steps

Once we have the application running successfully, we can:
1. Explore the API endpoints using our API reference documentation
2. Familiarize ourselves with the frontend interface
3. Begin contributing to specific features or fixing bugs
4. Run the test suite to verify functionality
5. Explore the codebase architecture using our reference documentation

We've found that the best way to understand Chikit is to start with the getting started guide, then explore the API reference to understand the available endpoints, and finally dive into the specific areas of interest using our frontend and backend references.

*Note: As we continue working with Chikit, we'll update this getting started guide with any new prerequisites or setup steps we discover.*