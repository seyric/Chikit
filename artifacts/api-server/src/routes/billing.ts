import { Router } from "express";
import { db } from "@workspace/db";
import { billingTable, patientsTable } from "@workspace/db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `INV-${y}${m}-${rand}`;
}

router.get("/", requireAuth, requireRole("admin", "receptionist", "doctor"), async (req, res) => {
  try {
    const { status, patientId, page: rawPage, limit: rawLimit } = req.query;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.min(Number(rawLimit) || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (req.user!.hospitalId) {
      conditions.push(eq(billingTable.hospitalId, req.user!.hospitalId));
    }
    if (status && String(status).trim()) {
      conditions.push(eq(billingTable.status, String(status) as "unpaid" | "partial" | "paid"));
    }
    if (patientId) {
      conditions.push(eq(billingTable.patientId, Number(patientId)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [invoices, [{ total }]] = await Promise.all([
      db.select({
        id: billingTable.id,
        patientId: billingTable.patientId,
        patientName: patientsTable.name,
        appointmentId: billingTable.appointmentId,
        invoiceNumber: billingTable.invoiceNumber,
        lineItems: billingTable.lineItems,
        subtotal: billingTable.subtotal,
        tax: billingTable.tax,
        discount: billingTable.discount,
        total: billingTable.total,
        status: billingTable.status,
        paidAmount: billingTable.paidAmount,
        notes: billingTable.notes,
        createdAt: billingTable.createdAt,
      })
      .from(billingTable)
      .leftJoin(patientsTable, eq(billingTable.patientId, patientsTable.id))
      .where(where)
      .orderBy(desc(billingTable.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ total: count() }).from(billingTable).where(where),
    ]);

    res.json({ invoices, total: Number(total), page, limit });
  } catch (err) {
    console.error("Billing list error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/", requireAuth, requireRole("admin", "receptionist"), async (req, res) => {
  try {
    const { patientId, appointmentId, lineItems, tax, discount, notes } = req.body;
    if (!patientId || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({ error: "validation_error", message: "patientId and lineItems required" });
      return;
    }

    if (req.user!.hospitalId) {
      const patientCheck = await db.execute(
        sql`SELECT 1 FROM patients p
            JOIN appointments a ON a.patient_id = p.id
            JOIN doctors d ON d.id = a.doctor_id AND d.hospital_id = ${req.user!.hospitalId}
            WHERE p.id = ${Number(patientId)}
            LIMIT 1`
      );
      if (patientCheck.rows.length === 0) {
        res.status(403).json({ error: "forbidden", message: "Patient does not belong to your hospital" });
        return;
      }
    }

    if (appointmentId && req.user!.hospitalId) {
      const apptCheck = await db.execute(
        sql`SELECT 1 FROM appointments a
            JOIN doctors d ON d.id = a.doctor_id AND d.hospital_id = ${req.user!.hospitalId}
            WHERE a.id = ${Number(appointmentId)} AND a.patient_id = ${Number(patientId)}
            LIMIT 1`
      );
      if (apptCheck.rows.length === 0) {
        res.status(403).json({ error: "forbidden", message: "Appointment does not belong to your hospital or patient" });
        return;
      }
    }

    const subtotal = lineItems.reduce((sum: number, item: { amount: number }) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = Number(tax) || 0;
    const discountAmount = Number(discount) || 0;
    const total = subtotal + taxAmount - discountAmount;

    const [invoice] = await db.insert(billingTable).values({
      patientId: Number(patientId),
      appointmentId: appointmentId ? Number(appointmentId) : null,
      hospitalId: req.user!.hospitalId || null,
      createdBy: req.user!.id,
      invoiceNumber: generateInvoiceNumber(),
      lineItems,
      subtotal: String(subtotal),
      tax: String(taxAmount),
      discount: String(discountAmount),
      total: String(total),
      notes: notes || null,
    }).returning();

    res.status(201).json(invoice);
  } catch (err) {
    console.error("Create invoice error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:id", requireAuth, requireRole("admin", "receptionist"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (req.user!.hospitalId) {
      const [existing] = await db.select({ hospitalId: billingTable.hospitalId }).from(billingTable).where(eq(billingTable.id, id));
      if (!existing || existing.hospitalId !== req.user!.hospitalId) {
        res.status(403).json({ error: "forbidden", message: "Cannot modify invoices from another hospital" });
        return;
      }
    }

    const { status, paidAmount } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (paidAmount !== undefined) updates.paidAmount = String(paidAmount);

    const [updated] = await db.update(billingTable).set(updates).where(eq(billingTable.id, id)).returning();

    if (!updated) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    console.error("Update invoice error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
