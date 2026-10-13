import { ABDMConfig, getABDMConfig, validateABDMConfig } from "./config.js";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

/**
 * ABDM Service for integrating with Ayushman Bharat Digital Mission APIs
 * This service handles ABHA creation, verification, linking, and other ABDM workflows
 */
export class ABDMService {
  private config: ABDMConfig;

  constructor() {
    this.config = getABDMConfig();
    const validationResult = validateABDMConfig(this.config);
    if (!validationResult.success) {
      console.warn("ABDM Configuration validation failed:", validationResult.error.errors);
      // In development, we might allow this to continue with warnings
      // In production, this should throw an error
      if (process.env.NODE_ENV === "production") {
        throw new Error("Invalid ABDM configuration");
      }
    }
  }

  /**
   * Get authorization headers for ABDM API requests
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-HIP-ID": this.config.hipId,
    };
  }

  /**
   * Generate a secure transaction ID for ABDM interactions
   */
  private generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ABHA Creation/Linking via Aadhaar
   * Step 1: Send OTP to Aadhaar-linked mobile number
   */
  async initiateAbhaRegistrationWithAadhaar(aadhaarNumber: string) {
    // Clean the Aadhaar number (remove spaces, etc.)
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");

    if (!/^\d{12}$/.test(cleanAadhaar)) {
      throw new Error("Invalid Aadhaar number. Must be 12 digits.");
    }

    const transactionId = this.generateTransactionId();

    // In a real implementation, this would call the ABDM API
    // For now, we'll simulate the API call structure
    const requestBody = {
      requestId: transactionId,
      timestamp: new Date().toISOString(),
      hipId: this.config.hipId,
      aadhaarNumber: cleanAadhaar,
    };

    // TODO: Replace with actual ABDM API call when SDK is available
    // const response = await fetch(`${this.config.baseUrl}/api/abha/auth/init`, {
    //   method: 'POST',
    //   headers: this.getAuthHeaders(),
    //   body: JSON.stringify(requestBody)
    // });

    // For now, return a simulated response that matches ABDM API structure
    return {
      transactionId,
      requestId: transactionId,
      response: {
        txnId: transactionId,
        status: "initiated",
        message: "OTP sent to Aadhaar-linked mobile number",
        // In sandbox mode, ABDM might return additional info
        ...(process.env.NODE_ENV === "development" && {
          _demoNote: "In real implementation, OTP would be sent to mobile linked with Aadhaar",
          _sandboxOtp: "123456" // Only for development/testing
        })
      }
    };
  }

  /**
   * Verify OTP for Aadhaar-based ABHA registration
   */
  async verifyAbhaRegistrationWithAadhaar(transactionId: string, otp: string) {
    // Validate transaction exists and is not expired
    // In a real implementation, we'd store transaction details and validate against ABDM
    // For now, we'll simulate the verification

    if (otp !== "123456" && process.env.NODE_ENV !== "production") {
      // Allow demo OTP in non-production environments
      // In production, this would validate against ABDM servers
    }

    // TODO: Replace with actual ABDM API call
    // const response = await fetch(`${this.config.baseUrl}/api/abha/auth/verify`, {
    //   method: 'POST',
    //   headers: this.getAuthHeaders(),
    //   body: JSON.stringify({ txnId: transactionId, otp })
    // });

    // Simulate successful verification
    const abhaNumber = this.generateAbhaNumber();
    const abhaAddress = this.generateAbhaAddress(`ABHA_User_${Date.now()}`);

    return {
      transactionId,
      abhaNumber,
      abhaAddress,
      name: "Verified User", // Would come from ABDM in real implementation
      gender: "male",        // Would come from ABDM in real implementation
      dateOfBirth: "1990-01-01", // Would come from ABDM in real implementation
      mobile: "9000000000",  // Would come from ABDM in real implementation
      // In sandbox mode, ABDM might return additional info
      ...(process.env.NODE_ENV === "development" && {
        _demoNote: "ABHA successfully created/verified",
        _sandboxNote: "In production, this would return actual user details from ABDM"
      })
    };
  }

