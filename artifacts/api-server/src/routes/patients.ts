import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, medicalRecordsTable, labReportsTable, radiologyReportsTable, prescriptionsTable, appointmentsTable, aiAnalysisResultsTable, usersTable, hospitalsTable, doctorsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

function generatePatientCode(): string {
  return "PT" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100).toString().padStart(2, "0");
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = db.select().from(patientsTable).where(eq(patientsTable.isActive, true));
    const patients = await query;
    if (search) {
      const s = (search as string).toLowerCase();
      const filtered = patients.filter(p => p.name.toLowerCase().includes(s) || p.patientCode.toLowerCase().includes(s) || p.phone?.includes(s));
      res.json(filtered);
      return;
    }
    res.json(patients);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch patients" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, dateOfBirth, gender, bloodGroup, phone, email, address, emergencyContact, emergencyPhone, allergies, chronicConditions, hospitalId } = req.body;
    const patientCode = generatePatientCode();
    const [patient] = await db.insert(patientsTable).values({
      patientCode, name, dateOfBirth, gender, bloodGroup, phone, email, address,
      emergencyContact, emergencyPhone, allergies, chronicConditions, hospitalId: hospitalId ?? null,
    }).returning();
    await createAuditLog(req, "create", "patient", patient.id, `Created patient ${name}`);
    res.status(201).json(patient);
  } catch {
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
    const { name, phone, email, address, emergencyContact, emergencyPhone, allergies, chronicConditions, bloodGroup } = req.body;
    const [patient] = await db.update(patientsTable).set({ name, phone, email, address, emergencyContact, emergencyPhone, allergies, chronicConditions, bloodGroup, updatedAt: new Date() })
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
        .leftJoin(doctorsTable, eq(labReportsTable.doctorId, doctorsTable.id))
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
        .leftJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
        .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
        .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
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

export default router;
