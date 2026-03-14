import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { CheckCircle, Fingerprint, Download, Loader2, ExternalLink } from "lucide-react";

interface AbhaProfile {
  patientId: number;
  abhaNumber: string | null;
  abhaAddress: string | null;
  abhaVerified: boolean;
  abhaLinkedAt: string | null;
  name: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
}

type OtpStep = "idle" | "input" | "otp" | "done";
type AbhaMethod = "aadhaar" | "mobile";

function formatAbha(n: string) {
  const clean = n.replace(/-/g, "");
  return clean.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, "$1-$2-$3-$4");
}

function AbhaCardSvg({ abha, name, dob, gender }: { abha: string; name: string; dob: string; gender: string }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const handleDownload = () => {
    const el = document.getElementById("abha-card-svg");
    if (!el) return;
    const svgData = new XMLSerializer().serializeToString(el);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ABHA-Card-${abha}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <svg id="abha-card-svg" width="340" height="200" viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
          <defs>
            <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
          <rect width="340" height="200" rx="16" fill="url(#cardGrad)" />
          <rect x="0" y="0" width="340" height="200" rx="16" fill="white" fillOpacity="0.05" />
          <circle cx="280" cy="40" r="60" fill="white" fillOpacity="0.06" />
          <circle cx="60" cy="160" r="80" fill="white" fillOpacity="0.04" />
          <text x="20" y="32" fill="white" fontSize="13" fontWeight="bold" fontFamily="system-ui">ABHA</text>
          <text x="20" y="46" fill="white" fillOpacity="0.7" fontSize="8" fontFamily="system-ui">Ayushman Bharat Health Account</text>
          <text x="310" y="32" fill="white" fontSize="8" fontFamily="system-ui" textAnchor="end">Ministry of Health</text>
          <circle cx="44" cy="90" r="24" fill="white" fillOpacity="0.15" />
          <text x="44" y="96" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui" textAnchor="middle">{initials}</text>
          <text x="76" y="78" fill="white" fontSize="13" fontWeight="bold" fontFamily="system-ui">{name}</text>
          <text x="76" y="94" fill="white" fillOpacity="0.75" fontSize="9" fontFamily="system-ui">DOB: {dob} · {gender.charAt(0).toUpperCase() + gender.slice(1)}</text>
          <text x="20" y="135" fill="white" fillOpacity="0.6" fontSize="8" fontFamily="system-ui" letterSpacing="1">ABHA NUMBER</text>
          <text x="20" y="152" fill="white" fontSize="16" fontFamily="monospace" fontWeight="bold" letterSpacing="2">{formatAbha(abha)}</text>
          <rect x="290" y="135" width="36" height="36" rx="4" fill="white" fillOpacity="0.15" />
          <text x="308" y="158" fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle">QR</text>
          <text x="20" y="186" fill="white" fillOpacity="0.5" fontSize="7" fontFamily="system-ui">abdm.gov.in · Valid across all ABDM-connected hospitals</text>
        </svg>
      </div>
      <button onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors">
        <Download className="w-4 h-4" /> Download ABHA Card (SVG)
      </button>
    </div>
  );
}

