import { Router } from "express";
import { identityVerificationService } from "../lib/identity-verification-service";
import { digiLockerService } from "../lib/digi-locker-service";

const router = Router();

/**
 * Initiate Aadhaar verification for patient identity verification
 */
router.post("/aadhaar/initiate", async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Aadhaar number required" });
    }
    const result = await identityVerificationService.initiateAadhaarVerification(
      aadhaarNumber
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: "invalid_request",
      message: error.message
    });
  }
});

/**
 * Verify Aadhaar OTP for patient identity verification
 */
router.post("/aadhaar/verify", async (req, res) => {
  try {
    const { transactionId, otp } = req.body;
    if (!transactionId || !otp) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Transaction ID and OTP required" });
    }
    const result = await identityVerificationService.verifyAadhaarOtp(
      transactionId,
      otp
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: "invalid_request",
      message: error.message
    });
  }
});

/**
 * Initiate DigiLocker connection for patient
 */
router.post("/digi-locker/initiate", async (req, res) => {
  try {
    const { patientId, redirectUri, scope, state } = req.body;
    if (!patientId || !redirectUri) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Patient ID and redirect URI required" });
    }
    const result = await digiLockerService.initiateConnection({
      patientId,
      redirectUri,
      scope,
      state,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: "invalid_request",
      message: error.message
    });
  }
});

/**
 * Handle DigiLocker callback after user consent
 */
router.post("/digi-locker/callback", async (req, res) => {
  try {
    const { patientId, code, state, codeVerifier } = req.body;
    if (!patientId || !code || !state) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Patient ID, code, and state required" });
    }
    const result = await digiLockerService.handleCallback({
      patientId,
      code,
      state,
      codeVerifier,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: "invalid_request",
      message: error.message
    });
  }
});

export default router;