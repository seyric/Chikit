// @ts-nocheck
import { Router } from "express";
import { db } from "@workspace/db";
import {
  appointmentsTable,
  patientsTable,
  doctorsTable,
  usersTable,
  hospitalsTable,
} from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const appointments = await db
      .select({
        id: appointmentsTable.id,
        patientId: appointmentsTable.patientId,
        doctorId: appointmentsTable.doctorId,
        hospitalId: appointmentsTable.hospitalId,
        appointmentDate: appointmentsTable.appointmentDate,
        duration: appointmentsTable.duration,
        reason: appointmentsTable.reason,
        status: appointmentsTable.status,
        notes: appointmentsTable.notes,
        createdAt: appointmentsTable.createdAt,
        patientName: patientsTable.name,
        doctorName: usersTable.name,
        hospitalName: hospitalsTable.name,
      })
      .from(appointmentsTable)
      .leftJoin(
        patientsTable,
        eq(appointmentsTable.patientId, patientsTable.id),
      )
      .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
      .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
      .leftJoin(
        hospitalsTable,
        eq(appointmentsTable.hospitalId, hospitalsTable.id),
      );
    res.json(appointments);
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch appointments",
      });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      hospitalId,
      appointmentDate,
      duration,
      reason,
      notes,
    } = req.body;
    const [appt] = await db
      .insert(appointmentsTable)
      .values({
        patientId,
        doctorId,
        hospitalId,
        appointmentDate: new Date(appointmentDate),
        duration,
        reason,
        notes,
      })
      .returning();
    await createAuditLog(req, "create", "appointment", appt.id);
    const result = {
      ...appt,
      patientName: null,
      doctorName: null,
      hospitalName: null,
    };
    res.status(201).json(result);
  } catch {
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to book appointment" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [appt] = await db
      .select({
        id: appointmentsTable.id,
        patientId: appointmentsTable.patientId,
        doctorId: appointmentsTable.doctorId,
        hospitalId: appointmentsTable.hospitalId,
        appointmentDate: appointmentsTable.appointmentDate,
        duration: appointmentsTable.duration,
        reason: appointmentsTable.reason,
        status: appointmentsTable.status,
        notes: appointmentsTable.notes,
        createdAt: appointmentsTable.createdAt,
        patientName: patientsTable.name,
        doctorName: usersTable.name,
        hospitalName: hospitalsTable.name,
      })
      .from(appointmentsTable)
      .leftJoin(
        patientsTable,
        eq(appointmentsTable.patientId, patientsTable.id),
      )
      .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
      .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
      .leftJoin(
        hospitalsTable,
        eq(appointmentsTable.hospitalId, hospitalsTable.id),
      )
      .where(eq(appointmentsTable.id, Number(req.params.id)));
    if (!appt) {
      res
        .status(404)
        .json({ error: "not_found", message: "Appointment not found" });
      return;
    }
    res.json(appt);
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch appointment",
      });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { appointmentDate, status, notes, reason } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (appointmentDate) updates.appointmentDate = new Date(appointmentDate);
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (reason !== undefined) updates.reason = reason;
    const [appt] = await db
      .update(appointmentsTable)
      .set(updates)
      .where(eq(appointmentsTable.id, Number(req.params.id)))
      .returning();
    await createAuditLog(
      req,
      "update",
      "appointment",
      appt.id,
      `Status: ${status}`,
    );
    res.json({
      ...appt,
      patientName: null,
      doctorName: null,
      hospitalName: null,
    });
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to update appointment",
      });
  }
});

/**
 * Get appointment availability for a doctor on a specific date
 */
