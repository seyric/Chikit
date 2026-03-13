import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiAnalysisResultsTable = pgTable("ai_analysis_results", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  analysisType: text("analysis_type", { enum: ["symptom_analysis", "patient_summary", "lab_interpretation", "radiology_analysis"] }).notNull(),
  inputData: jsonb("input_data"),
  findings: jsonb("findings").notNull(),
  differentialDiagnosis: jsonb("differential_diagnosis"),
  recommendations: jsonb("recommendations").notNull(),
  urgencyLevel: text("urgency_level", { enum: ["low", "medium", "high", "critical"] }).notNull().default("low"),
  summary: text("summary").notNull(),
  disclaimer: text("disclaimer").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiAnalysisResultSchema = createInsertSchema(aiAnalysisResultsTable).omit({ id: true, createdAt: true });
export type InsertAiAnalysisResult = z.infer<typeof insertAiAnalysisResultSchema>;
export type AiAnalysisResult = typeof aiAnalysisResultsTable.$inferSelect;
