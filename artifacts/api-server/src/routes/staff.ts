// @ts-nocheck
import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, ilike, or, and, ne, count } from "drizzle-orm";
import { requireAuth, requireRole, hashPassword } from "../lib/auth.js";

const router = Router();

function generateStaffId(role: string): string {
  const prefix =
    role === "doctor"
      ? "DR"
      : role === "nurse"
        ? "NR"
        : role === "admin"
          ? "AD"
          : role === "lab_technician"
            ? "LT"
            : role === "pharmacist"
              ? "PH"
              : role === "receptionist"
                ? "RC"
                : role === "radiology_technician"
                  ? "RT"
                  : "ST";
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `${prefix}-${rand}`;
}

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { q, role, page: rawPage, limit: rawLimit } = req.query;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.min(Number(rawLimit) || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [ne(usersTable.role, "patient")];

    if (req.user!.hospitalId) {
      conditions.push(eq(usersTable.hospitalId, req.user!.hospitalId));
    }

    if (q && String(q).trim()) {
      const search = `%${String(q).trim()}%`;
      conditions.push(
        or(ilike(usersTable.name, search), ilike(usersTable.email, search))!,
      );
    }
    if (role && String(role).trim()) {
      conditions.push(eq(usersTable.role, String(role)));
    }
    if (req.query.department && String(req.query.department).trim()) {
      conditions.push(eq(usersTable.department, String(req.query.department)));
    }

    const where = and(...conditions);

    const [staff, [{ total }]] = await Promise.all([
      db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          phone: usersTable.phone,
          role: usersTable.role,
          hospitalId: usersTable.hospitalId,
          department: usersTable.department,
          staffId: usersTable.staffId,
          isActive: usersTable.isActive,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(usersTable.createdAt),
      db.select({ total: count() }).from(usersTable).where(where),
    ]);

    res.json({ staff, total: Number(total), page, limit });
  } catch (err) {
    console.error("Staff list error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, role, phone, password, department } = req.body;
    if (!name || !email || !role || !password) {
      res
        .status(400)
        .json({
          error: "validation_error",
          message: "name, email, role, and password are required",
        });
      return;
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res
        .status(409)
        .json({ error: "conflict", message: "Email already in use" });
      return;
    }

    const passwordHash = hashPassword(password);
    const hospitalId = req.user!.hospitalId || null;
    const staffId = generateStaffId(role);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        role,
        phone: phone || null,
        passwordHash,
        hospitalId,
        department: department || null,
        staffId,
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        department: usersTable.department,
        staffId: usersTable.staffId,
        isActive: usersTable.isActive,
      });

    res.status(201).json(newUser);
  } catch (err) {
    console.error("Create staff error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isActive, role, name, phone, department } = req.body;

    if (req.user!.hospitalId) {
      const [target] = await db
        .select({ hospitalId: usersTable.hospitalId })
        .from(usersTable)
        .where(eq(usersTable.id, id));
      if (!target || target.hospitalId !== req.user!.hospitalId) {
        res
          .status(403)
          .json({
            error: "forbidden",
            message: "Cannot modify staff from another hospital",
          });
        return;
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof isActive === "boolean") updates.isActive = isActive;
    if (role) updates.role = role;
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        department: usersTable.department,
        staffId: usersTable.staffId,
        isActive: usersTable.isActive,
      });

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    console.error("Update staff error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
