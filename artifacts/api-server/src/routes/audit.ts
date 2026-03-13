import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { limit } = req.query;
    const logs = await db.select({
      id: auditLogsTable.id,
      userId: auditLogsTable.userId,
      action: auditLogsTable.action,
      resourceType: auditLogsTable.resourceType,
      resourceId: auditLogsTable.resourceId,
      details: auditLogsTable.details,
      ipAddress: auditLogsTable.ipAddress,
      createdAt: auditLogsTable.createdAt,
      userName: usersTable.name,
    }).from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(Number(limit ?? 100));
    res.json(logs);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch audit logs" });
  }
});

export default router;
