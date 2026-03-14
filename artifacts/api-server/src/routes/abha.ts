import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { generateToken } from "../lib/auth.js";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

const txnStore = new Map<string, { type: string; data: Record<string, string>; expires: number }>();

function makeTxnId(): string {
  return "TXN" + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function makeAbhaNumber(): string {
  const digits = () => String(Math.floor(Math.random() * 9000) + 1000);
  return `${digits()}-${digits()}-${digits()}-${digits()}`;
}

function makeAbhaAddress(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".") + Math.floor(Math.random() * 900 + 100) + "@abdm";
}

const MOCK_REGISTRY: Record<string, { name: string; gender: string; dob: string; mobile: string }> = {
  "123456789012": { name: "Rajesh Kumar", gender: "male", dob: "1985-04-12", mobile: "9876543210" },
  "234567890123": { name: "Priya Sharma", gender: "female", dob: "1990-07-22", mobile: "9765432109" },
  "345678901234": { name: "Amit Singh", gender: "male", dob: "1978-11-03", mobile: "9654321098" },
};

function mockProfileFromAadhaar(aadhaar: string) {
  return MOCK_REGISTRY[aadhaar] || { name: "Demo Patient", gender: "male", dob: "1990-01-01", mobile: "9000000000" };
}

router.post("/registration/aadhaar/generate-otp", async (req, res) => {
  const { aadhaar } = req.body;
  if (!aadhaar || String(aadhaar).replace(/\s/g, "").length !== 12) {
    res.status(400).json({ error: "invalid_aadhaar", message: "Aadhaar must be 12 digits" });
    return;
  }
  const cleanAadhaar = String(aadhaar).replace(/\s/g, "");
  const txnId = makeTxnId();
  txnStore.set(txnId, {
    type: "aadhaar_reg",
    data: { aadhaar: cleanAadhaar },
    expires: Date.now() + 10 * 60 * 1000,
  });
  res.json({
    txnId,
    message: "OTP sent to Aadhaar-linked mobile number",
    _demo_note: "Use OTP: 123456 (sandbox mode)",
  });
});

router.post("/registration/aadhaar/verify-otp", async (req, res) => {
  const { txnId, otp } = req.body;
  const entry = txnStore.get(txnId);
  if (!entry || entry.type !== "aadhaar_reg" || entry.expires < Date.now()) {
    res.status(422).json({ error: "invalid_txn", message: "Transaction expired or not found. Please start again." });
    return;
  }
  if (String(otp) !== "123456") {
    res.status(422).json({ error: "invalid_otp", message: "Incorrect OTP. Use 123456 in sandbox mode." });
    return;
  }
  const profile = mockProfileFromAadhaar(entry.data.aadhaar);
  const abhaNumber = makeAbhaNumber();
  const abhaAddress = makeAbhaAddress(profile.name);
  const newTxnId = makeTxnId();
  txnStore.set(newTxnId, {
    type: "aadhaar_verified",
    data: { abhaNumber: abhaNumber.replace(/-/g, ""), abhaAddress, ...profile },
    expires: Date.now() + 30 * 60 * 1000,
  });
  res.json({
    txnId: newTxnId,
    abhaNumber,
    abhaAddress,
    profile: {
      name: profile.name,
      gender: profile.gender,
      dateOfBirth: profile.dob,
      mobile: profile.mobile,
    },
    _demo_note: "Sandbox response — real credentials needed for production",
  });
});

router.post("/registration/mobile/generate-otp", async (req, res) => {
  const { mobile } = req.body;
  if (!mobile || String(mobile).replace(/\D/g, "").length < 10) {
    res.status(400).json({ error: "invalid_mobile", message: "Enter a valid 10-digit mobile number" });
    return;
  }
  const cleanMobile = String(mobile).replace(/\D/g, "").slice(-10);
  const txnId = makeTxnId();
  txnStore.set(txnId, {
    type: "mobile_reg",
    data: { mobile: cleanMobile },
    expires: Date.now() + 10 * 60 * 1000,
  });
  res.json({
    txnId,
    message: `OTP sent to +91-${cleanMobile}`,
    _demo_note: "Use OTP: 123456 (sandbox mode)",
  });
});

router.post("/registration/mobile/verify-otp", async (req, res) => {
  const { txnId, otp, name, gender, dateOfBirth } = req.body;
  const entry = txnStore.get(txnId);
  if (!entry || entry.type !== "mobile_reg" || entry.expires < Date.now()) {
    res.status(422).json({ error: "invalid_txn", message: "Transaction expired or not found. Please start again." });
    return;
  }
  if (String(otp) !== "123456") {
    res.status(422).json({ error: "invalid_otp", message: "Incorrect OTP. Use 123456 in sandbox mode." });
    return;
  }
  const resolvedName = name || "ABHA User";
  const abhaNumber = makeAbhaNumber();
  const abhaAddress = makeAbhaAddress(resolvedName);
  res.json({
    abhaNumber,
    abhaAddress,
    profile: {
      name: resolvedName,
      gender: gender || "male",
      dateOfBirth: dateOfBirth || "",
      mobile: entry.data.mobile,
    },
    _demo_note: "Sandbox response — real credentials needed for production",
  });
});

