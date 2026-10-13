// @ts-nocheck
import { Router } from "express";
import { db } from "@workspace/db";
import {
  controlledMedicationSchedulesTable,
  controlledMedicationAuthorizationsTable,
  pharmacyControlledInventoryTable,
  caregiverAuthorizationsTable,
  medicationDispensingRecordsTable,
  prescriptionAmendmentsTable,
  medicationAnomalyRulesTable,
  medicationAnomalyAlertsTable,
  prescriptionsTable,
  drugsTable,
  hospitalsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, gte, lte, sql, count, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

// Helper function to check if user is authorized for controlled medications
const requireMedicationAuth = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      res
        .status(401)
        .json({ error: "unauthorized", message: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res
        .status(403)
        .json({
          error: "forbidden",
          message: "Insufficient permissions for medication operations",
        });
      return;
    }
    next();
  };
};

/**
 * Get all controlled medication schedules
 */
router.get("/schedules", requireAuth, async (req, res) => {
  try {
    const schedules = await db
      .select()
      .from(controlledMedicationSchedulesTable)
      .where(eq(controlledMedicationSchedulesTable.isActive, true));
    res.json(schedules);
  } catch (err) {
    console.error("Fetch schedules error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch medication schedules",
      });
  }
});

/**
 * Create a new controlled medication schedule (Admin/Pharmacy only)
 */
router.post(
  "/schedules",
  requireMedicationAuth("admin", "pharmacist"),
  async (req, res) => {
    try {
      const {
        scheduleCode,
        scheduleName,
        description,
        prescribingRestrictions,
        dispensingRestrictions,
        recordRetentionYears,
      } = req.body;

      const [schedule] = await db
        .insert(controlledMedicationSchedulesTable)
        .values({
          scheduleCode,
          scheduleName,
          description,
          prescribingRestrictions: prescribingRestrictions || {},
          dispensingRestrictions: dispensingRestrictions || {},
          recordRetentionYears: recordRetentionYears || 3,
        })
        .returning();

      await createAuditLog(
        req,
        "create",
        "medication_schedule",
        schedule.id,
        `Created schedule ${scheduleCode}`,
      );
      res.status(201).json(schedule);
    } catch (err) {
      console.error("Create schedule error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to create medication schedule",
        });
    }
  },
);

/**
 * Create a controlled medication authorization from a prescription
 */
router.post(
  "/authorizations",
  requireMedicationAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const {
        prescriptionId,
        medicationId,
        strength,
        dosageForm,
        authorizedQuantity,
        unit,
        authorizedRefills,
        issueDate,
        expiryDate,
        specialInstructions,
      } = req.body;

      // Verify prescription exists and belongs to patient
      const [prescription] = await db
        .select()
        .from(prescriptionsTable)
        .where(eq(prescriptionsTable.id, prescriptionId));

      if (!prescription) {
        res
          .status(404)
          .json({ error: "not_found", message: "Prescription not found" });
        return;
      }

      // Verify medication exists
      const [medication] = await db
        .select()
        .from(drugsTable)
        .where(eq(drugsTable.id, medicationId));

      if (!medication) {
        res
          .status(404)
          .json({ error: "not_found", message: "Medication not found" });
        return;
      }

      // Check if authorization already exists for this prescription
      const [existingAuth] = await db
        .select()
        .from(controlledMedicationAuthorizationsTable)
        .where(
          eq(
            controlledMedicationAuthorizationsTable.prescriptionId,
            prescriptionId,
          ),
        );

      if (existingAuth) {
        res
          .status(409)
          .json({
            error: "conflict",
            message: "Authorization already exists for this prescription",
          });
        return;
      }

      // Get prescriber info (from prescription or user)
      const prescriberId = prescription.doctorId ?? req.user!.id;
      const prescribingFacilityId =
        prescription.hospitalId ?? req.user!.hospitalId;

      // Determine legal classification based on medication
      // In a real implementation, this would check the medication's schedule
      const legalClassification = "Schedule H1"; // Default, should be determined from medication properties

      const [authorization] = await db
        .insert(controlledMedicationAuthorizationsTable)
        .values({
          prescriptionId,
          patientId: prescription.patientId,
          prescriberId,
          prescribingFacilityId: prescribingFacilityId ?? 1, // Default to first hospital if not set
          medicationId,
          strength,
          dosageForm,
          authorizedQuantity,
          unit: unit || "tablets",
          remainingQuantity: authorizedQuantity, // Initially all quantity is remaining
          authorizedRefills: authorizedRefills || 0,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          expiryDate: expiryDate
            ? new Date(expiryDate)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          specialInstructions,
          legalClassification,
          verificationStatus: "pending",
        })
        .returning();

      await createAuditLog(
        req,
        "create",
        "medication_authorization",
        authorization.id,
        `Created authorization for prescription ${prescriptionId}`,
      );
      res.status(201).json(authorization);
    } catch (err) {
      console.error("Create authorization error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to create medication authorization",
        });
    }
  },
);

