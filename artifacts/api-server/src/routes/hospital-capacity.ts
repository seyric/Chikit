// @ts-nocheck
import { Router } from "express";
import { db } from "@workspace/db";
import {
  hospitalsTable,
  hospitalFacilitiesTable,
  bedCategoriesTable,
  hospitalBedsTable,
  bedAssignmentsTable,
  bedReservationsTable,
  hospitalCapacitySnapshotsTable,
  admissionCoordinationTable,
  interHospitalTransfersTable,
  hospitalCapacityAlertsTable,
  hospitalRoutesTable,
  patientsTable,
  usersTable,
} from "@workspace/db";
import {
  eq,
  and,
  gte,
  lte,
  sql,
  count,
  desc,
  inArray,
  or,
  not,
} from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

// Helper function to check if user is authorized for hospital capacity operations
const requireCapacityAuth = (...roles: string[]) => {
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
          message: "Insufficient permissions for hospital capacity operations",
        });
      return;
    }
    next();
  };
};

/**
 * Get bed categories
 */
router.get("/bed-categories", requireAuth, async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(bedCategoriesTable)
      .where(eq(bedCategoriesTable.isActive, true));
    res.json(categories);
  } catch (err) {
    console.error("Fetch bed categories error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch bed categories",
      });
  }
});

/**
 * Get hospital facilities for a hospital
 */
router.get("/:hospitalId/facilities", requireAuth, async (req, res) => {
  try {
    const hospitalId = Number(req.params.hospitalId);

    // Verify hospital exists
    const [hospital] = await db
      .select()
      .from(hospitalsTable)
      .where(eq(hospitalsTable.id, hospitalId));

    if (!hospital) {
      res
        .status(404)
        .json({ error: "not_found", message: "Hospital not found" });
      return;
    }

    const facilities = await db
      .select({
        id: hospitalFacilitiesTable.id,
        facilityCode: hospitalFacilitiesTable.facilityCode,
        facilityName: hospitalFacilitiesTable.facilityName,
        description: hospitalFacilitiesTable.description,
        isEmergencyCapable: hospitalFacilitiesTable.isEmergencyCapable,
        hasICU: hospitalFacilitiesTable.hasICU,
        hasBloodBank: hospitalFacilitiesTable.hasBloodBank,
        hasAmbulanceService: hospitalFacilitiesTable.hasAmbulanceService,
      })
      .from(hospitalFacilitiesTable)
      .where(eq(hospitalFacilitiesTable.hospitalId, hospitalId))
      .orderBy(hospitalFacilitiesTable.facilityName);

    res.json(facilities);
  } catch (err) {
    console.error("Fetch hospital facilities error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch hospital facilities",
      });
  }
});

/**
 * Get bed inventory for a hospital
 */
