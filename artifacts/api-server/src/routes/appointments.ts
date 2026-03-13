import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, patientsTable, doctorsTable, usersTable, hospitalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const appointments = await db.select({
      id: appointmentsTable.id, patientId: appointmentsTable.patientId, doctorId: appointmentsTable.doctorId,
      hospitalId: appointmentsTable.hospitalId, appointmentDate: appointmentsTable.appointmentDate,
      duration: appointmentsTable.duration, reason: appointmentsTable.reason,
      status: appointmentsTable.status, notes: appointmentsTable.notes, createdAt: appointmentsTable.createdAt,
      patientName: patientsTable.name, doctorName: usersTable.name, hospitalName: hospitalsTable.name,
    }).from(appointmentsTable)
      .leftJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
      .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
      .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
      .leftJoin(hospitalsTable, eq(appointmentsTable.hospitalId, hospitalsTable.id));
    res.json(appointments);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch appointments" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, appointmentDate, duration, reason, notes } = req.body;
    const [appt] = await db.insert(appointmentsTable).values({
      patientId, doctorId, hospitalId, appointmentDate: new Date(appointmentDate), duration, reason, notes,
    }).returning();
    await createAuditLog(req, "create", "appointment", appt.id);
    const result = { ...appt, patientName: null, doctorName: null, hospitalName: null };
    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to book appointment" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [appt] = await db.select({
      id: appointmentsTable.id, patientId: appointmentsTable.patientId, doctorId: appointmentsTable.doctorId,
      hospitalId: appointmentsTable.hospitalId, appointmentDate: appointmentsTable.appointmentDate,
      duration: appointmentsTable.duration, reason: appointmentsTable.reason,
      status: appointmentsTable.status, notes: appointmentsTable.notes, createdAt: appointmentsTable.createdAt,
      patientName: patientsTable.name, doctorName: usersTable.name, hospitalName: hospitalsTable.name,
    }).from(appointmentsTable)
      .leftJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
      .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
      .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
      .leftJoin(hospitalsTable, eq(appointmentsTable.hospitalId, hospitalsTable.id))
      .where(eq(appointmentsTable.id, Number(req.params.id)));
    if (!appt) { res.status(404).json({ error: "not_found", message: "Appointment not found" }); return; }
    res.json(appt);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch appointment" });
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
    const [appt] = await db.update(appointmentsTable).set(updates).where(eq(appointmentsTable.id, Number(req.params.id))).returning();
    await createAuditLog(req, "update", "appointment", appt.id, `Status: ${status}`);
    res.json({ ...appt, patientName: null, doctorName: null, hospitalName: null });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to update appointment" });
  }
});

export default router;