/**
 * Get pending medication authorizations for verification
 */
router.get(
  "/authorizations/pending",
  requireMedicationAuth("pharmacist", "admin"),
  async (req, res) => {
    try {
      const hospitalId = req.user!.hospitalId;

      const authorizations = await db
        .select({
          id: controlledMedicationAuthorizationsTable.id,
          prescriptionId:
            controlledMedicationAuthorizationsTable.prescriptionId,
          patientId: controlledMedicationAuthorizationsTable.patientId,
          patientName: patientsTable.name,
          medicationId: controlledMedicationAuthorizationsTable.medicationId,
          medicationName: drugsTable.name,
          strength: controlledMedicationAuthorizationsTable.strength,
          dosageForm: controlledMedicationAuthorizationsTable.dosageForm,
          authorizedQuantity:
            controlledMedicationAuthorizationsTable.authorizedQuantity,
          remainingQuantity:
            controlledMedicationAuthorizationsTable.remainingQuantity,
          authorizedRefills:
            controlledMedicationAuthorizationsTable.authorizedRefills,
          usedRefills: controlledMedicationAuthorizationsTable.usedRefills,
          issueDate: controlledMedicationAuthorizationsTable.issueDate,
          expiryDate: controlledMedicationAuthorizationsTable.expiryDate,
          status: controlledMedicationAuthorizationsTable.status,
          verificationStatus:
            controlledMedicationAuthorizationsTable.verificationStatus,
          legalClassification:
            controlledMedicationAuthorizationsTable.legalClassification,
          specialInstructions:
            controlledMedicationAuthorizationsTable.specialInstructions,
          prescriberName: usersTable.name,
        })
        .from(controlledMedicationAuthorizationsTable)
        .leftJoin(
          patientsTable,
          eq(
            controlledMedicationAuthorizationsTable.patientId,
            patientsTable.id,
          ),
        )
        .leftJoin(
          drugsTable,
          eq(
            controlledMedicationAuthorizationsTable.medicationId,
            drugsTable.id,
          ),
        )
        .leftJoin(
          usersTable,
          eq(
            controlledMedicationAuthorizationsTable.prescriberId,
            usersTable.id,
          ),
        )
        .where(
          and(
            eq(
              controlledMedicationAuthorizationsTable.prescribingFacilityId,
              hospitalId,
            ),
            eq(
              controlledMedicationAuthorizationsTable.verificationStatus,
              "pending",
            ),
          ),
        )
        .orderBy(desc(controlledMedicationAuthorizationsTable.issueDate));

      res.json(authorizations);
    } catch (err) {
      console.error("Fetch pending authorizations error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch pending authorizations",
        });
    }
  },
);

/**
 * Verify a medication authorization
 */
router.put(
  "/authorizations/:id/verify",
  requireMedicationAuth("pharmacist", "admin"),
  async (req, res) => {
    try {
      const authorizationId = Number(req.params.id);
      const { verificationStatus, notes } = req.body;

      if (!["verified", "failed"].includes(verificationStatus)) {
        res
          .status(400)
          .json({
            error: "invalid_request",
            message: "Verification status must be 'verified' or 'failed'",
          });
        return;
      }

      const [authorization] = await db
        .select()
        .from(controlledMedicationAuthorizationsTable)
        .where(eq(controlledMedicationAuthorizationsTable.id, authorizationId));

      if (!authorization) {
        res
          .status(404)
          .json({ error: "not_found", message: "Authorization not found" });
        return;
      }

      const [updatedAuthorization] = await db
        .update(controlledMedicationAuthorizationsTable)
        .set({
          verificationStatus,
          updatedAt: new Date(),
        })
        .where(eq(controlledMedicationAuthorizationsTable.id, authorizationId))
        .returning();

      await createAuditLog(
        req,
        "verify",
        "medication_authorization",
        authorizationId,
        `Verification status: ${verificationStatus}. Notes: ${notes || "None provided"}`,
      );

      res.json(updatedAuthorization);
    } catch (err) {
      console.error("Verify authorization error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to verify medication authorization",
        });
    }
  },
);

