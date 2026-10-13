import { Router } from "express";
import { db } from "@workspace/db";
import { hospitalsTable } from "@workspace/db";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { createAuditLog } from "../lib/audit.js";
import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

const router = Router();

// Parse a CSV line properly (handling quoted fields)
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function clean(val: string): string | null {
  if (!val || val === "0" || val === "N/A" || val.trim() === "") return null;
  return val.trim();
}

function cleanInt(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) || n === 0 ? null : n;
}

// GET /api/hospitals — searchable, filterable, paginated
router.get("/", requireAuth, async (req, res) => {
  try {
    const { search, state, district, type, category, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * pageSize;

    const conditions: any[] = [eq(hospitalsTable.isActive, true)];

    if (search) {
      conditions.push(
        or(
          ilike(hospitalsTable.name, `%${search}%`),
          ilike(hospitalsTable.city, `%${search}%`),
          ilike(hospitalsTable.district, `%${search}%`),
          ilike(hospitalsTable.location, `%${search}%`)
        )
      );
    }
    if (state) conditions.push(ilike(hospitalsTable.state, `%${state}%`));
    if (district) conditions.push(ilike(hospitalsTable.district, `%${district}%`));
    if (type) conditions.push(eq(hospitalsTable.type, type));
    if (category) conditions.push(ilike(hospitalsTable.category, `%${category}%`));

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [countResult, hospitals] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(hospitalsTable).where(whereClause),
      db.select().from(hospitalsTable).where(whereClause).limit(pageSize).offset(offset),
    ]);

    res.json({ hospitals, total: countResult[0]?.count ?? 0, page: pageNum, limit: pageSize });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch hospitals" });
  }
});

// GET /api/hospitals/states — get all unique states
router.get("/states", requireAuth, async (_req, res) => {
  try {
    const results = await db
      .selectDistinct({ state: hospitalsTable.state })
      .from(hospitalsTable)
      .where(eq(hospitalsTable.isActive, true))
      .orderBy(hospitalsTable.state);
    res.json(results.map((r) => r.state).filter(Boolean));
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch states" });
  }
});

// POST /api/hospitals — create single hospital
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, address, city, state, phone, email, type, bedCount } = req.body;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'hospital';
    const [hospital] = await db.insert(hospitalsTable).values({ name, address, city, state, phone, email, type, bedCount, slug }).returning();
    await createAuditLog(req, "create", "hospital", hospital.id);
    res.status(201).json(hospital);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to create hospital" });
  }
});

// POST /api/hospitals/import — bulk import from CSV
router.post("/import", requireAuth, async (req, res) => {
  try {
    const csvPath = path.join(process.cwd(), "../../attached_assets/hospital_directory_1773413013069.csv");

    if (!fs.existsSync(csvPath)) {
      res.status(404).json({ error: "not_found", message: `CSV file not found at ${csvPath}` });
      return;
    }

    // Check how many already imported
    const [existing] = await db.select({ count: sql<number>`count(*)::int` }).from(hospitalsTable).where(sql`source_id IS NOT NULL`);
    if ((existing?.count ?? 0) > 100) {
      res.json({ message: "Import already completed", imported: existing?.count, skipped: 0 });
      return;
    }

    const rl = readline.createInterface({
      input: fs.createReadStream(csvPath),
      crlfDelay: Infinity,
    });

    let lineNum = 0;
    let imported = 0;
    let skipped = 0;
    const batch: any[] = [];

    const flush = async () => {
      if (batch.length === 0) return;
      try {
        await db.insert(hospitalsTable).values(batch).onConflictDoNothing();
        imported += batch.length;
      } catch (e) {
        skipped += batch.length;
      }
      batch.length = 0;
    };

    await new Promise<void>((resolve, reject) => {
      rl.on("line", async (line) => {
        lineNum++;
        if (lineNum === 1) return; // header
        if (!line.trim()) return;

        const fields = parseCsvLine(line);
        if (fields.length < 12) return;

        const sourceId = fields[0];
        const location = clean(fields[2]);
        const name = clean(fields[3]);
        const category = clean(fields[4]);
        const careType = clean(fields[5]);
        const discipline = clean(fields[6]);
        const address = clean(fields[7]) ?? "Unknown";
        const state = clean(fields[8]) ?? "Unknown";
        const district = clean(fields[9]);
        const pincode = clean(fields[11]);
        const phone = clean(fields[12]) ?? clean(fields[13]);
        const email = clean(fields[21]);
        const website = clean(fields[23]);
        const specialties = clean(fields[24]);
        const facilities = clean(fields[25]);
        const numDoctors = cleanInt(fields[38]);
        const bedCount = cleanInt(fields[40]);

        if (!name) return;

        batch.push({
          sourceId,
          name,
          address,
          city: location ?? district ?? state,
          state,
          district,
          pincode,
          phone,
          email,
          type: "general",
          category,
          careType,
          discipline,
          specialties,
          facilities,
          numDoctors,
          bedCount,
          website,
          location,
          isActive: true,
        });

        if (batch.length >= 500) {
          rl.pause();
          await flush();
          rl.resume();
        }
      });

      rl.on("close", async () => {
        await flush();
        resolve();
      });

      rl.on("error", reject);
    });

    res.json({ message: "Import completed", imported, skipped, total: lineNum - 1 });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err.message || "Import failed" });
  }
});

// GET /api/hospitals/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, Number(req.params.id)));
    if (!hospital) { res.status(404).json({ error: "not_found", message: "Hospital not found" }); return; }
    res.json(hospital);
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch hospital" });
  }
});

export default router;
