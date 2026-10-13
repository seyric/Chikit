// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Pill,
  Search,
  Plus,
  Calendar,
  Stethoscope,
  CheckCircle,
  Clock,
  User,
  FlaskConical,
  X,
  AlertCircle,
  PackageCheck,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: number;
  patientId: number;
  doctorId: number;
  hospitalId: number;
  prescriptionDate: string;
  diagnosis: string;
  status: string;
  patientName: string;
  doctorName: string;
  instructions: string;
  followUpDays: number;
  medications: Medication[];
}

export default function Prescriptions() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "dispensed">("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    patientId: "1",
    diagnosis: "",
    instructions: "Take with water after meals. Complete full duration.",
    medName: "Paracetamol 650mg",
    medDosage: "650 mg",
    medFrequency: "Thrice daily (TDS)",
    medDuration: "5 days",
  });

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ["prescriptions", tab],
    queryFn: () => {
      const q = tab === "all" ? "" : `?status=${tab}`;
      return fetch(`/api/prescriptions${q}`).then(r => r.json());
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => fetch("/api/patients").then(r => r.json()),
  });

  const dispenseMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dispensed" }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      setShowNewModal(false);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      patientId: Number(newForm.patientId),
      diagnosis: newForm.diagnosis,
      instructions: newForm.instructions,
      medications: [
        {
          name: newForm.medName,
          dosage: newForm.medDosage,
          frequency: newForm.medFrequency,
          duration: newForm.medDuration,
        }
      ]
    });
  };

  const filtered = prescriptions.filter(p => {
    const matchesSearch =
      p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      p.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
      p.medications?.some(m => m.name.toLowerCase().includes(search.toLowerCase()));
    const matchesTab = tab === "all" || p.status === tab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              e-Prescriptions Registry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              AIIMS Formulary
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time outpatient prescriptions and digital dispensing tracker
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Issue e-Prescription
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient, medication, diagnosis..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
        </div>

        <div className="flex space-x-1 bg-muted/60 p-1 rounded-xl self-start md:self-auto">
          {[
            { id: "all", label: "All Prescriptions" },
            { id: "active", label: "Pending Dispense" },
            { id: "dispensed", label: "Dispensed" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filtered.map(rx => (
          <motion.div
            key={rx.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/80 shadow-sm p-5 hover:border-primary/40 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                  {rx.patientName?.charAt(0) || "P"}
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {rx.patientName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-primary" /> {rx.doctorName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(rx.prescriptionDate), "dd MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold capitalize",
                    rx.status === "dispensed"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                  )}
                >
                  {rx.status === "dispensed" ? "Dispensed by Pharmacy" : "Pending Dispense"}
                </span>
                {rx.status !== "dispensed" && (
                  <button
                    onClick={() => dispenseMutation.mutate(rx.id)}
                    disabled={dispenseMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <PackageCheck className="w-3.5 h-3.5" /> Dispense
                  </button>
                )}
              </div>
            </div>

            {rx.diagnosis && (
              <div className="mt-3 px-3.5 py-2 bg-muted/40 rounded-xl text-xs flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Clinical Indication:</span>
                <span className="font-bold text-foreground">{rx.diagnosis}</span>
              </div>
            )}

            {/* Medications Table */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Prescribed Drug Regimen ({rx.medications?.length || 0} items)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rx.medications?.map((med, i) => (
                  <div
                    key={i}
                    className="bg-muted/20 border border-border/60 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-primary mb-1">
                        <Pill className="w-3.5 h-3.5" />
                        <span className="font-bold text-xs text-foreground">{med.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {med.dosage} · {med.frequency}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex justify-between">
                      <span>Duration: {med.duration}</span>
                      {med.instructions && <span className="italic truncate max-w-[140px]">{med.instructions}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {rx.instructions && (
              <p className="text-xs text-muted-foreground italic mt-3">
                Doctor's Special Advice: "{rx.instructions}"
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* New Prescription Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" /> New e-Prescription
              </h3>
              <button onClick={() => setShowNewModal(false)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Patient</label>
                <select
                  value={newForm.patientId}
                  onChange={e => setNewForm({ ...newForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                >
                  {(Array.isArray(patients) ? patients : patients.patients || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.patientCode || p.chikitHealthId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Diagnosis</label>
                <input
                  type="text"
                  required
                  value={newForm.diagnosis}
                  onChange={e => setNewForm({ ...newForm, diagnosis: e.target.value })}
                  placeholder="e.g. Acute Bronchitis"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="border border-border/80 rounded-xl p-3 bg-muted/20 space-y-3">
                <p className="text-xs font-bold text-foreground">Drug Item</p>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Medicine Name</label>
                  <input
                    type="text"
                    required
                    value={newForm.medName}
                    onChange={e => setNewForm({ ...newForm, medName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Dosage</label>
                    <input
                      type="text"
                      value={newForm.medDosage}
                      onChange={e => setNewForm({ ...newForm, medDosage: e.target.value })}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Frequency</label>
                    <input
                      type="text"
                      value={newForm.medFrequency}
                      onChange={e => setNewForm({ ...newForm, medFrequency: e.target.value })}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Duration</label>
                    <input
                      type="text"
                      value={newForm.medDuration}
                      onChange={e => setNewForm({ ...newForm, medDuration: e.target.value })}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Patient Instructions</label>
                <input
                  type="text"
                  value={newForm.instructions}
                  onChange={e => setNewForm({ ...newForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90"
                >
                  {createMutation.isPending ? "Issuing..." : "Issue e-Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