/**
 * Dispense controlled medication
 */
router.post(
  "/dispense",
  requireMedicationAuth("pharmacist", "admin"),
  async (req, res) => {
    try {
      const {
        authorizationId,
        quantityToDispense,
        batchNumber,
        idempotencyKey,
        verificationMethod,
      } = req.body;

      // Validate required fields
      if (
        !authorizationId ||
        !quantityToDispense ||
        !batchNumber ||
        !idempotencyKey
      ) {
        res.status(400).json({
          error: "invalid_request",
          message:
            "Authorization ID, quantity to dispense, batch number, and idempotency key are required",
        });
        return;
      }

      // Check if this idempotency key has been used before (prevent duplicate dispensing)
      const [existingDispense] = await db
        .select()
        .from(medicationDispensingRecordsTable)
        .where(
          eq(medicationDispensingRecordsTable.idempotencyKey, idempotencyKey),
        );

      if (existingDispense) {
        res.status(409).json({
          error: "duplicate_request",
          message:
            "Dispensing with this idempotency key has already been processed",
          dispensingRecord: existingDispense,
        });
        return;
      }

      // Get authorization details
      const [authorization] = await db
        .select()
        .from(controlledMedicationAuthorizationsTable)
        .where(eq(controlledMedicationAuthorizationsTable.id, authorizationId));

      if (!authorization) {
        res
          .status(404)
          .json({ error: "not_found", message: "Authorization not found" });
        return;
      }

      // Check if authorization is active and not expired
      if (authorization.status !== "active") {
        res.status(400).json({
          error: "invalid_authorization",
          message: `Authorization is ${authorization.status}`,
        });
        return;
      }

      if (new Date() > new Date(authorization.expiryDate)) {
        res.status(400).json({
          error: "expired_authorization",
          message: "Authorization has expired",
        });
        return;
      }

      // Check if quantity requested is available
      if (quantityToDispense > authorization.remainingQuantity) {
        res.status(400).json({
          error: "insufficient_quantity",
          message: `Only ${authorization.remainingQuantity} ${authorization.unit} remaining`,
        });
        return;
      }

      // Get inventory details for this batch
      const [inventoryItem] = await db
        .select()
        .from(pharmacyControlledInventoryTable)
        .where(
          and(
            eq(
              pharmacyControlledInventoryTable.medicationId,
              authorization.medicationId,
            ),
            eq(pharmacyControlledInventoryTable.batchNumber, batchNumber),
          ),
        );

      if (!inventoryItem) {
        res
          .status(404)
          .json({ error: "not_found", message: "Inventory batch not found" });
        return;
      }

      if (inventoryItem.status !== "active") {
        res.status(400).json({
          error: "invalid_inventory",
          message: `Inventory batch is ${inventoryItem.status}`,
        });
        return;
      }

      if (quantityToDispense > inventoryItem.closingStock) {
        res.status(400).json({
          error: "insufficient_inventory",
          message: `Only ${inventoryItem.closingStock} units available in batch ${batchNumber}`,
        });
        return;
      }

      // Get patient and pharmacy info
      const [patient] = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, authorization.patientId));

      const [pharmacy] = await db
        .select()
        .from(hospitalsTable)
        .where(eq(hospitalsTable.id, authorization.prescribingFacilityId));

      // Begin transaction-like processing (in a real app, you'd use a transaction)
      // Update authorization remaining quantity
      const newRemainingQuantity =
        authorization.remainingQuantity - quantityToDispense;
      const newDispensedQuantity =
        authorization.alreadyDispensedQuantity + quantityToDispense;

      const [updatedAuthorization] = await db
        .update(controlledMedicationAuthorizationsTable)
        .set({
          alreadyDispensedQuantity: newDispensedQuantity,
          remainingQuantity: newRemainingQuantity,
          status:
            newRemainingQuantity <= 0 &&
            authorization.usedRefills >= authorization.authorizedRefills
              ? "completed"
              : "active",
          updatedAt: new Date(),
        })
        .where(eq(controlledMedicationAuthorizationsTable.id, authorizationId))
        .returning();

      // Update inventory
      const newClosingStock = inventoryItem.closingStock - quantityToDispense;
      const [updatedInventory] = await db
        .update(pharmacyControlledInventoryTable)
        .set({
          dispensedQuantity:
            inventoryItem.dispensedQuantity + quantityToDispense,
          closingStock: newClosingStock,
          updatedAt: new Date(),
        })
        .where(eq(pharmacyControlledInventoryTable.id, inventoryItem.id))
        .returning();

      // Create dispensing record
      const [dispensingRecord] = await db
        .insert(medicationDispensingRecordsTable)
        .values({
          authorizationId,
          prescriptionId: authorization.prescriptionId,
          patientId: authorization.patientId,
          pharmacyId: authorization.prescribingFacilityId,
          pharmacistId: req.user!.id,
          medicationId: authorization.medicationId,
          batchNumber,
          quantityDispensed: quantityToDispense,
          unit: authorization.unit,
          dispensingDate: new Date(),
          status: "completed",
          idempotencyKey,
          verificationMethod: verificationMethod || "prescription_check",
          patientVerified: true, // In real implementation, this would involve actual verification
          caregiverVerified: false,
          prescriptionVerified: true,
          inventoryUpdated: true,
        })
        .returning();

      // Create audit log
      await createAuditLog(
        req,
        "dispense",
        "medication",
        authorizationId,
        `Dispensed ${quantityToDispense} ${authorization.unit} of batch ${batchNumber}. Remaining: ${newRemainingQuantity}`,
      );

      // Check for low inventory alert (example threshold: 10% of opening stock)
      const lowStockThreshold = Math.max(
        1,
        Math.floor(inventoryItem.openingStock * 0.1),
      );
      if (newClosingStock <= lowStockThreshold) {
        // In a real implementation, this would trigger a notification or alert
        console.log(
          `Low stock alert: ${inventoryItem.medicationId} batch ${batchNumber} has ${newClosingStock} units remaining`,
        );
      }

      res.status(201).json({
        dispensingRecord,
        updatedAuthorization,
        updatedInventory,
      });
    } catch (err) {
      console.error("Dispense medication error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to dispense medication",
        });
    }
  },
);

