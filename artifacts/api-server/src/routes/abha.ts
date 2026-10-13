import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { generateToken } from "../lib/auth.js";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { abdmService } from "../abdm/service.js";

const router = Router();

/**
 * ABHA Registration via Aadhaar - Step 1: Generate OTP
 */
router.post("/registration/aadhaar/generate-otp", async (req, res) => {
  try {
    const { aadhaar } = req.body;
    const result = await abdmService.initiateAbhaRegistrationWithAadhaar(aadhaar);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: "invalid_request",
      message: error.message
    });
  }
});

/**
 * ABHA Registration via Aadhaar - Step 2: Verify OTP
 */
router.post("/registration/aadhaar/verify-otp", async (req, res) => {
  try {
    const { txnId, otp } = req.body;
    const result = await abdmService.verifyAbhaRegistrationWithAadhaar(txnId, otp);
    res.json(result);
  } catch (error: any) {
    res.status(422).json({
      error: "verification_failed",
      message: error.message
    });
  }
});

/**
 * ABHA Registration via Mobile - Step 1: Generate OTP
 */
router.post("/registration/mobile/generate-otp", async (req, res) => {
  try {
    const { mobile } = req.body;
    const result = await abdmService.initiateAbhaRegistrationWithMobile(mobile);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: "invalid_request",
      message: error.message
    });
  }
});

/**
 * ABHA Registration via Mobile - Step 2: Verify OTP
 */
router.post("/registration/mobile/verify-otp", async (req, res) => {
  try {
    const { txnId, otp, name, gender, dateOfBirth } = req.body;
    const result = await abdmService.verifyAbhaRegistrationWithMobile(
      txnId, otp, name, gender, dateOfBirth
    );
    res.json(result);
  } catch (error: any) {
    res.status(422).json({
      error: "verification_failed",
      message: error.message
    });
  }
});

/**
 * ABHA Authentication - Step 1: Initiate auth
 */
router.post("/auth/init", async (req, res) => {
  try {
    const { abhaNumber } = req.body;
    const result = await abdmService.initiateAbhaAuth(abhaNumber);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: "invalid_request",
      message: error.message
    });
  }
});

/**
 * ABHA Authentication - Step 2: Verify OTP and authenticate
 */
router.post("/auth/confirm", async (req, res) => {
  try {
    const { txnId, otp } = req.body;
    const result = await abdmService.verifyAbhaAuth(txnId, otp);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes("No Chikit account linked")) {
      res.status(404).json({
        error: "not_found",
        message: error.message
      });
    } else {
      res.status(422).json({
        error: "verification_failed",
        message: error.message
      });
    }
  }
});

/**
 * Get ABHA profile for authenticated user
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    // Find patient associated with this user
    const patientResult = await db.execute(
      sql`SELECT p.id, p.name, p.date_of_birth, p.gender, p.phone, p.abha_number,
                 p.abha_address, p.abha_verified, p.abha_linked_at
          FROM patients p
          WHERE p.email = ${user.email} OR p.phone = (SELECT phone FROM users WHERE id = ${user.id} LIMIT 1)
          LIMIT 1`
    );
    const patient = patientResult.rows[0] as Record<string, unknown> | undefined;

    if (!patient) {
      res.json({
        patientId: null,
        abhaNumber: null,
        abhaAddress: null,
        abhaVerified: false,
        abhaLinkedAt: null,
        name: user.name
      });
      return;
    }

    // If we have an ABHA number, we could fetch detailed profile from ABDM
    let abhaProfile = null;
    if (patient.abha_number) {
      try {
        abhaProfile = await abdmService.getAbhaProfile(patient.abha_number as string);
      } catch (e) {
        // If ABDM profile fetch fails, we still return basic patient info
        console.warn("Could not fetch ABHA profile from ABDM:", e);
      }
    }

    res.json({
      patientId: patient.id,
      abhaNumber: patient.abha_number || null,
      abhaAddress: patient.abha_address || null,
      abhaVerified: patient.abha_verified || false,
      abhaLinkedAt: patient.abha_linked_at || null,
      name: patient.name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      // Include ABDM profile if available
      ...(abhaProfile && { abhaProfile })
    });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch ABHA profile"
    });
  }
});

/**
 * Get ABHA profile by patient ID
 */
router.get("/profile/:patientId", requireAuth, async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const patientResult = await db.execute(
      sql`SELECT id, name, date_of_birth, gender, phone, abha_number,
                 abha_address, abha_verified, abha_linked_at
          FROM patients
          WHERE id = ${patientId}`
    );
    const patient = patientResult.rows[0] as Record<string, unknown> | undefined;

    if (!patient) {
      res.status(404).json({
        error: "not_found",
        message: "Patient not found"
      });
      return;
    }

    // Fetch ABHA profile if ABHA is linked
    let abhaProfile = null;
    if (patient.abha_number) {
      try {
        abhaProfile = await abdmService.getAbhaProfile(patient.abha_number as string);
      } catch (e) {
        console.warn("Could not fetch ABHA profile from ABDM:", e);
      }
    }

    res.json({
      patientId: patient.id,
      abhaNumber: patient.abha_number || null,
      abhaAddress: patient.abha_address || null,
      abhaVerified: patient.abha_verified || false,
      abhaLinkedAt: patient.abha_linked_at || null,
      name: patient.name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      // Include ABDM profile if available
      ...(abhaProfile && { abhaProfile })
    });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch ABHA profile"
    });
  }
});

/**
 * Link ABHA to existing patient record
 */
router.post("/link/:patientId", requireAuth, async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const { abhaNumber, abhaAddress } = req.body;

    const result = await abdmService.linkAbhaToPatient(patientId, abhaNumber, abhaAddress);
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

/**
 * Unlink ABHA from patient record (if supported by ABDM policies)
 */
router.delete("/unlink/:patientId", requireAuth, async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);

    // First get the current ABHA to verify it exists
    const patientResult = await db.execute(
      sql`SELECT abha_number FROM patients WHERE id = ${patientId}`
    );
    const patient = patientResult.rows[0];

    if (!patient || !patient.abha_number) {
      res.status(404).json({
        error: "not_found",
        message: "No ABHA linked to this patient"
      });
      return;
    }

    // Update patient record to remove ABHA linkage
    await db.execute(
      sql`UPDATE patients
          SET abha_number = NULL,
              abha_address = NULL,
              abha_verified = false,
              abha_linked_at = NULL
          WHERE id = ${patientId}`
    );

    res.json({
      success: true,
      message: "ABHA successfully unlinked from patient record"
    });
  } catch (error: any) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to unlink ABHA"
    });
  }
});

export default router;