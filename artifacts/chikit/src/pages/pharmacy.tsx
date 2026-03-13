import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Pill, CheckCircle, Loader2, AlertTriangle, Package, User, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions?: string; }

interface Prescription {
  id: number;
  patientId: number;
  doctorId: number;
  prescriptionDate: string;
  diagnosis: string | null;
  medications: Medication[];
  instructions: string | null;
  status: string;
  patientName: string | null;
  doctorName: string | null;
}

const LOW_STOCK_ALERTS = [
  { name: "Metformin 500mg", stock: 12, threshold: 50 },
  { name: "Amlodipine 5mg", stock: 8, threshold: 30 },
  { name: "Atorvastatin 10mg", stock: 5, threshold: 25 },
  { name: "Pantoprazole 40mg", stock: 3, threshold: 20 },
  { name: "Azithromycin 500mg", stock: 7, threshold: 15 },
];

function PrescriptionCard({ rx }: { rx: Prescription }) {
  const qc = useQueryClient();
  const [dispensed, setDispensed] = useState<Set<number>>(new Set());

  const dispenseMutation = useMutation({
    mutationFn: () => fetch(`/api/prescriptions/${rx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dispensed" }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prescriptions"] }),
  });

  const toggleItem = (i: number) => {
    setDispensed(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const allDispensed = dispensed.size === rx.medications.length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
              {rx.patientName?.charAt(0) || "P"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{rx.patientName || `Patient #${rx.patientId}`}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{rx.doctorName || `Dr. #${rx.doctorId}`}</span>
                <span>{format(new Date(rx.prescriptionDate), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full capitalize">
            {rx.status}
          </span>
        </div>
        {rx.diagnosis && (
          <div className="mt-3 px-3 py-2 bg-muted/40 rounded-xl text-sm">
            <span className="text-muted-foreground">Diagnosis: </span>
            <span className="font-medium text-foreground">{rx.diagnosis}</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-2">
        {rx.medications.map((med, i) => (
          <label key={i} className={cn(
            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
            dispensed.has(i) ? "bg-green-50 border border-green-200" : "bg-muted/20 border border-transparent hover:border-border"
          )}>
            <input type="checkbox" checked={dispensed.has(i)} onChange={() => toggleItem(i)}
              className="w-4 h-4 accent-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={cn("font-semibold text-sm", dispensed.has(i) ? "line-through text-muted-foreground" : "text-foreground")}>
                {med.name}
              </p>
              <p className="text-xs text-muted-foreground">{med.dosage} — {med.frequency} for {med.duration}</p>
            </div>
            <Pill className={cn("w-4 h-4 flex-shrink-0", dispensed.has(i) ? "text-green-500" : "text-muted-foreground")} />
          </label>
        ))}
      </div>

      {rx.instructions && (
        <div className="px-5 pb-4">
          <p className="text-xs text-muted-foreground italic">{rx.instructions}</p>
        </div>
      )}

      <div className="px-5 pb-5 flex justify-end">
        <button
          onClick={() => dispenseMutation.mutate()}
          disabled={dispenseMutation.isPending || (!allDispensed)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            allDispensed
              ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {dispenseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {allDispensed ? "Dispense All" : `${dispensed.size}/${rx.medications.length} selected`}
        </button>
      </div>
    </motion.div>
  );
}

export default function Pharmacy() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"active" | "dispensed">("active");

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ["prescriptions", tab],
    queryFn: () => fetch(`/api/prescriptions?status=${tab}`).then(r => r.json()),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Pharmacy</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Dispense prescriptions and monitor stock levels</p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h4 className="font-semibold text-amber-800">Low Stock Alerts</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {LOW_STOCK_ALERTS.map(item => (
            <div key={item.name} className="bg-white border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span className={cn("text-xs font-bold", item.stock < 5 ? "text-red-600" : "text-amber-700")}>
                  {item.stock} left
                </span>
              </div>
              <p className="text-xs font-medium text-foreground leading-tight">{item.name}</p>
              <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (item.stock / item.threshold) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl w-max">
        {([
          { id: "active", label: "Active Prescriptions", icon: Pill },
          { id: "dispensed", label: "Dispensed", icon: CheckCircle },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all",
              tab === t.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-card/50")}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-dashed border-border">
          <Pill className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-muted-foreground">No {tab} prescriptions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map(rx => <PrescriptionCard key={rx.id} rx={rx} />)}
        </div>
      )}
    </div>
  );
}