router.get("/availability/:doctorId/:date", requireAuth, async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const date = new Date(req.params.date);
    const hospitalId = req.user!.hospitalId;

    if (isNaN(date.getTime())) {
      res
        .status(400)
        .json({ error: "invalid_request", message: "Invalid date format" });
      return;
    }

    // Set start and end of day for the requested date
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM start
    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0); // 5 PM end

    // Get existing appointments for the doctor on this date
    const existingAppointments = await db
      .select({
        id: appointmentsTable.id,
        appointmentDate: appointmentsTable.appointmentDate,
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.doctorId, doctorId),
          eq(appointmentsTable.hospitalId, hospitalId),
          gte(appointmentsTable.appointmentDate, startOfDay),
          lte(appointmentsTable.appointmentDate, endOfDay),
        ),
      )
      .orderBy(appointmentsTable.appointmentDate);

    // Generate time slots (30-minute intervals)
    const timeSlots = [];
    let currentTime = new Date(startOfDay);

    while (currentTime <= endOfDay) {
      const isTaken = existingAppointments.some((appt) => {
        const apptDate = new Date(appt.appointmentDate);
        return apptDate.getTime() === currentTime.getTime();
      });

      timeSlots.push({
        time: currentTime.toISOString().substring(11, 16), // HH:MM format
        available: !isTaken,
        appointmentId: isTaken
          ? existingAppointments.find(
              (appt) =>
                new Date(appt.appointmentDate).getTime() ===
                currentTime.getTime(),
            )?.id
          : null,
      });

      // Increment by 30 minutes
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    await createAuditLog(req, "check_availability", "doctor", doctorId);
    res.json({ date: date.toISOString().split("T")[0], timeSlots });
  } catch (err) {
    console.error("Availability check error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to check availability",
      });
  }
});

/**
 * Create recurring appointments
 */
router.post("/recurring", requireAuth, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      hospitalId,
      startDate,
      endDate,
      frequency,
      duration,
      reason,
      notes,
    } = req.body;

    if (
      !patientId ||
      !doctorId ||
      !hospitalId ||
      !startDate ||
      !endDate ||
      !frequency
    ) {
      res.status(400).json({
        error: "invalid_request",
        message:
          "Patient ID, Doctor ID, Hospital ID, Start Date, End Date, and Frequency are required",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res
        .status(400)
        .json({ error: "invalid_request", message: "Invalid date format" });
      return;
    }

    // Parse frequency (e.g., "daily", "weekly", "monthly")
    const frequencyMap: Record<string, number> = {
      daily: 1,
      weekly: 7,
      monthly: 30,
    };

    const intervalDays = frequencyMap[frequency.toLowerCase()];
    if (!intervalDays) {
      res.status(400).json({
        error: "invalid_request",
        message: "Frequency must be one of: daily, weekly, monthly",
      });
      return;
    }

    const appointmentsToCreate = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      // Skip if it's a Sunday (0) or Saturday (6) - adjust as needed
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Exclude weekends
        appointmentsToCreate.push({
          patientId,
          doctorId,
          hospitalId,
          appointmentDate: new Date(currentDate),
          duration: duration ?? 30,
          reason,
          notes: notes
            ? `${notes} (Recurring appointment)`
            : "Recurring appointment",
          status: "scheduled",
        });
      }

      // Increment by interval days
      currentDate = new Date(
        currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000,
      );
    }

    // Create all appointments
    if (appointmentsToCreate.length > 0) {
      const createdAppointments = await db
        .insert(appointmentsTable)
        .values(appointmentsToCreate)
        .returning();

      await createAuditLog(
        req,
        "create_recurring",
        "appointment",
        0,
        `Created ${createdAppointments.length} recurring appointments for patient ${patientId}`,
      );

      res.status(201).json({
        count: createdAppointments.length,
        appointments: createdAppointments.map((appt) => ({
          id: appt.id,
          appointmentDate: appt.appointmentDate,
          status: appt.status,
        })),
      });
    } else {
      res.json({ count: 0, appointments: [] });
    }
  } catch (err) {
    console.error("Recurring appointments error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to create recurring appointments",
      });
  }
});

/**
 * Get patient's upcoming appointments
 */
