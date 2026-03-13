import { Router } from "express";
import { db } from "@workspace/db";
import { hospitalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const hospitals = await db.select().from(hospitalsTable).where(eq(hospitalsTable.isActive, true));
    res.json(hospitals);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch hospitals" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, address, city, state, phone, email, type, bedCount } = req.body;
    const [hospital] = await db.insert(hospitalsTable).values({ name, address, city, state, phone, email, type, bedCount }).returning();
    await createAuditLog(req, "create", "hospital", hospital.id);
    res.status(201).json(hospital);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to create hospital" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, Number(req.params.id)));
    if (!hospital) { res.status(404).json({ error: "not_found", message: "Hospital not found" }); return; }
    res.json(hospital);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch hospital" });
  }
});

export default router;