/**
 * Get dispensing history for an authorization
 */
router.get(
  "/authorizations/:id/dispensing-history",
  requireMedicationAuth("pharmacist", "admin", "doctor"),
  async (req, res) => {
    try {
      const authorizationId = Number(req.params.id);

      const dispensingHistory = await db
        .select({
          id: medicationDispensingRecordsTable.id,
          quantityDispensed: medicationDispensingRecordsTable.quantityDispensed,
          unit: medicationDispensingRecordsTable.unit,
          dispensingDate: medicationDispensingRecordsTable.dispensingDate,
          batchNumber: medicationDispensingRecordsTable.batchNumber,
          pharmacistName: usersTable.name,
          status: medicationDispensingRecordsTable.status,
        })
        .from(medicationDispensingRecordsTable)
        .leftJoin(
          usersTable,
          eq(medicationDispensingRecordsTable.pharmacistId, usersTable.id),
        )
        .where(
          eq(medicationDispensingRecordsTable.authorizationId, authorizationId),
        )
        .orderBy(desc(medicationDispensingRecordsTable.dispensingDate));

      res.json(dispensingHistory);
    } catch (err) {
      console.error("Fetch dispensing history error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch dispensing history",
        });
    }
  },
);

/**
 * Create caregiver authorization for medication pickup
 */
