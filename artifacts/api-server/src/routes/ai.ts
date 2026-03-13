import { Router } from "express";
import { db } from "@workspace/db";
import { aiAnalysisResultsTable, patientsTable, medicalRecordsTable, labReportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";

const router = Router();

function generateSymptomAnalysis(symptoms: string[], duration?: string, severity?: string, patientContext?: string) {
  const urgencyMap: Record<string, string> = {
    severe: "high",
    moderate: "medium",
    mild: "low",
  };
  const urgencyLevel = urgencyMap[severity ?? "moderate"] ?? "medium";

  const findings = [
    `Patient presents with ${symptoms.join(", ")}`,
    duration ? `Symptom duration: ${duration}` : "Duration not specified",
    `Severity assessed as ${severity ?? "moderate"}`,
    "Vital signs assessment recommended",
  ];

  const differentialDiagnosis = generateDifferentials(symptoms);
  const recommendations = generateRecommendations(symptoms, urgencyLevel);

  return { findings, differentialDiagnosis, recommendations, urgencyLevel };
}

function generateDifferentials(symptoms: string[]): string[] {
  const symLower = symptoms.map(s => s.toLowerCase());
  const differentials: string[] = [];

  if (symLower.some(s => s.includes("fever") || s.includes("temperature"))) {
    differentials.push("Viral infection", "Bacterial infection", "Malaria (endemic areas)", "Dengue fever");
  }
  if (symLower.some(s => s.includes("chest") || s.includes("pain"))) {
    differentials.push("Musculoskeletal chest pain", "Gastroesophageal reflux", "Cardiac evaluation required");
  }
  if (symLower.some(s => s.includes("cough") || s.includes("breath"))) {
    differentials.push("Upper respiratory infection", "Pneumonia", "Bronchitis", "Asthma exacerbation");
  }
  if (symLower.some(s => s.includes("headache") || s.includes("head"))) {
    differentials.push("Tension headache", "Migraine", "Hypertension", "Dehydration");
  }

  if (differentials.length === 0) {
    differentials.push("Further clinical evaluation required", "Consider full physical examination", "Lab workup recommended");
  }

  return differentials.slice(0, 5);
}

function generateRecommendations(symptoms: string[], urgencyLevel: string): string[] {
  const base = [
    "Complete physical examination",
    "Review patient medical history",
    "Document vital signs",
  ];

  if (urgencyLevel === "high" || urgencyLevel === "critical") {
    base.unshift("Immediate medical evaluation required");
    base.push("Consider emergency intervention if deterioration occurs");
  }

  base.push("Order appropriate laboratory investigations");
  base.push("Follow up within 24-48 hours if symptoms persist");
  base.push("Patient education on warning signs");

  return base;
}

router.post("/analyze-symptoms", requireAuth, async (req, res) => {
  try {
    const { patientId, symptoms, duration, severity, additionalContext } = req.body;
    const analysis = generateSymptomAnalysis(symptoms, duration, severity, additionalContext);

    const [result] = await db.insert(aiAnalysisResultsTable).values({
      patientId,
      analysisType: "symptom_analysis",
      inputData: { symptoms, duration, severity, additionalContext },
      findings: analysis.findings,
      differentialDiagnosis: analysis.differentialDiagnosis,
      recommendations: analysis.recommendations,
      urgencyLevel: analysis.urgencyLevel as any,
      summary: `AI symptom analysis for ${symptoms.length} reported symptoms. ${analysis.differentialDiagnosis[0] ?? "Further evaluation needed"}.`,
      disclaimer: "This AI analysis is for clinical decision support only. All medical decisions must be made by qualified healthcare professionals. This does not replace clinical judgment.",
    }).returning();

    await createAuditLog(req, "ai_analysis", "patient", patientId, "symptom_analysis");
    res.json(result);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to analyze symptoms" });
  }
});

router.post("/summarize-patient", requireAuth, async (req, res) => {
  try {
    const { patientId, includeRecentOnly } = req.body;
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
    if (!patient) { res.status(404).json({ error: "not_found", message: "Patient not found" }); return; }

    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, patientId));

    const findings = [
      `Patient: ${patient.name}, DOB: ${patient.dateOfBirth}, Gender: ${patient.gender}`,
      patient.bloodGroup ? `Blood Group: ${patient.bloodGroup}` : "Blood group not recorded",
      patient.chronicConditions ? `Chronic conditions: ${patient.chronicConditions}` : "No chronic conditions documented",
      patient.allergies ? `Known allergies: ${patient.allergies}` : "No known allergies",
      `Total medical records: ${records.length}`,
    ];

    const [result] = await db.insert(aiAnalysisResultsTable).values({
      patientId,
      analysisType: "patient_summary",
      inputData: { patientId, includeRecentOnly },
      findings,
      differentialDiagnosis: [],
      recommendations: [
        "Maintain regular follow-up appointments",
        "Ensure medication compliance",
        "Update emergency contact information",
        "Consider preventive health screening",
        "Review and update allergy documentation",
      ],
      urgencyLevel: "low",
      summary: `Comprehensive patient summary for ${patient.name}. Patient has ${records.length} medical records on file. ${patient.chronicConditions ? "Has documented chronic conditions requiring ongoing management." : "No chronic conditions documented."}`,
      disclaimer: "This AI-generated summary is for informational purposes only. Healthcare providers should review all source records before making clinical decisions.",
    }).returning();

    await createAuditLog(req, "ai_analysis", "patient", patientId, "patient_summary");
    res.json(result);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to summarize patient" });
  }
});

router.post("/interpret-lab", requireAuth, async (req, res) => {
  try {
    const { patientId, labReportId, results, patientContext } = req.body;
    const [labReport] = await db.select().from(labReportsTable).where(eq(labReportsTable.id, labReportId));

    const resultKeys = Object.keys(results ?? labReport?.results ?? {});
    const findings = [
      `Lab report analysis: ${labReport?.testName ?? "Lab Test"}`,
      `Number of parameters analyzed: ${resultKeys.length}`,
      ...resultKeys.slice(0, 5).map(k => `${k}: ${(results ?? labReport?.results as any)?.[k]}`),
    ];

    const [result] = await db.insert(aiAnalysisResultsTable).values({
      patientId,
      analysisType: "lab_interpretation",
      inputData: { labReportId, results, patientContext },
      findings,
      differentialDiagnosis: [],
      recommendations: [
        "Compare values against patient's baseline",
        "Consider clinical correlation with symptoms",
        "Repeat testing if values are borderline",
        "Consult specialist if values are significantly abnormal",
        "Document findings in patient record",
      ],
      urgencyLevel: "medium",
      summary: `AI interpretation of ${labReport?.testName ?? "lab results"}. ${resultKeys.length} parameters reviewed. Clinical correlation with patient history recommended.`,
      disclaimer: "AI lab interpretation is a decision support tool. Reference ranges may vary. All interpretations must be reviewed by a qualified clinician.",
    }).returning();

    if (labReport) {
      await db.update(labReportsTable).set({ aiInterpretation: result.summary, status: "reviewed" }).where(eq(labReportsTable.id, labReportId));
    }

    await createAuditLog(req, "ai_analysis", "patient", patientId, "lab_interpretation");
    res.json(result);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to interpret lab results" });
  }
});

router.get("/results", requireAuth, async (req, res) => {
  try {
    const { patientId } = req.query;
    let query = db.select().from(aiAnalysisResultsTable);
    const results = await query;
    if (patientId) {
      res.json(results.filter(r => r.patientId === Number(patientId)));
      return;
    }
    res.json(results);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch AI results" });
  }
});

export default router;
