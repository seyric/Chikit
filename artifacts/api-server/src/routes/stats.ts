import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, doctorsTable, hospitalsTable, appointmentsTable, labReportsTable, medicalRecordsTable, aiAnalysisResultsTable } from "@workspace/db";
import { eq, count, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      [{ totalPatients }],
      [{ totalDoctors }],
      [{ totalHospitals }],
      [{ todayAppointments }],
      [{ pendingLabReports }],
      [{ recentMedicalRecords }],
      [{ aiAnalysesToday }],
    ] = await Promise.all([
      db.select({ totalPatients: count() }).from(patientsTable).where(eq(patientsTable.isActive, true)),
      db.select({ totalDoctors: count() }).from(doctorsTable),
      db.select({ totalHospitals: count() }).from(hospitalsTable).where(eq(hospitalsTable.isActive, true)),
      db.select({ todayAppointments: count() }).from(appointmentsTable)
        .where(and(gte(appointmentsTable.appointmentDate, today), lte(appointmentsTable.appointmentDate, tomorrow))),
      db.select({ pendingLabReports: count() }).from(labReportsTable).where(eq(labReportsTable.status, "pending")),
      db.select({ recentMedicalRecords: count() }).from(medicalRecordsTable).where(gte(medicalRecordsTable.createdAt, today)),
      db.select({ aiAnalysesToday: count() }).from(aiAnalysisResultsTable).where(gte(aiAnalysisResultsTable.createdAt, today)),
    ]);

    res.json({ totalPatients, totalDoctors, totalHospitals, todayAppointments, pendingLabReports, recentMedicalRecords, aiAnalysesToday });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch stats" });
  }
});

export default router;
