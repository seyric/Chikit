import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Bed Categories (ICU, General Ward, etc.)
export const bedCategoriesTable = pgTable("bed_categories", {
  id: serial("id").primaryKey(),
  categoryCode: text("category_code").notNull().unique(), // e.g., "ICU", "GW", "HDU"
  categoryName: text("category_name").notNull(),
  description: text("description"),
  requiresSpecializedStaff: boolean("requires_specialized_staff").notNull().default(false),
  isCriticalCare: boolean("is_critical_care").notNull().default(false),
  averageDailyRate: real("average_daily_rate"), // For billing/insurance purposes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBedCategorySchema = createInsertSchema(bedCategoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBedCategory = z.infer<typeof insertBedCategorySchema>;
export type BedCategory = typeof bedCategoriesTable.$inferSelect;