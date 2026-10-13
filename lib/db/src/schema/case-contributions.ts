import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { caseGraphsTable } from "./case-graphs";
import { usersTable } from "./users";
import { hospitalsTable } from "./hospitals";

// Case Contributions and Reviews
export const caseContributionsTable = pgTable("case_contributions", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => caseGraphsTable.id, { onDelete: "cascade" }),

  contributionType: text("contribution_type", {
    enum: ["initial_submission", "update", "correction", "outcome_update", "review"]
  }).notNull().default("initial_submission"),

  contributedBy: integer("contributed_by").notNull(), // References users table
  contributionHospitalId: integer("contribution_hospital_id").notNull(), // References hospitals table

  // Contribution details
  contributionReason: text("contribution_reason"),
  changedFields: jsonb("changed_fields").notNull().default([]), // Track what was modified
  previousValues: jsonb("previous_values"),
  newValues: jsonb("new_values"),

  // Review and verification
  reviewedBy: integer("reviewed_by").notNull(), // References users table
  reviewedAt: timestamp("reviewed_at"),
  reviewStatus: text("review_status", {
    enum: ["pending", "approved", "rejected", "requesting_clarification"]
  }).notNull().default("pending"),
  reviewComments: text("review_comments"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCaseContributionSchema = createInsertSchema(caseContributionsTable).omit({ id: true, createdAt: true });
export type InsertCaseContribution = z.infer<typeof insertCaseContributionSchema>;
export type CaseContribution = typeof caseContributionsTable.$inferSelect;