router.get("/:hospitalId/beds", requireAuth, async (req, res) => {
  try {
    const hospitalId = Number(req.params.hospitalId);
    const { categoryId, bedState, facilityId } = req.query;

    // Verify hospital exists
    const [hospital] = await db
      .select()
      .from(hospitalsTable)
      .where(eq(hospitalsTable.id, hospitalId));

    if (!hospital) {
      res
        .status(404)
        .json({ error: "not_found", message: "Hospital not found" });
      return;
    }

    // Build WHERE conditions
    const conditions: any[] = [eq(hospitalBedsTable.hospitalId, hospitalId)];

    if (categoryId)
      conditions.push(eq(hospitalBedsTable.categoryId, Number(categoryId)));
    if (bedState)
      conditions.push(eq(hospitalBedsTable.bedState, bedState as string));
    if (facilityId)
      conditions.push(eq(hospitalBedsTable.facilityId, Number(facilityId)));

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    const beds = await db
      .select({
        id: hospitalBedsTable.id,
        bedNumber: hospitalBedsTable.bedNumber,
        roomNumber: hospitalBedsTable.roomNumber,
        wing: hospitalBedsTable.wing,
        floor: hospitalBedsTable.floor,
        categoryId: hospitalBedsTable.categoryId,
        categoryName: bedCategoriesTable.categoryName,
        categoryCode: bedCategoriesTable.categoryCode,
        facilityId: hospitalBedsTable.facilityId,
        facilityName: hospitalFacilitiesTable.facilityName,
        bedState: hospitalBedsTable.bedState,
        isAccessible: hospitalBedsTable.isAccessible,
        hasVentilator: hospitalBedsTable.hasVentilator,
        hasMonitor: hospitalBedsTable.hasMonitor,
        lastStateChange: hospitalBedsTable.lastStateChange,
        stateChangeReason: hospitalBedsTable.stateChangeReason,
        notes: hospitalBedsTable.notes,
      })
      .from(hospitalBedsTable)
      .leftJoin(
        bedCategoriesTable,
        eq(hospitalBedsTable.categoryId, bedCategoriesTable.id),
      )
      .leftJoin(
        hospitalFacilitiesTable,
        eq(hospitalBedsTable.facilityId, hospitalFacilitiesTable.id),
      )
      .where(whereClause)
      .orderBy(hospitalBedsTable.bedNumber);

    res.json(beds);
  } catch (err) {
    console.error("Fetch hospital beds error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch hospital beds",
      });
  }
});

/**
 * Get hospital capacity summary
 */
router.get("/:hospitalId/capacity-summary", requireAuth, async (req, res) => {
  try {
    const hospitalId = Number(req.params.hospitalId);

    // Verify hospital exists
    const [hospital] = await db
      .select()
      .from(hospitalsTable)
      .where(eq(hospitalsTable.id, hospitalId));

    if (!hospital) {
      res
        .status(404)
        .json({ error: "not_found", message: "Hospital not found" });
      return;
    }

    // Get latest capacity snapshot
    const [latestSnapshot] = await db
      .select()
      .from(hospitalCapacitySnapshotsTable)
      .where(eq(hospitalCapacitySnapshotsTable.hospitalId, hospitalId))
      .orderBy(desc(hospitalCapacitySnapshotsTable.snapshotDate))
      .limit(1);

    // Get bed counts by state
    const bedCountsByState = await db
      .select({
        bedState: hospitalBedsTable.bedState,
        count: sql<number>`count(*)::int`,
      })
      .from(hospitalBedsTable)
      .where(eq(hospitalBedsTable.hospitalId, hospitalId))
      .groupBy(hospitalBedsTable.bedState);

    // Get bed counts by category
    const bedCountsByCategory = await db
      .select({
        categoryId: bedCategoriesTable.id,
        categoryName: bedCategoriesTable.categoryName,
        totalBeds: sql<number>`count(*)::int`,
        availableBeds: sql<number>`sum(CASE WHEN hospital_beds.bed_state = 'available' THEN 1 ELSE 0 END)::int`,
        occupiedBeds: sql<number>`sum(CASE WHEN hospital_beds.bed_state = 'occupied' THEN 1 ELSE 0 END)::int`,
        reservedBeds: sql<number>`sum(CASE WHEN hospital_beds.bed_state = 'reserved' THEN 1 ELSE 0 END)::int`,
      })
      .from(hospitalBedsTable)
      .leftJoin(
        bedCategoriesTable,
        eq(hospitalBedsTable.categoryId, bedCategoriesTable.id),
      )
      .where(eq(hospitalBedsTable.hospitalId, hospitalId))
      .groupBy(bedCategoriesTable.id, bedCategoriesTable.categoryName);

    res.json({
      hospitalId,
      hospitalName: hospital.name,
      latestSnapshot: latestSnapshot || null,
      bedCountsByState,
      bedCountsByCategory,
    });
  } catch (err) {
    console.error("Fetch capacity summary error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch capacity summary",
      });
  }
});

/**
 * Update bed state (for staff to update bed status)
 */
