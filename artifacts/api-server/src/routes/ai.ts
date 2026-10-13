// @ts-nocheck
import { Router } from "express";
import { db } from "@workspace/db";
import {
  aiAnalysisResultsTable,
  patientsTable,
  medicalRecordsTable,
  labReportsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";
import { medgemmaService } from "../medgemma/index.js";

const router = Router();

/**
 * Analyze symptoms using MedGemma AI (with fallback to rule-based)
 */
router.post("/analyze-symptoms", requireAuth, async (req, res) => {
  try {
    const { patientId, symptoms, duration, severity, additionalContext } =
      req.body;

    // Validate required fields
    if (
      !patientId ||
      !symptoms ||
      !Array.isArray(symptoms) ||
      symptoms.length === 0
    ) {
      res.status(400).json({
        error: "invalid_request",
        message: "Patient ID and symptoms array are required",
      });
      return;
    }

    // Use MedGemma service for analysis
    const analysis = await medgemmaService.analyzeSymptomsMedGemma(
      patientId,
      symptoms,
      duration,
      severity,
      additionalContext,
    );

    // Save to database
    const [result] = await db
      .insert(aiAnalysisResultsTable)
      .values(analysis)
      .returning();

    await createAuditLog(
      req,
      "ai_analysis",
      "patient",
      patientId,
      "symptom_analysis",
    );
    res.json(result);
  } catch (error: any) {
    console.error("Symptom analysis error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to analyze symptoms",
    });
  }
});

/**
 * Summarize patient record using MedGemma AI (with fallback to rule-based)
 */
router.post("/summarize-patient", requireAuth, async (req, res) => {
  try {
    const { patientId, includeRecentOnly } = req.body;

    // Validate required fields
    if (!patientId) {
      res.status(400).json({
        error: "invalid_request",
        message: "Patient ID is required",
      });
      return;
    }

    // Use MedGemma service for summarization
    const analysis = await medgemmaService.summarizePatientMedGemma(
      patientId,
      includeRecentOnly,
    );

    // Save to database
    const [result] = await db
      .insert(aiAnalysisResultsTable)
      .values(analysis)
      .returning();

    await createAuditLog(
      req,
      "ai_analysis",
      "patient",
      patientId,
      "patient_summary",
    );
    res.json(result);
  } catch (error: any) {
    console.error("Patient summary error:", error);
    if (error.message === "Patient not found") {
      res.status(404).json({
        error: "not_found",
        message: "Patient not found",
      });
    } else {
      res.status(500).json({
        error: "internal_error",
        message: "Failed to summarize patient",
      });
    }
  }
});

/**
 * Interpret lab results using MedGemma AI (with fallback to rule-based)
 */
router.post("/interpret-lab", requireAuth, async (req, res) => {
  try {
    const { patientId, labReportId, results, patientContext } = req.body;

    // Validate required fields
    if (!patientId || !labReportId) {
      res.status(400).json({
        error: "invalid_request",
        message: "Patient ID and Lab Report ID are required",
      });
      return;
    }

    // Use MedGemma service for interpretation
    const analysis = await medgemmaService.interpretLabResultsMedGemma(
      patientId,
      labReportId,
      results,
      patientContext,
    );

    const [result] = await db
      .insert(aiAnalysisResultsTable)
      .values(analysis)
      .returning();

    await createAuditLog(
      req,
      "ai_analysis",
      "patient",
      patientId,
      "lab_interpretation",
    );
    res.json(result);
  } catch (error: any) {
    console.error("Lab interpretation error:", error);
    if (
      error.message === "Lab report not found" ||
      error.message === "Patient not found"
    ) {
      res.status(404).json({
        error: "not_found",
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: "internal_error",
        message: "Failed to interpret lab results",
      });
    }
  }
});

/**
 * Get AI analysis results
 */
router.get("/results", requireAuth, async (req, res) => {
  try {
    const { patientId } = req.query;
    let query = db.select().from(aiAnalysisResultsTable);

    if (patientId) {
      const results = await query.where(
        eq(aiAnalysisResultsTable.patientId, Number(patientId)),
      );
      res.json(results);
      return;
    }

    const results = await query;
    res.json(results);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch AI results",
    });
  }
});

/**
 * Get MedGemma service status
 */
router.get("/medgemma/status", requireAuth, async (req, res) => {
  try {
    const isAvailable = await medgemmaService.isMedGemmaAvailable();
    res.json({
      available: isAvailable,
      model: process.env.MEDGEMMA_MODEL_NAME || "medgemma-4b-it",
      inferenceUrl: process.env.MEDGEMMA_INFERENCE_URL || "Not configured",
      message: isAvailable
        ? "MedGemma service is available"
        : "MedGemma service not configured. Using rule-based fallback.",
    });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to check MedGemma status",
    });
  }
});

export default router;
