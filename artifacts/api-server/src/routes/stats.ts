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

router.get("/daily-patients", requireAuth, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const hospitalId = req.user!.hospitalId;

    const result = hospitalId
      ? await db.execute(sql`
          SELECT d::date AS date, COALESCE(c.cnt, 0)::int AS count
          FROM generate_series(CURRENT_DATE - ${days - 1} * interval '1 day', CURRENT_DATE, '1 day') d
          LEFT JOIN (
            SELECT DATE(p.created_at) AS day, COUNT(*) AS cnt
            FROM patients p
            JOIN appointments a ON a.patient_id = p.id
            JOIN doctors doc ON doc.id = a.doctor_id AND doc.hospital_id = ${hospitalId}
            WHERE p.created_at >= CURRENT_DATE - ${days - 1} * interval '1 day'
            GROUP BY DATE(p.created_at)
          ) c ON d::date = c.day
          ORDER BY d
        `)
      : await db.execute(sql`
          SELECT d::date AS date, COALESCE(c.cnt, 0)::int AS count
          FROM generate_series(CURRENT_DATE - ${days - 1} * interval '1 day', CURRENT_DATE, '1 day') d
          LEFT JOIN (
            SELECT DATE(created_at) AS day, COUNT(*) AS cnt
            FROM patients
            WHERE created_at >= CURRENT_DATE - ${days - 1} * interval '1 day'
            GROUP BY DATE(created_at)
          ) c ON d::date = c.day
          ORDER BY d
        `);

    res.json(result.rows);
  } catch (err) {
    console.error("Daily patients error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/doctor-workload", requireAuth, async (req, res) => {
  try {
    const hospitalId = req.user!.hospitalId;

    const result = hospitalId
      ? await db.execute(sql`
          SELECT u.name AS doctor, COUNT(a.id)::int AS appointments
          FROM doctors doc
          JOIN users u ON u.id = doc.user_id
          LEFT JOIN appointments a ON a.doctor_id = doc.id
            AND a.appointment_date >= CURRENT_DATE - interval '30 days'
          WHERE doc.hospital_id = ${hospitalId}
          GROUP BY u.id, u.name
          ORDER BY appointments DESC
          LIMIT 10
        `)
      : await db.execute(sql`
          SELECT u.name AS doctor, COUNT(a.id)::int AS appointments
          FROM doctors doc
          JOIN users u ON u.id = doc.user_id
          LEFT JOIN appointments a ON a.doctor_id = doc.id
            AND a.appointment_date >= CURRENT_DATE - interval '30 days'
          GROUP BY u.id, u.name
          ORDER BY appointments DESC
          LIMIT 10
        `);

    res.json(result.rows);
  } catch (err) {
    console.error("Doctor workload error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/lab-tests-by-type", requireAuth, async (req, res) => {
  try {
    const hospitalId = req.user!.hospitalId;

    const result = hospitalId
      ? await db.execute(sql`
          SELECT lr.test_name AS name, COUNT(*)::int AS value
          FROM lab_reports lr
          JOIN appointments a ON a.patient_id = lr.patient_id
          JOIN doctors doc ON doc.id = a.doctor_id AND doc.hospital_id = ${hospitalId}
          GROUP BY lr.test_name
          ORDER BY value DESC
          LIMIT 10
        `)
      : await db.execute(sql`
          SELECT test_name AS name, COUNT(*)::int AS value
          FROM lab_reports
          GROUP BY test_name
          ORDER BY value DESC
          LIMIT 10
        `);

    res.json(result.rows);
  } catch (err) {
    console.error("Lab tests by type error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/prescriptions-trend", requireAuth, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const hospitalId = req.user!.hospitalId;

    const result = hospitalId
      ? await db.execute(sql`
          SELECT d::date AS date, COALESCE(c.cnt, 0)::int AS count
          FROM generate_series(CURRENT_DATE - ${days - 1} * interval '1 day', CURRENT_DATE, '1 day') d
          LEFT JOIN (
            SELECT DATE(p.prescription_date) AS day, COUNT(*) AS cnt
            FROM prescriptions p
            JOIN doctors doc ON doc.id = p.doctor_id AND doc.hospital_id = ${hospitalId}
            WHERE p.prescription_date >= CURRENT_DATE - ${days - 1} * interval '1 day'
            GROUP BY DATE(p.prescription_date)
          ) c ON d::date = c.day
          ORDER BY d
        `)
      : await db.execute(sql`
          SELECT d::date AS date, COALESCE(c.cnt, 0)::int AS count
          FROM generate_series(CURRENT_DATE - ${days - 1} * interval '1 day', CURRENT_DATE, '1 day') d
          LEFT JOIN (
            SELECT DATE(prescription_date) AS day, COUNT(*) AS cnt
            FROM prescriptions
            WHERE prescription_date >= CURRENT_DATE - ${days - 1} * interval '1 day'
            GROUP BY DATE(prescription_date)
          ) c ON d::date = c.day
          ORDER BY d
        `);

    res.json(result.rows);
  } catch (err) {
    console.error("Prescriptions trend error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