function AbhaEnrollFlow({ patientId, onDone }: { patientId: number; onDone: () => void }) {
  const [method, setMethod] = useState<AbhaMethod>("aadhaar");
  const [step, setStep] = useState<OtpStep>("idle");
  const [inputVal, setInputVal] = useState("");
  const [otp, setOtp] = useState("");
  const [txnId, setTxnId] = useState("");
  const [result, setResult] = useState<{ abhaNumber: string; abhaAddress: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const sendOtp = async () => {
    if (!inputVal.trim()) { setError("Please enter a value"); return; }
    setLoading(true); setError("");
    try {
      const endpoint = method === "aadhaar" ? "/api/abha/registration/aadhaar/generate-otp" : "/api/abha/registration/mobile/generate-otp";
      const body = method === "aadhaar" ? { aadhaar: inputVal.replace(/\s/g, "") } : { mobile: inputVal };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTxnId(data.txnId);
      setStep("otp");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) { setError("Enter 6-digit OTP"); return; }
    setLoading(true); setError("");
    try {
      const endpoint = method === "aadhaar" ? "/api/abha/registration/aadhaar/verify-otp" : "/api/abha/registration/mobile/verify-otp";
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txnId, otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const linkRes = await fetch(`/api/abha/link/${patientId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abhaNumber: data.abhaNumber, abhaAddress: data.abhaAddress }),
      });
      if (!linkRes.ok) { const ld = await linkRes.json(); throw new Error(ld.message); }
      setResult({ abhaNumber: data.abhaNumber, abhaAddress: data.abhaAddress });
      setStep("done");
      qc.invalidateQueries({ queryKey: ["abha-profile", patientId] });
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  if (step === "done" && result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-700 font-semibold">
          <CheckCircle className="w-5 h-5" /> ABHA Linked Successfully!
        </div>
        <p className="text-sm text-muted-foreground font-mono">{result.abhaNumber}</p>
        <button onClick={onDone} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition">View ABHA Card</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["aadhaar", "mobile"] as AbhaMethod[]).map(m => (
          <button key={m} onClick={() => { setMethod(m); setStep("idle"); setInputVal(""); setOtp(""); setError(""); }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${method === m ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
            {m === "aadhaar" ? "Aadhaar OTP" : "Mobile OTP"}
          </button>
        ))}
      </div>
      {step === "idle" && (
        <div className="space-y-3">
          <input className="w-full px-3 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary"
            placeholder={method === "aadhaar" ? "12-digit Aadhaar" : "+91 Mobile number"}
            value={inputVal} onChange={e => setInputVal(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button onClick={sendOtp} disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send OTP
          </button>
          <p className="text-xs text-center text-muted-foreground">Sandbox: use OTP <strong>123456</strong></p>
        </div>
      )}
      {step === "otp" && (
        <div className="space-y-3">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary">Demo OTP: <strong>123456</strong></div>
          <input className="w-full px-3 py-3 border-2 border-border rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary"
            placeholder="000000" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep("idle")} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition">Back</button>
            <button onClick={verifyOtp} disabled={loading || otp.length < 6}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Verify & Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AbhaStatusBadge({ abhaVerified, abhaNumber }: { abhaVerified?: boolean; abhaNumber?: string | null }) {
  if (abhaVerified && abhaNumber) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
        <CheckCircle className="w-3.5 h-3.5" /> ABHA Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-full border border-border">
      <Fingerprint className="w-3.5 h-3.5" /> ABHA Not Linked
    </span>
  );
}

export function AbhaPanel({ patientId }: { patientId?: number }) {
  const { user } = useAuth();
  const [showEnroll, setShowEnroll] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery<AbhaProfile>({
    queryKey: ["abha-profile", patientId],
    queryFn: () => fetch(`/api/abha/profile/${patientId}`).then(r => r.json()),
    enabled: !!user && !!patientId,
  });

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const linked = profile?.abhaVerified && profile?.abhaNumber;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">ABHA Health ID</h3>
            <p className="text-xs text-muted-foreground">Ayushman Bharat Health Account · Government of India</p>
          </div>
        </div>
        {linked && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>

      <div className="p-5">
        {linked ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ABHA Number</p>
                <p className="font-mono font-bold text-primary text-lg">{formatAbha(profile!.abhaNumber!)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">ABHA Address</p>
                <p className="font-medium text-sm">{profile!.abhaAddress || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Linked On</p>
                <p className="text-sm">{profile?.abhaLinkedAt ? new Date(profile.abhaLinkedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className="text-sm font-semibold text-green-700">Active · Verified</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowCard(c => !c)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition">
                <Download className="w-4 h-4" /> {showCard ? "Hide" : "View"} ABHA Card
              </button>
              <a href="https://abha.abdm.gov.in/abha/v3/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition">
                <ExternalLink className="w-4 h-4" /> ABDM Portal
              </a>
            </div>

            {showCard && profile && (
              <AbhaCardSvg
                abha={profile.abhaNumber!}
                name={profile.name}
                dob={profile.dateOfBirth}
                gender={profile.gender}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!showEnroll ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                  <Fingerprint className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No ABHA Linked</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Link your Ayushman Bharat Health Account to enable universal health record access across all ABDM-connected hospitals in India.
                  </p>
                </div>
                <button onClick={() => setShowEnroll(true)}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition">
                  Enroll ABHA Health ID
                </button>
              </div>
            ) : (
              <AbhaEnrollFlow patientId={patientId!} onDone={() => { setShowEnroll(false); setShowCard(true); qc.invalidateQueries({ queryKey: ["abha-profile", patientId] }); }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
