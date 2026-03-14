import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { UserPlus, CreditCard, Heart, Phone, CheckCircle, Copy, ShieldCheck, ChevronDown, ChevronUp, Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const API_BASE = "/api";

interface NewPatient {
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies: string;
  chronicConditions: string;
  govtIdType: string;
  govtIdNumber: string;
}

const GOVT_ID_TYPES = ["Aadhaar", "PAN", "Passport", "Voter ID", "Driving License", "ABHA / Health ID"];

type AbhaStep = "idle" | "input" | "otp" | "verified";
type AbhaMethod = "aadhaar" | "mobile";

interface AbhaState {
  method: AbhaMethod;
  step: AbhaStep;
  inputValue: string;
  otp: string;
  txnId: string;
  abhaNumber: string;
  abhaAddress: string;
  profile: { name: string; gender: string; dateOfBirth: string; mobile: string } | null;
  loading: boolean;
  error: string;
}

function AbhaWizard({ onVerified }: { onVerified: (data: { abhaNumber: string; abhaAddress: string; profile: AbhaState["profile"] }) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AbhaState>({
    method: "aadhaar",
    step: "idle",
    inputValue: "",
    otp: "",
    txnId: "",
    abhaNumber: "",
    abhaAddress: "",
    profile: null,
    loading: false,
    error: "",
  });

  const set = (patch: Partial<AbhaState>) => setState(s => ({ ...s, ...patch }));

  const sendOtp = async () => {
    if (!state.inputValue.trim()) { set({ error: "Please enter a valid " + (state.method === "aadhaar" ? "12-digit Aadhaar" : "mobile number") }); return; }
    set({ loading: true, error: "" });
    try {
      const endpoint = state.method === "aadhaar"
        ? "/api/abha/registration/aadhaar/generate-otp"
        : "/api/abha/registration/mobile/generate-otp";
      const body = state.method === "aadhaar"
        ? { aadhaar: state.inputValue.replace(/\s/g, "") }
        : { mobile: state.inputValue };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      set({ txnId: data.txnId, step: "otp" });
      toast({ title: "OTP Sent", description: "Use 123456 as the OTP (sandbox mode)" });
    } catch (err: any) {
      set({ error: err.message || "Failed to send OTP" });
    } finally {
      set({ loading: false });
    }
  };

  const verifyOtp = async () => {
    if (state.otp.length < 6) { set({ error: "Enter the 6-digit OTP" }); return; }
    set({ loading: true, error: "" });
    try {
      const endpoint = state.method === "aadhaar"
        ? "/api/abha/registration/aadhaar/verify-otp"
        : "/api/abha/registration/mobile/verify-otp";
      const body = state.method === "aadhaar"
        ? { txnId: state.txnId, otp: state.otp }
        : { txnId: state.txnId, otp: state.otp };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      set({ step: "verified", abhaNumber: data.abhaNumber, abhaAddress: data.abhaAddress, profile: data.profile });
      onVerified({ abhaNumber: data.abhaNumber, abhaAddress: data.abhaAddress, profile: data.profile });
      toast({ title: "ABHA Verified!", description: `ABHA ID: ${data.abhaNumber}`, });
    } catch (err: any) {
      set({ error: err.message || "OTP verification failed" });
    } finally {
      set({ loading: false });
    }
  };

  const reset = () => setState({ method: "aadhaar", step: "idle", inputValue: "", otp: "", txnId: "", abhaNumber: "", abhaAddress: "", profile: null, loading: false, error: "" });

  return (
    <Card className={open ? "border-primary/40 bg-primary/2" : ""}>
      <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
        <CardTitle className="text-base flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary" />
            ABHA Health ID Enrollment
            <Badge variant="secondary" className="text-xs">Optional · Gov. Recommended</Badge>
            {state.step === "verified" && (
              <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {state.step === "verified" ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">ABHA Successfully Linked</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">ABHA Number</p>
                  <p className="font-mono font-bold text-primary">{state.abhaNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ABHA Address</p>
                  <p className="font-medium">{state.abhaAddress}</p>
                </div>
                {state.profile && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Name (from ABHA)</p>
                      <p className="font-medium">{state.profile.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mobile</p>
                      <p className="font-medium">{state.profile.mobile}</p>
                    </div>
                  </>
                )}
              </div>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-primary underline mt-2">Link a different ABHA</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                ABHA (Ayushman Bharat Health Account) is India's national health ID. Linking it enables universal health record access across all ABDM-connected hospitals.
              </p>

              <div className="flex gap-2">
                {(["aadhaar", "mobile"] as AbhaMethod[]).map(m => (
                  <button key={m} onClick={() => { set({ method: m, step: "idle", inputValue: "", otp: "", error: "" }); }}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${state.method === m ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {m === "aadhaar" ? "Via Aadhaar OTP" : "Via Mobile OTP"}
                  </button>
                ))}
              </div>

              {state.step === "idle" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>{state.method === "aadhaar" ? "Aadhaar Number (12 digits)" : "Mobile Number"}</Label>
                    <Input
                      placeholder={state.method === "aadhaar" ? "1234 5678 9012" : "+91 98765 43210"}
                      value={state.inputValue}
                      onChange={e => set({ inputValue: e.target.value })}
                      maxLength={state.method === "aadhaar" ? 14 : 13}
                    />
                  </div>
                  {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                  <Button type="button" onClick={sendOtp} disabled={state.loading} className="w-full">
                    {state.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send OTP
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Sandbox mode — use OTP: <strong>123456</strong></p>
                </div>
              )}

              {state.step === "otp" && (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary font-medium">
                    OTP sent to {state.method === "aadhaar" ? "Aadhaar-linked mobile" : state.inputValue} · <strong>Demo OTP: 123456</strong>
                  </div>
                  <div className="space-y-1">
                    <Label>Enter 6-digit OTP</Label>
                    <Input
                      placeholder="123456"
                      value={state.otp}
                      onChange={e => set({ otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      maxLength={6}
                      className="text-center text-2xl font-mono tracking-[0.5em]"
                    />
                  </div>
                  {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => set({ step: "idle", otp: "", error: "" })} className="flex-1">Back</Button>
                    <Button type="button" onClick={verifyOtp} disabled={state.loading || state.otp.length < 6} className="flex-1">
                      {state.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Verify & Link
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function RegisterPatient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [form, setForm] = useState<NewPatient>({
    name: "", dateOfBirth: "", gender: "", bloodGroup: "", phone: "", email: "",
    address: "", emergencyContact: "", emergencyPhone: "", allergies: "",
    chronicConditions: "", govtIdType: "", govtIdNumber: "",
  });
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdPatient, setCreatedPatient] = useState<any>(null);
  const [abhaData, setAbhaData] = useState<{ abhaNumber: string; abhaAddress: string; profile: any } | null>(null);

  const set = (field: keyof NewPatient) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleAbhaVerified = (data: { abhaNumber: string; abhaAddress: string; profile: any }) => {
    setAbhaData(data);
    if (data.profile) {
      setForm(f => ({
        ...f,
        name: f.name || data.profile.name || f.name,
        dateOfBirth: f.dateOfBirth || data.profile.dateOfBirth || f.dateOfBirth,
        gender: f.gender || data.profile.gender || f.gender,
        phone: f.phone || data.profile.mobile || f.phone,
      }));
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (data: NewPatient & { abhaNumber?: string; abhaAddress?: string }) => {
      const res = await fetch(`${API_BASE}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: async (patient) => {
      if (abhaData) {
        try {
          await fetch(`${API_BASE}/abha/link/${patient.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ abhaNumber: abhaData.abhaNumber, abhaAddress: abhaData.abhaAddress }),
          });
        } catch {}
      }
      setCreatedPatient({ ...patient, abhaNumber: abhaData?.abhaNumber });
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dateOfBirth || !form.gender || !form.phone) {
      toast({ title: "Required fields missing", description: "Please fill in name, date of birth, gender, and phone.", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ ...form, abhaNumber: abhaData?.abhaNumber, abhaAddress: abhaData?.abhaAddress });
  };

  const copyId = () => {
    navigator.clipboard.writeText(createdPatient?.chikitHealthId ?? "");
    toast({ title: "Copied!", description: "Chikit Health ID copied to clipboard." });
  };

  if (step === "success" && createdPatient) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Patient Registered!</h2>
              <p className="text-muted-foreground">A unique Chikit Health ID has been generated</p>
            </div>

            <div className="bg-white rounded-xl border-2 border-primary/30 p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Chikit Health ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold font-mono text-primary tracking-widest">
                    {createdPatient.chikitHealthId}
                  </span>
                  <Button variant="ghost" size="icon" onClick={copyId}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {createdPatient.abhaNumber && (
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ABHA Health ID</p>
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="font-mono font-bold text-green-700">{createdPatient.abhaNumber}</span>
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Verified</Badge>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm text-left">
                <div>
                  <p className="text-muted-foreground text-xs">Patient Name</p>
                  <p className="font-medium">{createdPatient.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Patient Code</p>
                  <p className="font-medium font-mono">{createdPatient.patientCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{createdPatient.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Blood Group</p>
                  <p className="font-medium">{createdPatient.bloodGroup || "—"}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Please note down the Chikit Health ID. The patient can use this ID to access their records across any Chikit-enabled hospital.
            </p>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(`/patients/${createdPatient.id}`)}>
                View Patient Record
              </Button>
              <Button onClick={() => { setStep("form"); setAbhaData(null); setForm({ name: "", dateOfBirth: "", gender: "", bloodGroup: "", phone: "", email: "", address: "", emergencyContact: "", emergencyPhone: "", allergies: "", chronicConditions: "", govtIdType: "", govtIdNumber: "" }); }}>
                Register Another Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Register New Patient</h1>
          <p className="text-muted-foreground text-sm">A Chikit Health ID will be automatically generated</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="Enter full name" value={form.name} onChange={set("name")} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
              <Input id="dob" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
            </div>
            <div className="space-y-1">
              <Label>Gender <span className="text-red-500">*</span></Label>
              <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Blood Group</Label>
              <Select value={form.bloodGroup} onValueChange={(v) => setForm((f) => ({ ...f, bloodGroup: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Mobile Number <span className="text-red-500">*</span></Label>
              <Input id="phone" placeholder="+91 99999 99999" value={form.phone} onChange={set("phone")} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="patient@email.com" value={form.email} onChange={set("email")} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Full address" value={form.address} onChange={set("address")} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* ABHA Enrollment */}
        <AbhaWizard onVerified={handleAbhaVerified} />

        {/* Government ID */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Government Identity Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>ID Type</Label>
              <Select value={form.govtIdType} onValueChange={(v) => setForm((f) => ({ ...f, govtIdType: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {GOVT_ID_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="govtId">ID Number</Label>
              <Input id="govtId" placeholder="Enter ID number" value={form.govtIdNumber} onChange={set("govtIdNumber")} />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="ec">Contact Name</Label>
              <Input id="ec" placeholder="Emergency contact name" value={form.emergencyContact} onChange={set("emergencyContact")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep">Contact Phone</Label>
              <Input id="ep" placeholder="Emergency contact phone" value={form.emergencyPhone} onChange={set("emergencyPhone")} />
            </div>
          </CardContent>
        </Card>

        {/* Medical Background */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Medical Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea id="allergies" placeholder="List any known allergies (e.g., Penicillin, Sulfa drugs)" value={form.allergies} onChange={set("allergies")} rows={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chronic">Chronic Conditions</Label>
              <Textarea id="chronic" placeholder="List any chronic conditions (e.g., Diabetes, Hypertension)" value={form.chronicConditions} onChange={set("chronicConditions")} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/patients")}>Cancel</Button>
          <Button type="submit" disabled={registerMutation.isPending}>
            <UserPlus className="w-4 h-4 mr-2" />
            {registerMutation.isPending ? "Registering..." : "Register Patient"}
          </Button>
        </div>
      </form>
    </div>
  );
}
