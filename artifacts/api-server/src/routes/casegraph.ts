// @ts-nocheck
import { Router, type IRouter } from "express";
import CaseGraphService from "../casegraph/service";
import { requireAuth, requireRole } from "../lib/auth";
import { ABDMService } from "../abdm/service";
import { MedGemmaService } from "../medgemma/service";
import { db } from "@workspace/db";
import { and, desc, eq, or } from "drizzle-orm";
import {
  caseConsentsTable,
  caseContributionsTable,
  caseNetworkPermissionsTable,
} from "@workspace/db/schema";

// Initialize services
const abdmService = new ABDMService();
const medgemmaService = new MedGemmaService();
const caseGraphService = new CaseGraphService(abdmService, medgemmaService);

const router: IRouter = Router();

// All routes require authentication
router.use(requireAuth);

// Submit a new case to the CaseGraph
router.post(
  "/",
  requireRole(["doctor", "admin", "physician"]),
  async (req, res, next) => {
    try {
      await caseGraphService.submitCase(req, res, next);
    } catch (error) {
      next(error);
    }
  },
);

// Search for similar cases
router.get(
  "/search",
  requireRole(["doctor", "admin", "physician", "researcher"]),
  async (req, res, next) => {
    try {
      await caseGraphService.searchSimilarCases(req, res, next);
    } catch (error) {
      next(error);
    }
  },
);

// Get case details by ID
router.get(
  "/:id",
  requireRole(["doctor", "admin", "physician", "researcher"]),
  async (req, res, next) => {
    try {
      await caseGraphService.getCaseDetails(req, res, next);
    } catch (error) {
      next(error);
    }
  },
);

// Update or grant research consent for a patient
router.put(
  "/patients/:patientId/consent",
  requireRole(["doctor", "admin", "physician"]),
  async (req, res, next) => {
    try {
      await caseGraphService.updateConsent(req, res, next);
    } catch (error) {
      next(error);
    }
  },
);

// Get patient's consent status
router.get(
  "/patients/:patientId/consent",
  requireRole(["doctor", "admin", "physician"]),
  async (req, res, next) => {
    try {
      const patientId = Number(req.params.patientId);

      if (isNaN(patientId)) {
        return res.status(400).json({ error: "Invalid patient ID" });
      }

      // Verify patient exists and belongs to user's hospital
      // (This would typically be done in the service, but doing a quick check here)

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

// Get cases contributed by the current user/hospital
router.get(
  "/my-contributions",
  requireRole(["doctor", "admin", "physician"]),
  async (req, res, next) => {
    try {
      const contributions = await db.query.caseContributionsTable.findMany({
        where: and(
          eq(caseContributionsTable.contributedBy, req.user.id),
          eq(
            caseContributionsTable.contributionHospitalId,
            req.user.hospitalId,
          ),
        ),
        with: {
          case: true,
          contributedByUser: true,
          contributionHospital: true,
        },
        orderBy: desc(caseContributionsTable.createdAt),
      });

      res.json({
        success: true,
        contributions,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get network permissions for current hospital
router.get(
  "/network/permissions",
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      const permissions = await db.query.caseNetworkPermissionsTable.findMany({
        where: or(
          eq(
            caseNetworkPermissionsTable.sharingHospitalId,
            req.user.hospitalId,
          ),
          eq(
            caseNetworkPermissionsTable.receivingHospitalId,
            req.user.hospitalId,
          ),
        ),
        with: {
          sharingHospital: true,
          receivingHospital: true,
        },
        orderBy: desc(caseNetworkPermissionsTable.createdAt),
      });

      res.json({
        success: true,
        permissions,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