router.get("/patient/:patientId/upcoming", requireAuth, async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const hospitalId = req.user!.hospitalId;

    const upcomingAppointments = await db
      .select({
        id: appointmentsTable.id,
        appointmentDate: appointmentsTable.appointmentDate,
        duration: appointmentsTable.duration,
        reason: appointmentsTable.reason,
        status: appointmentsTable.status,
        notes: appointmentsTable.notes,
        createdAt: appointmentsTable.createdAt,
        doctorName: usersTable.name,
        hospitalName: hospitalsTable.name,
      })
      .from(appointmentsTable)
      .leftJoin(usersTable, eq(appointmentsTable.doctorId, usersTable.id))
      .leftJoin(
        hospitalsTable,
        eq(appointmentsTable.hospitalId, hospitalsTable.id),
      )
      .where(
        and(
          eq(appointmentsTable.patientId, patientId),
          eq(appointmentsTable.hospitalId, hospitalId),
          gte(appointmentsTable.appointmentDate, new Date()),
        ),
      )
      .orderBy(appointmentsTable.appointmentDate)
      .limit(10);

    await createAuditLog(req, "view_upcoming", "patient", patientId);
    res.json(upcomingAppointments);
  } catch (err) {
    console.error("Upcoming appointments error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch upcoming appointments",
      });
  }
});

/**
 * Cancel appointment
 */
router.put("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { cancellationReason } = req.body;

    const [existingAppointment] = await db
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointmentId));

    if (!existingAppointment) {
      res
        .status(404)
        .json({ error: "not_found", message: "Appointment not found" });
      return;
    }

    // Check if user has permission to cancel this appointment
    const hospitalId = req.user!.hospitalId;
    if (
      existingAppointment.hospitalId !== hospitalId &&
      req.user!.role !== "admin"
    ) {
      res
        .status(403)
        .json({
          error: "forbidden",
          message: "Not authorized to cancel this appointment",
        });
      return;
    }

    const [updatedAppointment] = await db
      .update(appointmentsTable)
      .set({
        status: "cancelled",
        notes: cancellationReason
          ? `${existingAppointment.notes || ""}\nCancellation: ${cancellationReason}`.trim()
          : existingAppointment.notes,
        updatedAt: new Date(),
      })
      .where(eq(appointmentsTable.id, appointmentId))
      .returning();

    await createAuditLog(
      req,
      "cancel",
      "appointment",
      appointmentId,
      `Cancelled appointment. Reason: ${cancellationReason || "Not provided"}`,
    );

    res.json({
      ...updatedAppointment,
      patientName: null,
      doctorName: null,
      hospitalName: null,
    });
  } catch (err) {
    console.error("Cancel appointment error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to cancel appointment",
      });
  }
});

/**
 * Mark appointment as completed
 */
router.put("/:id/complete", requireAuth, async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { completionNotes } = req.body;

    const [existingAppointment] = await db
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointmentId));

    if (!existingAppointment) {
      res
        .status(404)
        .json({ error: "not_found", message: "Appointment not found" });
      return;
    }

    // Check if user has permission to complete this appointment
    const hospitalId = req.user!.hospitalId;
    if (
      existingAppointment.hospitalId !== hospitalId &&
      req.user!.role !== "admin"
    ) {
      res
        .status(403)
        .json({
          error: "forbidden",
          message: "Not authorized to complete this appointment",
        });
      return;
    }

    const [updatedAppointment] = await db
      .update(appointmentsTable)
      .set({
        status: "completed",
        notes: completionNotes
          ? `${existingAppointment.notes || ""}\nCompletion: ${completionNotes}`.trim()
          : existingAppointment.notes,
        updatedAt: new Date(),
      })
      .where(eq(appointmentsTable.id, appointmentId))
      .returning();

    await createAuditLog(
      req,
      "complete",
      "appointment",
      appointmentId,
      `Marked appointment as completed. Notes: ${completionNotes || "None provided"}`,
    );

    res.json({
      ...updatedAppointment,
      patientName: null,
      doctorName: null,
      hospitalName: null,
    });
  } catch (err) {
    console.error("Complete appointment error:", err);
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to complete appointment",
      });
  }
});

export default router;
