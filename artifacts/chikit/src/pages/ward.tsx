import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  BedDouble, HeartPulse, Thermometer, Activity, Droplets,
  Wind, Loader2, Plus, CheckCircle, User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: number;
  patientId: number;
  patientName: string | null;
  doctorName: string | null;
  appointmentDate: string;
  reason: string | null;
  status: string;
}

interface VitalsForm {
  bpSystolic: string;
  bpDiastolic: string;
  heartRate: string;
  temperature: string;
  spo2: string;
  respiratoryRate: string;
  notes: string;
}

const defaultVitals: VitalsForm = {
  bpSystolic: "", bpDiastolic: "", heartRate: "",
  temperature: "", spo2: "", respiratoryRate: "", notes: "",
};

function VitalsModal({ patient, apptId, onClose }: { patient: string; apptId: number; onClose: () => void }) {
  const [vitals, setVitals] = useState<VitalsForm>(defaultVitals);
  const qc = useQueryClient();

  const setV = (field: keyof VitalsForm, val: string) => setVitals(v => ({ ...v, [field]: val }));

  const submitMutation = useMutation({
    mutationFn: () => {
      const vitalSigns: Record<string, unknown> = {};
      if (vitals.bpSystolic && vitals.bpDiastolic) vitalSigns.bloodPressure = `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`;
      if (vitals.heartRate) vitalSigns.heartRate = Number(vitals.heartRate);
      if (vitals.temperature) vitalSigns.temperature = Number(vitals.temperature);
      if (vitals.spo2) vitalSigns.spo2 = Number(vitals.spo2);
      if (vitals.respiratoryRate) vitalSigns.respiratoryRate = Number(vitals.respiratoryRate);

      return fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: apptId,
          chiefComplaint: "Vitals Recording",
          vitalSigns,
          notes: vitals.notes || "Routine vitals recorded by nurse",
          diagnosis: "Vitals Monitoring",
        }),
      }).then(r => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ward-appointments"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-display font-bold text-lg">Record Vitals</h3>
            <p className="text-sm text-muted-foreground">{patient}</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-red-500" /> Blood Pressure (mmHg)
              </label>
              <div className="flex items-center gap-2">
                <input value={vitals.bpSystolic} onChange={e => setV("bpSystolic", e.target.value)}
                  placeholder="Systolic" type="number"
                  className="flex-1 px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <span className="text-muted-foreground font-bold">/</span>
                <input value={vitals.bpDiastolic} onChange={e => setV("bpDiastolic", e.target.value)}
                  placeholder="Diastolic" type="number"
                  className="flex-1 px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" /> Heart Rate (bpm)
              </label>
              <input value={vitals.heartRate} onChange={e => setV("heartRate", e.target.value)}
                placeholder="e.g. 72" type="number"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" /> Temperature (°C)
              </label>
              <input value={vitals.temperature} onChange={e => setV("temperature", e.target.value)}
                placeholder="e.g. 37.2" type="number" step="0.1"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-500" /> SpO₂ (%)
              </label>
              <input value={vitals.spo2} onChange={e => setV("spo2", e.target.value)}
                placeholder="e.g. 98" type="number"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <Wind className="w-3.5 h-3.5 text-emerald-500" /> Resp. Rate (/min)
              </label>
              <input value={vitals.respiratoryRate} onChange={e => setV("respiratoryRate", e.target.value)}
                placeholder="e.g. 18" type="number"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notes (optional)</label>
            <textarea value={vitals.notes} onChange={e => setV("notes", e.target.value)}
              placeholder="e.g. Patient is stable, medication given at 10:00 AM"
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Vitals
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Ward() {
  const { user } = useAuth();
  const [vitalsPatient, setVitalsPatient] = useState<{ name: string; apptId: number } | null>(null);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["ward-appointments"],
    queryFn: () => fetch("/api/appointments").then(r => r.json()),
    enabled: !!user,
  });

  const admitted = appointments.filter(a => a.status === "in_progress");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Ward View</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Monitor admitted patients and record vitals</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Admitted Patients", value: admitted.length, icon: BedDouble, color: "text-primary bg-primary/10" },
          { label: "Vitals Due", value: Math.min(admitted.length, 3), icon: HeartPulse, color: "text-red-500 bg-red-500/10" },
          { label: "Stable", value: Math.max(0, admitted.length - 1), icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", s.color)}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-5 border-b border-border">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-primary" /> Admitted Patients
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : admitted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BedDouble className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-muted-foreground">No patients currently admitted</p>
            <p className="text-sm text-muted-foreground/70">Checked-in patients from Reception will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {admitted.map(appt => (
              <div key={appt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                  {appt.patientName?.charAt(0) || "P"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{appt.patientName || `Patient #${appt.patientId}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {appt.reason || "General"} • Checked in {format(new Date(appt.appointmentDate), "hh:mm a")}
                    {appt.doctorName && <> • Dr. {appt.doctorName}</>}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">In Ward</span>
                <button
                  onClick={() => setVitalsPatient({ name: appt.patientName || `Patient #${appt.patientId}`, apptId: appt.patientId })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition"
                >
                  <Plus className="w-3 h-3" /> Record Vitals
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {vitalsPatient && (
        <VitalsModal
          patient={vitalsPatient.name}
          apptId={vitalsPatient.apptId}
          onClose={() => setVitalsPatient(null)}
        />
      )}
    </div>
  );
}
