import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, ilike, or, and, ne, count } from "drizzle-orm";
import { requireAuth, requireRole, hashPassword } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { q, role, page: rawPage, limit: rawLimit } = req.query;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.min(Number(rawLimit) || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [ne(usersTable.role, "patient")];

    if (q && String(q).trim()) {
      const search = `%${String(q).trim()}%`;
      conditions.push(or(ilike(usersTable.name, search), ilike(usersTable.email, search))!);
    }
    if (role && String(role).trim()) {
      conditions.push(eq(usersTable.role, String(role)));
    }

    const where = and(...conditions);

    const [staff, [{ total }]] = await Promise.all([
      db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        role: usersTable.role,
        hospitalId: usersTable.hospitalId,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
      }).from(usersTable).where(where).limit(limit).offset(offset).orderBy(usersTable.createdAt),
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
    const { name, email, role, phone, password, hospitalId } = req.body;
    if (!name || !email || !role || !password) {
      res.status(400).json({ error: "validation_error", message: "name, email, role, and password are required" });
      return;
    }

    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(409).json({ error: "conflict", message: "Email already in use" });
      return;
    }

    const passwordHash = hashPassword(password);
    const [newUser] = await db.insert(usersTable).values({
      name,
      email,
      role,
      phone: phone || null,
      passwordHash,
      hospitalId: hospitalId || null,
    }).returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
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
    const { isActive, role, name, phone } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof isActive === "boolean") updates.isActive = isActive;
    if (role) updates.role = role;
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
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
