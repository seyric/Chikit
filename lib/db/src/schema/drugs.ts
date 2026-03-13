import { pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const drugsTable = pgTable("drugs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name").notNull(),
  brandNames: jsonb("brand_names").notNull().default([]),
  drugClass: text("drug_class").notNull(),
  dosageForms: jsonb("dosage_forms").notNull().default([]),
  strength: text("strength"),
  contraindications: jsonb("contraindications").notNull().default([]),
  sideEffects: jsonb("side_effects").notNull().default([]),
  pregnancyRisk: text("pregnancy_risk"),
  interactions: jsonb("interactions").notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDrugSchema = createInsertSchema(drugsTable).omit({ id: true, createdAt: true });
export type InsertDrug = z.infer<typeof insertDrugSchema>;
export type Drug = typeof drugsTable.$inferSelect;
