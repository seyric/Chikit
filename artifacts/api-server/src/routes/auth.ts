import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, otpCodesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, generateToken, requireAuth } from "../lib/auth.ts";

const router = Router();

const demoUser = {
  id: 1,
  email: "admin@chikit.health",
  name: "Chikit Demo Admin",
  role: "admin",
  hospitalId: 1,
  phone: null,
  isActive: true,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
};

function isDevelopmentDemoLogin(email: unknown, password: unknown): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    email === demoUser.email &&
    password === "admin123"
  );
}

function demoLoginResponse() {
  const token = generateToken({
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    role: demoUser.role,
    hospitalId: demoUser.hospitalId,
  });
  return { token, user: demoUser };
}

// In-memory OTP store for quick demo (backed by DB for persistence)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res
        .status(400)
        .json({ error: "bad_request", message: "Email and password required" });
      return;
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!user || user.passwordHash !== hashPassword(password)) {
      res
        .status(401)
        .json({ error: "unauthorized", message: "Invalid credentials" });
      return;
    }
    if (!user.isActive) {
      res
        .status(401)
        .json({ error: "unauthorized", message: "Account deactivated" });
      return;
    }
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (isDevelopmentDemoLogin(req.body?.email, req.body?.password)) {
      res.json(demoLoginResponse());
      return;
    }
    res.status(500).json({ error: "internal_error", message: "Login failed" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, hospitalId, phone } = req.body;
    if (!name || !role) {
      res
        .status(400)
        .json({ error: "bad_request", message: "Missing required fields" });
      return;
    }
    if (email) {
      const [existing] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      if (existing) {
        res
          .status(409)
          .json({ error: "conflict", message: "Email already registered" });
        return;
      }
    }
    const [user] = await db
      .insert(usersTable)
      .values({
        email: email ?? null,
        passwordHash: password ? hashPassword(password) : null,
        name,
        role,
        hospitalId: hospitalId ?? null,
        phone: phone ?? null,
      })
      .returning();
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
    });
    res
      .status(201)
      .json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hospitalId: user.hospitalId,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
  } catch (err) {
    res
      .status(500)
      .json({ error: "internal_error", message: "Registration failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch {
    if (process.env.NODE_ENV !== "production" && req.user?.id === demoUser.id) {
      res.json(demoUser);
      return;
    }
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to fetch user" });
  }
});

// OTP: Send
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ""))) {
      res
        .status(400)
        .json({ error: "bad_request", message: "Valid phone number required" });
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await db.insert(otpCodesTable).values({ phone, code, expiresAt });
    // In production: send SMS via Twilio/MSG91. For demo, return OTP in response.
    res.json({
      success: true,
      message: "OTP sent successfully",
      _demo_otp: code,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to send OTP" });
  }
});

// OTP: Verify
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res
        .status(400)
        .json({ error: "bad_request", message: "Phone and OTP code required" });
      return;
    }
    const now = new Date();
    const [otpRecord] = await db
      .select()
      .from(otpCodesTable)
      .where(
        and(
          eq(otpCodesTable.phone, phone),
          eq(otpCodesTable.code, code),
          gt(otpCodesTable.expiresAt, now),
        ),
      )
      .orderBy(otpCodesTable.createdAt)
      .limit(1);

    if (!otpRecord) {
      res
        .status(401)
        .json({ error: "unauthorized", message: "Invalid or expired OTP" });
      return;
    }

    // Mark OTP as used
    await db
      .update(otpCodesTable)
      .set({ usedAt: now })
      .where(eq(otpCodesTable.id, otpRecord.id));

    // Find or create user by phone
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone, phone));
    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({
          name: `Patient ${phone.slice(-4)}`,
          phone,
          role: "patient",
          isActive: true,
        })
        .returning();
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "internal_error", message: "OTP verification failed" });
  }
});

// Google Auth (simulated — in production use Google Identity Services to verify ID token)
router.post("/google", async (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email || !name) {
      res
        .status(400)
        .json({ error: "bad_request", message: "Google auth data required" });
      return;
    }
    // Find existing user by email or googleId
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!user && googleId) {
      const [byGoogleId] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.googleId, googleId));
      user = byGoogleId;
    }
    if (!user) {
      // Create new patient account via Google
      [user] = await db
        .insert(usersTable)
        .values({
          email,
          name,
          googleId: googleId ?? null,
          role: "patient",
          isActive: true,
        })
        .returning();
    } else {
      // Update googleId if not set
      if (!user.googleId && googleId) {
        await db
          .update(usersTable)
          .set({ googleId })
          .where(eq(usersTable.id, user.id));
      }
    }

    if (!user.isActive) {
      res
        .status(401)
        .json({ error: "unauthorized", message: "Account deactivated" });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "internal_error", message: "Google auth failed" });
  }
});

export default router;
