// @ts-nocheck
import { eq, and, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  caseConsentsTable,
  patientsTable,
  usersTable,
  hospitalsTable,
  caseGraphsTable,
} from "@workspace/db/schema";
import { ABDMService } from "../abdm/service";
import { z } from "zod";

// Consent Service Class
export class ConsentService {
  constructor(private abdmService: ABDMService) {}

  // Grant research consent for a patient
  async grantResearchConsent(options: {
    patientId: number;
    grantedBy: number; // user ID
    dataSharingScope?: string;
    allowedDataTypes?: string[];
    prohibitedDataTypes?: string[];
    researchStudyId?: string;
    researchPurpose?: string;
    consentExpiryDate?: Date;
    abdmConsentToken?: string; // Token from ABDM consent artifact
  }): Promise<any> {
    try {
      // Verify patient exists
      const patient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, options.patientId),
      });

      if (!patient) {
        throw new Error("Patient not found");
      }

      // Verify ABHA number exists for the patient
      if (!patient.abhaNumber) {
        throw new Error("Patient does not have an ABHA number");
      }

      // Verify with ABDM if consent token provided
      let abdmVerificationResult = null;
      if (options.abdmConsentToken) {
        abdmVerificationResult = await this.abdmService.verifyConsent(
          patient.abhaNumber,
          options.abdmConsentToken,
        );

        if (!abdmVerificationResult.verified) {
          throw new Error("ABDM consent verification failed");
        }
      }

      // Check if consent record already exists
      let existingConsent = await db.query.caseConsentsTable.findFirst({
        where: eq(caseConsentsTable.patientId, options.patientId),
      });

      const now = new Date();
      const consentData = {
        patientId: options.patientId,
        abhaNumberHash: await this.generateABHHash(patient.abhaNumber || ""),
        consentGranted: true,
        consentDate: now,
        consentExpiryDate: options.consentExpiryDate,
        dataSharingScope: options.dataSharingScope || "hospital_only",
        allowedDataTypes: options.allowedDataTypes || [],
        prohibitedDataTypes: options.prohibitedDataTypes || [],
        researchStudyId: options.researchStudyId,
        researchPurpose: options.researchPurpose,
        consentWithdrawn: false,
        withdrawalDate: null,
        withdrawalReason: null,
        verifiedBy: options.grantedBy,
        verificationMethod: options.abdmConsentToken
          ? "abdm_consent_api"
          : "hospital_consent_portal",
        verificationDate: now,
        createdAt: now,
        updatedAt: now,
      };

      let consentRecord;
      if (existingConsent) {
        // Update existing consent
        [consentRecord] = await db
          .update(caseConsentsTable)
          .set(consentData)
          .where(eq(caseConsentsTable.id, existingConsent.id))
          .returning();
      } else {
        // Create new consent
        [consentRecord] = await db
          .insert(caseConsentsTable)
          .values(consentData)
          .returning();
      }

      // Create provenance ledger entry
      const provenanceService = await import("./provenance.service").then(
        (m) => m.default,
      );
      // Note: In a real implementation, we'd inject this dependency
      // For now, we'll skip direct provenance creation to avoid circular dependency issues

      return {
        success: true,
        consent: consentRecord,
        abdmVerification: abdmVerificationResult,
        message: "Research consent granted successfully",
      };
    } catch (error) {
      throw new Error(`Failed to grant research consent: ${error.message}`);
    }
  }

  // Withdraw research consent for a patient
  async withdrawConsent(options: {
    patientId: number;
    withdrawnBy: number; // user ID
    withdrawalReason?: string;
  }): Promise<any> {
    try {
      // Verify patient exists
      const patient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, options.patientId),
      });

      if (!patient) {
        throw new Error("Patient not found");
      }

      // Get existing consent
      const existingConsent = await db.query.caseConsentsTable.findFirst({
        where: and(
          eq(caseConsentsTable.patientId, options.patientId),
          eq(caseConsentsTable.consentGranted, true),
          or(
            eq(caseConsentsTable.consentWithdrawn, false),
            isNull(caseConsentsTable.consentWithdrawn),
          ),
        ),
      });

      if (!existingConsent) {
        throw new Error("No active research consent found for this patient");
      }

      const now = new Date();
      const withdrawalData = {
        consentGranted: false,
        consentWithdrawn: true,
        withdrawalDate: now,
        withdrawalReason:
          options.withdrawalReason || "Consent withdrawn by patient/hospital",
        verifiedBy: options.withdrawnBy,
        verificationMethod: "hospital_consent_portal",
        verificationDate: now,
        updatedAt: now,
      };

      // Update consent record
      const [consentRecord] = await db
        .update(caseConsentsTable)
        .set(withdrawalData)
        .where(eq(caseConsentsTable.id, existingConsent.id))
        .returning();

      return {
        success: true,
        consent: consentRecord,
        message: "Research consent withdrawn successfully",
      };
    } catch (error) {
      throw new Error(`Failed to withdraw consent: ${error.message}`);
    }
  }

  // Check if patient has valid consent for research participation
  async hasValidConsent(patientId: number): Promise<{
    hasConsent: boolean;
    consentRecord: any | null;
    consentStatus: string;
  }> {
    try {
      const consentRecord = await db.query.caseConsentsTable.findFirst({
        where: and(
          eq(caseConsentsTable.patientId, patientId),
          eq(caseConsentsTable.consentGranted, true),
          or(
            eq(caseConsentsTable.consentWithdrawn, false),
            isNull(caseConsentsTable.consentWithdrawn),
          ),
        ),
      });

      if (!consentRecord) {
        return {
          hasConsent: false,
          consentRecord: null,
          consentStatus: "no_consent",
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

      return {
        hasConsent: true,
        consentRecord,
        consentStatus: "active",
      };
    } catch (error) {
      throw new Error(`Failed to check consent status: ${error.message}`);
    }
  }

  // Get consent details for a patient
  async getPatientConsent(patientId: number): Promise<any> {
    try {
      const consentRecord = await db.query.caseConsentsTable.findFirst({
        where: eq(caseConsentsTable.patientId, patientId),
        with: {
          verifiedByUser: true,
          patient: true,
        },
      });

      if (!consentRecord) {
        return null;
      }

      return consentRecord;
    } catch (error) {
      throw new Error(`Failed to get patient consent: ${error.message}`);
    }
  }

  // Get all patients with active research consent for a hospital
  async getHospitalConsentedPatients(
    hospitalId: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any> {
    try {
      const patients = await db.query.patientsTable.findMany({
        where: and(
          eq(patientsTable.hospitalId, hospitalId),
          // Join with consents to filter only those with active consent
          sql`${patientsTable.id} IN (
            SELECT ${caseConsentsTable.patientId}
            FROM ${caseConsentsTable}
            WHERE ${caseConsentsTable.patientId} = ${patientsTable.id}
              AND ${caseConsentsTable.consentGranted} = true
              AND (${caseConsentsTable.consentWithdrawn} = false OR ${caseConsentsTable.consentWithdrawn} IS NULL)
              AND (${caseConsentsTable.consentExpiryDate} IS NULL OR ${caseConsentsTable.consentExpiryDate} >= NOW())
          )`,
        ),
        limit,
        offset,
        with: {
          consent: true,
        },
      });

      // Get total count
      const countResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(patientsTable)
        .where(
          and(
            eq(patientsTable.hospitalId, hospitalId),
            sql`${patientsTable.id} IN (
            SELECT ${caseConsentsTable.patientId}
            FROM ${caseConsentsTable}
            WHERE ${caseConsentsTable.patientId} = ${patientsTable.id}
              AND ${caseConsentsTable.consentGranted} = true
              AND (${caseConsentsTable.consentWithdrawn} = false OR ${caseConsentsTable.consentWithdrawn} IS NULL)
              AND (${caseConsentsTable.consentExpiryDate} IS NULL OR ${caseConsentsTable.consentExpiryDate} >= NOW())
          )`,
          ),
        );

      const total = Number(countResult[0].count || 0);

      return {
        patients,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get hospital consented patients: ${error.message}`,
      );
    }
  }

  // Helper methods

  private async generateABHHash(abhaNumber: string): Promise<string> {
    if (!abhaNumber) return "";
    const input = `abha-${abhaNumber}-chikit-2026`;
    // Simple hash - in production use proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return ((hash & 0xffffffff) >>> 0).toString(16).padStart(8, "0");
  }
}

// Helper function for SQL IS NULL
function isNull(column: any): any {
  return sql`${column} IS NULL`;
}

export default ConsentService;
