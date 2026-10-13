// @ts-nocheck
import { eq, and } from "drizzle-orm";
import { Router } from "express";
import { requireAuth } from "../lib/auth.ts";
import { db } from "@workspace/db";
import {
  labReportsTable,
  patientsTable,
  doctorsTable,
  usersTable,
} from "@workspace/db/schema";

const withNames = () =>
  db
    .select({
      id: labReportsTable.id,
      patientId: labReportsTable.patientId,
      doctorId: labReportsTable.doctorId,
      hospitalId: labReportsTable.hospitalId,
      testName: labReportsTable.testName,
      testDate: labReportsTable.testDate,
      results: labReportsTable.results,
      referenceRanges: labReportsTable.referenceRanges,
      interpretation: labReportsTable.interpretation,
      aiInterpretation: labReportsTable.aiInterpretation,
      status: labReportsTable.status,
      createdAt: labReportsTable.createdAt,
      patientName: patientsTable.name,
      doctorName: usersTable.name,
    })
    .from(labReportsTable)
    .leftJoin(patientsTable, eq(labReportsTable.patientId, patientsTable.id))
    .leftJoin(doctorsTable, eq(labReportsTable.doctorId, doctorsTable.id))
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id));

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const statusParam = req.query.status;
    const patientIdParam = req.query.patientId;
    let query = withNames();
    if (typeof statusParam === "string" && typeof patientIdParam === "string") {
      query = query.where(
        and(
          eq(labReportsTable.status, statusParam),
          eq(labReportsTable.patientId, Number(patientIdParam)),
        ),
      );
    } else if (typeof statusParam === "string") {
      query = query.where(eq(labReportsTable.status, statusParam));
    } else if (typeof patientIdParam === "string") {
      query = query.where(
        eq(labReportsTable.patientId, Number(patientIdParam)),
      );
    }
    const reports = await query;
    res.json(reports);
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to fetch lab reports",
      });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      hospitalId,
      testName,
      testDate,
      results,
      referenceRanges,
      interpretation,
      aiInterpretation,
      status,
    } = req.body;
    const [report] = await db
      .insert(labReportsTable)
      .values({
        patientId,
        doctorId,
        hospitalId,
        testName,
        testDate,
        results,
        referenceRanges,
        interpretation,
        aiInterpretation,
        status,
      })
      .returning();
    res.json(report);
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to create lab report",
      });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const report = await withNames().where(
      eq(labReportsTable.id, Number(req.params.id)),
    );
    if (!report) {
      return res
        .status(404)
        .json({ error: "not_found", message: "Lab report not found" });
    }
    res.json(report);
  } catch {
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to fetch lab report" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      hospitalId,
      testName,
      testDate,
      results,
      referenceRanges,
      interpretation,
      aiInterpretation,
      status,
    } = req.body;
    const [updatedReport] = await db
      .update(labReportsTable)
      .set({
        patientId,
        doctorId,
        hospitalId,
        testName,
        testDate,
        results,
        referenceRanges,
        interpretation,
        aiInterpretation,
        status,
      })
      .where(eq(labReportsTable.id, Number(req.params.id)))
      .returning();
    if (!updatedReport) {
      return res
        .status(404)
        .json({ error: "not_found", message: "Lab report not found" });
    }
    res.json(updatedReport);
  } catch {
    res
      .status(500)
      .json({
        error: "internal_error",
        message: "Failed to update lab report",
      });
  }
});

export default router;
