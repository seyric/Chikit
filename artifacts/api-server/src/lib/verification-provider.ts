/**
 * Provider interface for Aadhaar verification
 * This allows integrating with different authorized Aadhaar verification providers
 * (e.g., UIDAI API, authorized authentication agencies, or offline e-KYC services)
 */
export interface IAadhaarVerificationProvider {
  /**
   * Initiate Aadhaar verification
   * @param aadhaarNumber - The Aadhaar number to verify (without spaces)
   * @returns Transaction ID and any additional data needed for the next step
   */
  initiateVerification(aadhaarNumber: string): Promise<{
    transactionId: string;
    // Provider-specific data for the verification process
    [key: string]: any;
  }>;

  /**
   * Verify OTP for Aadhaar verification
   * @param transactionId - The transaction ID returned from initiateVerification
   * @param otp - The OTP entered by the user
   * @returns Verification result and any verified identity details (excluding raw Aadhaar number)
   */
  verifyOtp(transactionId: string, otp: string): Promise<{
    success: boolean;
    // Timestamp when Aadhaar was verified (ISO string)
    aadhaarVerifiedAt?: string;
    // Reference to the verification transaction (from provider)
    verificationReference?: string;
    // Any additional verified details (name, gender, date of birth, mobile) - if permitted and needed
    // Note: We should avoid storing raw Aadhaar number as per regulations
    verifiedDetails?: {
      name?: string;
      gender?: string;
      dateOfBirth?: string;
      mobile?: string;
    };
  }>;
}

/**
 * Mock Aadhaar verification provider for development and testing
 * In production, this should be replaced with an authorized provider implementation
 */
export class MockAadhaarVerificationProvider implements IAadhaarVerificationProvider {
  async initiateVerification(aadhaarNumber: string): Promise<{
    transactionId: string;
  }> {
    // Clean the Aadhaar number (remove spaces, etc.)
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");

    if (!/^\d{12}$/.test(cleanAadhaar)) {
      throw new Error("Invalid Aadhaar number. Must be 12 digits.");
    }

    const transactionId = `MOCK_AADHAAR_TXN_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Simulate successful initiation
    return {
      transactionId,
      ...(process.env.NODE_ENV === "development" && {
        _demoNote: "In real implementation, OTP would be sent to Aadhaar-linked mobile number",
        _sandboxOtp: "123456" // Only for development/testing
      })
    };
  }

  async verifyOtp(transactionId: string, otp: string): Promise<{
    success: boolean;
    aadhaarVerifiedAt?: string;
    verificationReference?: string;
    verifiedDetails?: {
      name?: string;
      gender?: string;
      dateOfBirth?: string;
      mobile?: string;
    };
  }> {
    // Validate OTP (in a real implementation, this would be done by the provider)
    // For now, we simulate verification
    const isValid =
      otp === "123456" && process.env.NODE_ENV !== "production"
        ? true
        : false; // In production, we'd validate against the provider

    if (!isValid) {
      return { success: false };
    }

    // Simulate successful verification
    const verificationReference = `MOCK_AADHAAR_VER_${Date.now()}`;

    // Return mock verified details (in a real implementation, these would come from the provider)
    // Note: In a real implementation, we would get these details from the provider
    // but we should be careful about what we store and for what purpose
    return {
      success: true,
      aadhaarVerifiedAt: new Date().toISOString(),
      verificationReference,
      verifiedDetails: {
        name: "Verified User",
        gender: "male",
        dateOfBirth: "1990-01-01",
        mobile: "9000000000",
      },
    };
  }
}

/**
 * Provider manager to get the configured Aadhaar verification provider
 * In a real implementation, this would read from configuration and initialize the appropriate provider
 */
export class AadhaarVerificationProviderManager {
  private static instance: IAadhaarVerificationProvider;

  static getProvider(): IAadhaarVerificationProvider {
    if (!this.instance) {
      // In development, use the mock provider
      // In production, this should be configured based on environment variables
      // and should initialize an authorized provider
      if (process.env.NODE_ENV === "production") {
        // TODO: Initialize real provider based on config
        // For now, we'll throw an error to indicate that a real provider must be configured
        throw new Error(
          "No Aadhaar verification provider configured. Please set up an authorized provider in production."
        );
      }
      this.instance = new MockAadhaarVerificationProvider();
    }
    return this.instance;
  }
}