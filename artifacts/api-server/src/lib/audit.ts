import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { Request } from "express";

export async function createAuditLog(
  req: Request,
  action: string,
  resourceType: string,
  resourceId?: number,
  details?: string
) {
  try {
    if (!req.user) return;
    await db.insert(auditLogsTable).values({
      userId: req.user.id,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip ?? req.socket?.remoteAddress,
    });
  } catch {
    // Audit log failures should not block operations
  }
}
