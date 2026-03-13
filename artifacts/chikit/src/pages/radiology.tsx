import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ScanLine, CheckCircle, Loader2, ChevronDown, ChevronUp, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadiologyReport {
  id: number;
  patientId: number;
  imagingType: string;
  bodyPart: string | null;
  studyDate: string;
  findings: string | null;
  impression: string | null;
  radiologistNotes: string | null;
  status: string;
  patientName: string | null;
  doctorName: string | null;
}

const CLASSIFICATIONS = [
  { value: "normal", label: "Normal", color: "text-green-700 bg-green-100" },
  { value: "abnormal", label: "Abnormal", color: "text-amber-700 bg-amber-100" },
  { value: "critical", label: "Critical", color: "text-red-700 bg-red-100" },
];

function ReportForm({ report, onDone }: { report: RadiologyReport; onDone: () => void }) {
  const qc = useQueryClient();
  const [findings, setFindings] = useState(report.findings || "");
  const [impression, setImpression] = useState(report.impression || "");
  const [classification, setClassification] = useState("normal");
  const [notes, setNotes] = useState(report.radiologistNotes || "");

  const submitMutation = useMutation({
    mutationFn: () => fetch(`/api/radiology-reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        findings,
        impression,
        radiologistNotes: `[${classification.toUpperCase()}] ${notes}`,
      }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["radiology-reports"] });
      onDone();
    },
  });

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-xl border border-border">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Findings</label>
        <textarea value={findings} onChange={e => setFindings(e.target.value)} rows={3}
          placeholder="Describe the imaging findings in detail…"
          className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Impression</label>
        <textarea value={impression} onChange={e => setImpression(e.target.value)} rows={2}
          placeholder="Clinical impression / conclusion…"
          className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">Classification</label>
        <div className="flex gap-2">
          {CLASSIFICATIONS.map(c => (
            <button key={c.value} onClick={() => setClassification(c.value)}
              className={cn("px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                classification === c.value ? `${c.color} border-current` : "border-border text-muted-foreground hover:border-muted-foreground")}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Radiologist Notes (optional)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Additional notes for the referring physician…"
          className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">Cancel</button>
        <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !findings || !impression}
          className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2">
          {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Submit Report
        </button>
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: RadiologyReport }) {
  const [expanded, setExpanded] = useState(false);

  const getClassBadge = () => {
    if (!report.radiologistNotes) return null;
    if (report.radiologistNotes.includes("[CRITICAL]")) return { label: "Critical", color: "bg-red-100 text-red-700" };
    if (report.radiologistNotes.includes("[ABNORMAL]")) return { label: "Abnormal", color: "bg-amber-100 text-amber-700" };
    return { label: "Normal", color: "bg-green-100 text-green-700" };
  };

  const badge = getClassBadge();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ScanLine className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{report.patientName || `Patient #${report.patientId}`}</p>
            {badge && report.status === "completed" && (
              <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full", badge.color)}>{badge.label}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {report.imagingType}{report.bodyPart ? ` — ${report.bodyPart}` : ""} • {format(new Date(report.studyDate), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {report.status === "pending" && <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full">Pending</span>}
          {report.status === "completed" && <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Completed</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {report.status === "completed" ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Findings</p>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-xl">{report.findings || "No findings recorded"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Impression</p>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-xl">{report.impression || "No impression recorded"}</p>
              </div>
              {report.radiologistNotes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Radiologist Notes</p>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded-xl">{report.radiologistNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <ReportForm report={report} onDone={() => setExpanded(false)} />
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Radiology() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"pending" | "completed">("pending");

  const { data: reports = [], isLoading } = useQuery<RadiologyReport[]>({
    queryKey: ["radiology-reports", tab],
    queryFn: () => fetch(`/api/radiology-reports?status=${tab}`).then(r => r.json()),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Radiology</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Review imaging orders and submit radiological reports</p>
      </div>

      <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl w-max">
        {([
          { id: "pending", label: "Pending Orders", icon: Activity },
          { id: "completed", label: "Completed", icon: CheckCircle },
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
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-dashed border-border">
          <ScanLine className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-muted-foreground">No {tab} imaging orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}
