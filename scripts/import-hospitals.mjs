import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "../attached_assets/hospital_directory_1773413013069.csv");

function parseCsvLine(line) {
  const fields = [];
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
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function clean(val) {
  if (!val || val.trim() === "0" || val.trim() === "" || val.trim() === "N/A") return null;
  return val.trim() || null;
}

function cleanInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) || n === 0 ? null : n;
}

async function main() {
  // Check if already imported
  const { rows: [{ count }] } = await pool.query("SELECT count(*)::int FROM hospitals WHERE source_id IS NOT NULL");
  if (count > 30000) {
    console.log(`Already imported ${count} hospitals. Skipping.`);
    await pool.end();
    return;
  }
  console.log(`Currently have ${count} hospitals, importing remaining...`);

  const client = await pool.connect();

  const rl = createInterface({ input: createReadStream(CSV_PATH), crlfDelay: Infinity });

  let lineNum = 0;
  let imported = 0;
  let skipped = 0;
  const batch = [];

  const flush = async () => {
    if (batch.length === 0) return;
    try {
      const placeholders = batch.map((_, i) => {
        const base = i * 18;
        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14},$${base+15},$${base+16},$${base+17},$${base+18})`;
      }).join(",");
      const values = batch.flatMap(h => [
        h.sourceId, h.name, h.address, h.city, h.state, h.district, h.pincode,
        h.phone, h.email, h.type, h.category, h.careType, h.discipline,
        h.specialties, h.numDoctors, h.bedCount, h.website, h.location
      ]);
      await client.query(
        `INSERT INTO hospitals (source_id, name, address, city, state, district, pincode, phone, email, type, category, care_type, discipline, specialties, num_doctors, bed_count, website, location, is_active)
         SELECT v.source_id, v.name, v.address, v.city, v.state, v.district, v.pincode, v.phone, v.email, v.type, v.category, v.care_type, v.discipline, v.specialties, v.num_doctors::integer, v.bed_count::integer, v.website, v.location, true
         FROM (VALUES ${placeholders}) AS v(source_id, name, address, city, state, district, pincode, phone, email, type, category, care_type, discipline, specialties, num_doctors, bed_count, website, location)
         ON CONFLICT (source_id) DO NOTHING`,
        values
      );
      imported += batch.length;
      if (imported % 5000 === 0) process.stdout.write(`\r  Imported ${imported}...`);
    } catch (e) {
      if (skipped === 0) console.error("First batch error:", e.message);
      skipped += batch.length;
    }
    batch.length = 0;
  };

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue;
    if (!line.trim()) continue;

    const f = parseCsvLine(line);
    if (f.length < 12) continue;

    const name = clean(f[3]);
    if (!name) continue;

    batch.push({
      sourceId: f[0]?.trim() || null,
      location: clean(f[2]),
      name,
      category: clean(f[4]),
      careType: clean(f[5]),
      discipline: clean(f[6]),
      address: clean(f[7]) ?? "Unknown",
      state: clean(f[8]) ?? "Unknown",
      district: clean(f[9]),
      pincode: clean(f[11]),
      phone: clean(f[12]) ?? clean(f[13]),
      email: clean(f[21]),
      website: clean(f[23]),
      specialties: clean(f[24]),
      numDoctors: cleanInt(f[38]),
      bedCount: cleanInt(f[40]),
      type: "general",
      city: clean(f[2]) ?? clean(f[9]) ?? clean(f[8]) ?? "Unknown",
    });

    if (batch.length >= 500) {
      await flush();
    }
  }

  await flush();
  client.release();
  await pool.end();

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}, Total lines: ${lineNum - 1}`);
}

main().catch(err => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
