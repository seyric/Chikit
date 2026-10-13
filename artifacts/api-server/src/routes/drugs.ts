import { Router } from "express";
import { db } from "@workspace/db";
import { drugsTable } from "@workspace/db";
import { ilike, or, sql, eq, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { q, limit: rawLimit } = req.query;
    const limit = Math.min(Number(rawLimit) || 50, 500);

    if (q && String(q).trim().length > 0) {
      const search = `%${String(q).trim()}%`;
      const results = await db.select().from(drugsTable)
        .where(or(
          ilike(drugsTable.name, search),
          ilike(drugsTable.genericName, search),
          sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${drugsTable.brandNames}) AS bn WHERE bn ILIKE ${search})`,
          ilike(drugsTable.drugClass, search),
        ))
        .limit(limit);
      res.json(results);
    } else {
      const results = await db.select().from(drugsTable)
        .where(eq(drugsTable.isActive, true))
        .limit(limit);
      res.json(results);
    }
  } catch (err) {
    console.error("Drug search error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to search drugs" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [drug] = await db.select().from(drugsTable).where(eq(drugsTable.id, Number(req.params.id)));
    if (!drug) { res.status(404).json({ error: "not_found" }); return; }
    res.json(drug);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch drug" });
  }
});

async function handleInteractionCheck(req: import("express").Request, res: import("express").Response) {
  try {
    const { drugNames, drugIds } = req.body;

    const hasDrugIds = Array.isArray(drugIds) && drugIds.length >= 2;
    const hasDrugNames = Array.isArray(drugNames) && drugNames.length >= 2;

    if (!hasDrugIds && !hasDrugNames) {
      res.json({ interactions: [] });
      return;
    }

    let allDrugs;
    if (hasDrugIds) {
      allDrugs = await db.select({
        id: drugsTable.id,
        name: drugsTable.name,
        genericName: drugsTable.genericName,
        interactions: drugsTable.interactions,
        contraindications: drugsTable.contraindications,
      }).from(drugsTable)
        .where(inArray(drugsTable.id, drugIds.map(Number)));
    } else {
      const normalizedNames = drugNames.map((n: string) => n.toLowerCase().trim());
      allDrugs = await db.select({
        id: drugsTable.id,
        name: drugsTable.name,
        genericName: drugsTable.genericName,
        interactions: drugsTable.interactions,
        contraindications: drugsTable.contraindications,
      }).from(drugsTable)
        .where(or(
          ...normalizedNames.map((n: string) => ilike(drugsTable.name, n)),
          ...normalizedNames.map((n: string) => ilike(drugsTable.genericName, n)),
        ));
    }

    const foundInteractions: Array<{
      drug1: string;
      drug2: string;
      severity: string;
      message: string;
    }> = [];

    for (const drug of allDrugs) {
      const drugInteractions = (drug.interactions as string[]) || [];
      for (const interactingName of drugInteractions) {
        const interactingLower = interactingName.toLowerCase();
        for (const otherDrug of allDrugs) {
          if (otherDrug.id === drug.id) continue;
          if (
            otherDrug.name.toLowerCase() === interactingLower ||
            otherDrug.genericName.toLowerCase() === interactingLower ||
            otherDrug.name.toLowerCase().includes(interactingLower) ||
            interactingLower.includes(otherDrug.name.toLowerCase())
          ) {
            const key = [drug.name, otherDrug.name].sort().join("|");
            if (!foundInteractions.some(fi => [fi.drug1, fi.drug2].sort().join("|") === key)) {
              foundInteractions.push({
                drug1: drug.name,
                drug2: otherDrug.name,
                severity: "warning",
                message: `${drug.name} has a known interaction with ${otherDrug.name}. Review before prescribing together.`,
              });
            }
          }
        }
      }
    }

    res.json({ interactions: foundInteractions });
  } catch (err) {
    console.error("Interaction check error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to check interactions" });
  }
}

router.post("/check-interactions", requireAuth, handleInteractionCheck);
router.post("/interactions", requireAuth, handleInteractionCheck);

export default router;