router.post(
  "/caregiver-authorizations",
  requireMedicationAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const {
        patientId,
        caregiverId,
        relationship,
        authorizationStartDate,
        authorizationEndDate,
        authorizedMedications,
        maxQuantityPerPickup,
        pickupFrequencyLimit,
        verificationMethod,
      } = req.body;

      // Verify patient exists
      const [patient] = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId));

      if (!patient) {
        res
          .status(404)
          .json({ error: "not_found", message: "Patient not found" });
        return;
      }

      // Verify caregiver exists
      const [caregiver] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, caregiverId));

      if (!caregiver) {
        res
          .status(404)
          .json({ error: "not_found", message: "Caregiver not found" });
        return;
      }

      const [caregiverAuth] = await db
        .insert(caregiverAuthorizationsTable)
        .values({
          patientId,
          caregiverId,
          relationship,
          authorizationStartDate: authorizationStartDate
            ? new Date(authorizationStartDate)
            : new Date(),
          authorizationEndDate: authorizationEndDate
            ? new Date(authorizationEndDate)
            : null,
          authorizedMedications: authorizedMedications || [],
          maxQuantityPerPickup: maxQuantityPerPickup || null,
          pickupFrequencyLimit: pickupFrequencyLimit || "as_needed",
          verifiedBy: req.user!.id,
          verificationDate: new Date(),
          verificationMethod: verificationMethod || "document_check",
        })
        .returning();

      await createAuditLog(
        req,
        "create",
        "caregiver_authorization",
        caregiverAuth.id,
        `Created caregiver authorization for patient ${patientId}`,
      );

      res.status(201).json(caregiverAuth);
    } catch (err) {
      console.error("Create caregiver authorization error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to create caregiver authorization",
        });
    }
  },
);

/**
 * Get pharmacy controlled medication inventory
 */
router.get(
  "/inventory",
  requireMedicationAuth("pharmacist", "admin"),
  async (req, res) => {
    try {
      const pharmacyId = req.user!.hospitalId; // Assuming pharmacy is associated with hospital

      const inventory = await db
        .select({
          id: pharmacyControlledInventoryTable.id,
          medicationId: pharmacyControlledInventoryTable.medicationId,
          medicationName: drugsTable.name,
          genericName: drugsTable.genericName,
          batchNumber: pharmacyControlledInventoryTable.batchNumber,
          expiryDate: pharmacyControlledInventoryTable.expiryDate,
          openingStock: pharmacyControlledInventoryTable.openingStock,
          closingStock: pharmacyControlledInventoryTable.closingStock,
          receivedQuantity: pharmacyControlledInventoryTable.receivedQuantity,
          dispensedQuantity: pharmacyControlledInventoryTable.dispensedQuantity,
          returnedQuantity: pharmacyControlledInventoryTable.returnedQuantity,
          adjustedQuantity: pharmacyControlledInventoryTable.adjustedQuantity,
          adjustmentReason: pharmacyControlledInventoryTable.adjustmentReason,
          isQuarantined: pharmacyControlledInventoryTable.isQuarantined,
          quarantineReason: pharmacyControlledInventoryTable.quarantineReason,
          lastPhysicalCount: pharmacyControlledInventoryTable.lastPhysicalCount,
          physicalCountQuantity:
            pharmacyControlledInventoryTable.physicalCountQuantity,
          discrepancy: pharmacyControlledInventoryTable.discrepancy,
          status: pharmacyControlledInventoryTable.status,
        })
        .from(pharmacyControlledInventoryTable)
        .leftJoin(
          drugsTable,
          eq(pharmacyControlledInventoryTable.medicationId, drugsTable.id),
        )
        .where(eq(pharmacyControlledInventoryTable.pharmacyId, pharmacyId))
        .orderBy(drugsTable.name, pharmacyControlledInventoryTable.batchNumber);

      res.json(inventory);
    } catch (err) {
      console.error("Fetch inventory error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch pharmacy inventory",
        });
    }
  },
);

/**
 * Add inventory (receive new stock)
 */
