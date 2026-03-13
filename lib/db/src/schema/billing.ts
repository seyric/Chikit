import { pgTable, serial, integer, text, timestamp, numeric, jsonb, boolean } from "drizzle-orm/pg-core";

export const billingTable = pgTable("billing", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  hospitalId: integer("hospital_id"),
  createdBy: integer("created_by"),
  invoiceNumber: text("invoice_number").notNull(),
  lineItems: jsonb("line_items").notNull().default([]),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status", { enum: ["unpaid", "partial", "paid"] }).notNull().default("unpaid"),
  notes: text("notes"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
