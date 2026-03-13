import { Router } from "express";
import { db } from "@workspace/db";
import { doctorsTable, usersTable, hospitalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const doctors = await db.select({
      id: doctorsTable.id,
      userId: doctorsTable.userId,
      hospitalId: doctorsTable.hospitalId,
      specialization: doctorsTable.specialization,
      department: doctorsTable.department,
      licenseNumber: doctorsTable.licenseNumber,
      phone: doctorsTable.phone,
      isAvailable: doctorsTable.isAvailable,
      createdAt: doctorsTable.createdAt,
      name: usersTable.name,
      email: usersTable.email,
      hospitalName: hospitalsTable.name,
    }).from(doctorsTable)
      .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
      .leftJoin(hospitalsTable, eq(doctorsTable.hospitalId, hospitalsTable.id));
    res.json(doctors);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch doctors" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { userId, hospitalId, specialization, department, licenseNumber, phone } = req.body;
    const [doctor] = await db.insert(doctorsTable).values({ userId, hospitalId, specialization, department, licenseNumber, phone }).returning();
    await createAuditLog(req, "create", "doctor", doctor.id);
    res.status(201).json({ ...doctor, name: req.user?.name, email: req.user?.email, hospitalName: null });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to create doctor" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [doctor] = await db.select({
      id: doctorsTable.id,
      userId: doctorsTable.userId,
      hospitalId: doctorsTable.hospitalId,
      specialization: doctorsTable.specialization,
      department: doctorsTable.department,
      licenseNumber: doctorsTable.licenseNumber,
      phone: doctorsTable.phone,
      isAvailable: doctorsTable.isAvailable,
      createdAt: doctorsTable.createdAt,
      name: usersTable.name,
      email: usersTable.email,
      hospitalName: hospitalsTable.name,
    }).from(doctorsTable)
      .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
      .leftJoin(hospitalsTable, eq(doctorsTable.hospitalId, hospitalsTable.id))
      .where(eq(doctorsTable.id, Number(req.params.id)));
    if (!doctor) { res.status(404).json({ error: "not_found", message: "Doctor not found" }); return; }
    res.json(doctor);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch doctor" });
  }
});

export default router;
