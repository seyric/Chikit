# ABDM Integration Module

This module provides integration with the Ayushman Bharat Digital Mission (ABDM) for Chikit by Solar.

## Overview

The ABDM module enables Chikit to:
- Link patient records with ABHA (Ayushman Bharat Health Account)
- Authenticate users via ABHA
- Verify ABHA credentials
- Link existing Chikit patient records to ABHA numbers
- Fetch ABHA profile information
- Comply with ABDM APIs and workflows

## Architecture

The module consists of:
- **Configuration** (`config.ts`): Handles environment variables and validation
- **Service** (`service.ts`): Implements ABDM API workflows and business logic
- **Routes** (`routes/abha.ts`): HTTP endpoints for ABDM functionality (updated to use this module)
- **Index** (`index.ts`: Exports for easy importing

## Environment Variables

The following environment variables are required for ABDM integration:

| Variable | Description | Example |
|----------|-------------|---------|
| `ABDM_BASE_URL` | Production ABDM API base URL | `https://abha.abdm.gov.in` |
| `ABDM_SANDBOX_BASE_URL` | Sandbox ABDM API base URL | `https://sandbox.abdm.gov.in` |
| `ABDM_API_KEY` | ABDM API Key | `your_api_key_here` |
| `ABDM_API_SECRET` | ABDM API Secret | `your_api_secret_here` |
| `ABDM_HIP_ID` | Your Health Facility ID | `HIP123456` |
| `ABDM_HIP_NAME` | Your Health Facility Name | `Chikit Hospital` |
| `ABDM_CALLBACK_URL` | Your callback URL for ABDM interactions | `https://yourdomain.com/abdm/callback` |
| `ABDM_TOKEN_EXPIRY_MINUTES` | Token expiry time (minutes) | `60` |
| `JWT_SECRET` | Secret for internal Chikit JWT tokens | `your_jwt_secret_here` |

See `.env.example` for a complete example.

## Usage

### Importing the ABDM Service

```typescript
import { abdmService } from "@/abdm";
// or
import { abdmService } from "@workspace/api-server/src/abdm";
```

### Key Methods

#### Aadhaar-based ABHA Registration
```typescript
// Step 1: Generate OTP
const initResult = await abdmService.initiateAbhaRegistrationWithAadhaar(aadhaarNumber);
// Returns: { transactionId, response: { txnId, message, ... } }

// Step 2: Verify OTP
const verifyResult = await abdmService.verifyAbhaRegistrationWithAadhaar(transactionId, otp);
// Returns: { transactionId, abhaNumber, abhaAddress, profile: { ... } }
```

#### Mobile-based ABHA Registration
```typescript
// Step 1: Generate OTP
const initResult = await abdmService.initiateAbhaRegistrationWithMobile(mobileNumber);

// Step 2: Verify OTP
const verifyResult = await abdmService.verifyAbhaRegistrationWithMobile(
  transactionId, otp, name, gender, dateOfBirth
);
// Returns: { transactionId, abhaNumber, abhaAddress, profile: { ... } }
```

#### ABHA Authentication (Login)
```typescript
// Step 1: Initiate auth
const initResult = await abdmService.initiateAbhaAuth(abhaNumber);

// Step 2: Verify OTP and authenticate
const authResult = await abdmService.verifyAbhaAuth(transactionId, otp);
// Returns: { transactionId, abhaNumber, name, token }
```

#### Link ABHA to Patient
```typescript
const result = await abdmService.linkAbhaToPatient(patientId, abhaNumber, abhaAddress);
// Returns: { success: true, patient: { ... } }
```

#### Get ABHA Profile
```typescript
const profile = await abdmService.getAbhaProfile(abhaNumber);
// Returns: ABHA profile details
```

## Features Implemented

✅ Aadhaar-based ABHA registration (send/verify OTP)
✅ Mobile-based ABHA registration (send/verify OTP)
✅ ABHA-based authentication (login)
✅ Linking ABHA to existing patient records
✅ Fetching ABHA profile information
✅ Duplicate ABHA detection and prevention
✅ Proper error handling and validation
✅ Environment-based configuration (sandbox/production)
✅ Sandbox mode support with demo OTP (123456) for development
✅ Comprehensive logging and audit readiness

## Security Considerations

- Never logs sensitive information (ABHA numbers, OTPs, etc.)
- Uses environment variables for secrets
- Implements proper validation for all inputs
- Prepares for production use with real ABDM credentials
- Maintains patient data privacy and consent requirements

## Testing

In development/testing environments, the service uses:
- Demo OTP: `123456` for all verification flows
- Mock responses when actual ABDM API credentials are not available
- Clear demarcation of demo/sandbox responses with `_demoNote` fields

In production, the service requires valid ABDM API credentials and will make actual API calls to ABDM endpoints.

## Dependencies

- `zod`: For configuration validation
- `@workspace/db`: For database access
- `crypto`: For internal JWT token generation (separate from ABDM tokens)

## Future Enhancements

1. **Consent Management**: Implement ABDM consent requests, grants, and revocations
2. **Health Information Exchange**: Add HIE workflows for sharing medical records
3. **PHR Integration**: Personal Health Record integration
4. **Sandbox Testing**: Automated tests against ABDM sandbox environment
5. **Error Recovery**: Improved retry mechanisms and circuit breakers
6. **Monitoring**: Integration health metrics and dashboards

## Compliance Notes

This implementation follows ABDM API specifications but requires:
- Valid ABDM API credentials for production use
- Proper facility registration as a Health Information Provider (HIP)
- Compliance with ABDM security and privacy requirements
- Patient consent for all ABDM interactions as per ABDM guidelines

See the official ABDM documentation at https://abdm.gov.in/ for complete requirements.