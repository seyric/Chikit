// @ts-nocheck
import { db } from "@/db";
import {
  caseGraphsTable,
  caseEmbeddingsTable,
  caseConsentsTable,
  caseNetworkPermissionsTable,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateEmbedding } from "@/medgemma/service";
import { z } from "zod";

/**
 * Hybrid search service for CaseGraph
 * Combines structured filtering with semantic similarity search
 */
export class CaseGraphSearchService {
  /**
   * Search for similar cases based on structured filters and semantic similarity
   * @param filters - Structured filters (ICD codes, SNOMED, etc.)
   * @param queryText - Free-text query for semantic search
   * @param sourceHospitalId - ID of the hospital requesting the search (for permission checking)
   * @param limit - Maximum number of results to return
   * @returns Array of matching cases with similarity scores
   */
  async searchSimilarCases(
    filters: {
      icdCodes?: string[];
      snomedCodes?: string[];
      loincCodes?: string[];
      rxnormCodes?: string[];
      ageRange?: { min: number; max: number };
      gender?: string[];
      dateRange?: { start: Date; end: Date };
    },
    queryText: string,
    sourceHospitalId: number,
    limit: number = 10,
  ) {
    // 1. Build structured filter conditions
    const structuredConditions = this.buildStructuredConditions(filters);

    // 2. Generate embedding for the query text
    const queryEmbedding = await generateEmbedding(queryText);

    // 3. Perform hybrid search: structured filtering + semantic similarity
    // We'll use a two-step approach: first filter by structured conditions, then rank by semantic similarity
    // For better performance, we could use a combined approach with SQL, but for simplicity we do two steps.

    // Step 1: Get cases that match structured conditions and have consent for sharing
    const candidateCases = await db
      .select({
        caseId: caseGraphsTable.id,
        patientId: caseGraphsTable.patientId,
        sourceHospitalId: caseGraphsTable.sourceHospitalId,
        createdAt: caseGraphsTable.createdAt,
        structuredData: caseGraphsTable.structuredData,
        // We'll also get the embedding for similarity calculation
      })
      .from(caseGraphsTable)
      .innerJoin(
        caseEmbeddingsTable,
        eq(caseGraphsTable.id, caseEmbeddingsTable.caseId),
      )
      .innerJoin(
        caseConsentsTable,
        and(
          eq(caseGraphsTable.patientId, caseConsentsTable.patientId),
          eq(caseConsentsTable.status, "active"),
        ),
      )
      .innerJoin(
        caseNetworkPermissionsTable,
        and(
          eq(
            caseNetworkPermissionsTable.sourceHospitalId,
            caseGraphsTable.sourceHospitalId,
          ),
          eq(caseNetworkPermissionsTable.targetHospitalId, sourceHospitalId),
          eq(caseNetworkPermissionsTable.status, "active"),
        ),
      )
      .where(and(...structuredConditions))
      .limit(100); // Limit candidates to avoid too many embeddings to process

    // Step 2: Calculate similarity scores and rank
    const scoredCases = await Promise.all(
      candidateCases.map(async (candidate) => {
        // Get the embedding for this case
        const embeddingRecord = await db
          .select({ embedding: caseEmbeddingsTable.embedding })
          .from(caseEmbeddingsTable)
          .where(eq(caseEmbeddingsTable.caseId, candidate.caseId))
          .limit(1);

        if (!embeddingRecord[0]) {
          return { ...candidate, similarity: 0 };
        }

        // Calculate cosine similarity between query embedding and case embedding
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          embeddingRecord[0].embedding,
        );

        return {
          ...candidate,
          similarity,
        };
      }),
    );

    // Step 3: Sort by similarity descending and take top limit
    const rankedCases = scoredCases
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return rankedCases;
  }

  /**
   * Build structured filter conditions from filters object
   */
  private buildStructuredConditions(filters: any) {
    const conditions = [];

    if (filters.icdCodes?.length) {
      // Assuming structuredData contains an array of ICD codes under "icdCodes"
      conditions.push(
        sql`${caseGraphsTable.structuredData}::jsonb ?| ${Array.from(
          filters.icdCodes,
        )}`,
      );
    }

    if (filters.snomedCodes?.length) {
      conditions.push(
        sql`${caseGraphsTable.structuredData}::jsonb ?| ${Array.from(
          filters.snomedCodes,
        )}`,
      );
    }

    // Add other filter types as needed...

    // Age range filter (assuming structuredData has age field)
    if (filters.ageRange) {
      conditions.push(
        sql`(${caseGraphsTable.structuredData}->>'age')::int >= ${filters.ageRange.min} AND (${caseGraphsTable.structuredData}->>'age')::int <= ${filters.ageRange.max}`,
      );
    }

    // Gender filter
    if (filters.gender?.length) {
      conditions.push(
        sql`${caseGraphsTable.structuredData}->>'gender' = ANY(${Array.from(
          filters.gender,
        )})`,
      );
    }

    // Date range filter (using createdAt for simplicity, but could be a field in structuredData)
    if (filters.dateRange) {
      conditions.push(
        and(
          sql`${caseGraphsTable.createdAt} >= ${filters.dateRange.start}`,
          sql`${caseGraphsTable.createdAt} <= ${filters.dateRange.end}`,
        ),
      );
    }

    return conditions;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Cosine similarity score between -1 and 1
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must be of the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      normA += vec1[i] * vec1[i];
      normB += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Export a singleton instance
export const caseGraphSearchService = new CaseGraphSearchService();
