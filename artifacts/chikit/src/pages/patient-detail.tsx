import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetPatientTimeline } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import {
  User, Calendar, Activity, Pill, BrainCircuit, FileText, Loader2,
  Thermometer, HeartPulse, ShieldAlert, Plus, Trash2, TestTube, ScanLine, Save, AlertTriangle, Search, X
} from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

interface DrugEntry { name: string; dosage: string; frequency: string; duration: string; instructions: string; }
const defaultDrug = (): DrugEntry => ({ name: "", dosage: "", frequency: "twice daily", instructions: "", duration: "5 days" });

interface DrugResult {
  id: number; name: string; genericName: string; strength: string | null;
  brandNames: string[]; drugClass: string; interactions: string[];
}
interface InteractionAlert { drug1: string; drug2: string; severity: string; message: string; }

function DrugSearchInput({ value, onChange, onSelectDrug, index }: {
  value: string; onChange: (val: string) => void;
  onSelectDrug: (drug: DrugResult) => void; index: number;
}) {
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: results = [] } = useQuery<DrugResult[]>({
    queryKey: ["drug-search", searchText],
    queryFn: () => fetch(`/api/drugs?q=${encodeURIComponent(searchText)}&limit=10`).then(r => r.json()),
    enabled: !!user && searchText.length >= 2,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative col-span-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={value || searchText}
          onChange={e => {
            const v = e.target.value;
            if (value) { onChange(""); }
            setSearchText(v);
            setShowDropdown(v.length >= 2);
          }}
          onFocus={() => { if (searchText.length >= 2) setShowDropdown(true); }}
          placeholder="Search drug…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {value && (
          <button onClick={() => { onChange(""); setSearchText(""); }} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {results.map(drug => (
            <button key={drug.id} type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2 text-sm"
              onClick={() => {
                onSelectDrug(drug);
                setSearchText("");
                setShowDropdown(false);
              }}>
              <Pill className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{drug.name}</p>
                <p className="text-xs text-muted-foreground truncate">{drug.genericName} {drug.strength ? `• ${drug.strength}` : ""}</p>
              </div>
              {drug.interactions.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full shrink-0">{drug.interactions.length} int.</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const patientId = Number(params?.id);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: timeline, isLoading } = useGetPatientTimeline(patientId, { query: { enabled: !!patientId } });
  const [activeTab, setActiveTab] = useState("overview");

  const [visitForm, setVisitForm] = useState({
    chiefComplaint: "", diagnosis: "", treatmentPlan: "", notes: "", followUpDate: "",
    bp: "", heartRate: "", temperature: "", spo2: "",
  });
  const [drugs, setDrugs] = useState<DrugEntry[]>([defaultDrug()]);
  const [testOrder, setTestOrder] = useState({ testName: "", type: "lab", indication: "" });
  const [rxInteractions, setRxInteractions] = useState<InteractionAlert[]>([]);
  const [dismissedAllergyAlert, setDismissedAllergyAlert] = useState(false);
  const [dismissedInteractionAlert, setDismissedInteractionAlert] = useState(false);

  const [savingVisit, setSavingVisit] = useState(false);
  const [visitSaved, setVisitSaved] = useState(false);

  const addDrug = () => setDrugs(d => [...d, defaultDrug()]);
  const removeDrug = (i: number) => {
    setDrugs(d => d.filter((_, idx) => idx !== i));
    checkInteractions(drugs.filter((_, idx) => idx !== i));
  };
  const updateDrug = (i: number, field: keyof DrugEntry, val: string) =>
    setDrugs(d => d.map((drug, idx) => idx === i ? { ...drug, [field]: val } : drug));

  const checkInteractions = async (currentDrugs: DrugEntry[]) => {
    const names = currentDrugs.filter(d => d.name).map(d => d.name);
    const existingRxNames = (timeline?.prescriptions || [])
      .filter((rx: Record<string, unknown>) => rx.status === "active")
      .flatMap((rx: Record<string, unknown>) => ((rx.medications as Array<{name: string}>) || []).map(m => m.name))
      .filter(Boolean);
    const allNames = [...new Set([...names, ...existingRxNames])];
    if (allNames.length < 2) { setRxInteractions([]); return; }
    try {
      const res = await fetch("/api/drugs/check-interactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugNames: allNames }),
      });
      const data = await res.json();
      setRxInteractions(data.interactions || []);
    } catch { setRxInteractions([]); }
  };

  const handleSelectDrug = (i: number, drug: DrugResult) => {
    const updated = drugs.map((d, idx) => idx === i ? {
      ...d, name: drug.name,
      dosage: drug.strength || d.dosage,
    } : d);
    setDrugs(updated);
    checkInteractions(updated);
  };

  const { data: overviewInteractions = [] } = useQuery<InteractionAlert[]>({
    queryKey: ["patient-interactions", patientId],
    queryFn: async () => {
      if (!timeline?.prescriptions) return [];
      const activeRx = timeline.prescriptions.filter((rx: Record<string, unknown>) => rx.status === "active");
      const allMedNames = activeRx
        .flatMap((rx: Record<string, unknown>) => ((rx.medications as Array<{name: string}>) || []).map(m => m.name))
        .filter(Boolean);
      if (allMedNames.length < 2) return [];
      const res = await fetch("/api/drugs/check-interactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugNames: [...new Set(allMedNames)] }),
      });
      const data = await res.json();
      return data.interactions || [];
    },
    enabled: !!timeline?.prescriptions && activeTab === "overview",
  });

  const visitMutation = useMutation({
    mutationFn: () => {
      const vitalSigns: Record<string, unknown> = {};
      if (visitForm.bp) vitalSigns.bloodPressure = visitForm.bp;
      if (visitForm.heartRate) vitalSigns.heartRate = Number(visitForm.heartRate);
      if (visitForm.temperature) vitalSigns.temperature = Number(visitForm.temperature);
      if (visitForm.spo2) vitalSigns.spo2 = Number(visitForm.spo2);
      return fetch("/api/medical-records", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId, doctorId: user?.id ?? null, hospitalId: user?.hospitalId ?? null,
          chiefComplaint: visitForm.chiefComplaint, diagnosis: visitForm.diagnosis,
          treatmentPlan: visitForm.treatmentPlan, notes: visitForm.notes,
          followUpDate: visitForm.followUpDate || null, vitalSigns,
        }),
      }).then(r => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-timeline", patientId] });
      setVisitSaved(true);
      setTimeout(() => setVisitSaved(false), 3000);
    },
  });

  const rxMutation = useMutation({
    mutationFn: () => fetch("/api/prescriptions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId, doctorId: user?.id ?? null, hospitalId: user?.hospitalId ?? null,
        diagnosis: visitForm.diagnosis, medications: drugs.filter(d => d.name),
        instructions: visitForm.notes,
      }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-timeline", patientId] });
      setDrugs([defaultDrug()]);
      setRxInteractions([]);
    },
  });

  const orderTestMutation = useMutation({
    mutationFn: () => {
      const url = testOrder.type === "lab" ? "/api/lab-reports" : "/api/radiology-reports";
      const body = testOrder.type === "lab"
        ? { patientId, doctorId: user?.id ?? null, hospitalId: user?.hospitalId ?? null, testName: testOrder.testName, testDate: new Date().toISOString(), interpretation: testOrder.indication }
        : { patientId, doctorId: user?.id ?? null, hospitalId: user?.hospitalId ?? null, imagingType: testOrder.testName, studyDate: new Date().toISOString(), radiologistNotes: testOrder.indication };
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
    },
    onSuccess: () => setTestOrder({ testName: "", type: "lab", indication: "" }),
  });

  const isDoctor = user?.role === "doctor" || user?.role === "nurse" || user?.role === "admin";

  const allTabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "records", label: "Medical Records", icon: Activity },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
    ...(isDoctor ? [{ id: "consultation", label: "Consultation", icon: FileText }] : []),
    { id: "ai", label: "AI Analysis", icon: BrainCircuit },
  ];

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!timeline) return <div>Patient not found</div>;

  const { patient, medicalRecords, prescriptions, aiAnalyses } = timeline;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-display text-3xl font-bold shadow-lg shadow-primary/20">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">{patient.name}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {patient.patientCode}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(patient.dateOfBirth), "MMM d, yyyy")}</span>
              <span className="capitalize border-l pl-3 border-border">{patient.gender}</span>
              <span className="border-l pl-3 border-border">{patient.bloodGroup || "Blood Type Unrecorded"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {isDoctor && (
            <button onClick={() => setActiveTab("consultation")}
              className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary/90 transition">
              Start Consultation
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl w-max">
        {allTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={clsx("flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all",
              activeTab === tab.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-card/50")}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {(() => {
                const allergyText = (patient.allergies || "").toLowerCase();
                const activeRxMeds = (prescriptions || [])
                  .filter((rx: Record<string, unknown>) => rx.status === "active")
                  .flatMap((rx: Record<string, unknown>) => ((rx.medications as Array<{name: string}>) || []).map(m => m.name));
                const allergyConflicts = allergyText
                  ? activeRxMeds.filter(med => {
                      const medLower = med.toLowerCase();
                      return allergyText.includes(medLower) || allergyText.split(/[,;/]+/).some(a => {
                        const trimmed = a.trim();
                        return trimmed && (medLower.includes(trimmed) || trimmed.includes(medLower));
                      });
                    })
                  : [];
                return allergyConflicts.length > 0 && !dismissedAllergyAlert ? (
                  <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-5 relative">
                    <button onClick={() => setDismissedAllergyAlert(true)} className="absolute top-3 right-3 p-1.5 hover:bg-red-200 rounded-lg transition" title="Dismiss alert">
                      <X className="w-4 h-4 text-red-700" />
                    </button>
                    <h3 className="font-display font-bold text-lg text-red-800 flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-5 h-5" /> Drug Allergy Alert
                    </h3>
                    <div className="space-y-2">
                      {allergyConflicts.map((med, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-red-800">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>Patient has a recorded allergy that may conflict with active medication: <b>{med}</b></span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {overviewInteractions.length > 0 && !dismissedInteractionAlert && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 relative">
                  <button onClick={() => setDismissedInteractionAlert(true)} className="absolute top-3 right-3 p-1.5 hover:bg-red-100 rounded-lg transition" title="Dismiss alert">
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                  <h3 className="font-display font-bold text-lg text-red-700 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5" /> Drug Interaction Alerts
                  </h3>
                  <div className="space-y-2">
                    {overviewInteractions.map((ia, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                        <span><b>{ia.drug1}</b> ↔ <b>{ia.drug2}</b> — {ia.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{patient.phone || "-"}</p></div>
                  <div><p className="text-muted-foreground">Email</p><p className="font-medium">{patient.email || "-"}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Address</p><p className="font-medium">{patient.address || "-"}</p></div>
                  <div><p className="text-muted-foreground">Emergency Contact</p><p className="font-medium">{patient.emergencyContact || "-"}</p></div>
                  <div><p className="text-muted-foreground">Emergency Phone</p><p className="font-medium">{patient.emergencyPhone || "-"}</p></div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4 text-destructive flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Medical Alerts</h3>
                <div className="space-y-4">
                  <div><p className="text-sm font-semibold text-muted-foreground mb-1">Allergies</p><p>{patient.allergies || "None recorded"}</p></div>
                  <div><p className="text-sm font-semibold text-muted-foreground mb-1">Chronic Conditions</p><p>{patient.chronicConditions || "None recorded"}</p></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-accent/10 to-primary/5 rounded-2xl p-6 border border-accent/20">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-accent" /> Latest AI Summary</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {aiAnalyses.find(a => a.analysisType === "patient_summary")?.summary || "No AI summary generated. Click \"AI Analysis\" tab to generate one."}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "records" && (
          <div className="space-y-4">
            {medicalRecords.length === 0 ? (
              <p className="text-muted-foreground p-8 text-center bg-card rounded-2xl border border-dashed">No medical records found.</p>
            ) : medicalRecords.map(record => (
              <div key={record.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">{record.chiefComplaint}</h4>
                    <p className="text-sm text-muted-foreground">{format(new Date(record.visitDate), "MMMM d, yyyy")} • Dr. {record.doctorName}</p>
                  </div>
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full">Record #{record.id}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div><p className="text-sm font-semibold text-muted-foreground mb-1">Diagnosis</p><p>{record.diagnosis || "Pending"}</p></div>
                  <div><p className="text-sm font-semibold text-muted-foreground mb-1">Treatment Plan</p><p>{record.treatmentPlan || "None"}</p></div>
                </div>
                {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4">
                    {(record.vitalSigns as Record<string, unknown>).bloodPressure && <span className="flex items-center gap-1.5 text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium"><HeartPulse className="w-4 h-4" /> {String((record.vitalSigns as Record<string, unknown>).bloodPressure)}</span>}
                    {(record.vitalSigns as Record<string, unknown>).temperature && <span className="flex items-center gap-1.5 text-sm bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg font-medium"><Thermometer className="w-4 h-4" /> {String((record.vitalSigns as Record<string, unknown>).temperature)}°C</span>}
                    {(record.vitalSigns as Record<string, unknown>).heartRate && <span className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium"><Activity className="w-4 h-4" /> {String((record.vitalSigns as Record<string, unknown>).heartRate)} bpm</span>}
                    {(record.vitalSigns as Record<string, unknown>).spo2 && <span className="flex items-center gap-1.5 text-sm bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg font-medium">SpO₂ {String((record.vitalSigns as Record<string, unknown>).spo2)}%</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? <p className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-dashed">No prescriptions</p> :
              prescriptions.map(rx => (
                <div key={rx.id} className="bg-card p-6 rounded-2xl border shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold">{rx.diagnosis || "Prescription"}</h4>
                      <p className="text-sm text-muted-foreground">{format(new Date(rx.prescriptionDate), "PPP")}</p>
                    </div>
                    <span className={clsx("px-2.5 py-1 text-xs font-bold rounded-full", rx.status === "active" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700")}>{rx.status}</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {rx.medications.map((m, i) => (
                      <li key={i} className="flex gap-3 text-sm bg-muted/30 px-3 py-2 rounded-xl">
                        <Pill className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span><b>{m.name}</b> — {m.dosage}, {m.frequency} for {m.duration}{m.instructions && ` (${m.instructions})`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === "consultation" && isDoctor && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
                <h3 className="font-display font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Visit Notes</h3>
                {visitSaved && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Saved!</span>}
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Chief Complaint</label>
                    <input value={visitForm.chiefComplaint} onChange={e => setVisitForm(f => ({ ...f, chiefComplaint: e.target.value }))}
                      placeholder="e.g. Fever and cough for 3 days"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Diagnosis</label>
                    <input value={visitForm.diagnosis} onChange={e => setVisitForm(f => ({ ...f, diagnosis: e.target.value }))}
                      placeholder="e.g. Upper Respiratory Tract Infection"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Vital Signs</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "BP (mmHg)", field: "bp" as const, placeholder: "120/80", icon: HeartPulse },
                      { label: "Heart Rate (bpm)", field: "heartRate" as const, placeholder: "72", icon: Activity },
                      { label: "Temp (°C)", field: "temperature" as const, placeholder: "37.2", icon: Thermometer },
                      { label: "SpO₂ (%)", field: "spo2" as const, placeholder: "98", icon: Activity },
                    ].map(({ label, field, placeholder, icon: Icon }) => (
                      <div key={field}>
                        <label className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><Icon className="w-3 h-3" /> {label}</label>
                        <input value={visitForm[field]} onChange={e => setVisitForm(f => ({ ...f, [field]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Treatment Plan</label>
                    <textarea value={visitForm.treatmentPlan} onChange={e => setVisitForm(f => ({ ...f, treatmentPlan: e.target.value }))}
                      placeholder="Treatment details and instructions…" rows={3}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes</label>
                    <textarea value={visitForm.notes} onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Additional clinical notes…" rows={3}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Follow-up Date</label>
                    <input type="date" value={visitForm.followUpDate} onChange={e => setVisitForm(f => ({ ...f, followUpDate: e.target.value }))}
                      className="px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <button onClick={() => visitMutation.mutate()} disabled={visitMutation.isPending || !visitForm.chiefComplaint}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50">
                    {visitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Visit Notes
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
                <h3 className="font-display font-bold text-lg flex items-center gap-2"><Pill className="w-5 h-5 text-accent" /> Write Prescription</h3>
                <button onClick={addDrug} className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  <Plus className="w-4 h-4" /> Add Drug
                </button>
              </div>
              <div className="p-5 space-y-3">
                {rxInteractions.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5 mb-2">
                    <p className="text-sm font-bold text-red-700 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Drug Interaction Warning</p>
                    {rxInteractions.map((ia, i) => (
                      <p key={i} className="text-xs text-red-600 pl-5.5">
                        <b>{ia.drug1}</b> ↔ <b>{ia.drug2}</b>: {ia.message}
                      </p>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1 mb-1">
                  <div className="col-span-3">Drug Name</div>
                  <div className="col-span-2">Dosage</div>
                  <div className="col-span-2">Frequency</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">Instructions</div>
                  <div className="col-span-1" />
                </div>
                {drugs.map((drug, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <DrugSearchInput
                      value={drug.name}
                      onChange={val => updateDrug(i, "name", val)}
                      onSelectDrug={d => handleSelectDrug(i, d)}
                      index={i}
                    />
                    <input value={drug.dosage} onChange={e => updateDrug(i, "dosage", e.target.value)}
                      placeholder="500mg" className="col-span-2 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <select value={drug.frequency} onChange={e => updateDrug(i, "frequency", e.target.value)}
                      className="col-span-2 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {["once daily", "twice daily", "thrice daily", "every 4 hours", "every 6 hours", "at bedtime", "as needed"].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select value={drug.duration} onChange={e => updateDrug(i, "duration", e.target.value)}
                      className="col-span-2 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {["3 days", "5 days", "7 days", "10 days", "14 days", "30 days", "ongoing"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input value={drug.instructions} onChange={e => updateDrug(i, "instructions", e.target.value)}
                      placeholder="After food" className="col-span-2 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={() => removeDrug(i)} className="col-span-1 p-2 hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button onClick={() => rxMutation.mutate()} disabled={rxMutation.isPending || !drugs.some(d => d.name)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition disabled:opacity-50">
                    {rxMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
                    Submit Prescription
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/20">
                <h3 className="font-display font-bold text-lg flex items-center gap-2"><TestTube className="w-5 h-5 text-yellow-600" /> Order Test / Imaging</h3>
              </div>
              <div className="p-5">
                <div className="flex gap-2 mb-4">
                  {[{ val: "lab", label: "Lab Test", icon: TestTube }, { val: "radiology", label: "Imaging", icon: ScanLine }].map(t => (
                    <button key={t.val} onClick={() => setTestOrder(o => ({ ...o, type: t.val }))}
                      className={clsx("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                        testOrder.type === t.val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground")}>
                      <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      {testOrder.type === "lab" ? "Test Name" : "Imaging Type"}
                    </label>
                    {testOrder.type === "lab" ? (
                      <select value={testOrder.testName} onChange={e => setTestOrder(o => ({ ...o, testName: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Select test</option>
                        {["CBC (Complete Blood Count)", "LFT (Liver Function)", "KFT (Kidney Function)", "Lipid Profile", "Thyroid Profile", "HbA1c", "Blood Glucose (Fasting)", "Urine Routine", "Blood Culture"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <select value={testOrder.testName} onChange={e => setTestOrder(o => ({ ...o, testName: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Select imaging</option>
                        {["X-Ray Chest PA", "X-Ray Abdomen", "Ultrasound Abdomen", "CT Chest", "CT Abdomen", "MRI Brain", "MRI Spine", "ECG", "2D Echo"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Clinical Indication</label>
                    <input value={testOrder.indication} onChange={e => setTestOrder(o => ({ ...o, indication: e.target.value }))}
                      placeholder="Reason for ordering this test"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button onClick={() => orderTestMutation.mutate()} disabled={orderTestMutation.isPending || !testOrder.testName}
                    className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-white rounded-xl text-sm font-semibold hover:bg-yellow-700 transition disabled:opacity-50">
                    {orderTestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-4">
            {aiAnalyses.map(ai => (
              <div key={ai.id} className="bg-card p-6 rounded-2xl border-l-4 border-l-accent shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold capitalize flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-accent" /> {ai.analysisType.replace("_", " ")}</h4>
                  <span className={clsx("px-3 py-1 text-xs font-bold rounded-full uppercase",
                    ai.urgencyLevel === "critical" ? "bg-red-100 text-red-700" :
                    ai.urgencyLevel === "high" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                  )}>{ai.urgencyLevel} Priority</span>
                </div>
                <p className="text-foreground leading-relaxed">{ai.summary}</p>
              </div>
            ))}
            {aiAnalyses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border border-dashed">
                <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No AI analyses yet. Use the AI Assistant to generate one.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
