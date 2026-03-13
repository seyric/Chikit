import { Router } from "express";
import { db } from "@workspace/db";
import { labReportsTable, patientsTable, doctorsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

const withNames = () => db.select({
  id: labReportsTable.id, patientId: labReportsTable.patientId, doctorId: labReportsTable.doctorId,
  hospitalId: labReportsTable.hospitalId, testName: labReportsTable.testName, testDate: labReportsTable.testDate,
  results: labReportsTable.results, referenceRanges: labReportsTable.referenceRanges,
  interpretation: labReportsTable.interpretation, aiInterpretation: labReportsTable.aiInterpretation,
  status: labReportsTable.status, createdAt: labReportsTable.createdAt,
  patientName: patientsTable.name, doctorName: usersTable.name,
}).from(labReportsTable)
  .leftJoin(patientsTable, eq(labReportsTable.patientId, patientsTable.id))
  .leftJoin(doctorsTable, eq(labReportsTable.doctorId, doctorsTable.id))
  .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id));

router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, patientId } = req.query;
    let query = withNames();
    if (status && patientId) {
      query = query.where(and(eq(labReportsTable.status, String(status)), eq(labReportsTable.patientId, Number(patientId))));
    } else if (status) {
      query = query.where(eq(labReportsTable.status, String(status)));
    } else if (patientId) {
      query = query.where(eq(labReportsTable.patientId, Number(patientId)));
    }
    const reports = await query;
    res.json(reports);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch lab reports" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, testName, testDate, results, referenceRanges, interpretation } = req.body;
    const [report] = await db.insert(labReportsTable).values({
      patientId, doctorId, hospitalId, testName, testDate: testDate ? new Date(testDate) : new Date(), results, referenceRanges, interpretation,
    }).returning();
    await createAuditLog(req, "create", "lab_report", report.id);
    res.status(201).json({ ...report, patientName: null, doctorName: null });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to create lab report" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [report] = await withNames().where(eq(labReportsTable.id, Number(req.params.id)));
    if (!report) { res.status(404).json({ error: "not_found", message: "Lab report not found" }); return; }
    await createAuditLog(req, "view", "lab_report", report.id);
    res.json(report);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch lab report" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status, results, interpretation, referenceRanges } = req.body;
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (results !== undefined) updates.results = results;
    if (interpretation !== undefined) updates.interpretation = interpretation;
    if (referenceRanges !== undefined) updates.referenceRanges = referenceRanges;
    const [report] = await db.update(labReportsTable).set(updates).where(eq(labReportsTable.id, Number(req.params.id))).returning();
    await createAuditLog(req, "update", "lab_report", report.id, `Status: ${status}`);
    res.json({ ...report, patientName: null, doctorName: null });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to update lab report" });
  }
});

export default router;
