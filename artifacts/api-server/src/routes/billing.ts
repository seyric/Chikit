import { Router } from "express";
import { db } from "@workspace/db";
import { billingTable, patientsTable } from "@workspace/db";
import { eq, desc, ilike, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `INV-${y}${m}-${rand}`;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, patientId, page: rawPage, limit: rawLimit } = req.query;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.min(Number(rawLimit) || 20, 100);
    const offset = (page - 1) * limit;

    let query = db.select({
      id: billingTable.id,
      patientId: billingTable.patientId,
      patientName: patientsTable.name,
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
    .orderBy(desc(billingTable.createdAt))
    .limit(limit)
    .offset(offset)
    .$dynamic();

    if (status && String(status).trim()) {
      query = query.where(eq(billingTable.status, String(status) as "unpaid" | "partial" | "paid"));
    }
    if (patientId) {
      query = query.where(eq(billingTable.patientId, Number(patientId)));
    }

    const invoices = await query;

    const [{ total }] = await db.select({ total: count() }).from(billingTable);

    res.json({ invoices, total: Number(total), page, limit });
  } catch (err) {
    console.error("Billing list error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { patientId, lineItems, tax, discount, notes } = req.body;
    if (!patientId || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({ error: "validation_error", message: "patientId and lineItems required" });
      return;
    }

    const subtotal = lineItems.reduce((sum: number, item: { amount: number }) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = Number(tax) || 0;
    const discountAmount = Number(discount) || 0;
    const total = subtotal + taxAmount - discountAmount;

    const [invoice] = await db.insert(billingTable).values({
      patientId: Number(patientId),
      hospitalId: req.user?.hospitalId || null,
      createdBy: req.user?.id || null,
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

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
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