  /**
   * ABHA Creation/Linking via Mobile Number
   * Step 1: Send OTP to mobile number
   */
  async initiateAbhaRegistrationWithMobile(mobileNumber: string) {
    // Clean the mobile number
    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);

    if (!/^\d{10}$/.test(cleanMobile)) {
      throw new Error("Invalid mobile number. Must be 10 digits.");
    }

    const transactionId = this.generateTransactionId();

    // TODO: Replace with actual ABDM API call
    return {
      transactionId,
      requestId: transactionId,
      response: {
        txnId: transactionId,
        status: "initiated",
        message: `OTP sent to mobile number ending in ${cleanMobile.substring(6)}`,
        ...(process.env.NODE_ENV === "development" && {
          _demoNote: "In real implementation, OTP would be sent to the provided mobile number",
          _sandboxOtp: "123456"
        })
      }
    };
  }

  /**
   * Verify OTP for Mobile-based ABHA registration
   */
  async verifyAbhaRegistrationWithMobile(transactionId: string, otp: string,
                                        name?: string, gender?: string,
                                        dateOfBirth?: string) {
    // TODO: Replace with actual ABDM API call

    // Simulate successful verification
    const resolvedName = name || "ABHA User";
    const abhaNumber = this.generateAbhaNumber();
    const abhaAddress = this.generateAbhaAddress(resolvedName);

    return {
      transactionId,
      abhaNumber,
      abhaAddress,
      profile: {
        name: resolvedName,
        gender: gender || "male",
        dateOfBirth: dateOfBirth || "",
        mobile: "9000000000", // Would come from ABDM in real implementation
      },
      ...(process.env.NODE_ENV === "development" && {
        _demoNote: "Mobile-based ABHA registration successful",
        _sandboxNote: "In production, this would return actual user details from ABDM"
      })
    };
  }

  /**
   * ABHA Authentication (Login)
   * Step 1: Initiate authentication
   */
  async initiateAbhaAuth(abhaNumber: string) {
    const cleanAbha = abhaNumber.replace(/-/g, "");

    if (!/^\d{14}$/.test(cleanAbha)) {
      throw new Error("Invalid ABHA number. Must be 14 digits.");
    }

    const transactionId = this.generateTransactionId();

    // TODO: Replace with actual ABDM API call
    return {
      transactionId,
      requestId: transactionId,
      response: {
        txnId: transactionId,
        status: "initiated",
        message: "OTP sent to ABHA-linked mobile number",
        ...(process.env.NODE_ENV === "development" && {
          _demoNote: "In real implementation, OTP would be sent to mobile linked with ABHA",
          _sandboxOtp: "123456"
        })
      }
    };
  }

  /**
   * Verify OTP for ABHA authentication
   */
  async verifyAbhaAuth(transactionId: string, otp: string) {
    // TODO: Replace with actual ABDM API call to verify ABHA and get user details

    // For now, simulate by checking if ABHA exists in our database
    const cleanAbha = otp === "123456" && process.env.NODE_ENV !== "production"
      ? "12345678901234" // Demo ABHA for testing
      : ""; // In production, we'd extract from transaction

    if (cleanAbha) {
      // Check if this ABHA is already linked to a patient in our system
      const patientResult = await db.execute(
        sql`SELECT p.id, p.name, p.abha_number, u.id as user_id, u.email, u.role
            FROM patients p
            JOIN users u ON (p.email = u.email OR p.phone = u.phone)
            WHERE REPLACE(p.abha_number, '-', '') = ${cleanAbha}
            LIMIT 1`
      );

      const patient = patientResult.rows[0];

      if (patient) {
        // Generate JWT token for our system
        const token = this.generateJwtToken({
          id: patient.user_id,
          email: patient.email || "",
          name: patient.name,
          role: patient.role,
          hospitalId: null // Would come from user/hospital mapping
        });

        return {
          transactionId,
          abhaNumber: patient.abha_number,
          name: patient.name,
          token,
          ...(process.env.NODE_ENV === "development" && {
            _demoNote: "ABHA authentication successful - user found in Chikit system"
          })
        };
      }
    }

    // If ABHA not found in our system, return error (would need to register first)
    throw new Error("No Chikit account linked to this ABHA. Please register first.");
  }

  /**
   * Link ABHA to existing patient record
   */
  async linkAbhaToPatient(patientId: number, abhaNumber: string, abhaAddress?: string) {
    const cleanAbha = abhaNumber.replace(/-/g, "");

    if (!/^\d{14}$/.test(cleanAbha)) {
      throw new Error("Invalid ABHA number format");
    }

    // Check if ABHA is already linked to another patient
    const existingPatient = await db.execute(
      sql`SELECT id FROM patients WHERE REPLACE(abha_number, '-', '') = ${cleanAbha} AND id != ${patientId}`
    );

    if (existingPatient.rows.length > 0) {
      throw new Error("This ABHA number is already linked to another patient");
    }

    // Format ABHA number with standard formatting (XXX-XXXX-XXXX-XXXX)
    const formattedAbha = cleanAbha.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, "$1-$2-$3-$4");

    // Update patient record with ABHA details
    await db.execute(
      sql`UPDATE patients
          SET abha_number = ${formattedAbha},
              abha_address = ${abhaAddress || null},
              abha_verified = true,
              abha_linked_at = NOW()
          WHERE id = ${patientId}`
    );

    // Return updated patient record
    const result = await db.execute(
      sql`SELECT id, name, abha_number, abha_address, abha_verified, abha_linked_at
          FROM patients WHERE id = ${patientId}`
    );

    return {
      success: true,
      patient: result.rows[0]
    };
  }

  /**
   * Get ABHA profile/details
   * Note: In real implementation, this would call ABDM APIs to fetch profile
   */
  async getAbhaProfile(abhaNumber: string) {
    const cleanAbha = abhaNumber.replace(/-/g, "");

    // TODO: Replace with actual ABDM API call to fetch ABHA profile
    // const response = await fetch(`${this.config.baseUrl}/api/abha/profile/${cleanAbha}`, {
    //   method: 'GET',
    //   headers: this.getAuthHeaders()
    // });

    // For now, fetch from our database if available
    const patientResult = await db.execute(
      sql`SELECT id, name, abha_number, abha_address, abha_verified, abha_linked_at,
                 date_of_birth, gender, phone
          FROM patients
          WHERE REPLACE(abha_number, '-', '') = ${cleanAbha}
          LIMIT 1`
    );

    const patient = patientResult.rows[0];

    if (!patient) {
      throw new Error("ABHA not found in Chikit system");
    }

    return {
      abhaNumber: patient.abha_number,
      abhaAddress: patient.abha_address,
      abhaVerified: patient.abha_verified,
      abhaLinkedAt: patient.abha_linked_at,
      name: patient.name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      ...(process.env.NODE_ENV === "development" && {
        _demoNote: "Profile fetched from Chikit database. In production, this might fetch from ABDM"
      })
    };
  }

  /**
   * Generate a formatted ABHA number (for demo purposes)
   * In production, this would come from ABDM API
   */
  private generateAbhaNumber(): string {
    // Generate 14-digit ABHA number (as per ABDM specs)
    const randomDigits = () => Math.floor(Math.random() * 9000) + 1000; // 4-digit number
    return `${randomDigits()}-${randomDigits()}-${randomDigits()}-${randomDigits()}`;
  }

  /**
   * Generate ABHA address (for demo purposes)
   * In production, this would come from ABDM API or be based on naming conventions
   */
  private generateAbhaAddress(name: string): string {
    const cleanName = name.toLowerCase().replace(/\s+/g, ".");
    const randomSuffix = Math.floor(Math.random() * 900) + 100; // 3-digit number
    return `${cleanName}${randomSuffix}@abdm`;
  }

  /**
   * Generate JWT token for internal authentication
   * (This is separate from ABDM tokens)
   */
  private generateJwtToken(payload: any): string {
    const tokenPayload = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    const encoded = Buffer.from(tokenPayload).toString("base64");
    // In production, use a proper secret from environment
    const secret = process.env.JWT_SECRET || "chikit_jwt_secret_2024";
    const sig = require("crypto").createHmac("sha256", secret).update(encoded).digest("hex");
    return `${encoded}.${sig}`;
  }
}

// Export singleton instance
export const abdmService = new ABDMService();