router.post(
  "/inventory/receive",
  requireMedicationAuth("pharmacist", "admin"),
  async (req, res) => {
    try {
      const {
        medicationId,
        batchNumber,
        expiryDate,
        quantityReceived,
        supplierInfo,
      } = req.body;
      const pharmacyId = req.user!.hospitalId;

      // Validate required fields
      if (!medicationId || !batchNumber || !expiryDate || !quantityReceived) {
        res.status(400).json({
          error: "invalid_request",
          message:
            "Medication ID, batch number, expiry date, and quantity received are required",
        });
        return;
      }

      // Verify medication exists
      const [medication] = await db
        .select()
        .from(drugsTable)
        .where(eq(drugsTable.id, medicationId));

      if (!medication) {
        res
          .status(404)
          .json({ error: "not_found", message: "Medication not found" });
        return;
      }

      // Check if batch already exists
      const [existingBatch] = await db
        .select()
        .from(pharmacyControlledInventoryTable)
        .where(
          and(
            eq(pharmacyControlledInventoryTable.pharmacyId, pharmacyId),
            eq(pharmacyControlledInventoryTable.medicationId, medicationId),
            eq(pharmacyControlledInventoryTable.batchNumber, batchNumber),
          ),
        );

      if (existingBatch) {
        res
          .status(409)
          .json({
            error: "conflict",
            message: "Batch already exists in inventory",
          });
        return;
      }

      // Create new inventory record
      const [inventoryItem] = await db
        .insert(pharmacyControlledInventoryTable)
        .values({
          pharmacyId,
          medicationId,
          batchNumber,
          expiryDate: new Date(expiryDate),
          openingStock: quantityReceived,
          closingStock: quantityReceived,
          receivedQuantity: quantityReceived,
          status: "active",
        })
        .returning();

      await createAuditLog(
        req,
        "receive_inventory",
        "medication_inventory",
        inventoryItem.id,
        `Received ${quantityReceived} units of batch ${batchNumber}`,
      );

      res.status(201).json(inventoryItem);
    } catch (err) {
      console.error("Receive inventory error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to receive inventory",
        });
    }
  },
);

/**
 * Adjust inventory (for spoilage, damage, etc.)
 */
router.put(
  "/inventory/:id/adjust",
  requireMedicationAuth("pharmacist", "admin"),
  async (req, res) => {
    try {
      const inventoryId = Number(req.params.id);
      const { adjustmentQuantity, adjustmentReason } = req.body;

      if (adjustmentQuantity === undefined || !adjustmentReason) {
        res.status(400).json({
          error: "invalid_request",
          message: "Adjustment quantity and reason are required",
        });
        return;
      }

      const [inventoryItem] = await db
        .select()
        .from(pharmacyControlledInventoryTable)
        .where(eq(pharmacyControlledInventoryTable.id, inventoryId));

      if (!inventoryItem) {
        res
          .status(404)
          .json({ error: "not_found", message: "Inventory item not found" });
        return;
      }

      const newClosingStock = inventoryItem.closingStock + adjustmentQuantity;
      if (newClosingStock < 0) {
        res.status(400).json({
          error: "invalid_adjustment",
          message: "Adjustment would result in negative inventory",
        });
        return;
      }

      const [updatedInventory] = await db
        .update(pharmacyControlledInventoryTable)
        .set({
          adjustedQuantity: inventoryItem.adjustedQuantity + adjustmentQuantity,
          closingStock: newClosingStock,
          adjustmentReason,
          updatedAt: new Date(),
        })
        .where(eq(pharmacyControlledInventoryTable.id, inventoryId))
        .returning();

      await createAuditLog(
        req,
        "adjust_inventory",
        "medication_inventory",
        inventoryId,
        `Adjusted inventory by ${adjustmentQuantity} units. Reason: ${adjustmentReason}`,
      );

      res.json(updatedInventory);
    } catch (err) {
      console.error("Adjust inventory error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to adjust inventory",
        });
    }
  },
);

/**
 * Get medication anomaly alerts
 */
