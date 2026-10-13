// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { eq, and, or, desc, asc, isNull, ne, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  caseGraphsTable,
  caseEmbeddingsTable,
  caseConsentsTable,
  caseNetworkPermissionsTable,
  caseContributionsTable,
  patientsTable,
  hospitalsTable,
  provenanceLedgerTable,
} from "@workspace/db/schema";
import { z } from "zod";
import { requireAuth, requireRole } from "../lib/auth";
import { ABDMService } from "../abdm/service";
import { MedGemmaService } from "../medgemma/service";
import ProvenanceService from "./provenance.service";
import ConsentService from "./consent.service";

// CaseGraph Service Class
export class CaseGraphService {
  constructor(
    private abdmService: ABDMService,
    private medgemmaService: MedGemmaService,
    private provenanceService: ProvenanceService = new ProvenanceService(),
    private consentService: ConsentService = new ConsentService(abdmService),
  ) {}

  // Submit a new case to the CaseGraph
  async submitCase(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const submitCaseSchema = z.object({
        patientId: z.number().int().positive(),
        chiefComplaint: z.string().min(1),
        symptoms: z
          .array(
            z.object({
              name: z.string(),
              severity: z.number().min(0).max(10).optional(),
              duration: z.string().optional(),
              bodyLocation: z.string().optional(),
            }),
          )
          .nonempty(),
        vitalSigns: z
          .record(z.string(), z.union([z.string(), z.number()]))
          .optional(),
        suspectedDiagnoses: z
          .array(
            z.object({
              code: z.string(), // ICD-10 code
              confidence: z.number().min(0).max(1),
              description: z.string().optional(),
            }),
          )
          .optional(),
        confirmedDiagnoses: z
          .array(
            z.object({
              code: z.string(), // ICD-10 code
              description: z.string().optional(),
            }),
          )
          .optional(),
        laboratoryResults: z
          .array(
            z.object({
              testName: z.string(),
              value: z.union([z.string(), z.number()]),
              unit: z.string().optional(),
              referenceRange: z.string().optional(),
              interpretation: z.string().optional(),
              date: z.string().datetime().optional(),
            }),
          )
          .optional(),
        imagingStudies: z
          .array(
            z.object({
              studyType: z.string(), // X-ray, MRI, CT, etc.
              bodyPart: z.string(),
              findings: z.string(),
              impression: z.string().optional(),
              date: z.string().datetime().optional(),
            }),
          )
          .optional(),
        treatmentsAdministered: z
          .array(
            z.object({
              treatmentName: z.string(),
              dosage: z.string().optional(),
              frequency: z.string().optional(),
              route: z.string().optional(),
              startDate: z.string().datetime().optional(),
              endDate: z.string().datetime().optional(),
            }),
          )
          .optional(),
        medicationsPrescribed: z
          .array(
            z.object({
              medicationName: z.string(),
              dosage: z.string(),
              frequency: z.string(),
              route: z.string().optional(),
              startDate: z.string().datetime().optional(),
              endDate: z.string().datetime().optional(),
              instructions: z.string().optional(),
            }),
          )
          .optional(),
        complications: z.array(z.string()).optional(),
        clinicalCourse: z.string().optional(),
        outcome: z
          .enum(["recovered", "deteriorated", "died", "transferred", "ongoing"])
          .optional(),
        outcomeDate: z.string().datetime().optional(),
        dischargeDisposition: z
          .enum(["home", "rehab", "ltac", "hospice", "other"])
          .optional(),
        readmissionRisk: z.enum(["low", "medium", "high"]).optional(),
        contributingSpecialty: z.string().optional(),
        caseSeverity: z
          .enum(["mild", "moderate", "severe", "critical"])
          .optional(),
      });

      const validatedData = submitCaseSchema.parse(req.body);

      // Verify patient exists and belongs to user's hospital
      const patient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, validatedData.patientId),
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Verify user has access to this patient's hospital
      if (req.user.hospitalId !== patient.hospitalId) {
        return res
          .status(403)
          .json({ error: "Access denied to patient's hospital" });
      }

      // Check if patient has granted consent for research participation
      const consentRecord = await db.query.caseConsentsTable.findFirst({
        where: and(
          eq(caseConsentsTable.patientId, validatedData.patientId),
          eq(caseConsentsTable.consentGranted, true),
          or(
            eq(caseConsentsTable.consentWithdrawn, false),
            isNull(caseConsentsTable.consentWithdrawn),
          ),
        ),
      });

      if (!consentRecord) {
        return res.status(403).json({
          error: "Patient has not granted consent for research participation",
        });
      }

      // Check consent expiry
      if (
        consentRecord.consentExpiryDate &&
        new Date(consentRecord.consentExpiryDate) < new Date()
      ) {
        return res.status(403).json({
          error: "Patient consent has expired",
        });
      }

      // Generate patient hash for pseudonymization (ABHA-based)
      const patientHash = await this.generatePatientHash(
        patient.abhaNumber || "",
        req.user.hospitalId,
      );

      // Generate ABHA consent hash
      const abhaConsentHash = await this.generateConsentHash(consentRecord.id);