router.put(
  "/beds/:bedId/state",
  requireCapacityAuth("doctor", "nurse", "admin"),
  async (req, res) => {
    try {
      const bedId = Number(req.params.bedId);
      const { newState, reason, notes } = req.body;

      const validStates = [
        "available",
        "occupied",
        "reserved",
        "cleaning",
        "maintenance",
        "unavailable",
        "pending_confirmation",
      ];
      if (!validStates.includes(newState)) {
        res.status(400).json({
          error: "invalid_request",
          message: `Invalid bed state. Must be one of: ${validStates.join(", ")}`,
        });
        return;
      }

      const [bed] = await db
        .select()
        .from(hospitalBedsTable)
        .where(eq(hospitalBedsTable.id, bedId));

      if (!bed) {
        res.status(404).json({ error: "not_found", message: "Bed not found" });
        return;
      }

      // If setting to occupied, create assignment record if patientId provided
      // If setting from occupied to available, end assignment
      let assignmentId = null;

      if (newState === "occupied" && req.body.patientId) {
        // Check if bed is already assigned
        const [existingAssignment] = await db
          .select()
          .from(bedAssignmentsTable)
          .where(
            and(
              eq(bedAssignmentsTable.bedId, bedId),
              isNull(bedAssignmentsTable.dischargeDate),
            ),
          );

        if (!existingAssignment) {
          const [assignment] = await db
            .insert(bedAssignmentsTable)
            .values({
              bedId,
              patientId: req.body.patientId,
              admissionDate: new Date(),
              admittingDoctorId: req.user!.id,
              primaryDiagnosis: req.body.primaryDiagnosis || null,
              admittedFrom: req.body.admittedFrom || null,
              admissionType: req.body.admissionType || "elective",
            })
            .returning();

          assignmentId = assignment.id;
        }
      } else if (bed.bedState === "occupied" && newState !== "occupied") {
        // End current assignment
        const [updatedAssignment] = await db
          .update(bedAssignmentsTable)
          .set({
            dischargeDate: new Date(),
            dischargeTo: req.body.dischargeTo || null,
            dischargeSummary: req.body.dischargeSummary || null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(bedAssignmentsTable.bedId, bedId),
              isNull(bedAssignmentsTable.dischargeDate),
            ),
          )
          .returning();
      }

      // Update bed state
      const [updatedBed] = await db
        .update(hospitalBedsTable)
        .set({
          bedState: newState,
          stateChangeReason: reason || null,
          notes: notes || bed.notes,
          lastStateChange: new Date(),
          changedBy: req.user!.id,
          updatedAt: new Date(),
        })
        .where(eq(hospitalBedsTable.id, bedId))
        .returning();

      await createAuditLog(
        req,
        "update_bed_state",
        "hospital_bed",
        bedId,
        `Changed bed ${bed.bedNumber} from ${bed.bedState} to ${newState}. Reason: ${reason || "None provided"}`,
      );

      res.json({
        bed: updatedBed,
        assignmentId,
      });
    } catch (err) {
      console.error("Update bed state error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to update bed state",
        });
    }
  },
);

/**
 * Create a bed reservation
 */
