import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, medicalRecordsTable, labReportsTable, radiologyReportsTable, prescriptionsTable, appointmentsTable, aiAnalysisResultsTable, usersTable, hospitalsTable, doctorsTable } from "@workspace/db";
import { eq, ilike, or, count, and, gte, desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

function generatePatientCode(): string {
  return "PT" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100).toString().padStart(2, "0");
}

function generateChikitHealthId(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CHK-${year}-${suffix}`;
}

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { search, limit = "10", offset = "0" } = req.query as Record<string, string>;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offsetNum = Math.max(0, parseInt(offset));

    let query = db.select().from(patientsTable).where(eq(patientsTable.isActive, true));

    if (search) {
      const s = (search as string).toLowerCase();
      query = query.where(
        or(
          ilike(patientsTable.name, `%${s}%`),
          ilike(patientsTable.patientCode, `%${s}%`),
          ilike(patientsTable.phone, `%${s}%`),
          ilike(patientsTable.chikitHealthId, `%${s}%`),
          ilike(patientsTable.govtIdNumber, `%${s}%`)
        )
      );
    }

    const [patients, { count: total }] = await Promise.all([
      query.limit(limitNum).offset(offsetNum),
      db.select({ count: count() }).from(patientsTable).where(eq(patientsTable.isActive, true)).where(
        search ?
          or(
            ilike(patientsTable.name, `%${(search as string).toLowerCase()}%`),
            ilike(patientsTable.patientCode, `%${(search as string).toLowerCase()}%`),
            ilike(patientsTable.phone, `%${(search as string).toLowerCase()}%`),
            ilike(patientsTable.chikitHealthId, `%${(search as string).toLowerCase()}%`),
            ilike(patientsTable.govtIdNumber, `%${(search as string).toLowerCase()}%`)
          ) :
          sql`true`
      )
    ]);

    res.json({ patients, total, limit: limitNum, offset: offsetNum });
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch patients" });
  }
});

// Patient lookup by Health ID, phone, or government ID
router.get("/lookup", requireAuth, async (req, res) => {
  try {
    const { healthId, phone, govtId } = req.query as Record<string, string>;
    let patient = null;

    if (healthId) {
      const [p] = await db.select().from(patientsTable).where(ilike(patientsTable.chikitHealthId, healthId));
      patient = p;
    } else if (phone) {
      const [p] = await db.select().from(patientsTable).where(ilike(patientsTable.phone, phone));
      patient = p;
    } else if (govtId) {
      const [p] = await db.select().from(patientsTable).where(ilike(patientsTable.govtIdNumber, govtId));
      patient = p;
    }

    if (!patient) {
      res.status(404).json({ error: "not_found", message: "Patient not found" });
      return;
    }
    res.json(patient);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to lookup patient" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, dateOfBirth, gender, bloodGroup, phone, email, address, emergencyContact, emergencyPhone, allergies, chronicConditions, hospitalId, govtIdType, govtIdNumber } = req.body;
    const patientCode = generatePatientCode();
    const chikitHealthId = generateChikitHealthId();
    const [patient] = await db.insert(patientsTable).values({
      patientCode, chikitHealthId, name, dateOfBirth, gender, bloodGroup, phone, email, address,
      emergencyContact, emergencyPhone, allergies, chronicConditions, hospitalId: hospitalId ?? null,
      govtIdType: govtIdType ?? null, govtIdNumber: govtIdNumber ?? null,
    }).returning();
    await createAuditLog(req, "create", "patient", patient.id, `Created patient ${name} with Health ID ${chikitHealthId}`);
    res.status(201).json(patient);
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: "Failed to create patient" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, Number(req.params.id)));
    if (!patient) { res.status(404).json({ error: "not_found", message: "Patient not found" }); return; }
    await createAuditLog(req, "view", "patient", patient.id);
    res.json(patient);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch patient" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { name, phone, email, address, emergencyContact, emergencyPhone, allergies, chronicConditions, bloodGroup, govtIdType, govtIdNumber } = req.body;
    const [patient] = await db.update(patientsTable).set({ name, phone, email, address, emergencyContact, emergencyPhone, allergies, chronicConditions, bloodGroup, govtIdType, govtIdNumber, updatedAt: new Date() })
      .where(eq(patientsTable.id, Number(req.params.id))).returning();
    await createAuditLog(req, "update", "patient", patient.id);
    res.json(patient);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to update patient" });
  }
});

router.get("/:id/timeline", requireAuth, async (req, res) => {
  try {
    const patientId = Number(req.params.id);
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
    if (!patient) { res.status(404).json({ error: "not_found", message: "Patient not found" }); return; }

    const [medicalRecords, labReports, radiologyReports, prescriptions, appointments, aiAnalyses] = await Promise.all([
      db.select({
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
        .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
        .where(eq(medicalRecordsTable.patientId, patientId)),
      db.select({
        id: labReportsTable.id, patientId: labReportsTable.patientId, doctorId: labReportsTable.doctorId,
        hospitalId: labReportsTable.hospitalId, testName: labReportsTable.testName, testDate: labReportsTable.testDate,
        results: labReportsTable.results, referenceRanges: labReportsTable.referenceRanges,
        interpretation: labReportsTable.interpretation, aiInterpretation: labReportsTable.aiInterpretation,
        status: labReportsTable.status, createdAt: labReportsTable.createdAt,
        patientName: patientsTable.name, doctorName: usersTable.name,
      }).from(labReportsTable)
        .leftJoin(patientsTable, eq(labReportsTable.patientId, patientsTable.id))
        .leftJoin(doctorsTable, eq(doctorsTable.doctorId, doctorsTable.id))
        .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
        .where(eq(labReportsTable.patientId, patientId)),
      db.select().from(radiologyReportsTable).where(eq(radiologyReportsTable.patientId, patientId)),
      db.select({
        id: prescriptionsTable.id, patientId: prescriptionsTable.patientId, doctorId: prescriptionsTable.doctorId,
        hospitalId: prescriptionsTable.hospitalId, prescriptionDate: prescriptionsTable.prescriptionDate,
        diagnosis: prescriptionsTable.diagnosis, medications: prescriptionsTable.medications,
        instructions: prescriptionsTable.instructions, followUpDays: prescriptionsTable.followUpDays,
        status: prescriptionsTable.status, createdAt: prescriptionsTable.createdAt,
        patientName: patientsTable.name, doctorName: usersTable.name,
      }).from(prescriptionsTable)
        .leftJoin(patientsTable, eq(prescriptionsTable.patientId, patientsTable.id))
        .leftJoin(doctorsTable, eq(prescriptionsTable.doctorId, doctorsTable.id))
        .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
        .where(eq(prescriptionsTable.patientId, patientId)),
      db.select({
        id: appointmentsTable.id, patientId: appointmentsTable.patientId, doctorId: appointmentsTable.doctorId,
        hospitalId: appointmentsTable.hospitalId, appointmentDate: appointmentsTable.appointmentDate,
        duration: appointmentsTable.duration, reason: appointmentsTable.reason,
        status: appointmentsTable.status, notes: appointmentsTable.notes, createdAt: appointmentsTable.createdAt,
        patientName: patientsTable.name, doctorName: usersTable.name, hospitalName: hospitalsTable.name,
      }).from(appointmentsTable)
        .leftJoin(patientsTable, eq(appointmentsTable.patientId, appointmentsTable.id))
        .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, appointmentsTable.id))
        .leftJoin(hospitalsTable, eq(appointmentsTable.hospitalId, hospitalsTable.id))
        .where(eq(appointmentsTable.patientId, patientId)),
      db.select().from(aiAnalysisResultsTable).where(eq(aiAnalysisResultsTable.patientId, patientId)),
    ]);

    await createAuditLog(req, "view_timeline", "patient", patientId);
    res.json({ patient, medicalRecords, labReports, radiologyReports, prescriptions, appointments, aiAnalyses });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch timeline" });
  }
});

/**
 * Get patient dashboard - summary view of patient's key information
 */
router.get("/:id/dashboard", requireAuth, async (req, res) => {
  try {
    const patientId = Number(req.params.id);
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
    if (!patient) { res.status(404).json({ error: "not_found", message: "Patient not found" }); return; }

    // Get counts for various patient data
    const [
      [{ totalMedicalRecords }],
      [{ totalLabReports }],
      [{ totalPrescriptions }],
      [{ totalAppointments }],
      [{ upcomingAppointments }],
      [{ totalAiAnalyses }],
      [{ pendingLabReports }],
    ] = await Promise.all([
      db.select({ totalMedicalRecords: count() }).from(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, patientId)),
      db.select({ totalLabReports: count() }).from(labReportsTable).where(eq(labReportsTable.patientId, patientId)),
      db.select({ totalPrescriptions: count() }).from(prescriptionsTable).where(eq(prescriptionsTable.patientId, patientId)),
      db.select({ totalAppointments: count() }).from(appointmentsTable).where(eq(appointmentsTable.patientId, patientId)),
      db.select({ upcomingAppointments: count() })
        .from(appointmentsTable)
        .where(and(
          eq(appointmentsTable.patientId, patientId),
          gte(appointmentsTable.appointmentDate, new Date())
        )),
      db.select({ totalAiAnalyses: count() }).from(aiAnalysisResultsTable).where(eq(aiAnalysisResultsTable.patientId, patientId)),
      db.select({ pendingLabReports: count() })
        .from(labReportsTable)
        .where(and(
          eq(labReportsTable.patientId, patientId),
          eq(labReportsTable.status, "pending")
        )),
    ]);

    // Get recent activities (last 5 of each type)
    const [
      recentMedicalRecords,
      recentLabReports,
      recentPrescriptions,
      recentAppointments,
    ] = await Promise.all([
      db.select({
        id: medicalRecordsTable.id,
        visitDate: medicalRecordsTable.visitDate,
        chiefComplaint: medicalRecordsTable.chiefComplaint,
        diagnosis: medicalRecordsTable.diagnosis,
        createdAt: medicalRecordsTable.createdAt,
        doctorName: usersTable.name,
      })
      .from(medicalRecordsTable)
      .leftJoin(usersTable, eq(medicalRecordsTable.doctorId, usersTable.id))
      .where(eq(medicalRecordsTable.patientId, patientId))
      .orderBy(desc(medicalRecordsTable.createdAt))
      .limit(5),
      db.select({
        id: labReportsTable.id,
        testName: labReportsTable.testName,
        testDate: labReportsTable.testDate,
        status: labReportsTable.status,
        createdAt: labReportsTable.createdAt,
        doctorName: usersTable.name,
      })
      .from(labReportsTable)
        .leftJoin(usersTable, eq(labReportsTable.doctorId, usersTable.id))
        .where(eq(labReportsTable.patientId, patientId))
        .orderBy(desc(labReportsTable.createdAt))
        .limit(5),
      db.select({
        id: prescriptionsTable.id,
        prescriptionDate: prescriptionsTable.prescriptionDate,
        diagnosis: prescriptionsTable.diagnosis,
        status: prescriptionsTable.status,
        createdAt: prescriptionsTable.createdAt,
        doctorName: usersTable.name,
      })
      .from(prescriptionsTable)
        .leftJoin(usersTable, eq(prescriptionsTable.doctorId, usersTable.id))
        .where(eq(prescriptionsTable.patientId, patientId))
        .orderBy(desc(prescriptionsTable.createdAt))
        .limit(5),
      db.select({
        id: appointmentsTable.id,
        appointmentDate: appointmentsTable.appointmentDate,
        reason: appointmentsTable.reason,
        status: appointmentsTable.status,
        createdAt: appointmentsTable.createdAt,
        doctorName: usersTable.name,
        hospitalName: hospitalsTable.name,
      })
      .from(appointmentsTable)
        .leftJoin(usersTable, eq(appointmentsTable.doctorId, usersTable.id))
        .leftJoin(hospitalsTable, eq(appointmentsTable.hospitalId, hospitalsTable.id))
        .where(eq(appointmentsTable.patientId, patientId))
        .orderBy(desc(appointmentsTable.createdAt))
        .limit(5),
    ]);

    await createAuditLog(req, "view_dashboard", "patient", patientId);
    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        patientCode: patient.patientCode,
        chikitHealthId: patient.chikitHealthId,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        abhaNumber: patient.abhaNumber,
        abhaVerified: patient.abhaVerified,
        isActive: patient.isActive,
      },
      statistics: {
        totalMedicalRecords,
        totalLabReports,
        totalPrescriptions,
        totalAppointments,
        upcomingAppointments,
        totalAiAnalyses,
        pendingLabReports,
      },
      recentActivities: {
        medicalRecords: recentMedicalRecords,
        labReports: recentLabReports,
        prescriptions: recentPrescriptions,
        appointments: recentAppointments,
      }
    });
  } catch (err) {
    console.error("Patient dashboard error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch patient dashboard" });
  }
});

/**
 * Get patient summary - concise view for quick reference (Two-Minute Doctor)
 */
router.get("/:id/summary", requireAuth, async (req, res) => {
  try {
    const patientId = Number(req.params.id);
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
    if (!patient) { res.status(404).json({ error: "not_found", message: "Patient not found" }); return; }

    // Fetch latest medical record for vitals and recent encounter
    const [latestMedicalRecord] = await db
      .select()
      .from(medicalRecordsTable)
      .where(eq(medicalRecordsTable.patientId, patientId))
      .orderBy(desc(medicalRecordsTable.createdAt))
      .limit(1);

    // Fetch active prescriptions (status: active)
    const [activePrescriptions] = await db
      .select({
        id: prescriptionsTable.id,
        medication: prescriptionsTable.medications,
        dosage: prescriptionsTable.dosage,
        frequency: prescriptionsTable.frequency,
        status: prescriptionsTable.status,
      })
      .from(prescriptionsTable)
      .where(and(
        eq(prescriptionsTable.patientId, patientId),
        eq(prescriptionsTable.status, "active")
      ))
      .limit(10);

    // Fetch recent lab reports (last 3)
    const [recentLabReports] = await db
      .select({
        id: labReportsTable.id,
        testName: labReportsTable.testName,
        value: labReportsTable.results,
        units: labReportsTable.units, // assuming we have units field; if not, adjust
        status: labReportsTable.status,
        date: labReportsTable.createdAt,
      })
      .from(labReportsTable)
      .where(eq(labReportsTable.patientId, patientId))
      .orderBy(desc(labReportsTable.createdAt))
      .limit(3);

    // Fetch upcoming appointments (next 3)
    const [upcomingAppointments] = await db
      .select({
        id: appointmentsTable.id,
        date: appointmentsTable.appointmentDate,
        reason: appointmentsTable.reason,
        status: appointmentsTable.status,
        doctorName: usersTable.name,
      })
      .from(appointmentsTable)
      .leftJoin(usersTable, eq(appointmentsTable.doctorId, usersTable.id))
      .where(and(
        eq(appointmentsTable.patientId, patientId),
        gte(appointmentsTable.appointmentDate, new Date())
      ))
      .orderBy(appointmentsTable.appointmentDate)
      .limit(3);

    // Parse chronic conditions and allergies from patient fields
    const chronicConditions = patient.chronicConditions ? patient.chronicConditions.split(',').map(c => c.trim()).filter(Boolean) : [];
    const allergies = patient.allergies ? patient.allergies.split(',').map(a => a.trim()).filter(Boolean) : [];

    // Build summary object
    const summary = {
      patient: {
        id: patient.id,
        name: patient.name,
        patientCode: patient.patientCode,
        chikitHealthId: patient.chikitHealthId,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
      },
      vitals: latestMedicalRecord ? {
        bloodPressure: latestMedicalRecord.vitalSigns?.bloodPressure ?? null,
        heartRate: latestMedicalRecord.vitalSigns?.heartRate ?? null,
        temperature: latestMedicalRecord.vitalSigns?.temperature ?? null,
        spo2: latestMedicalRecord.vitalSigns?.spo2 ?? null,
        recordedAt: latestMedicalRecord.createdAt,
      } : null,
      conditions: {
        chronic: chronicConditions,
        allergies: allergies,
      },
      recentEncounter: latestMedicalRecord ? {
        id: latestMedicalRecord.id,
        date: latestMedicalRecord.createdAt,
        chiefComplaint: latestMedicalRecord.chiefComplaint,
        diagnosis: latestMedicalRecord.diagnosis,
        treatmentPlan: latestMedicalRecord.treatmentPlan,
      } : null,
      activePrescriptions: activePrescriptions.map(p => ({
        id: p.id,
        medication: p.medication,
        dosage: p.dosage,
        frequency: p.frequency,
      })),
      recentLabReports: recentLabReports.map(lr => ({
        id: lr.id,
        testName: lr.testName,
        value: lr.value,
        units: lr.units ?? null,
        status: lr.status,
        date: lr.date,
      })),
      upcomingAppointments: upcomingAppointments.map(a => ({
        id: a.id,
        date: a.date,
        reason: a.reason,
        status: a.status,
        doctor: a.doctorName,
      })),
    };

    await createAuditLog(req, "view_summary", "patient", patientId);
    res.json(summary);
  } catch (err) {
    console.error("Error fetching patient summary:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch patient summary" });
  }
});

export default router;