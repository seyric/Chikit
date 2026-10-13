import { Router } from "express";
import { db } from "@workspace/db";
import {
  otpCodesTable,
  patientsTable,
  usersTable
} from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { generateToken, hashPassword } from "../lib/auth";

const router = Router();

/**
 * Send OTP for mobile verification (patient registration)
 * Similar to existing /auth/send-otp but tailored for patient registration
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ""))) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Valid phone number required" });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await db.insert(otpCodesTable).values({
      phone,
      code,
      expiresAt,
    });

    // In production: send SMS via Twilio/MSG91. For demo, return OTP in response.
    res.json({
      success: true,
      message: "OTP sent successfully",
      _demo_otp: code, // Remove in production
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to send OTP" });
  }
});

/**
 * Verify OTP for mobile verification (patient registration)
 * Similar to existing /auth/verify-otp but returns patient info and ensures role=patient
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Phone and OTP code required" });
    }
    const now = new Date();
    const [otpRecord] = await db
      .select()
      .from(otpCodesTable)
      .where(
        and(
          eq(otpCodesTable.phone, phone),
          eq(otpCodesTable.code, code),
          gt(otpCodesTable.expiresAt, now)
        )
      )
      .orderBy(otpCodesTable.createdAt)
      .limit(1);

    if (!otpRecord) {
      return res
        .status(401)
        .json({ error: "unauthorized", message: "Invalid or expired OTP" });
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
      // Create new patient account via OTP
      [user] = await db
        .insert(usersTable)
        .values({
          name: `Patient ${phone.slice(-4)}`,
          phone,
          role: "patient",
          isActive: true,
        })
        .returning();
    } else {
      // Ensure the user has role patient (if not, we might want to update or warn)
      if (user.role !== "patient") {
        // Optionally update role to patient, or leave as is and let the registration flow decide
        // For now, we'll update to patient to ensure consistency
        await db
          .update(usersTable)
          .set({ role: "patient" })
          .where(eq(usersTable.id, user.id));
        // Refresh the user object
        const [updatedUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, user.id));
        user = updatedUser;
      }
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ error: "unauthorized", message: "Account deactivated" });
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

/**
 * Google OAuth for patient registration
 * Similar to existing /auth/google but ensures role=patient
 */
router.post("/google", async (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email || !name) {
      return res
        .status(400)
        .json({ error: "bad_request", message: "Google auth data required" });
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
      // Ensure role is patient
      if (user.role !== "patient") {
        await db
          .update(usersTable)
          .set({ role: "patient" })
          .where(eq(usersTable.id, user.id));
        // Refresh user
        const [updatedUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, user.id));
        user = updatedUser;
      }
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ error: "unauthorized", message: "Account deactivated" });
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