router.post(
  "/bed-reservations",
  requireCapacityAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const {
        bedId,
        patientId,
        priorityLevel,
        requiredByDate,
        admissionType,
        clinicalNotes,
        contactPhone,
      } = req.body;

      // Validate required fields
      if (!bedId || !patientId) {
        res.status(400).json({
          error: "invalid_request",
          message: "Bed ID and Patient ID are required",
        });
        return;
      }

      // Verify bed exists and is available
      const [bed] = await db
        .select()
        .from(hospitalBedsTable)
        .where(eq(hospitalBedsTable.id, bedId));

      if (!bed) {
        res.status(404).json({ error: "not_found", message: "Bed not found" });
        return;
      }

      if (bed.bedState !== "available") {
        res.status(409).json({
          error: "conflict",
          message: `Bed is not available. Current state: ${bed.bedState}`,
        });
        return;
      }

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

      // Check if patient already has an active reservation
      const [existingReservation] = await db
        .select()
        .from(bedReservationsTable)
        .where(
          and(
            eq(bedReservationsTable.patientId, patientId),
            inArray(bedReservationsTable.status, ["pending", "confirmed"]),
          ),
        );

      if (existingReservation) {
        res.status(409).json({
          error: "conflict",
          message: "Patient already has an active bed reservation",
        });
        return;
      }

      // Set expiration time (e.g., 4 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4);

      const [reservation] = await db
        .insert(bedReservationsTable)
        .values({
          bedId,
          patientId,
          reservedBy: req.user!.id,
          priorityLevel: priorityLevel || "medium",
          expiresAt,
          requiredByDate: requiredByDate ? new Date(requiredByDate) : null,
          admissionType: admissionType || "elective",
          clinicalNotes,
          contactPhone,
        })
        .returning();

      // Update bed state to reserved
      await db
        .update(hospitalBedsTable)
        .set({
          bedState: "reserved",
          lastStateChange: new Date(),
          stateChangeReason: "Bed reserved for patient",
          changedBy: req.user!.id,
          updatedAt: new Date(),
        })
        .where(eq(hospitalBedsTable.id, bedId));

      await createAuditLog(
        req,
        "create",
        "bed_reservation",
        reservation.id,
        `Created reservation for bed ${bed.bedNumber} for patient ${patient.name}`,
      );

      res.status(201).json(reservation);
    } catch (err) {
      console.error("Create bed reservation error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to create bed reservation",
        });
    }
  },
);

/**
 * Confirm a bed reservation (convert to actual assignment)
 */
router.put(
  "/bed-reservations/:id/confirm",
  requireCapacityAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const reservationId = Number(req.params.id);
      const {
        admittingDoctorId,
        primaryDiagnosis,
        admittedFrom,
        admissionType,
      } = req.body;

      const [reservation] = await db
        .select()
        .from(bedReservationsTable)
        .where(eq(bedReservationsTable.id, reservationId));

      if (!reservation) {
        res
          .status(404)
          .json({ error: "not_found", message: "Reservation not found" });
        return;
      }

      if (reservation.status !== "pending") {
        res.status(409).json({
          error: "conflict",
          message: `Reservation is not in pending state. Current state: ${reservation.status}`,
        });
        return;
      }

      // Check if reservation has expired
      if (new Date() > new Date(reservation.expiresAt)) {
        // Update reservation status to expired
        await db
          .update(bedReservationsTable)
          .set({
            status: "expired",
            updatedAt: new Date(),
          })
          .where(eq(bedReservationsTable.id, reservationId));

        // Update bed back to available
        await db
          .update(hospitalBedsTable)
          .set({
            bedState: "available",
            lastStateChange: new Date(),
            stateChangeReason: "Reservation expired",
            changedBy: req.user!.id,
            updatedAt: new Date(),
          })
          .where(eq(hospitalBedsTable.bedId, reservation.bedId));

        res
          .status(400)
          .json({ error: "expired", message: "Reservation has expired" });
        return;
      }

      // Create bed assignment
      const [assignment] = await db
        .insert(bedAssignmentsTable)
        .values({
          bedId: reservation.bedId,
          patientId: reservation.patientId,
          admissionDate: new Date(),
          admittingDoctorId: admittingDoctorId || req.user!.id,
          primaryDiagnosis: primaryDiagnosis || null,
          admittedFrom: admittedFrom || null,
          admissionType: admissionType || reservation.admissionType,
        })
        .returning();

      // Update reservation status to confirmed
      const [updatedReservation] = await db
        .update(bedReservationsTable)
        .set({
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(bedReservationsTable.id, reservationId))
        .returning();

      // Update bed state to occupied
      await db
        .update(hospitalBedsTable)
        .set({
          bedState: "occupied",
          lastStateChange: new Date(),
          stateChangeReason: "Bed occupied from confirmed reservation",
          changedBy: req.user!.id,
          updatedAt: new Date(),
        })
        .where(eq(hospitalBedsTable.id, reservation.bedId));

      await createAuditLog(
        req,
        "confirm",
        "bed_reservation",
        reservationId,
        `Confirmed reservation and created bed assignment for patient ${reservation.patientId}`,
      );

      res.json({
        reservation: updatedReservation,
        assignment,
      });
    } catch (err) {
      console.error("Confirm bed reservation error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to confirm bed reservation",
        });
    }
  },
);

