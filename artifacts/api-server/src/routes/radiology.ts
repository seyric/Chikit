// @ts-nocheck
import { Router } from "express";
import { db } from "@workspace/db";
import {
  radiologyReportsTable,
  patientsTable,
  doctorsTable,
  usersTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

const withNames = () =>
  db
    .select({
      id: radiologyReportsTable.id,
      patientId: radiologyReportsTable.patientId,
      doctorId: radiologyReportsTable.doctorId,
      hospitalId: radiologyReportsTable.hospitalId,
      imagingType: radiologyReportsTable.imagingType,
      bodyPart: radiologyReportsTable.bodyPart,
      studyDate: radiologyReportsTable.studyDate,
      findings: radiologyReportsTable.findings,
      impression: radiologyReportsTable.impression,
      radiologistNotes: radiologyReportsTable.radiologistNotes,
      aiFindings: radiologyReportsTable.aiFindings,
      status: radiologyReportsTable.status,
      createdAt: radiologyReportsTable.createdAt,
      patientName: patientsTable.name,
      doctorName: usersTable.name,
    })
    .from(radiologyReportsTable)
    .leftJoin(
      patientsTable,
      eq(radiologyReportsTable.patientId, patientsTable.id),
    )
    .leftJoin(doctorsTable, eq(radiologyReportsTable.doctorId, doctorsTable.id))
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id));

router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, patientId } = req.query;
    let query = withNames();
    if (status && patientId) {
      query = query.where(
        and(
          eq(radiologyReportsTable.status, String(status)),
          eq(radiologyReportsTable.patientId, Number(patientId)),
        ),
      );
    } else if (status) {
      query = query.where(eq(radiologyReportsTable.status, String(status)));
    } else if (patientId) {
      query = query.where(
        eq(radiologyReportsTable.patientId, Number(patientId)),
      );
    }
    const reports = await query;
    res.json(reports);
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch radiology reports",
      });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      hospitalId,
      imagingType,
      bodyPart,
      studyDate,
      findings,
      impression,
      radiologistNotes,
    } = req.body;
    const [report] = await db
      .insert(radiologyReportsTable)
      .values({
        patientId,
        doctorId,
        hospitalId,
        imagingType,
        bodyPart,
        studyDate: studyDate ? new Date(studyDate) : new Date(),
        findings,
        impression,
        radiologistNotes,
      })
      .returning();
    await createAuditLog(req, "create", "radiology_report", report.id);
    res.status(201).json({ ...report, patientName: null, doctorName: null });
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to create radiology report",
      });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [report] = await withNames().where(
      eq(radiologyReportsTable.id, Number(req.params.id)),
    );
    if (!report) {
      res
        .status(404)
        .json({ error: "not_found", message: "Radiology report not found" });
      return;
    }
    res.json(report);
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch radiology report",
      });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status, findings, impression, radiologistNotes, aiFindings } =
      req.body;
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (findings !== undefined) updates.findings = findings;
    if (impression !== undefined) updates.impression = impression;
    if (radiologistNotes !== undefined)
      updates.radiologistNotes = radiologistNotes;
    if (aiFindings !== undefined) updates.aiFindings = aiFindings;
    const [report] = await db
      .update(radiologyReportsTable)
      .set(updates)
      .where(eq(radiologyReportsTable.id, Number(req.params.id)))
      .returning();
    await createAuditLog(
      req,
      "update",
      "radiology_report",
      report.id,
      `Status: ${status}`,
    );
    res.json({ ...report, patientName: null, doctorName: null });
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to update radiology report",
      });
  }
});

export default router;
