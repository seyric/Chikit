import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hospitalsTable = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  district: text("district"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  type: text("type").notNull().default("general"),
  bedCount: integer("bed_count"),
  category: text("category"),
  careType: text("care_type"),
  discipline: text("discipline"),
  specialties: text("specialties"),
  facilities: text("facilities"),
  numDoctors: integer("num_doctors"),
  website: text("website"),
  location: text("location"),
  sourceId: text("source_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHospitalSchema = createInsertSchema(hospitalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitalsTable.$inferSelect;