router.post("/auth/init", async (req, res) => {
  const { abhaNumber } = req.body;
  if (!abhaNumber) {
    res.status(400).json({ error: "missing_abha", message: "ABHA number is required" });
    return;
  }
  const txnId = makeTxnId();
  txnStore.set(txnId, {
    type: "abha_login",
    data: { abhaNumber: String(abhaNumber).replace(/-/g, "") },
    expires: Date.now() + 10 * 60 * 1000,
  });
  res.json({
    txnId,
    message: "OTP sent to ABHA-linked mobile",
    _demo_note: "Use OTP: 123456 (sandbox mode)",
  });
});

router.post("/auth/confirm", async (req, res) => {
  const { txnId, otp } = req.body;
  const entry = txnStore.get(txnId);
  if (!entry || entry.type !== "abha_login" || entry.expires < Date.now()) {
    res.status(422).json({ error: "invalid_txn", message: "Transaction expired. Please start again." });
    return;
  }
  if (String(otp) !== "123456") {
    res.status(422).json({ error: "invalid_otp", message: "Incorrect OTP. Use 123456 in sandbox mode." });
    return;
  }
  const cleanAbha = entry.data.abhaNumber;

  const rows = await db.execute(sql`SELECT * FROM patients WHERE REPLACE(abha_number, '-', '') = ${cleanAbha} AND abha_verified = true LIMIT 1`);
  const patient = rows.rows[0] as Record<string, unknown> | undefined;

  if (patient) {
    const userRows = await db.execute(sql`SELECT * FROM users WHERE email = ${patient.email as string} OR phone = ${patient.phone as string} LIMIT 1`);
    const user = userRows.rows[0] as Record<string, unknown> | undefined;
    if (user) {
      const token = generateToken({ id: user.id as number, email: user.email as string, name: user.name as string, role: user.role as string, hospitalId: user.hospital_id as number | null });
      res.json({ token, abhaNumber: entry.data.abhaNumber, name: user.name });
      return;
    }
  }

  const abhaFormatted = cleanAbha.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, "$1-$2-$3-$4");
  const mockUserRows = await db.execute(sql`SELECT * FROM users WHERE role = 'patient' LIMIT 1`);
  const mockUser = mockUserRows.rows[0] as Record<string, unknown> | undefined;
  if (mockUser) {
    const token = generateToken({ id: mockUser.id as number, email: mockUser.email as string, name: mockUser.name as string, role: "patient", hospitalId: null });
    res.json({ token, abhaNumber: abhaFormatted, name: mockUser.name, _demo_note: "Matched first patient user in sandbox" });
    return;
  }

  res.status(404).json({ error: "not_found", message: "No Chikit account linked to this ABHA. Please register first." });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const rows = await db.execute(sql`
      SELECT p.id, p.name, p.date_of_birth, p.gender, p.phone, p.abha_number, p.abha_address, p.abha_verified, p.abha_linked_at
      FROM patients p
      WHERE p.email = ${user.email} OR p.phone = (SELECT phone FROM users WHERE id = ${user.id} LIMIT 1)
      LIMIT 1
    `);
    const patient = rows.rows[0] as Record<string, unknown> | undefined;
    if (!patient) {
      res.json({ patientId: null, abhaNumber: null, abhaAddress: null, abhaVerified: false, abhaLinkedAt: null, name: user.name });
      return;
    }
    res.json({
      patientId: patient.id,
      abhaNumber: patient.abha_number || null,
      abhaAddress: patient.abha_address || null,
      abhaVerified: patient.abha_verified || false,
      abhaLinkedAt: patient.abha_linked_at || null,
      name: patient.name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
    });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch ABHA profile" });
  }
});

router.get("/profile/:patientId", requireAuth, async (req, res) => {
  try {
    const rows = await db.execute(sql`SELECT id, name, date_of_birth, gender, phone, abha_number, abha_address, abha_verified, abha_linked_at FROM patients WHERE id = ${Number(req.params.patientId)}`);
    const patient = rows.rows[0] as Record<string, unknown> | undefined;
    if (!patient) {
      res.status(404).json({ error: "not_found", message: "Patient not found" });
      return;
    }
    res.json({
      patientId: patient.id,
      abhaNumber: patient.abha_number || null,
      abhaAddress: patient.abha_address || null,
      abhaVerified: patient.abha_verified || false,
      abhaLinkedAt: patient.abha_linked_at || null,
      name: patient.name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
    });
  } catch {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch ABHA profile" });
  }
});

router.post("/link/:patientId", requireAuth, async (req, res) => {
  try {
    const { abhaNumber, abhaAddress } = req.body;
    if (!abhaNumber) {
      res.status(400).json({ error: "missing_abha", message: "ABHA number is required" });
      return;
    }
    const cleanAbha = String(abhaNumber).replace(/-/g, "");
    const formatted = cleanAbha.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, "$1-$2-$3-$4");
    await db.execute(sql`
      UPDATE patients
      SET abha_number = ${formatted},
          abha_address = ${abhaAddress || null},
          abha_verified = true,
          abha_linked_at = NOW()
      WHERE id = ${Number(req.params.patientId)}
    `);
    const rows = await db.execute(sql`SELECT * FROM patients WHERE id = ${Number(req.params.patientId)}`);
    res.json({ success: true, patient: rows.rows[0] });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "duplicate_abha", message: "This ABHA number is already linked to another patient" });
      return;
    }
    res.status(500).json({ error: "internal_error", message: "Failed to link ABHA" });
  }
});

export default router;
