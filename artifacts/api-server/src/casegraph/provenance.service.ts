// @ts-nocheck
import { eq, sql, asc, desc, and } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  provenanceLedgerTable,
  caseGraphsTable,
  usersTable,
  hospitalsTable,
} from "@workspace/db/schema";
import { z } from "zod";

// Provenance Service Class
export class ProvenanceService {
  // Create a new provenance ledger entry
  async createLedgerEntry(options: {
    caseId: number;
    entryType: string;
    entryDescription: string;
    actorId: number;
    actorHospitalId: number;
    actorRole: string;
    changedFields?: string[];
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    dataSnapshot?: Record<string, any>;
    consentHashAtTime?: string;
    privacyLevel?: string;
    ipAddress?: string;
    userAgent?: string;
    originatingSystem?: string;
  }): Promise<any> {
    try {
      // Get the previous hash for chaining
      const lastEntry = await db.query.provenanceLedgerTable.findFirst({
        where: eq(provenanceLedgerTable.caseId, options.caseId),
        orderBy: desc(provenanceLedgerTable.sequenceNumber),
        limit: 1,
      });

      const previousHash = lastEntry ? lastEntry.entryHash : null;
      const sequenceNumber = lastEntry ? lastEntry.sequenceNumber + 1 : 1;

      // Get case UUID for denormalization
      const caseRecord = await db.query.caseGraphsTable.findFirst({
        where: eq(caseGraphsTable.id, options.caseId),
        columns: { caseUuid: true },
      });

      // Create entry data for hashing
      const entryData = {
        caseId: options.caseId,
        caseUuid: caseRecord?.caseUuid,
        entryType: options.entryType,
        entryDescription: options.entryDescription,
        previousHash,
        changedFields: options.changedFields || [],
        previousValues: options.previousValues || {},
        newValues: options.newValues || {},
        dataSnapshot: options.dataSnapshot || {},
        actorId: options.actorId,
        actorHospitalId: options.actorHospitalId,
        actorRole: options.actorRole,
        timestamp: new Date().toISOString(),
        sequenceNumber,
        consentHashAtTime: options.consentHashAtTime,
        privacyLevel: options.privacyLevel || "pseudonymized",
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        originatingSystem: options.originatingSystem || "chikit_casegraph",
      };

      // Generate hash of the entry data (simplified - in production use proper crypto)
      const entryHash = this.generateEntryHash(entryData);

      // Insert the ledger entry
      const [ledgerEntry] = await db
        .insert(provenanceLedgerTable)
        .values({
          caseId: options.caseId,
          caseUuid: caseRecord?.caseUuid || null,
          entryType: options.entryType,
          entryDescription: options.entryDescription,
          previousHash,
          entryHash,
          changedFields: options.changedFields || [],
          previousValues: options.previousValues || {},
          newValues: options.newValues || {},
          dataSnapshot: options.dataSnapshot || {},
          actorId: options.actorId,
          actorHospitalId: options.actorHospitalId,
          actorRole: options.actorRole,
          timestamp: new Date(),
          sequenceNumber,
          consentHashAtTime: options.consentHashAtTime,
          privacyLevel: options.privacyLevel || "pseudonymized",
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          originatingSystem: options.originatingSystem || "chikit_casegraph",
          isVerified: false, // Will be verified later by audit process or manually
        })
        .returning();

      return ledgerEntry;
    } catch (error) {
      throw new Error(
        `Failed to create provenance ledger entry: ${error.message}`,
      );
    }
  }

  // Verify a ledger entry's integrity
  async verifyLedgerEntry(ledgerId: number): Promise<boolean> {
    try {
      const entry = await db.query.provenanceLedgerTable.findFirst({
        where: eq(provenanceLedgerTable.id, ledgerId),
      });

      if (!entry) {
        return false;
      }

      // Recreate the entry data for hash verification
      const entryData = {
        caseId: entry.caseId,
        caseUuid: entry.caseUuid,
        entryType: entry.entryType,
        entryDescription: entry.entryDescription,
        previousHash: entry.previousHash,
        changedFields: entry.changedFields,
        previousValues: entry.previousValues,
        newValues: entry.newValues,
        dataSnapshot: entry.dataSnapshot,
        actorId: entry.actorId,
        actorHospitalId: entry.actorHospitalId,
        actorRole: entry.actorRole,
        timestamp: entry.timestamp?.toISOString() || new Date().toISOString(),
        sequenceNumber: entry.sequenceNumber,
        consentHashAtTime: entry.consentHashAtTime,
        privacyLevel: entry.privacyLevel,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        originatingSystem: entry.originatingSystem,
      };

      const computedHash = this.generateEntryHash(entryData);
      const isValid = computedHash === entry.entryHash;

      // Update verification status
      await db
        .update(provenanceLedgerTable)
        .set({
          isVerified: isValid,
          verifiedAt: new Date(),
          verificationMethod: isValid ? "cryptographic" : "hash_mismatch",
        })
        .where(eq(provenanceLedgerTable.id, ledgerId));

      return isValid;
    } catch (error) {
      console.error("Failed to verify ledger entry:", error);
      return false;
    }
  }

