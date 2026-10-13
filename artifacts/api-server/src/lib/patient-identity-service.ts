// @ts-nocheck
import { db } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { patientsTable, InsertPatient } from "@workspace/db/schema";
import { identityVerificationConsentTable } from "@workspace/db/schema";
// We'll define the generation functions here to avoid circular dependency

/**
 * Generate a patient code (PT + timestamp + random)
 */
function generatePatientCode(): string {
  return "PT" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100).toString().padStart(2, "0");
}

/**
 * Generate a Chikit Health ID (CHK-YEAR-RANDOM)
 */
function generateChikitHealthId(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CHK-${year}-${suffix}`;
}

/**
 * Patient Identity Service for handling patient registration and identity resolution
 * This service handles creating patient records from verified identity data,
 * duplicate detection, and identity resolution.
 */
export class PatientIdentityService {
  /**
   * Check for potential duplicate patients based on identity information
   * Returns a list of potential matches with confidence scores
   */
  async findPotentialDuplicates(options: {
    phone?: string;
    abhaNumber?: string; // Note: we may not have the raw ABHA number, but we might have a hash or reference
    govtIdType?: string;
    govtIdNumber?: string;
    name?: string;
    dateOfBirth?: string;
  }): Promise<Array<{
    patient: any;
    confidence: number; // 0-100
    matchReasons: string[];
  }>> {
    const { phone, abhaNumber, govtIdType, govtIdNumber, name, dateOfBirth } = options;

    // Build dynamic query based on available information
    // We'll search for patients that match on any of the available identifiers
    // and then score them based on how many match

    // Start with all active patients
    let query = db.select().from(patientsTable).where(eq(patientsTable.isActive, true));

    // We'll execute the query and then score in memory for simplicity
    // For a large dataset, we would want to do more sophisticated indexing
    const allPatients = await query;

    const potentialMatches: Array<{
      patient: any;
      confidence: number;
      matchReasons: string[];
    }> = [];

    for (const patient of allPatients) {
      let confidence = 0;
      const matchReasons: string[] = [];

      // Check phone match
      if (phone && patient.phone && phone === patient.phone) {
        confidence += 30;
        matchReasons.push("Phone number matches");
      }

      // Check ABHA match (if we have ABHA number)
      // Note: We store abhaNumber in patients table, but we may not have the raw ABHA number during verification
      // We might have a hashed or referenced ABHA number. For now, we'll assume we can compare if we have it.
      if (abhaNumber && patient.abhaNumber && abhaNumber === patient.abhaNumber) {
        confidence += 30;
        matchReasons.push("ABHA number matches");
      }

      // Check government ID match
      if (
        govtIdType &&
        govtIdNumber &&
        patient.govtIdType &&
        patient.govtIdNumber &&
        govtIdType === patient.govtIdType &&
        govtIdNumber === patient.govtIdNumber
      ) {
        confidence += 25;
        matchReasons.push("Government ID matches");
      }

      // Check name and date of birth match (fuzzy matching could be added)
      if (name && patient.name && name.toLowerCase() === patient.name.toLowerCase()) {
        confidence += 10;
        matchReasons.push("Name matches");
      }
      if (dateOfBirth && patient.dateOfBirth && dateOfBirth === patient.dateOfBirth) {
        confidence += 10;
        matchReasons.push("Date of birth matches");
      }

      // If confidence is above a threshold, consider it a potential duplicate
      if (confidence >= 20) {
        potentialMatches.push({
          patient,
          confidence,
          matchReasons,
        });
      }
    }

    // Sort by confidence descending
    potentialMatches.sort((a, b) => b.confidence - a.confidence);

    return potentialMatches;
  }

  /**
   * Create a new patient record from verified identity data
   * This should be called after identity verification and consent have been obtained
   */
  async createPatient(options: {
    // Identity verification data (from verification services)
    phone?: string; // Verified phone number
    abhaNumber?: string; // Verified ABHA number (if ABHA verification was done)
    aadhaarVerifiedAt?: string; // Timestamp when Aadhaar was verified
    abhaVerifiedAt?: string; // Timestamp when ABHA was verified/linked
    digiLockerConnectedAt?: string; // Timestamp when DigiLocker was connected
    govtIdType?: string; // Verified government ID type
    govtIdNumber?: string; // Verified government ID number
    // Profile data
    name: string;
    dateOfBirth: string;
    gender: "male" | "female" | "other";
    bloodGroup?: string;
    email?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    allergies?: string;
    chronicConditions?: string;
    // Optional: hospitalId if known (for new patient registration, this might be null)
    hospitalId?: number;
    // Consent and verification metadata
    verifiedBy?: number; // User ID who performed the verification (if applicable)
    userId: number; // User ID to link to the users table
  }): Promise<any> {
    try {
      // Check for potential duplicates before creating
      const potentialDuplicates = await this.findPotentialDuplicates({
        phone: options.phone,
        abhaNumber: options.abhaNumber,
        govtIdType: options.govtIdType,
        govtIdNumber: options.govtIdNumber,
        name: options.name,
        dateOfBirth: options.dateOfBirth,
      });

      // If we found high-confidence duplicates, we might want to flag for manual review
      // For now, we'll proceed with creation but note that in a real implementation,
      // we might want to return the duplicates for manual resolution if confidence is high
      const highConfidenceDuplicates = potentialDuplicates.filter(
        (dup) => dup.confidence >= 80
      );

      // Generate identifiers
      const patientCode = generatePatientCode();
      const chikitHealthId = generateChikitHealthId();

      // Prepare patient data
      const patientData: InsertPatient = {
        patientCode,
        chikitHealthId,
        name: options.name,
        dateOfBirth: options.dateOfBirth,
        gender: options.gender,
        bloodGroup: options.bloodGroup ?? null,
        phone: options.phone ?? null,
        email: options.email ?? null,
        address: options.address ?? null,
        emergencyContact: options.emergencyContact ?? null,
        emergencyPhone: options.emergencyPhone ?? null,
        allergies: options.allergies ?? null,
        chronicConditions: options.chronicConditions ?? null,
        govtIdType: options.govtIdType ?? null,
        govtIdNumber: options.govtIdNumber ?? null,
        hospitalId: options.hospitalId ?? null,
        userId: options.userId,
        // Set verification timestamps
        identityVerifiedAt: new Date(), // At least identity verification is done at this point
        aadhaarVerifiedAt: options.aadhaarVerifiedAt
          ? new Date(options.aadhaarVerifiedAt)
          : null,
        abhaVerifiedAt: options.abhaVerifiedAt
          ? new Date(options.abhaVerifiedAt)
          : null,
        digiLockerConnectedAt: options.digiLockerConnectedAt
          ? new Date(options.digiLockerConnectedAt)
          : null,
        // Note: We don't set abhaVerified and abhaLinkedAt here unless we have ABHA verification
        // Those are set in the ABHA linking process or via ABHA verification service
        // We'll set abhaVerified based on whether we have an abhaNumber
        abhaVerified: !!options.abhaNumber,
        abhaLinkedAt: options.abhaVerifiedAt ? new Date(options.abhaVerifiedAt) : null,
        // abhaNumber itself
        abhaNumber: options.abhaNumber ?? null,
        abhaAddress: null, // We might get this from ABHA service if available
        isActive: true,
      };

      // Insert the patient
      const [newPatient] = await db
        .insert(patientsTable)
        .values(patientData)
        .returning();

      // If we have an ABHA number and we want to link it (though we already set abhaNumber above),
      // we might want to use the ABHA service to link it properly (which does additional checks)
      // For now, we'll just note that the ABHA number is stored.

      // If we have high-confidence duplicates, we might want to return them for review
      // For now, we'll just return the new patient and note the duplicates in the result if needed

      return {
        success: true,
        patient: newPatient,
        // In a real implementation, we might return potential duplicates for review
        // potentialDuplicates: highConfidenceDuplicates,
      };
    } catch (error: unknown) {
      // Handle unique constraint violation on userId
      if ((error as Error).message.includes("duplicate key") || (error as Error).message.includes("Unique constraint") || (error as Error).message.includes("violates unique constraint")) {
        throw new Error(`Patient record already exists for this user`);
      }
      throw new Error(`Failed to create patient: ${(error as Error).message}`);
    }
  }

  /**
   * Resolve a potential duplicate by linking to an existing patient or creating a new one
   * This would be used in a workflow where duplicates are found and a decision is made
   */
  async resolveDuplicate(options: {
    existingPatientId: number; // The existing patient to link to
    newPatientData: any; // The data for the new patient (same as createPatient options)
    action: "link" | "create_new"; // "link" means merge into existing patient, "create_new" means create anyway
    resolvedBy: number; // User ID who made the decision
    resolutionNote?: string; // Reason for the decision
  }): Promise<any> {
    try {
      if (options.action === "link") {
        // Link the new patient data to the existing patient
        // Update the existing patient with any new information (if not already present)
        // We'll implement a simple update: fill in missing fields from newPatientData
        const [existingPatient] = await db
          .select()
          .from(patientsTable)
          .where(eq(patientsTable.id, options.existingPatientId));

        if (!existingPatient) {
          throw new Error("Existing patient not found");
        }

        // Prepare update data: only update fields that are empty in existing patient
        const updateData: any = {};

        // Define fields to consider for updating if empty
        const updatableFields = [
          "name",
          "dateOfBirth",
          "gender",
          "bloodGroup",
          "phone",
          "email",
          "address",
          "emergencyContact",
          "emergencyPhone",
          "allergies",
          "chronicConditions",
          "govtIdType",
          "govtIdNumber",
          "hospitalId",
        ];

        for (const field of updatableFields) {
          const newValue = options.newPatientData[field];
          const existingValue = (existingPatient as any)[field];
          if (
            newValue !== null &&
            newValue !== undefined &&
            newValue !== "" &&
            (existingValue === null || existingValue === undefined || existingValue === "")
          ) {
            updateData[field] = newValue;
          }
        }

        // Also update verification timestamps if the new data has more recent verification
        // For simplicity, we'll set identityVerifiedAt to now if not already set
        if (!existingPatient.identityVerifiedAt) {
          updateData.identityVerifiedAt = new Date();
        }
        // Note: We should be careful not to overwrite more recent verification timestamps with older ones

        // Update the patient
        const [updatedPatient] = await db
          .update(patientsTable)
          .set(updateData)
          .where(eq(patientsTable.id, options.existingPatientId))
          .returning();

        // Log the resolution for audit
        // We could create an audit log entry here

        return {
          success: true,
          patient: updatedPatient,
          action: "linked",
          message: "Patient data linked to existing patient",
        };
      } else {
        // Create a new patient despite potential duplicates
        // We'll use the createPatient method
        return this.createPatient(options.newPatientData);
      }
    } catch (error: unknown) {
      throw new Error(`Failed to resolve duplicate: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const patientIdentityService = new PatientIdentityService();