/**
 * Cancel a bed reservation
 */
router.put(
  "/bed-reservations/:id/cancel",
  requireCapacityAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const reservationId = Number(req.params.id);
      const { cancellationReason } = req.body;

      const [reservation] = await db
        .select()
        .from(bedReservationsTable)
        .where(eq(bedReservationsTable.id, reservationId));

      if (!reservation) {
        res
          .status(404)
          .json({ error: "not_found", message: "Reservation not found" });
        return;
      }

      if (
        reservation.status !== "pending" &&
        reservation.status !== "confirmed"
      ) {
        res.status(409).json({
          error: "conflict",
          message: `Reservation cannot be cancelled. Current state: ${reservation.status}`,
        });
        return;
      }

      // Update reservation status
      const [updatedReservation] = await db
        .update(bedReservationsTable)
        .set({
          status: "cancelled",
          rejectionReason: cancellationReason || null,
          updatedAt: new Date(),
        })
        .where(eq(bedReservationsTable.id, reservationId))
        .returning();

      // If bed was reserved, set it back to available
      if (reservation.status === "confirmed") {
        // Find the bed assignment and end it
        const [assignment] = await db
          .select()
          .from(bedAssignmentsTable)
          .where(eq(bedAssignmentsTable.bedId, reservation.bedId));

        if (assignment) {
          await db
            .update(bedAssignmentsTable)
            .set({
              dischargeDate: new Date(),
              dischargeSummary: "Reservation cancelled before admission",
              updatedAt: new Date(),
            })
            .where(eq(bedAssignmentsTable.id, assignment.id));
        }

        // Set bed back to available
        await db
          .update(hospitalBedsTable)
          .set({
            bedState: "available",
            lastStateChange: new Date(),
            stateChangeReason: "Reservation cancelled",
            changedBy: req.user!.id,
            updatedAt: new Date(),
          })
          .where(eq(hospitalBedsTable.id, reservation.bedId));
      } else {
        // Bed was still reserved, set it back to available
        await db
          .update(hospitalBedsTable)
          .set({
            bedState: "available",
            lastStateChange: new Date(),
            stateChangeReason: "Reservation cancelled",
            changedBy: req.user!.id,
            updatedAt: new Date(),
          })
          .where(eq(hospitalBedsTable.id, reservation.bedId));
      }

      await createAuditLog(
        req,
        "cancel",
        "bed_reservation",
        reservationId,
        `Cancelled bed reservation. Reason: ${cancellationReason || "None provided"}`,
      );

      res.json(updatedReservation);
    } catch (err) {
      console.error("Cancel bed reservation error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to cancel bed reservation",
        });
    }
  },
);

/**
 * Get patient's active bed reservations
 */
