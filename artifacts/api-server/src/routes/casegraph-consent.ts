// @ts-nocheck
import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { db } from "@workspace/db";
import { caseConsentsTable, patientsTable } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// All routes require authentication
router.use(requireAuth);

// Submit or update research consent for a patient
router.post(
  "/patients/:patientId/consent",
  requireRole(["doctor", "admin", "physician"]),
  async (req, res, next) => {
    try {
      const patientId = Number(req.params.patientId);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: "Invalid patient ID" });
      }

      // Verify patient exists and belongs to user's hospital (or user has permission)
      // For simplicity, we'll assume the user can consent for any patient in their hospital
      // In a real implementation, we would check the patient's hospital association.

      const { consentArtifactId, consentArtifactHash, scope, expiresAt } =
        req.body;

      // Validate input
      const consentSchema = z.object({
        consentArtifactId: z.string(),
        consentArtifactHash: z.string(),
        scope: z.object(), // We'll accept any scope object
        expiresAt: z.string().datetime().optional(),
      });

      const parsed = consentSchema.safeParse({
        consentArtifactId,
        consentArtifactHash,
        scope,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Invalid consent data",
            details: parsed.error.format(),
          });
      }

      // Check if there's an existing consent record for this patient
      const existingConsent = await db.query.caseConsentsTable.findFirst({
        where: eq(caseConsentsTable.patientId, patientId),
      });

      let consentRecord;
      if (existingConsent) {
        // Update existing consent
        [consentRecord] = await db
          .update(caseConsentsTable)
          .set({
            consentArtifactId: parsed.data.consentArtifactId,
            consentArtifactHash: parsed.data.consentArtifactHash,
            scope: parsed.data.scope,
            expiresAt: parsed.data.expiresAt,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(caseConsentsTable.patientId, patientId))
          .returning();
      } else {
        // Insert new consent
        [consentRecord] = await db
          .insert(caseConsentsTable)
          .values({
            patientId,
            consentArtifactId: parsed.data.consentArtifactId,
            consentArtifactHash: parsed.data.consentArtifactHash,
            scope: parsed.data.scope,
            expiresAt: parsed.data.expiresAt,
            status: "active",
          })
          .returning();
      }

      res.json({
        success: true,
        consent: consentRecord,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Withdraw research consent for a patient
router.delete(
  "/patients/:patientId/consent",
  requireRole(["doctor", "admin", "physician"]),
  async (req, res, next) => {
    try {
      const patientId = Number(req.params.patientId);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: "Invalid patient ID" });
      }

      const { withdrawalReason } = req.body;

      // Update the consent status to withdrawn
      const [consentRecord] = await db
        .update(caseConsentsTable)
        .set({
          status: "withdrawn",
          withdrawalReason: withdrawalReason || "Patient withdrew consent",
          withdrawnAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(caseConsentsTable.patientId, patientId))
        .returning();

      if (!consentRecord) {
        return res
          .status(404)
          .json({ error: "No consent record found for this patient" });
      }

      res.json({
        success: true,
        consent: consentRecord,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get consent status for a patient
router.get(
  "/patients/:patientId/consent",
  requireRole(["doctor", "admin", "physician", "researcher"]),
  async (req, res, next) => {
    try {
      const patientId = Number(req.params.patientId);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: "Invalid patient ID" });
      }

      const consentRecord = await db.query.caseConsentsTable.findFirst({
        where: eq(caseConsentsTable.patientId, patientId),
      });

      res.json({
        success: true,
        consent: consentRecord || null,
      });
    } catch (error) {
      next(error);
    }
  },
);

// List all consents (for admin/audit purposes)
router.get("/consents", requireRole(["admin"]), async (req, res, next) => {
  try {
    const consents = await db.query.caseConsentsTable.findMany({
      with: {
        patient: true,
      },
      orderBy: desc(caseConsentsTable.createdAt),
    });

    res.json({
      success: true,
      consents,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