  // Verify the entire chain for a case
  async verifyCaseChain(caseId: number): Promise<{
    isValid: boolean;
    brokenLinks: number[];
    totalEntries: number;
  }> {
    try {
      const entries = await db.query.provenanceLedgerTable.findMany({
        where: eq(provenanceLedgerTable.caseId, caseId),
        orderBy: asc(provenanceLedgerTable.sequenceNumber),
      });

      if (entries.length === 0) {
        return { isValid: true, brokenLinks: [], totalEntries: 0 };
      }

      let previousHash = null;
      const brokenLinks = [];

      for (const entry of entries) {
        // Verify individual entry hash
        const entryData = {
          caseId: entry.caseId,
          caseUuid: entry.caseUuid,
          entryType: entry.entryType,
          entryDescription: entry.entryDescription,
          previousHash: entry.previousHash,
          changedFields: entry.changedFields,
          previousValues: entry.previousValues,
          newValues: entry.newValues,
          dataSnapshot: entry.dataSnapshot,
          actorId: entry.actorId,
          actorHospitalId: entry.actorHospitalId,
          actorRole: entry.actorRole,
          timestamp: entry.timestamp?.toISOString() || new Date().toISOString(),
          sequenceNumber: entry.sequenceNumber,
          consentHashAtTime: entry.consentHashAtTime,
          privacyLevel: entry.privacyLevel,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          originatingSystem: entry.originatingSystem,
        };

        const computedHash = this.generateEntryHash(entryData);
        const entryHashValid = computedHash === entry.entryHash;

        // Verify chain linkage (except for first entry)
        const chainValid =
          entry.id === entries[0].id || entry.previousHash === previousHash;

        if (!entryHashValid || !chainValid) {
          brokenLinks.push(entry.id);
        }

        // Update previous hash for next iteration
        previousHash = entry.entryHash;
      }

      // Update verification status for all entries
      const entryIds = entries.map((e) => e.id);
      await db
        .update(provenanceLedgerTable)
        .set({
          isVerified: sql`NOT (${provenanceLedgerTable.id} = ANY(${entryIds}))`,
          verifiedAt: new Date(),
          verificationMethod: "chain_verification",
        })
        .where(inArray(provenanceLedgerTable.id, brokenLinks));

      // Mark non-broken entries as verified
      await db
        .update(provenanceLedgerTable)
        .set({
          isVerified: true,
          verifiedAt: new Date(),
          verificationMethod: "chain_verification",
        })
        .where(
          and(
            eq(provenanceLedgerTable.caseId, caseId),
            notInArray(provenanceLedgerTable.id, brokenLinks),
          ),
        );

      return {
        isValid: brokenLinks.length === 0,
        brokenLinks,
        totalEntries: entries.length,
      };
    } catch (error) {
      throw new Error(`Failed to verify case chain: ${error.message}`);
    }
  }

  // Get provenance history for a case
  async getCaseProvenanceHistory(
    caseId: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any> {
    try {
      const entries = await db.query.provenanceLedgerTable.findMany({
        where: eq(provenanceLedgerTable.caseId, caseId),
        orderBy: desc(provenanceLedgerTable.timestamp),
        limit,
        offset,
        with: {
          actor: true,
          actorHospital: true,
        },
      });

      const countResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(provenanceLedgerTable)
        .where(eq(provenanceLedgerTable.caseId, caseId));

      const total = Number(countResult[0].count || 0);

      return {
        entries,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      throw new Error(`Failed to get provenance history: ${error.message}`);
    }
  }

  // Helper methods

  private generateEntryHash(data: any): string {
    // Create a deterministic JSON string representation
    const jsonString = JSON.stringify(data, (key, value) => {
      // Filter out undefined values and sort object keys for consistency
      if (value === undefined) return undefined;
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return Object.keys(value)
          .sort()
          .reduce((obj, key) => {
            obj[key] = value[key];
            return obj;
          }, {} as any);
      }
      return value;
    });

    // Simple hash function - in production use crypto.createHash('sha256')
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to hex string
    return ((hash & 0xffffffff) >>> 0).toString(16).padStart(8, "0");
  }
}

// Helper functions for SQL arrays (since drizzle doesn't have built-in notInArray)
function inArray<T>(column: any, values: T[]): any {
  return values.length > 0 ? sql`${column} = ANY(${values})` : sql`1=0`;
}

function notInArray<T>(column: any, values: T[]): any {
  return values.length > 0 ? sql`${column} <> ALL(${values})` : sql`1=1`;
}

export default ProvenanceService;