router.get(
  "/patient/:patientId/bed-reservations",
  requireAuth,
  async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);

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

      const reservations = await db
        .select({
          id: bedReservationsTable.id,
          bedId: bedReservationsTable.bedId,
          bedNumber: hospitalBedsTable.bedNumber,
          bedCategory: bedCategoriesTable.categoryName,
          reservationDate: bedReservationsTable.reservationDate,
          expiresAt: bedReservationsTable.expiresAt,
          priorityLevel: bedReservationsTable.priorityLevel,
          requiredByDate: bedReservationsTable.requiredByDate,
          admissionType: bedReservationsTable.admissionType,
          status: bedReservationsTable.status,
          rejectionReason: bedReservationsTable.rejectionReason,
          reservedByName: usersTable.name,
          hospitalId: hospitalsTable.id,
          hospitalName: hospitalsTable.name,
        })
        .from(bedReservationsTable)
        .leftJoin(
          hospitalBedsTable,
          eq(bedReservationsTable.bedId, hospitalBedsTable.id),
        )
        .leftJoin(
          bedCategoriesTable,
          eq(hospitalBedsTable.categoryId, bedCategoriesTable.id),
        )
        .leftJoin(
          hospitalsTable,
          eq(hospitalBedsTable.hospitalId, hospitalsTable.id),
        )
        .leftJoin(
          usersTable,
          eq(bedReservationsTable.reservedBy, usersTable.id),
        )
        .where(eq(bedReservationsTable.patientId, patientId))
        .orderBy(desc(bedReservationsTable.reservationDate));

      res.json(reservations);
    } catch (err) {
      console.error("Fetch patient bed reservations error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch patient bed reservations",
        });
    }
  },
);

/**
 * Get current bed assignments (admitted patients)
 */
router.get(
  "/bed-assignments",
  requireCapacityAuth("doctor", "nurse", "admin"),
  async (req, res) => {
    try {
      const hospitalId = req.user!.hospitalId;

      const assignments = await db
        .select({
          id: bedAssignmentsTable.id,
          bedId: bedAssignmentsTable.bedId,
          bedNumber: hospitalBedsTable.bedNumber,
          bedCategory: bedCategoriesTable.categoryName,
          patientId: bedAssignmentsTable.patientId,
          patientName: patientsTable.name,
          admissionDate: bedAssignmentsTable.admissionDate,
          admissionType: bedAssignmentsTable.admissionType,
          primaryDiagnosis: bedAssignmentsTable.primaryDiagnosis,
          admittedFrom: bedAssignmentsTable.admittedFrom,
          admittingDoctorName: usersTable.name,
          estimatedStayDays: bedAssignmentsTable.estimatedStayDays,
        })
        .from(bedAssignmentsTable)
        .leftJoin(
          hospitalBedsTable,
          eq(bedAssignmentsTable.bedId, hospitalBedsTable.id),
        )
        .leftJoin(
          bedCategoriesTable,
          eq(hospitalBedsTable.categoryId, bedCategoriesTable.id),
        )
        .leftJoin(
          patientsTable,
          eq(bedAssignmentsTable.patientId, patientsTable.id),
        )
        .leftJoin(
          usersTable,
          eq(bedAssignmentsTable.admittingDoctorId, usersTable.id),
        )
        .where(eq(hospitalBedsTable.hospitalId, hospitalId))
        .orderBy(desc(bedAssignmentsTable.admissionDate));

      res.json(assignments);
    } catch (err) {
      console.error("Fetch bed assignments error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch bed assignments",
        });
    }
  },
);

/**
 * Create admission coordination record (referral between hospitals)
 */
