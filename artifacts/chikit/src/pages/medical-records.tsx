// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Stethoscope,
  Activity,
  HeartPulse,
  Thermometer,
  User,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: number;
  hospitalId: number;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  symptoms: string[];
  vitalSigns: Record<string, any>;
  treatmentPlan: string;
  notes: string;
  followUpDate: string | null;
  createdAt: string;
  patientName: string;
  doctorName: string;
}

export default function MedicalRecords() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    patientId: "1",
    chiefComplaint: "",
    diagnosis: "",
    treatmentPlan: "",
    bpSystolic: "120",
    bpDiastolic: "80",
    heartRate: "72",
    spo2: "98",
    temperature: "98.4",
    notes: ""
  });

  const { data: records = [], isLoading } = useQuery<MedicalRecord[]>({
    queryKey: ["medical-records"],
    queryFn: () => fetch("/api/medical-records").then(r => r.json()),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => fetch("/api/patients").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-records"] });
      setShowNewModal(false);
      setNewForm({
        patientId: "1",
        chiefComplaint: "",
        diagnosis: "",
        treatmentPlan: "",
        bpSystolic: "120",
        bpDiastolic: "80",
        heartRate: "72",
        spo2: "98",
        temperature: "98.4",
        notes: ""
      });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      patientId: Number(newForm.patientId),
      chiefComplaint: newForm.chiefComplaint,
      diagnosis: newForm.diagnosis,
      treatmentPlan: newForm.treatmentPlan,
      vitalSigns: {
        bloodPressure: `${newForm.bpSystolic}/${newForm.bpDiastolic} mmHg`,
        heartRate: Number(newForm.heartRate),
        spo2: Number(newForm.spo2),
        temperature: Number(newForm.temperature),
      },
      notes: newForm.notes,
      visitDate: new Date().toISOString()
    });
  };

  const filteredRecords = records.filter(r =>
    r.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    r.chiefComplaint?.toLowerCase().includes(search.toLowerCase()) ||
    r.doctorName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Electronic Health Records (EHR)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              ABDM Compliant
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            AIIMS Jodhpur clinical encounters, OPD diagnostic entries, and treatment summaries
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> New Clinical Encounter
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by patient, ICD-10 diagnosis, or doctor..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
        />
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.map(rec => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/80 shadow-sm hover:border-primary/40 transition-all p-5"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-foreground">
                      {rec.patientName}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                      Record #{rec.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-primary" /> {rec.doctorName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(rec.visitDate), "dd MMM yyyy, hh:mm a")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold self-start">
                AIIMS Clinical Encounter
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-sm">
              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Chief Complaint</p>
                <p className="font-medium text-foreground text-xs leading-relaxed">
                  {rec.chiefComplaint}
                </p>
              </div>

              <div className="bg-primary/5 rounded-xl p-3 border border-primary/15">
                <p className="text-xs font-semibold text-primary mb-1">Diagnosis</p>
                <p className="font-bold text-foreground text-xs leading-relaxed">
                  {rec.diagnosis}
                </p>
              </div>

              <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/15">
                <p className="text-xs font-semibold text-emerald-600 mb-1">Treatment Plan</p>
                <p className="font-medium text-foreground text-xs leading-relaxed">
                  {rec.treatmentPlan}
                </p>
              </div>
            </div>

            {/* Vitals Ribbon */}
            {rec.vitalSigns && Object.keys(rec.vitalSigns).length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-primary" /> Recorded Vitals:
                </span>
                {rec.vitalSigns.bloodPressure && (
                  <span className="bg-card px-2.5 py-1 rounded-lg border border-border">
                    BP: <strong className="text-foreground">{rec.vitalSigns.bloodPressure}</strong>
                  </span>
                )}
                {rec.vitalSigns.heartRate && (
                  <span className="bg-card px-2.5 py-1 rounded-lg border border-border">
                    Pulse: <strong className="text-foreground">{rec.vitalSigns.heartRate} bpm</strong>
                  </span>
                )}
                {rec.vitalSigns.spo2 && (
                  <span className="bg-card px-2.5 py-1 rounded-lg border border-border">
                    SpO2: <strong className="text-foreground">{rec.vitalSigns.spo2}%</strong>
                  </span>
                )}
                {rec.vitalSigns.temperature && (
                  <span className="bg-card px-2.5 py-1 rounded-lg border border-border">
                    Temp: <strong className="text-foreground">{rec.vitalSigns.temperature}°F</strong>
                  </span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* New Encounter Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" /> New Clinical Record Entry
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
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Chief Complaint</label>
                <input
                  type="text"
                  required
                  value={newForm.chiefComplaint}
                  onChange={e => setNewForm({ ...newForm, chiefComplaint: e.target.value })}
                  placeholder="e.g. Recurrent chest discomfort and shortness of breath"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Diagnosis</label>
                <input
                  type="text"
                  required
                  value={newForm.diagnosis}
                  onChange={e => setNewForm({ ...newForm, diagnosis: e.target.value })}
                  placeholder="e.g. Acute Coronary Syndrome (Unstable Angina)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">BP Sys/Dia</label>
                  <input
                    type="text"
                    value={`${newForm.bpSystolic}/${newForm.bpDiastolic}`}
                    onChange={e => {
                      const [s, d] = e.target.value.split("/");
                      setNewForm({ ...newForm, bpSystolic: s || "", bpDiastolic: d || "" });
                    }}
                    placeholder="120/80"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Heart Rate</label>
                  <input
                    type="number"
                    value={newForm.heartRate}
                    onChange={e => setNewForm({ ...newForm, heartRate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={newForm.spo2}
                    onChange={e => setNewForm({ ...newForm, spo2: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newForm.temperature}
                    onChange={e => setNewForm({ ...newForm, temperature: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Treatment Plan</label>
                <textarea
                  rows={2}
                  required
                  value={newForm.treatmentPlan}
                  onChange={e => setNewForm({ ...newForm, treatmentPlan: e.target.value })}
                  placeholder="Medications prescribed, lifestyle modifications, and follow-up protocol"
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
                  {createMutation.isPending ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