      // Prepare case data for insertion
      const caseData = {
        patientHash,
        abhaConsentHash,
        caseDate: new Date(),
        onsetDate: validatedData.chiefComplaintDuration
          ? new Date(
              Date.now() -
                this.parseDurationToMs(validatedData.chiefComplaintDuration),
            )
          : undefined,
        ageGroup: this.calculateAgeGroup(patient.dateOfBirth),
        gender: patient.gender,
        region: patient.state, // State level only for privacy
        chiefComplaint: validatedData.chiefComplaint,
        symptoms: validatedData.symptoms,
        chiefComplaintDuration: validatedData.chiefComplaintDuration,
        vitalSigns: validatedData.vitalSigns || {},
        suspectedDiagnoses: validatedData.suspectedDiagnoses || [],
        confirmedDiagnoses: validatedData.confirmedDiagnoses || [],
        differentialDiagnosis: [], // Will be populated by AI analysis
        laboratoryResults: validatedData.laboratoryResults || [],
        imagingStudies: validatedData.imagingStudies || [],
        otherInvestigations: [],
        treatmentsAdministered: validatedData.treatmentsAdministered || [],
        proceduresPerformed: [],
        medicationsPrescribed: validatedData.medicationsPrescribed || [],
        complications: validatedData.complications || [],
        clinicalCourse: validatedData.clinicalCourse,
        outcome: validatedData.outcome,
        outcomeDate: validatedData.outcomeDate
          ? new Date(validatedData.outcomeDate)
          : undefined,
        dischargeDisposition: validatedData.dischargeDisposition,
        readmissionRisk: validatedData.readmissionRisk,
        contributingHospitalId: req.user.hospitalId,
        contributingSpecialty: validatedData.contributingSpecialty,
        caseSeverity: validatedData.caseSeverity,
        verificationStatus: "pending",
        consentLevel: "pseudonymized", // Default level for research
        dataRetentionUntil: this.calculateRetentionDate(
          consentRecord.consentExpiryDate,
        ),
      };

      // Insert case into database
      const [newCase] = await db
        .insert(caseGraphsTable)
        .values(caseData)
        .returning();

      // Create provenance ledger entry for case creation
      await this.provenanceService.createLedgerEntry({
        caseId: newCase.id,
        entryType: "case_creation",
        entryDescription: "Initial case submission to CaseGraph",
        actorId: req.user.id,
        actorHospitalId: req.user.hospitalId,
        actorRole: req.user.role || "unknown",
        changedFields: Object.keys(caseData),
        newValues: caseData,
        dataSnapshot: caseData,
        consentHashAtTime: abhaConsentHash,
        privacyLevel: caseData.consentLevel,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || undefined,
        originatingSystem: "chikit_casegraph",
      });

      // Generate embeddings for AI-powered search
      await this.generateAndStoreCaseEmbeddings(newCase.id, validatedData);

      // Create provenance ledger entry for embedding generation
      await this.provenanceService.createLedgerEntry({
        caseId: newCase.id,
        entryType: "embedding_generation",
        entryDescription: "Generated AI embeddings for case search",
        actorId: req.user.id,
        actorHospitalId: req.user.hospitalId,
        actorRole: req.user.role || "unknown",
        changedFields: ["embeddings"],
        dataSnapshot: { embeddingModel: "medgemma-4b-it" },
        consentHashAtTime: abhaConsentHash,
        privacyLevel: caseData.consentLevel,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || undefined,
        originatingSystem: "chikit_casegraph",
      });

      // Create initial contribution record
      await db.insert(caseContributionsTable).values({
        caseId: newCase.id,
        contributionType: "initial_submission",
        contributedBy: req.user.id,
        contributionHospitalId: req.user.hospitalId,
        contributionReason: "Initial case submission for CaseGraph",
        reviewStatus: "pending",
      });

      // Create provenance ledger entry for contribution
      await this.provenanceService.createLedgerEntry({
        caseId: newCase.id,
        entryType: "case_contribution",
        entryDescription: "Initial case contribution recorded",
        actorId: req.user.id,
        actorHospitalId: req.user.hospitalId,
        actorRole: req.user.role || "unknown",
        changedFields: ["contributions"],
        dataSnapshot: { contributionType: "initial_submission" },
        consentHashAtTime: abhaConsentHash,
        privacyLevel: caseData.consentLevel,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || undefined,
        originatingSystem: "chikit_casegraph",
      });

      // Log to audit trail (provenance service handles this)