router.post(
  "/admission-coordination",
  requireCapacityAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const {
        patientId,
        referringHospitalId,
        receivingHospitalId,
        referralReason,
        clinicalSummary,
        requestedBedCategory,
        urgencyLevel,
      } = req.body;

      // Validate required fields
      if (!patientId || !referringHospitalId || !receivingHospitalId) {
        res.status(400).json({
          error: "invalid_request",
          message:
            "Patient ID, Referring Hospital ID, and Receiving Hospital ID are required",
        });
        return;
      }

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

      // Verify referring hospital exists
      const [referringHospital] = await db
        .select()
        .from(hospitalsTable)
        .where(eq(hospitalsTable.id, referringHospitalId));

      if (!referringHospital) {
        res
          .status(404)
          .json({
            error: "not_found",
            message: "Referring hospital not found",
          });
        return;
      }

      // Verify receiving hospital exists
      const [receivingHospital] = await db
        .select()
        .from(hospitalsTable)
        .where(eq(hospitalsTable.id, receivingHospitalId));

      if (!receivingHospital) {
        res
          .status(404)
          .json({
            error: "not_found",
            message: "Receiving hospital not found",
          });
        return;
      }

      // Prevent self-referral
      if (referringHospitalId === receivingHospitalId) {
        res.status(400).json({
          error: "invalid_request",
          message: "Referring and receiving hospitals cannot be the same",
        });
        return;
      }

      const [coordination] = await db
        .insert(admissionCoordinationTable)
        .values({
          patientId,
          referringHospitalId,
          receivingHospitalId,
          referralReason,
          clinicalSummary,
          requestedBedCategory: requestedBedCategory || null,
          urgencyLevel: urgencyLevel || "medium",
        })
        .returning();

      await createAuditLog(
        req,
        "create",
        "admission_coordination",
        coordination.id,
        `Created admission coordination from ${referringHospital.name} to ${receivingHospital.name} for patient ${patient.name}`,
      );

      res.status(201).json(coordination);
    } catch (err) {
      console.error("Create admission coordination error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to create admission coordination",
        });
    }
  },
);

/**
 * Update admission coordination status (receiving hospital response)
 */
router.put(
  "/admission-coordination/:id/response",
  requireCapacityAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const coordinationId = Number(req.params.id);
      const { status, response, estimatedTransferDate } = req.body;

      const validStatuses = [
        "pending_acceptance",
        "accepted",
        "rejected",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: "invalid_request",
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
        return;
      }

      const [coordination] = await db
        .select()
        .from(admissionCoordinationTable)
        .where(eq(admissionCoordinationTable.id, coordinationId));

      if (!coordination) {
        res
          .status(404)
          .json({
            error: "not_found",
            message: "Admission coordination not found",
          });
        return;
      }

      // Only receiving hospital can update this
      if (
        coordination.receivingHospitalId !== req.user!.hospitalId &&
        req.user!.role !== "admin"
      ) {
        res
          .status(403)
          .json({
            error: "forbidden",
            message:
              "Only the receiving hospital can update coordination status",
          });
        return;
      }

      const [updatedCoordination] = await db
        .update(admissionCoordinationTable)
        .set({
          status,
          receivingHospitalResponse: response || null,
          responseDate: new Date(),
          estimatedTransferDate: estimatedTransferDate
            ? new Date(estimatedTransferDate)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(admissionCoordinationTable.id, coordinationId))
        .returning();

      await createAuditLog(
        req,
        "update_response",
        "admission_coordination",
        coordinationId,
        `Updated admission coordination status to ${status}`,
      );

      res.json(updatedCoordination);
    } catch (err) {
      console.error("Update admission coordination error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to update admission coordination",
        });
    }
  },
);

/**
 * Get hospital capacity alerts
 */
router.get(
  "/capacity-alerts",
  requireCapacityAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const hospitalId = req.user!.hospitalId;

      const alerts = await db
        .select({
          id: hospitalCapacityAlertsTable.id,
          alertType: hospitalCapacityAlertsTable.alertType,
          severity: hospitalCapacityAlertsTable.severity,
          thresholdValue: hospitalCapacityAlertsTable.thresholdValue,
          currentValue: hospitalCapacityAlertsTable.currentValue,
          alertMessage: hospitalCapacityAlertsTable.alertMessage,
          isActive: hospitalCapacityAlertsTable.isActive,
          acknowledgedByName: usersTable.name,
          acknowledgedAt: hospitalCapacityAlertsTable.acknowledgedAt,
          resolutionNotes: hospitalCapacityAlertsTable.resolutionNotes,
          resolvedAt: hospitalCapacityAlertsTable.resolvedAt,
          createdAt: hospitalCapacityAlertsTable.createdAt,
        })
        .from(hospitalCapacityAlertsTable)
        .leftJoin(
          usersTable,
          eq(hospitalCapacityAlertsTable.acknowledgedBy, usersTable.id),
        )
        .where(eq(hospitalCapacityAlertsTable.hospitalId, hospitalId))
        .orderBy(desc(hospitalCapacityAlertsTable.createdAt));

      res.json(alerts);
    } catch (err) {
      console.error("Fetch capacity alerts error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch capacity alerts",
        });
    }
  },
);

