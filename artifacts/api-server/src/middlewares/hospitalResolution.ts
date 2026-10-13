import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { hospitalsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Middleware to resolve hospital from hostname or header and attach to request.
 * Supports:
 *   - Header: X-Hospital-Slug (for API calls where hostname may not be reliable)
 *   - Hostname: extracts first label as slug (e.g., aiimsjodhpur.localhost:3000 -> aiimsjodhpur)
 *   - Local development: also accepts localhost without subdomain (no hospital resolved)
 */
export const hospitalResolution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Check for explicit header (useful for API calls)
    const headerSlug = req.headers["x-hospital-slug"] as string | undefined;
    if (headerSlug) {
      const slug = headerSlug.trim();
      if (slug) {
        const [hospital] = await db
          .select()
          .from(hospitalsTable)
          .where(and(eq(hospitalsTable.slug, slug), eq(hospitalsTable.isActive, true)))
          .limit(1);

        if (hospital) {
          req.hospital = hospital;
          return next();
        }
        // If header slug is provided but not found, we could error, but we'll fall through to hostname parsing
        // and eventually set req.hospital to null if not found by hostname either.
      }
    }

    // 2. Extract slug from hostname
    const hostname = req.headers.host ?? "";
    // Remove port if present
    const hostnameWithoutPort = hostname.split(":")[0];
    // Split by dot and take the first part
    const parts = hostnameWithoutPort.split(".");
    let slugFromHostname = "";
    if (parts.length > 1) {
      // If we have at least two parts (e.g., subdomain.domain), take the first part as slug
      slugFromHostname = parts[0];
    } else if (parts.length === 1 && parts[0] !== "localhost" && parts[0] !== "127.0.0.1") {
      // If only one part and it's not localhost, treat it as slug (e.g., in production with just the subdomain domain)
      slugFromHostname = parts[0];
    }

    // If we have a slug from hostname that is not empty, try to look it up
    if (slugFromHostname) {
      const [hospital] = await db
        .select()
        .from(hospitalsTable)
        .where(and(eq(hospitalsTable.slug, slugFromHostname), eq(hospitalsTable.isActive, true)))
        .limit(1);

      if (hospital) {
        req.hospital = hospital;
        return next();
      }
    }

    // 3. No hospital resolved from header or hostname
    req.hospital = null;
    next();
  } catch (error) {
    // Log error but don't fail the request; let downstream handle missing hospital if required
    console.error("Hospital resolution error:", error);
    req.hospital = null;
    next();
  }
};

export default hospitalResolution;