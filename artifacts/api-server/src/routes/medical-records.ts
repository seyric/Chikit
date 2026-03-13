import { Router } from "express";
import { db } from "@workspace/db";
import { medicalRecordsTable, patientsTable, doctorsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

const withNames = () => db.select({
  id: medicalRecordsTable.id, patientId: medicalRecordsTable.patientId, doctorId: medicalRecordsTable.doctorId,
  hospitalId: medicalRecordsTable.hospitalId, visitDate: medicalRecordsTable.visitDate,
  chiefComplaint: medicalRecordsTable.chiefComplaint, diagnosis: medicalRecordsTable.diagnosis,
  symptoms: medicalRecordsTable.symptoms, vitalSigns: medicalRecordsTable.vitalSigns,
  treatmentPlan: medicalRecordsTable.treatmentPlan, notes: medicalRecordsTable.notes,
  followUpDate: medicalRecordsTable.followUpDate, createdAt: medicalRecordsTable.createdAt,
  patientName: patientsTable.name, doctorName: usersTable.name,
}).from(medicalRecordsTable)
  .leftJoin(patientsTable, eq(medicalRecordsTable.patientId, patientsTable.id))
  .leftJoin(doctorsTable, eq(medicalRecordsTable.doctorId, doctorsTable.id))
  .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id));

router.get("/", requireAuth, async (req, res) => {
  try {
    const records = await withNames();
    res.json(records);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch medical records" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, visitDate, chiefComplaint, diagnosis, symptoms, vitalSigns, treatmentPlan, notes, followUpDate } = req.body;
    const [record] = await db.insert(medicalRecordsTable).values({
      patientId, doctorId, hospitalId, visitDate: visitDate ? new Date(visitDate) : new Date(),
      chiefComplaint, diagnosis, symptoms, vitalSigns, treatmentPlan, notes, followUpDate,
    }).returning();
    await createAuditLog(req, "create", "medical_record", record.id, `Patient: ${patientId}`);
    res.status(201).json({ ...record, patientName: null, doctorName: null });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to create medical record" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [record] = await withNames().where(eq(medicalRecordsTable.id, Number(req.params.id)));
    if (!record) { res.status(404).json({ error: "not_found", message: "Record not found" }); return; }
    await createAuditLog(req, "view", "medical_record", record.id);
    res.json(record);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch record" });
  }
});

export default router;