/**
 * Acknowledge a capacity alert
 */
router.put(
  "/capacity-alerts/:id/acknowledge",
  requireCapacityAuth("doctor", "admin"),
  async (req, res) => {
    try {
      const alertId = Number(req.params.id);

      const [alert] = await db
        .select()
        .from(hospitalCapacityAlertsTable)
        .where(eq(hospitalCapacityAlertsTable.id, alertId));

      if (!alert) {
        res
          .status(404)
          .json({ error: "not_found", message: "Alert not found" });
        return;
      }

      if (!alert.isActive) {
        res
          .status(400)
          .json({
            error: "invalid_request",
            message: "Alert is already inactive",
          });
        return;
      }

      const [updatedAlert] = await db
        .update(hospitalCapacityAlertsTable)
        .set({
          isActive: false,
          acknowledgedBy: req.user!.id,
          acknowledgedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(hospitalCapacityAlertsTable.id, alertId))
        .returning();

      await createAuditLog(
        req,
        "acknowledge",
        "capacity_alert",
        alertId,
        `Acknowledged capacity alert of type ${alert.alertType}`,
      );

      res.json(updatedAlert);
    } catch (err) {
      console.error("Acknowledge capacity alert error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to acknowledge capacity alert",
        });
    }
  },
);

/**
 * Generate hospital capacity dashboard data for multiple hospitals
 */
router.get(
  "/dashboard/multi-hospital",
  requireCapacityAuth("admin"),
  async (req, res) => {
    try {
      const { hospitalIds } = req.query;

      let hospitalsQuery = db
        .select({
          id: hospitalsTable.id,
          name: hospitalsTable.name,
          city: hospitalsTable.city,
          state: hospitalsTable.state,
        })
        .from(hospitalsTable)
        .where(eq(hospitalsTable.isActive, true));

      if (hospitalIds) {
        const idsArray = Array.isArray(hospitalIds)
          ? hospitalIds
          : [hospitalIds];
        const ids = idsArray.map((id) => Number(id));
        hospitalsQuery = hospitalsQuery.where(inArray(hospitalsTable.id, ids));
      }

      const hospitals = await hospitalsQuery;

      // Get latest capacity snapshot for each hospital
      const hospitalData = await Promise.all(
        hospitals.map(async (hospital) => {
          const [latestSnapshot] = await db
            .select()
            .from(hospitalCapacitySnapshotsTable)
            .where(eq(hospitalCapacitySnapshotsTable.hospitalId, hospital.id))
            .orderBy(desc(hospitalCapacitySnapshotsTable.snapshotDate))
            .limit(1);

          // Get bed counts by state for this hospital
          const bedCounts = await db
            .select({
              bedState: hospitalBedsTable.bedState,
              count: sql<number>`count(*)::int`,
            })
            .from(hospitalBedsTable)
            .where(eq(hospitalBedsTable.hospitalId, hospital.id))
            .groupBy(hospitalBedsTable.bedState);

          return {
            hospital: {
              id: hospital.id,
              name: hospital.name,
              city: hospital.city,
              state: hospital.state,
            },
            capacitySnapshot: latestSnapshot || null,
            bedCountsByState: bedCounts.reduce(
              (acc, item) => {
                acc[item.bedState] = item.count;
                return acc;
              },
              {} as Record<string, number>,
            ),
          };
        }),
      );

      res.json(hospitalData);
    } catch (err) {
      console.error("Fetch multi-hospital dashboard error:", err);
      res
        .status(500)
        .json({
          error: "internal_error",
          message: "Failed to fetch multi-hospital dashboard data",
        });
    }
  },
);

export default router;
