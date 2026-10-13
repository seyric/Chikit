import { Router } from "express";
import { db } from "@workspace/db";
import { identityVerificationService } from "../lib/identity-verification-service";
import { digiLockerService } from "../lib/digi-locker-service";
import { patientIdentityService } from "../lib/patient-identity-service";
import { patientsTable } from "@workspace/db/schema";
import { usersTable } from "@workspace/db/schema";
import { abdmService } from "../abdm/service";
import { requireAuth } from "../lib/auth";

const router = Router();

/**
 * Collect and save patient profile information
 * This endpoint would be called after identity verification steps are completed
 */
router.post("/profile", requireAuth, async (req, res) => {
  try {
    // This endpoint would receive the verified identity data and profile data
    // and create a patient record using the patient identity service
    // For now, we'll expect the request body to contain all necessary data
    const {
      // Identity verification data
      phone,
      abhaNumber,
      aadhaarVerifiedAt,
      abhaVerifiedAt,
      digiLockerConnectedAt,
      govtIdType,
      govtIdNumber,
      // Profile data
      name,
      dateOfBirth,
      gender,
      bloodGroup,
      email,
      address,
      emergencyContact,
      emergencyPhone,
      allergies,
      chronicConditions,
      hospitalId,
      // Verification metadata
      verifiedBy,
    } = req.body;

    // Validate required fields
    if (!name || !dateOfBirth || !gender) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Name, date of birth, and gender are required" });
    }

    // Use the patient identity service to create the patient
    const result = await patientIdentityService.createPatient({
      phone,
      abhaNumber,
      aadhaarVerifiedAt,
      abhaVerifiedAt,
      digiLockerConnectedAt,
      govtIdType,
      govtIdNumber,
      name,
      dateOfBirth,
      gender,
      bloodGroup,
      email,
      address,
      emergencyContact,
      emergencyPhone,
      allergies,
      chronicConditions,
      hospitalId: req.hospital?.id ?? null,
      verifiedBy,
      userId: req.user.id,
    });

    res.status(201).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "internal_error", message: error.message });
  }
});

/**
 * Link ABHA to patient after verification (optional step)
 * This endpoint can be used to link an ABHA number to a patient after ABHA verification
 */
router.post("/identity/abha/link", async (req, res) => {
  try {
    const { patientId, abhaNumber, abhaAddress } = req.body;
    if (!patientId || !abhaNumber) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Patient ID and ABHA number required" });
    }
    // Use the ABDM service to link ABHA to patient
    const result = await abdmService.linkAbhaToPatient(
      patientId,
      abhaNumber,
      abhaAddress
    );
    res.json(result);
  } catch (error: any) {
    if (error.message.includes("already linked")) {
      res.status(409).json({
        error: "duplicate_abha",
        message: error.message
      });
    } else if (error.message.includes("Invalid ABHA number")) {
      res.status(400).json({
        error: "invalid_abha",
        message: error.message
      });
    } else {
      res.status(500).json({
        error: "internal_error",
        message: "Failed to link ABHA"
      });
    }
  }
});

export default router;