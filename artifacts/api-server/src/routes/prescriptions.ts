import { Router } from "express";
import { db } from "@workspace/db";
import { prescriptionsTable, patientsTable, doctorsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

const withNames = () => db.select({
  id: prescriptionsTable.id, patientId: prescriptionsTable.patientId, doctorId: prescriptionsTable.doctorId,
  hospitalId: prescriptionsTable.hospitalId, prescriptionDate: prescriptionsTable.prescriptionDate,
  diagnosis: prescriptionsTable.diagnosis, medications: prescriptionsTable.medications,
  instructions: prescriptionsTable.instructions, followUpDays: prescriptionsTable.followUpDays,
  status: prescriptionsTable.status, createdAt: prescriptionsTable.createdAt,
  patientName: patientsTable.name, doctorName: usersTable.name,
}).from(prescriptionsTable)
  .leftJoin(patientsTable, eq(prescriptionsTable.patientId, patientsTable.id))
  .leftJoin(doctorsTable, eq(prescriptionsTable.doctorId, doctorsTable.id))
  .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id));

router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, patientId } = req.query;
    let query = withNames();
    if (status && patientId) {
      query = query.where(and(eq(prescriptionsTable.status, String(status)), eq(prescriptionsTable.patientId, Number(patientId))));
    } else if (status) {
      query = query.where(eq(prescriptionsTable.status, String(status)));
    } else if (patientId) {
      query = query.where(eq(prescriptionsTable.patientId, Number(patientId)));
    }
    const prescriptions = await query;
    res.json(prescriptions);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch prescriptions" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, diagnosis, medications, instructions, followUpDays } = req.body;
    const [prescription] = await db.insert(prescriptionsTable).values({
      patientId, doctorId, hospitalId, diagnosis, medications, instructions, followUpDays,
    }).returning();
    await createAuditLog(req, "create", "prescription", prescription.id);
    res.status(201).json({ ...prescription, patientName: null, doctorName: null });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to create prescription" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [prescription] = await withNames().where(eq(prescriptionsTable.id, Number(req.params.id)));
    if (!prescription) { res.status(404).json({ error: "not_found", message: "Prescription not found" }); return; }
    res.json(prescription);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch prescription" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status, medications, instructions, diagnosis } = req.body;
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (medications !== undefined) updates.medications = medications;
    if (instructions !== undefined) updates.instructions = instructions;
    if (diagnosis !== undefined) updates.diagnosis = diagnosis;
    const [prescription] = await db.update(prescriptionsTable).set(updates).where(eq(prescriptionsTable.id, Number(req.params.id))).returning();
    await createAuditLog(req, "update", "prescription", prescription.id, `Status: ${status}`);
    res.json({ ...prescription, patientName: null, doctorName: null });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to update prescription" });
  }
});

export default router;