router.get(
  "/anomaly-alerts",
  requireMedicationAuth("pharmacist", "admin", "doctor"),
  async (req, res) => {
    try {
      const hospitalId = req.user!.hospitalId;

      const alerts = await db
        .select({
          id: medicationAnomalyAlertsTable.id,
          ruleId: medicationAnomalyAlertsTable.ruleId,
          ruleName: medicationAnomalyRulesTable.ruleName,
          prescriptionId: medicationAnomalyAlertsTable.prescriptionId,
          prescriptionNumber: prescriptionsTable.id, // Simplified - in reality would link to prescription code
          patientId: medicationAnomalyAlertsTable.patientId,
          patientName: patientsTable.name,
          prescriberId: medicationAnomalyAlertsTable.prescriberId,
          prescriberName: usersTable.name,
          pharmacyId: medicationAnomalyAlertsTable.pharmacyId,
          pharmacyName: hospitalsTable.name,
          alertDetails: medicationAnomalyAlertsTable.alertDetails,
          severity: medicationAnomalyAlertsTable.severity,
          status: medicationAnomalyAlertsTable.status,
          assignedToName: usersTable.name,
          investigationNotes: medicationAnomalyAlertsTable.investigation_notes,
          resolution: medicationAnomalyAlertsTable.resolution,
          createdAt: medicationAnomalyAlertsTable.createdAt,
          updatedAt: medicationAnomalyAlertsTable.updatedAt,
        })
        .from(medicationAnomalyAlertsTable)
        .leftJoin(
          medicationAnomalyRulesTable,
          eq(
            medicationAnomalyAlertsTable.ruleId,
            medicationAnomalyRulesTable.id,
          ),
        )
        .leftJoin(
          prescriptionsTable,
          eq(
            medicationAnomalyAlertsTable.prescriptionId,
            prescriptionsTable.id,
          ),
        )
        .leftJoin(
          patientsTable,
          eq(medicationAnomalyAlertsTable.patientId, patientsTable.id),
        )
        .leftJoin(
          usersTable,
          eq(medicationAnomalyAlertsTable.prescriberId, usersTable.id),
        )
        .leftJoin(
          hospitalsTable,
          eq(medicationAnomalyAlertsTable.pharmacyId, hospitalsTable.id),
        )
        .leftJoin(
          usersTable.as("assignedTo"),
          eq(medicationAnomalyAlertsTable.assignedTo, assignedTo.id),
        )
        .where(eq(medicationAnomalyAlertsTable.pharmacyId, hospitalId))
        .orderBy(desc(medicationAnomalyAlertsTable.createdAt));

      res.json(alerts);
    } catch (err) {
      console.error("Fetch anomaly alerts error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch anomaly alerts",
        });
    }
  },
);

/**
 * Acknowledge or resolve an anomaly alert
 */
router.put(
  "/anomaly-alerts/:id/resolve",
  requireMedicationAuth("pharmacist", "admin"),
  async (req, res) => {
    try {
      const alertId = Number(req.params.id);
      const { status, investigationNotes, resolution } = req.body;

      if (
        !["open", "investigating", "resolved", "false_positive"].includes(
          status,
        )
      ) {
        res.status(400).json({
          error: "invalid_request",
          message:
            "Status must be one of: open, investigating, resolved, false_positive",
        });
        return;
      }

      const [alert] = await db
        .select()
        .from(medicationAnomalyAlertsTable)
        .where(eq(medicationAnomalyAlertsTable.id, alertId));

      if (!alert) {
        res
          .status(404)
          .json({ error: "not_found", message: "Alert not found" });
        return;
      }

      const [updatedAlert] = await db
        .update(medicationAnomalyAlertsTable)
        .set({
          status,
          investigationNotes: investigationNotes || null,
          resolution: resolution || null,
          resolvedAt:
            status === "resolved" || status === "false_positive"
              ? new Date()
              : null,
          updatedAt: new Date(),
        })
        .where(eq(medicationAnomalyAlertsTable.id, alertId))
        .returning();

      await createAuditLog(
        req,
        "resolve_anomaly",
        "medication_alert",
        alertId,
        `Alert resolved with status: ${status}`,
      );

      res.json(updatedAlert);
    } catch (err) {
      console.error("Resolve anomaly alert error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to resolve anomaly alert",
        });
    }
  },
);

/**
 * Get medication authorization details for a patient
 */
