import { Router } from "express";
import { db } from "@workspace/db";
import { prescriptionsTable, patientsTable, doctorsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
    const prescriptions = await withNames();
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

export default router;
