import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import type { Hospital } from "@workspace/db/schema";

export interface AuthUser {
  id: number;
  email: string | null;
  name: string;
  role: string;
  hospitalId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      hospital?: Hospital | null;
    }
  }
}

export function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "chikit_salt_2024")
    .digest("hex");
}

export function generateToken(user: AuthUser): string {
  const payload = JSON.stringify({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const encoded = Buffer.from(payload).toString("base64");
  const sig = crypto
    .createHmac("sha256", "chikit_jwt_secret_2024")
    .update(encoded)
    .digest("hex");
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const [encoded, sig] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", "chikit_jwt_secret_2024")
      .update(encoded)
      .digest("hex");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf-8"),
    );
    if (payload.exp < Date.now()) return null;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      hospitalId: payload.hospitalId,
    };
  } catch {
    return null;
  }
}

/**
 * Generate a registration token for multi-step registration flows
 * These tokens have a shorter expiration (15 minutes) and are used for
 * tracking registration progress between steps
 */
export function generateRegistrationToken(payload: any): string {
  const tokenPayload = JSON.stringify({
    ...payload,
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  const encoded = Buffer.from(tokenPayload).toString("base64");
  const sig = crypto
    .createHmac("sha256", "chikit_jwt_secret_2024")
    .update(encoded)
    .digest("hex");
  return `${encoded}.${sig}`;
}

/**
 * Verify a registration token
 */
export function verifyRegistrationToken(token: string): any | null {
  try {
    const [encoded, sig] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", "chikit_jwt_secret_2024")
      .update(encoded)
      .digest("hex");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf-8"),
    );
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ error: "unauthorized", message: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);
  const user = verifyToken(token);
  if (!user) {
    res
      .status(401)
      .json({ error: "unauthorized", message: "Invalid or expired token" });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roleArgs: (string | string[])[]) {
  const roles = roleArgs.flat();
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res
        .status(401)
        .json({ error: "unauthorized", message: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res
        .status(403)
        .json({ error: "forbidden", message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
