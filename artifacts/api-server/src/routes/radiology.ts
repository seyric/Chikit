import { Router } from "express";
import { db } from "@workspace/db";
import { radiologyReportsTable, patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const reports = await db.select({
      id: radiologyReportsTable.id, patientId: radiologyReportsTable.patientId,
      doctorId: radiologyReportsTable.doctorId, hospitalId: radiologyReportsTable.hospitalId,
      imagingType: radiologyReportsTable.imagingType, bodyPart: radiologyReportsTable.bodyPart,
      studyDate: radiologyReportsTable.studyDate, findings: radiologyReportsTable.findings,
      impression: radiologyReportsTable.impression, radiologistNotes: radiologyReportsTable.radiologistNotes,
      aiFindings: radiologyReportsTable.aiFindings, status: radiologyReportsTable.status,
      createdAt: radiologyReportsTable.createdAt, patientName: patientsTable.name,
      doctorName: patientsTable.name,
    }).from(radiologyReportsTable)
      .leftJoin(patientsTable, eq(radiologyReportsTable.patientId, patientsTable.id));
    res.json(reports);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch radiology reports" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, imagingType, bodyPart, studyDate, findings, impression, radiologistNotes } = req.body;
    const [report] = await db.insert(radiologyReportsTable).values({
      patientId, doctorId, hospitalId, imagingType, bodyPart, studyDate: new Date(studyDate), findings, impression, radiologistNotes,
    }).returning();
    await createAuditLog(req, "create", "radiology_report", report.id);
    res.status(201).json({ ...report, patientName: null, doctorName: null });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to create radiology report" });
  }
});

export default router;
