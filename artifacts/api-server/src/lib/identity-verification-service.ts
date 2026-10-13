import { db } from "@workspace/db";
import {
  identityVerificationConsentTable,
  patientVerificationAttemptsTable
} from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { AadhaarVerificationProviderManager, IAadhaarVerificationProvider } from "./verification-provider";

/**
 * Identity Verification Service for handling identity verification workflows
 * This service handles Aadhaar verification (via provider abstraction), consent logging, and verification attempt tracking
 */
export class IdentityVerificationService {
  private provider: IAadhaarVerificationProvider;

  constructor() {
    this.provider = AadhaarVerificationProviderManager.getProvider();
  }

  /**
   * Log a verification attempt for security and audit
   */
  async logVerificationAttempt(options: {
    patientId?: number;
    phoneNumber?: string;
    verificationType: string;
    verificationMethod: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
    attemptMetadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await db.insert(patientVerificationAttemptsTable).values({
        patientId: options.patientId ?? null,
        phoneNumber: options.phoneNumber ?? null,
        verificationType: options.verificationType,
        verificationMethod: options.verificationMethod,
        status: options.status,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        failureReason: options.failureReason,
        attemptMetadata: options.attemptMetadata ?? {},
      });
    } catch (error: unknown) {
      // Logging failure should not break the verification flow
      console.error("Failed to log verification attempt:", error);
    }
  }

  /**
   * Initiate Aadhaar verification via provider abstraction
   * Delegates to the configured Aadhaar verification provider
   */
  async initiateAadhaarVerification(aadhaarNumber: string): Promise<{
    transactionId: string;
    // Provider-specific data for the verification process
    [key: string]: any;
  }> {
    // Clean the Aadhaar number (remove spaces, etc.)
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");

    if (!/^\d{12}$/.test(cleanAadhaar)) {
      throw new Error("Invalid Aadhaar number. Must be 12 digits.");
    }

    // Delegate to the provider
    return this.provider.initiateVerification(cleanAadhaar);
  }

  /**
   * Verify Aadhaar OTP via provider abstraction
   * Delegates to the configured Aadhaar verification provider
   */
  async verifyAadhaarOtp(
    transactionId: string,
    otp: string
  ): Promise<{
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
  }> {
    // Delegate to the provider
    const result = await this.provider.verifyOtp(transactionId, otp);

    // Log the attempt based on the result
    if (result.success) {
      await this.logVerificationAttempt({
        verificationType: "aadhaar",
        verificationMethod: "verify_otp",
        status: "success",
        attemptMetadata: { verificationReference: result.verificationReference },
      });
    } else {
      await this.logVerificationAttempt({
        verificationType: "aadhaar",
        verificationMethod: "verify_otp",
        status: "failed",
        failureReason: "Invalid OTP or verification failed",
      });
    }

    return result;
  }

  /**
   * Record identity verification consent
   */
  async recordIdentityVerificationConsent(options: {
    patientId: number;
    consentType: string; // e.g., 'aadhaar', 'abha', 'digilocker', 'govt_id'
    consentGranted: boolean;
    verificationMethod?: string;
    verificationReference?: string;
    verifiedBy?: number; // user ID who verified/processed the consent
    consentVersion?: string;
    purpose?: string;
  }): Promise<any> {
    try {
      const consentData = {
        patientId: options.patientId,
        consentType: options.consentType,
        consentGranted: options.consentGranted,
        consentDate: options.consentGranted ? new Date() : null,
        consentExpiryDate: null, // We'll leave this null for now; could be set based on consentVersion or purpose
        verificationMethod: options.verificationMethod,
        verificationReference: options.verificationReference,
        verifiedBy: options.verifiedBy,
        consentWithdrawn: false,
        withdrawalDate: null,
        withdrawalReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.insert(identityVerificationConsentTable).values(consentData).returning();

      return {
        success: true,
        consent: result[0],
      };
    } catch (error: unknown) {
      throw new Error(`Failed to record identity verification consent: ${(error as Error).message}`);
    }
  }

  /**
   * Check if patient has valid consent for a specific verification type
   */
  async hasValidConsent(options: {
    patientId: number;
    consentType: string;
  }): Promise<{
    hasConsent: boolean;
    consentRecord: any | null;
    consentStatus: string; // e.g., 'granted', 'denied', 'expired', 'withdrawn'
  }> {
    try {
      const result = await db
        .select()
        .from(identityVerificationConsentTable)
        .where(
          and(
            eq(identityVerificationConsentTable.patientId, options.patientId),
            eq(identityVerificationConsentTable.consentType, options.consentType)
          )
        )
        .orderBy(desc(identityVerificationConsentTable.createdAt))
        .limit(1);

      if (result.length === 0) {
        return { hasConsent: false, consentRecord: null, consentStatus: "no_consent" };
      }

      const consentRecord = result[0];

      // Check if consent has been withdrawn
      if (consentRecord.consentWithdrawn) {
        return {
          hasConsent: false,
          consentRecord,
          consentStatus: "withdrawn",
        };
      }

      // Check if consent has expired
      if (
        consentRecord.consentExpiryDate &&
        new Date(consentRecord.consentExpiryDate) < new Date()
      ) {
        return {
          hasConsent: false,
          consentRecord,
          consentStatus: "expired",
        };
      }

      // Check if consent was granted
      if (consentRecord.consentGranted) {
        return {
          hasConsent: true,
          consentRecord,
          consentStatus: "active",
        };
      }

      return {
        hasConsent: false,
        consentRecord,
        consentStatus: "not_granted",
      };
    } catch (error: unknown) {
      throw new Error(`Failed to check consent status: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const identityVerificationService = new IdentityVerificationService();