      res.status(201).json({
        success: true,
        caseId: newCase.id,
        caseUuid: newCase.caseUuid,
        message: "Case submitted successfully to CaseGraph",
      });
    } catch (error) {
      next(error);
    }
  }

  // Search for similar cases using hybrid search (structured + semantic)
  async searchSimilarCases(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query parameters
      const searchSchema = z.object({
        chiefComplaint: z.string().optional(),
        symptoms: z.array(z.string()).optional(),
        suspectedDiagnoses: z.array(z.string()).optional(), // ICD-10 codes
        confirmedDiagnoses: z.array(z.string()).optional(), // ICD-10 codes
        ageGroup: z.string().optional(),
        gender: z.string().optional(),
        region: z.string().optional(),
        vitalSigns: z
          .record(z.string(), z.union([z.string(), z.number()]))
          .optional(),
        treatments: z.array(z.string()).optional(),
        medications: z.array(z.string()).optional(),
        outcome: z
          .enum(["recovered", "deteriorated", "died", "transferred", "ongoing"])
          .optional(),
        caseSeverity: z
          .enum(["mild", "moderate", "severe", "critical"])
          .optional(),
        contributingSpecialty: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(10),
        offset: z.number().int().min(0).default(0),
        // Hybrid search parameters
        semanticWeight: z.number().min(0).max(1).default(0.7), // Weight for semantic vs structured search
        minSimilarityScore: z.number().min(0).max(1).default(0.6),
      });

      const validatedQuery = searchSchema.parse(req.query);

      // Verify user's hospital has network permissions to search
      const hasNetworkAccess = await this.checkNetworkSearchPermission(
        req.user.hospitalId,
      );
      if (!hasNetworkAccess) {
        return res.status(403).json({
          error:
            "Your hospital does not have permission to search the CaseGraph network",
        });
      }

      // Build structured query filters
      const structuredConditions = [];

      if (validatedQuery.chiefComplaint) {
        structuredConditions.push(
          sql.raw(
            `LOWER(chief_complaint) LIKE LOWER('%' || ${validatedQuery.chiefComplaint} || '%')`,
          ),
        );
      }

      if (validatedQuery.symptoms && validatedQuery.symptoms.length > 0) {
        // Check if any of the symptoms match
        const symptomConditions = validatedQuery.symptoms.map((symptom) =>
          sql.raw(`symptoms @> ${JSON.stringify([{ name: symptom }])}`),
        );
        structuredConditions.push(or(...symptomConditions));
      }

      if (
        validatedQuery.suspectedDiagnoses &&
        validatedQuery.suspectedDiagnoses.length > 0
      ) {
        const diagnosisConditions = validatedQuery.suspectedDiagnoses.map(
          (code) =>
            sql.raw(`suspected_diagnoses @> ${JSON.stringify([{ code }])}`),
        );
        structuredConditions.push(or(...diagnosisConditions));
      }

      if (
        validatedQuery.confirmedDiagnoses &&
        validatedQuery.confirmedDiagnoses.length > 0
      ) {
        const diagnosisConditions = validatedQuery.confirmedDiagnoses.map(
          (code) =>
            sql.raw(`confirmed_diagnoses @> ${JSON.stringify([{ code }])}`),
        );
        structuredConditions.push(or(...diagnosisConditions));
      }

      if (validatedQuery.ageGroup) {
        structuredConditions.push(
          eq(caseGraphsTable.ageGroup, validatedQuery.ageGroup),
        );
      }

      if (validatedQuery.gender) {
        structuredConditions.push(
          eq(caseGraphsTable.gender, validatedQuery.gender),
        );
      }

      if (validatedQuery.region) {
        structuredConditions.push(
          eq(caseGraphsTable.region, validatedQuery.region),
        );
      }

      if (
        validatedQuery.vitalSigns &&
        Object.keys(validatedQuery.vitalSigns).length > 0
      ) {
        // Convert vital signs to JSONB containment check
        structuredConditions.push(
          sql.raw(
            `vital_signs @> ${JSON.stringify(validatedQuery.vitalSigns)}`,
          ),
        );
      }

      if (validatedQuery.treatments && validatedQuery.treatments.length > 0) {
        const treatmentConditions = validatedQuery.treatments.map((treatment) =>
          sql.raw(
            `treatments_administered @> ${JSON.stringify([{ treatmentName: treatment }])}`,
          ),
        );
        structuredConditions.push(or(...treatmentConditions));
      }

      if (validatedQuery.medications && validatedQuery.medications.length > 0) {
        const medicationConditions = validatedQuery.medications.map(
          (medication) =>
            sql.raw(
              `medications_prescribed @> ${JSON.stringify([{ medicationName: medication }])}`,
            ),
        );
        structuredConditions.push(or(...medicationConditions));
      }

      if (validatedQuery.outcome) {
        structuredConditions.push(
          eq(caseGraphsTable.outcome, validatedQuery.outcome),
        );
      }

      if (validatedQuery.caseSeverity) {
        structuredConditions.push(
          eq(caseGraphsTable.caseSeverity, validatedQuery.caseSeverity),
        );
      }

      if (validatedQuery.contributingSpecialty) {
        structuredConditions.push(
          eq(
            caseGraphsTable.contributingSpecialty,
            validatedQuery.contributingSpecialty,
          ),
        );
      }

      // Exclude cases from the same hospital to avoid self-matches (unless specifically allowed)
      // For now, exclude same hospital cases to encourage cross-hospital learning
      structuredConditions.push(
        ne(caseGraphsTable.contributingHospitalId, req.user.hospitalId),
      );

      // Only include verified cases or cases with sufficient verification status
      structuredConditions.push(
        inArray(caseGraphsTable.verificationStatus, [
          "clinician_reviewed",
          "verified",
        ]),
      );

      // Execute base query to get candidate cases
      let query = db
        .select({
          id: caseGraphsTable.id,
          caseUuid: caseGraphsTable.caseUuid,
          caseDate: caseGraphsTable.caseDate,
          ageGroup: caseGraphsTable.ageGroup,
          gender: caseGraphsTable.gender,
          region: caseGraphsTable.region,
          chiefComplaint: caseGraphsTable.chiefComplaint,
          symptoms: caseGraphsTable.symptoms,
          vitalSigns: caseGraphsTable.vitalSigns,
          suspectedDiagnoses: caseGraphsTable.suspectedDiagnoses,
          confirmedDiagnoses: caseGraphsTable.confirmedDiagnoses,
          laboratoryResults: caseGraphsTable.laboratoryResults,
          imagingStudies: caseGraphsTable.imagingStudies,
          treatmentsAdministered: caseGraphsTable.treatmentsAdministered,
          medicationsPrescribed: caseGraphsTable.medicationsPrescribed,
          complications: caseGraphsTable.complications,
          clinicalCourse: caseGraphsTable.clinicalCourse,
          outcome: caseGraphsTable.outcome,
          outcomeDate: caseGraphsTable.outcomeDate,
          dischargeDisposition: caseGraphsTable.dischargeDisposition,
          readmissionRisk: caseGraphsTable.readmissionRisk,
          contributingHospitalId: caseGraphsTable.contributingHospitalId,
          contributingSpecialty: caseGraphsTable.contributingSpecialty,
          caseSeverity: caseGraphsTable.caseSeverity,
          verificationStatus: caseGraphsTable.verificationStatus,
        })
        .from(caseGraphsTable)
        .where(and(...structuredConditions))
        .orderBy(desc(caseGraphsTable.caseDate))
        .limit(validatedQuery.limit * 3) // Get more candidates for reranking
        .offset(validatedQuery.offset);

      const candidateCases = await query;

      // If no candidates found, return early
      if (candidateCases.length === 0) {
        return res.json({
          success: true,
          cases: [],
          total: 0,
          message: "No similar cases found",
        });
      }

      // Generate query embedding for semantic search
      const queryText = this.buildQueryText(validatedQuery);
      const queryEmbedding =
        await this.medgemmaService.generateEmbedding(queryText);

      // Calculate semantic similarity scores and combine with structured scores
      const scoredCases = await Promise.all(
        candidateCases.map(async (caseObj) => {
          // Get embedding for this case
          const caseEmbedding = await db.query.caseEmbeddingsTable.findFirst({
            where: eq(caseEmbeddingsTable.caseId, caseObj.id),
            columns: { compositeEmbedding: true },
          });

          let semanticScore = 0;
          if (caseEmbedding && caseEmbedding.compositeEmbedding) {
            // Calculate cosine similarity between query and case embeddings
            semanticScore = this.calculateCosineSimilarity(
              queryEmbedding,
              caseEmbedding.compositeEmbedding,
            );
          }

          // Calculate structured match score (simplified - could be enhanced)
          const structuredScore = this.calculateStructuredMatchScore(
            validatedQuery,
            caseObj,
          );

          // Combine scores using weighted average
          const combinedScore =
            validatedQuery.semanticWeight * semanticScore +
            (1 - validatedQuery.semanticWeight) * structuredScore;

          return {
            ...caseObj,
            similarityScore: combinedScore,
            semanticScore,
            structuredScore,
            matchExplanation: this.generateMatchExplanation(
              validatedQuery,
              caseObj,
              semanticScore,
              structuredScore,
            ),
          };
        }),
      );

      // Filter by minimum similarity score and sort
      const filteredCases = scoredCases
        .filter(
          (caseObj) =>
            caseObj.similarityScore >= validatedQuery.minSimilarityScore,
        )
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, validatedQuery.limit);

      // Get total count for pagination
      const countQuery = db
        .select({ count: sql`COUNT(*)` })
        .from(caseGraphsTable)
        .where(and(...structuredConditions));

      const [{ count }] = await countQuery;
      const total = Number(count);

      res.json({
        success: true,
        cases: filteredCases,
        total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore: validatedQuery.offset + validatedQuery.limit < total,
        searchMetadata: {
          queryText,
          semanticWeight: validatedQuery.semanticWeight,
          minSimilarityScore: validatedQuery.minSimilarityScore,
          candidatesExamined: candidateCases.length,
        },
      });

      // Log search access to provenance ledger for accessed cases (anonymized)
      // Note: In a production system, we might want to log this asynchronously
      // or sample the logs to prevent performance impact
      if (filteredCases.length > 0) {
        // Create a minimal provenance log for search access (without PHI)
        await this.provenanceService.createLedgerEntry({
          caseId: filteredCases[0].id, // Log for first result as representative
          entryType: "access_log",
          entryDescription: `CaseGraph search accessed by user ${req.user.id}`,
          actorId: req.user.id,
          actorHospitalId: req.user.hospitalId,
          actorRole: req.user.role || "unknown",
          changedFields: ["search_access"],
          dataSnapshot: {
            queryHash: this.stringToHash(JSON.stringify(validatedQuery)),
            resultsCount: filteredCases.length,
            timestamp: new Date().toISOString(),
          },
          consentHashAtTime: "search_access_no_specific_consent", // Search doesn't access specific PHI
          privacyLevel: "anonymous", // Search logs are anonymized
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || undefined,
          originatingSystem: "chikit_casegraph",
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // Get case details by ID (with proper authorization)
  async getCaseDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const caseId = Number(req.params.id);

      if (isNaN(caseId)) {
        return res.status(400).json({ error: "Invalid case ID" });
      }

      // Get case with related data
      const caseData = await db.query.caseGraphsTable.findFirst({
        where: eq(caseGraphsTable.id, caseId),
        with: {
          contributions: {
            with: {
              contributedByUser: true,
              contributionHospital: true,
            },
          },
          embeddings: true,
        },
      });

      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }

      // Check authorization: user must be from same hospital OR have network access
      const isSameHospital =
        caseData.contributingHospitalId === req.user.hospitalId;
      const hasNetworkAccess = await this.checkNetworkAccessPermission(
        req.user.hospitalId,
        caseData.contributingHospitalId,
      );

      if (!isSameHospital && !hasNetworkAccess) {
        return res.status(403).json({ error: "Access denied to this case" });
      }

      // Apply privacy filtering based on consent level and user permissions
      const filteredCase = this.applyPrivacyFilters(
        caseData,
        req.user.hospitalId,
      );

      // Log case access to provenance ledger
      await this.provenanceService.createLedgerEntry({
        caseId: caseData.id,
        entryType: "access_log",
        entryDescription: `Case details accessed by user ${req.user.id}`,
        actorId: req.user.id,
        actorHospitalId: req.user.hospitalId,
        actorRole: req.user.role || "unknown",
        changedFields: ["case_access"],
        dataSnapshot: {
          accessedFields: Object.keys(filteredCase).length,
          timestamp: new Date().toISOString(),
        },
        consentHashAtTime: caseData.abhaConsentHash || "unknown",
        privacyLevel: caseData.consentLevel,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || undefined,
        originatingSystem: "chikit_casegraph",
      });

      res.json({
        success: true,
        case: filteredCase,
      });
    } catch (error) {
      next(error);
    }
  }

  // Grant or update research consent for a patient
  async updateConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = Number(req.params.patientId);

      if (isNaN(patientId)) {
        return res.status(400).json({ error: "Invalid patient ID" });
      }

      // Verify patient exists and belongs to user's hospital
      const patient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, patientId),
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Verify user has access to this patient's hospital
      if (req.user.hospitalId !== patient.hospitalId) {
        return res
          .status(403)
          .json({ error: "Access denied to patient's hospital" });
      }

      // Validate consent data
      const consentSchema = z.object({
        consentGranted: z.boolean(),
        dataSharingScope: z
          .enum([
            "hospital_only",
            "state_level",
            "national",
            "international_research",
          ])
          .optional(),
        allowedDataTypes: z.array(z.string()).optional(),
        prohibitedDataTypes: z.array(z.string()).optional(),
        researchStudyId: z.string().optional(),
        researchPurpose: z.string().optional(),
        consentExpiryDate: z.string().datetime().optional(),
      });

      const validatedData = consentSchema.parse(req.body);

      // Check if consent record already exists
      let consentRecord = await db.query.caseConsentsTable.findFirst({
        where: eq(caseConsentsTable.patientId, patientId),
      });

      const now = new Date();

      if (consentRecord) {
        // Update existing consent
        await db
          .update(caseConsentsTable)
          .set({
            consentGranted: validatedData.consentGranted,
            consentDate: validatedData.consentGranted ? now : null,
            consentExpiryDate: validatedData.consentExpiryDate
              ? new Date(validatedData.consentExpiryDate)
              : null,
            dataSharingScope:
              validatedData.dataSharingScope ?? consentRecord.dataSharingScope,
            allowedDataTypes:
              validatedData.allowedDataTypes ?? consentRecord.allowedDataTypes,
            prohibitedDataTypes:
              validatedData.prohibitedDataTypes ??
              consentRecord.prohibitedDataTypes,
            researchStudyId:
              validatedData.researchStudyId ?? consentRecord.researchStudyId,
            researchPurpose:
              validatedData.researchPurpose ?? consentRecord.researchPurpose,
            consentWithdrawn: !validatedData.consentGranted ? true : false,
            withdrawalDate: !validatedData.consentGranted ? now : null,
            withdrawalReason: !validatedData.consentGranted
              ? "Consent withdrawn by patient/hospital"
              : null,
            verifiedBy: req.user.id,
            verificationMethod: "hospital_consent_portal",
            verificationDate: now,
            updatedAt: now,
          })
          .where(eq(caseConsentsTable.id, consentRecord.id));

        consentRecord = {
          ...consentRecord,
          ...validatedData,
          id: consentRecord.id,
        };
      } else {
        // Create new consent record
        const [newConsent] = await db
          .insert(caseConsentsTable)
          .values({
            patientId,
            abhaNumberHash: await this.generateABHHash(
              patient.abhaNumber || "",
            ),
            consentGranted: validatedData.consentGranted,
            consentDate: validatedData.consentGranted ? now : null,
            consentExpiryDate: validatedData.consentExpiryDate
              ? new Date(validatedData.consentExpiryDate)
              : null,
            dataSharingScope: validatedData.dataSharingScope ?? "hospital_only",
            allowedDataTypes: validatedData.allowedDataTypes ?? [],
            prohibitedDataTypes: validatedData.prohibitedDataTypes ?? [],
            researchStudyId: validatedData.researchStudyId,
            researchPurpose: validatedData.researchPurpose,
            consentWithdrawn: !validatedData.consentGranted,
            withdrawalDate: !validatedData.consentGranted ? now : null,
            withdrawalReason: !validatedData.consentGranted
              ? "Consent withdrawn by patient/hospital"
              : null,
            verifiedBy: req.user.id,
            verificationMethod: "hospital_consent_portal",
            verificationDate: now,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        consentRecord = newConsent;
      }

      res.json({
        success: true,
        consent: consentRecord,
        message: validatedData.consentGranted
          ? "Research consent granted successfully"
          : "Research consent withdrawn successfully",
      });

      // Log consent update to provenance ledger
      await this.provenanceService.createLedgerEntry({
        caseId: 0, // Consent updates don't tie to a specific case, but we can link to patient's cases
        entryType: "consent_update",
        entryDescription: `Research consent ${validatedData.consentGranted ? "granted" : "withdrawn"} for patient ${patientId}`,
        actorId: req.user.id,
        actorHospitalId: req.user.hospitalId,
        actorRole: req.user.role || "unknown",
        changedFields: Object.keys(validatedData),
        newValues: validatedData,
        dataSnapshot: {
          patientId,
          consentAction: validatedData.consentGranted ? "grant" : "withdraw",
          timestamp: new Date().toISOString(),
        },
        consentHashAtTime: await this.consentService.generateABHHash(
          patient.abhaNumber || "",
        ),
        privacyLevel: "pseudonymized", // Consent metadata is pseudonymized
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || undefined,
        originatingSystem: "chikit_casegraph",
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods (private implementation details)

  private async generatePatientHash(
    abhaNumber: string,
    hospitalId: number,
  ): Promise<string> {
    // Create a pseudonymized hash using ABHA number + hospital-specific salt
    // In production, use proper cryptographic hashing with salt
    const salt = `chikit-hospital-${hospitalId}-salt-2026`;
    const input = `${abhaNumber}|${salt}`;
    // Simplified hash - in production use crypto.createHash('sha256')
    return Buffer.from(input).toString("base64").substring(0, 32);
  }

  private async generateConsentHash(consentId: number): Promise<string> {
    // Generate hash of consent artifact for verification
    const input = `consent-${consentId}-chikit-2026`;
    return Buffer.from(input).toString("base64").substring(0, 32);
  }

  private async generateABHHash(abhaNumber: string): Promise<string> {
    // Generate hash of ABHA number for lookup
    if (!abhaNumber) return "";
    const input = `abha-${abhaNumber}-chikit-2026`;
    return Buffer.from(input).toString("base64").substring(0, 32);
  }

  private calculateAgeGroup(dateOfBirth: string | undefined): string {
    if (!dateOfBirth) return "unknown";

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age >= 0 && age <= 18) return "0-18";
    if (age >= 19 && age <= 35) return "19-35";
    if (age >= 36 && age <= 50) return "36-50";
    if (age >= 51 && age <= 65) return "51-65";
    return "65+";
  }

  private parseDurationToMs(duration: string): number {
    // Parse duration string like "2 days", "3 weeks", "1 month" to milliseconds
    const match = duration.match(
      /^(\d+)\s*(day|days|week|weeks|month|months|year|years)$/,
    );
    if (!match) return 24 * 60 * 60 * 1000; // Default to 1 day

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "day":
      case "days":
        return value * 24 * 60 * 60 * 1000;
      case "week":
      case "weeks":
        return value * 7 * 24 * 60 * 60 * 1000;
      case "month":
      case "months":
        return value * 30 * 24 * 60 * 60 * 1000; // Approximate
      case "year":
      case "years":
        return value * 365 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  private calculateRetentionDate(
    expiryDate: string | undefined,
  ): Date | undefined {
    if (!expiryDate) return undefined;
    // Retain data for 1 year after consent expiry for audit purposes
    const expiry = new Date(expiryDate);
    return new Date(
      expiry.getFullYear() + 1,
      expiry.getMonth(),
      expiry.getDate(),
    );
  }

  private async checkNetworkSearchPermission(
    hospitalId: number,
  ): Promise<boolean> {
    // Check if hospital has active network permissions to search
    const permissions = await db.query.caseNetworkPermissionsTable.findMany({
      where: and(
        eq(caseNetworkPermissionsTable.receivingHospitalId, hospitalId),
        eq(caseNetworkPermissionsTable.status, "active"),
        sql`${caseNetworkPermissionsTable.validFrom} <= NOW()`,
        or(
          isNull(caseNetworkPermissionsTable.validUntil),
          sql`${caseNetworkPermissionsTable.validUntil} >= NOW()`,
        ),
      ),
    });

    return permissions.length > 0;
  }

  private async checkNetworkAccessPermission(
    requestingHospitalId: number,
    targetHospitalId: number,
  ): Promise<boolean> {
    // Check if requesting hospital has permission to access target hospital's cases
    const permission = await db.query.caseNetworkPermissionsTable.findFirst({
      where: and(
        eq(caseNetworkPermissionsTable.sharingHospitalId, targetHospitalId),
        eq(
          caseNetworkPermissionsTable.receivingHospitalId,
          requestingHospitalId,
        ),
        eq(caseNetworkPermissionsTable.status, "active"),
        sql`${caseNetworkPermissionsTable.validFrom} <= NOW()`,
        or(
          isNull(caseNetworkPermissionsTable.validUntil),
          sql`${caseNetworkPermissionsTable.validUntil} >= NOW()`,
        ),
      ),
    });

    return !!permission;
  }

  private async generateAndStoreCaseEmbeddings(
    caseId: number,
    caseData: any,
  ): Promise<void> {
    try {
      // Generate text representations for different aspects of the case
      const symptomText = this.extractSymptomText(caseData.symptoms);
      const diagnosisText = this.extractDiagnosisText([
        ...(caseData.suspectedDiagnoses || []),
        ...(caseData.confirmedDiagnoses || []),
      ]);
      const treatmentText = this.extractTreatmentText([
        ...(caseData.treatmentsAdministered || []),
        ...(caseData.medicationsPrescribed || []),
      ]);
      const outcomeText = caseData.outcome || "";

      // Generate embeddings using MedGemma
      const [
        symptomEmbedding,
        diagnosisEmbedding,
        treatmentEmbedding,
        outcomeEmbedding,
      ] = await Promise.all([
        this.medgemmaService.generateEmbedding(symptomText),
        this.medgemmaService.generateEmbedding(diagnosisText),
        this.medgemmaService.generateEmbedding(treatmentText),
        this.medgemmaService.generateEmbedding(outcomeText),
      ]);

      // Create composite embedding (weighted average)
      const compositeEmbedding = this.createCompositeEmbedding([
        symptomEmbedding,
        diagnosisEmbedding,
        treatmentEmbedding,
        outcomeEmbedding,
      ]);

      // Store embeddings in database
      await db.insert(caseEmbeddingsTable).values({
        caseId,
        symptomEmbedding,
        diagnosisEmbedding,
        treatmentEmbedding,
        outcomeEmbedding,
        compositeEmbedding,
        embeddingModel: "medgemma-4b-it",
        embeddingVersion: "1.0",
      });
    } catch (error) {
      console.error("Failed to generate case embeddings:", error);
      // Don't fail the whole operation if embedding generation fails
    }
  }

  private extractSymptomText(symptoms: any[]): string {
    if (!symptoms || symptoms.length === 0) return "";
    return symptoms
      .map((s) => s.name || "")
      .filter(Boolean)
      .join(", ");
  }

  private extractDiagnosisText(diagnoses: any[]): string {
    if (!diagnoses || diagnoses.length === 0) return "";
    return diagnoses
      .map((d) => `${d.code} ${d.description || ""}`.trim())
      .filter(Boolean)
      .join(", ");
  }

  private extractTreatmentText(treatments: any[]): string {
    if (!treatments || treatments.length === 0) return "";
    return treatments
      .map((t) => {
        const parts = [
          t.treatmentName || t.medicationName,
          t.dosage,
          t.frequency,
        ].filter(Boolean);
        return parts.join(" ");
      })
      .filter(Boolean)
      .join(", ");
  }

  private createCompositeEmbedding(embeddings: number[][]): number[] {
    if (!embeddings || embeddings.length === 0) return [];

    // Filter out empty embeddings
    const validEmbeddings = embeddings.filter((emb) => emb && emb.length > 0);
    if (validEmbeddings.length === 0) return [];

    // Calculate weighted average (equal weights for now)
    const dimension = validEmbeddings[0].length;
    const composite: number[] = new Array(dimension).fill(0);

    for (const embedding of validEmbeddings) {
      for (let i = 0; i < dimension; i++) {
        composite[i] += embedding[i] || 0;
      }
    }

    // Average
    return composite.map((val) => val / validEmbeddings.length);
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  }

  private buildQueryText(query: any): string {
    const parts = [];

    if (query.chiefComplaint)
      parts.push(`Chief complaint: ${query.chiefComplaint}`);
    if (query.symptoms?.length)
      parts.push(`Symptoms: ${query.symptoms.join(", ")}`);
    if (query.suspectedDiagnoses?.length)
      parts.push(`Suspected diagnoses: ${query.suspectedDiagnoses.join(", ")}`);
    if (query.confirmedDiagnoses?.length)
      parts.push(`Confirmed diagnoses: ${query.confirmedDiagnoses.join(", ")}`);
    if (query.treatments?.length)
      parts.push(`Treatments: ${query.treatments.join(", ")}`);
    if (query.medications?.length)
      parts.push(`Medications: ${query.medications.join(", ")}`);
    if (query.outcome) parts.push(`Outcome: ${query.outcome}`);

    return parts.join(". ");
  }

  private calculateStructuredMatchScore(query: any, caseObj: any): number {
    let score = 0;
    let maxScore = 0;

    // Chief complaint match
    maxScore++;
    if (
      query.chiefComplaint &&
      caseObj.chiefComplaint
        ?.toLowerCase()
        .includes(query.chiefComplaint.toLowerCase())
    ) {
      score++;
    }

    // Symptoms match
    if (query.symptoms?.length) {
      maxScore++;
      const symptomMatches = query.symptoms.filter((querySymptom) =>
        caseObj.symptoms?.some(
          (caseSymptom: any) =>
            caseSymptom.name?.toLowerCase() === querySymptom.toLowerCase(),
        ),
      ).length;
      score += symptomMatches / query.symptoms.length;
    }

    // Diagnoses match
    if (query.suspectedDiagnoses?.length || query.confirmedDiagnoses?.length) {
      maxScore++;
      const allQueryDiagnoses = [
        ...(query.suspectedDiagnoses || []),
        ...(query.confirmedDiagnoses || []),
      ];
      const allCaseDiagnoses = [
        ...(caseObj.suspectedDiagnoses || []).map((d: any) => d.code),
        ...(caseObj.confirmedDiagnoses || []).map((d: any) => d.code),
      ];

      const diagnosisMatches = allQueryDiagnoses.filter((queryDiag) =>
        allCaseDiagnoses.some((caseDiag) => caseDiag === queryDiag),
      ).length;

      score +=
        allQueryDiagnoses.length > 0
          ? diagnosisMatches / allQueryDiagnoses.length
          : 0;
    }

    // Treatments/Medications match
    if (query.treatments?.length || query.medications?.length) {
      maxScore++;
      const allQueryTreatments = [
        ...(query.treatments || []),
        ...(query.medications || []),
      ];
      const allCaseTreatments = [
        ...(caseObj.treatmentsAdministered || []).map(
          (t: any) => t.treatmentName,
        ),
        ...(caseObj.medicationsPrescribed || []).map(
          (m: any) => m.medicationName,
        ),
      ];

      const treatmentMatches = allQueryTreatments.filter((queryTreat) =>
        allCaseTreatments.some(
          (caseTreat) => caseTreat?.toLowerCase() === queryTreat.toLowerCase(),
        ),
      ).length;

      score +=
        allQueryTreatments.length > 0
          ? treatmentMatches / allQueryTreatments.length
          : 0;
    }

    // Demographics match
    if (query.ageGroup) {
      maxScore++;
      if (caseObj.ageGroup === query.ageGroup) score++;
    }

    if (query.gender) {
      maxScore++;
      if (caseObj.gender === query.gender) score++;
    }

    if (query.region) {
      maxScore++;
      if (caseObj.region === query.region) score++;
    }

    // Outcome match
    if (query.outcome) {
      maxScore++;
      if (caseObj.outcome === query.outcome) score++;
    }

    // Severity match
    if (query.caseSeverity) {
      maxScore++;
      if (caseObj.caseSeverity === query.caseSeverity) score++;
    }

    // Specialty match
    if (query.contributingSpecialty) {
      maxScore++;
      if (caseObj.contributingSpecialty === query.contributingSpecialty)
        score++;
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  private generateMatchExplanation(
    query: any,
    caseObj: any,
    semanticScore: number,
    structuredScore: number,
  ): string {
    const explanations = [];

    if (structuredScore > 0.7) {
      explanations.append("Strong structured data match");
    } else if (structuredScore > 0.4) {
      explanations.append("Moderate structured data match");
    }

    if (semanticScore > 0.7) {
      explanations.append("Strong semantic similarity");
    } else if (semanticScore > 0.4) {
      explanations.append("Moderate semantic similarity");
    }

    const matchDetails = [];

    // Add specific matching details
    if (
      query.chiefComplaint &&
      caseObj.chiefComplaint
        ?.toLowerCase()
        .includes(query.chiefComplaint.toLowerCase())
    ) {
      matchDetails.push(`chief complaint ("${query.chiefComplaint}")`);
    }

    if (query.symptoms?.length) {
      const matchedSymptoms = query.symptoms.filter((qSymptom) =>
        caseObj.symptoms?.some(
          (cSymptom: any) =>
            cSymptom.name?.toLowerCase() === qSymptom.toLowerCase(),
        ),
      );
      if (matchedSymptoms.length > 0) {
        matchDetails.push(`symptoms (${matchedSymptoms.join(", ")})`);
      }
    }

    if (query.suspectedDiagnoses?.length || query.confirmedDiagnoses?.length) {
      const allQueryDiagnoses = [
        ...(query.suspectedDiagnoses || []),
        ...(query.confirmedDiagnoses || []),
      ];
      const allCaseDiagnoses = [
        ...(caseObj.suspectedDiagnoses || []).map((d: any) => d.code),
        ...(caseObj.confirmedDiagnoses || []).map((d: any) => d.code),
      ];

      const matchedDiagnoses = allQueryDiagnoses.filter((qDiag) =>
        allCaseDiagnoses.some((cDiag) => cDiag === qDiag),
      );

      if (matchedDiagnoses.length > 0) {
        matchDetails.push(`diagnoses (${matchedDiagnoses.join(", ")})`);
      }
    }

    if (matchDetails.length > 0) {
      explanations.push(`Matched: ${matchDetails.join(", ")}`);
    }

    return explanations.length > 0
      ? explanations.join("; ")
      : "Low similarity match";
  }

  private applyPrivacyFilters(
    caseData: any,
    requestingHospitalId: number,
  ): any {
    // Create a copy to avoid modifying original
    const filteredCase = { ...caseData };

    // If same hospital, show more detailed information
    const isSameHospital =
      caseData.contributingHospitalId === requestingHospitalId;

    if (!isSameHospital) {
      // Apply stricter privacy filters for cross-hospital sharing

      // Remove or generalize sensitive fields based on consent level
      switch (caseData.consentLevel) {
        case "anonymous":
          // Remove all potentially identifying information
          delete filteredCase.chiefComplaint;
          delete filteredCase.symptoms;
          delete filteredCase.vitalSigns;
          delete filteredCase.suspectedDiagnoses;
          delete filteredCase.confirmedDiagnoses;
          delete filteredCase.laboratoryResults;
          delete filteredCase.imagingStudies;
          delete filteredCase.treatmentsAdministered;
          delete filteredCase.medicationsPrescribed;
          delete filteredCase.complications;
          delete filteredCase.clinicalCourse;
          break;

        case "pseudonymized":
          // Keep clinical data but remove specific identifiers
          // Already handled by schema design (symptoms as arrays, etc.)
          // Just ensure no free-text fields that could contain PHI
          break;

        case "limited_dataset":
          // Allow more detailed clinical data for research
          // Keep most fields but may need to generalize some
          break;

        case "full_phi":
          // Only for internal use within same organization
          // Should not happen in cross-hospital sharing
          break;
      }

      // Generalize dates to reduce re-identification risk
      if (filteredCase.caseDate) {
        const date = new Date(filteredCase.caseDate);
        // Round to week start to reduce precision
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        filteredCase.caseDate = weekStart.toISOString();
      }

      if (filteredCase.onsetDate) {
        const date = new Date(filteredCase.onsetDate);
        // Round to week start
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        filteredCase.onsetDate = weekStart.toISOString();
      }

      if (filteredCase.outcomeDate) {
        const date = new Date(filteredCase.outcomeDate);
        // Round to week start
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        filteredCase.outcomeDate = weekStart.toISOString();
      }
    }

    return filteredCase;
  }

  /**
   * Convert string to hash code (simple implementation for non-cryptographic use)
   */
  private stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}

export default CaseGraphService;