router.get(
  "/patient/:patientId/authorizations",
  requireAuth,
  async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      const hospitalId = req.user!.hospitalId;

      // Check if user has permission to view this patient's data
      const [patient] = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId));

      if (!patient) {
        res
          .status(404)
          .json({ error: "not_found", message: "Patient not found" });
        return;
      }

      // In a real implementation, you'd check if the user is associated with the patient's hospital
      // For now, we'll allow if user is from same hospital or is a doctor/admin
      if (
        patient.hospitalId !== hospitalId &&
        !["doctor", "admin"].includes(req.user!.role)
      ) {
        res
          .status(403)
          .json({
            error: "forbidden",
            message:
              "Not authorized to view this patient's medication authorizations",
          });
        return;
      }

      const authorizations = await db
        .select({
          id: controlledMedicationAuthorizationsTable.id,
          prescriptionId:
            controlledMedicationAuthorizationsTable.prescriptionId,
          medicationId: controlledMedicationAuthorizationsTable.medicationId,
          medicationName: drugsTable.name,
          strength: controlledMedicationAuthorizationsTable.strength,
          dosageForm: controlledMedicationAuthorizationsTable.dosageForm,
          authorizedQuantity:
            controlledMedicationAuthorizationsTable.authorizedQuantity,
          unit: controlledMedicationAuthorizationsTable.unit,
          remainingQuantity:
            controlledMedicationAuthorizationsTable.remainingQuantity,
          authorizedRefills:
            controlledMedicationAuthorizationsTable.authorizedRefills,
          usedRefills: controlledMedicationAuthorizationsTable.usedRefills,
          issueDate: controlledMedicationAuthorizationsTable.issueDate,
          expiryDate: controlledMedicationAuthorizationsTable.expiryDate,
          status: controlledMedicationAuthorizationsTable.status,
          verificationStatus:
            controlledMedicationAuthorizationsTable.verificationStatus,
          legalClassification:
            controlledMedicationAuthorizationsTable.legalClassification,
          specialInstructions:
            controlledMedicationAuthorizationsTable.specialInstructions,
        })
        .from(controlledMedicationAuthorizationsTable)
        .leftJoin(
          drugsTable,
          eq(
            controlledMedicationAuthorizationsTable.medicationId,
            drugsTable.id,
          ),
        )
        .where(eq(controlledMedicationAuthorizationsTable.patientId, patientId))
        .orderBy(desc(controlledMedicationAuthorizationsTable.issueDate));

      res.json(authorizations);
    } catch (err) {
      console.error("Fetch patient authorizations error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch patient medication authorizations",
        });
    }
  },
);

/**
 * Get medication dispensing records for a patient
 */
router.get(
  "/patient/:patientId/dispensing-history",
  requireAuth,
  async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      const hospitalId = req.user!.hospitalId;

      // Check if user has permission to view this patient's data
      const [patient] = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId));

      if (!patient) {
        res
          .status(404)
          .json({ error: "not_found", message: "Patient not found" });
        return;
      }

      // In a real implementation, you'd check if the user is associated with the patient's hospital
      // For now, we'll allow if user is from same hospital or is a doctor/admin
      if (
        patient.hospitalId !== hospitalId &&
        !["doctor", "admin"].includes(req.user!.role)
      ) {
        res
          .status(403)
          .json({
            error: "forbidden",
            message: "Not authorized to view this patient's dispensing history",
          });
        return;
      }

      const dispensingHistory = await db
        .select({
          id: medicationDispensingRecordsTable.id,
          authorizationId: medicationDispensingRecordsTable.authorizationId,
          prescriptionId: medicationDispensingRecordsTable.prescriptionId,
          medicationId: medicationDispensingRecordsTable.medicationId,
          medicationName: drugsTable.name,
          quantityDispensed: medicationDispensingRecordsTable.quantityDispensed,
          unit: medicationDispensingRecordsTable.unit,
          batchNumber: medicationDispensingRecordsTable.batchNumber,
          dispensingDate: medicationDispensingRecordsTable.dispensingDate,
          pharmacistName: usersTable.name,
          status: medicationDispensingRecordsTable.status,
        })
        .from(medicationDispensingRecordsTable)
        .leftJoin(
          drugsTable,
          eq(medicationDispensingRecordsTable.medicationId, drugsTable.id),
        )
        .leftJoin(
          usersTable,
          eq(medicationDispensingRecordsTable.pharmacistId, usersTable.id),
        )
        .where(eq(medicationDispensingRecordsTable.patientId, patientId))
        .orderBy(desc(medicationDispensingRecordsTable.dispensingDate));

      res.json(dispensingHistory);
    } catch (err) {
      console.error("Fetch patient dispensing history error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch patient dispensing history",
        });
    }
  },
);

export default router;
