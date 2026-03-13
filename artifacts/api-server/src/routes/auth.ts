import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateToken, requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "bad_request", message: "Email and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
      return;
    }
    if (!user.isActive) {
      res.status(401).json({ error: "unauthorized", message: "Account deactivated" });
      return;
    }
    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role, hospitalId: user.hospitalId });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, hospitalId: user.hospitalId, isActive: user.isActive, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Login failed" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, hospitalId } = req.body;
    if (!email || !password || !name || !role) {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      res.status(409).json({ error: "conflict", message: "Email already registered" });
      return;
    }
    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash: hashPassword(password),
      name,
      role,
      hospitalId: hospitalId ?? null,
    }).returning();
    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role, hospitalId: user.hospitalId });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, hospitalId: user.hospitalId, isActive: user.isActive, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Registration failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, hospitalId: user.hospitalId, isActive: user.isActive, createdAt: user.createdAt });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user" });
  }
});

export default router;
