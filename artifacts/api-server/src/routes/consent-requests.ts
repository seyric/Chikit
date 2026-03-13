import { Router } from "express";
import { db } from "@workspace/db";
import { consentRequestsTable, patientsTable, usersTable, doctorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /api/consent-requests — get consents for the current user (patient or doctor)
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    let requests;

    if (user.role === "patient") {
      // Get patient ID for this user
      const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.email, user.email ?? ""));
      if (!patient) { res.json([]); return; }
      requests = await db.select().from(consentRequestsTable).where(eq(consentRequestsTable.patientId, patient.id));
    } else if (user.role === "doctor") {
      const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, user.id));
      if (!doctor) { res.json([]); return; }
      requests = await db.select().from(consentRequestsTable).where(eq(consentRequestsTable.requestingDoctorId, doctor.id));
    } else {
      // Admin sees all
      requests = await db.select().from(consentRequestsTable);
    }

    res.json(requests);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch consent requests" });
  }
});

// POST /api/consent-requests — doctor requests access to patient records
router.post("/", requireAuth, async (req, res) => {
  try {
    const { patientId, requestingDoctorId, requestingHospitalId, notes, accessScope } = req.body;
    if (!patientId || !requestingDoctorId) {
      res.status(400).json({ error: "bad_request", message: "patientId and requestingDoctorId required" });
      return;
    }

    // Check if there's already a pending request
    const [existing] = await db.select().from(consentRequestsTable).where(
      and(
        eq(consentRequestsTable.patientId, patientId),
        eq(consentRequestsTable.requestingDoctorId, requestingDoctorId),
        eq(consentRequestsTable.status, "pending")
      )
    );
    if (existing) { res.json(existing); return; }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const [request] = await db.insert(consentRequestsTable).values({
      patientId, requestingDoctorId, requestingHospitalId: requestingHospitalId ?? null,
      notes, accessScope: accessScope ?? "all", expiresAt,
    }).returning();

    res.status(201).json(request);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to create consent request" });
  }
});

// PATCH /api/consent-requests/:id — patient approves or denies
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "denied"].includes(status)) {
      res.status(400).json({ error: "bad_request", message: "status must be 'approved' or 'denied'" });
      return;
    }

    const [request] = await db.update(consentRequestsTable)
      .set({ status, respondedAt: new Date() })
      .where(eq(consentRequestsTable.id, Number(req.params.id)))
      .returning();

    if (!request) { res.status(404).json({ error: "not_found", message: "Consent request not found" }); return; }
    res.json(request);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to update consent request" });
  }
});

export default router;
