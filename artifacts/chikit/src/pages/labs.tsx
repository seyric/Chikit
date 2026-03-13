import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { TestTube, FlaskConical, CheckCircle, Loader2, Plus, Trash2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabReport {
  id: number;
  patientId: number;
  testName: string;
  testDate: string;
  status: string;
  results: Record<string, unknown> | null;
  interpretation: string | null;
  patientName: string | null;
  doctorName: string | null;
}

interface ResultRow { key: string; value: string; unit: string; abnormal: boolean; }

function ResultEntryForm({ report, onDone }: { report: LabReport; onDone: () => void }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<ResultRow[]>([{ key: "", value: "", unit: "", abnormal: false }]);
  const [interpretation, setInterpretation] = useState(report.interpretation || "");

  const addRow = () => setRows(r => [...r, { key: "", value: "", unit: "", abnormal: false }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof ResultRow, val: string | boolean) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const submitMutation = useMutation({
    mutationFn: () => {
      const results = rows.reduce((acc, row) => {
        if (row.key) acc[row.key] = { value: row.value, unit: row.unit, abnormal: row.abnormal };
        return acc;
      }, {} as Record<string, unknown>);
      return fetch(`/api/lab-reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", results, interpretation }),
      }).then(r => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab-reports"] });
      onDone();
    },
  });

  const collectMutation = useMutation({
    mutationFn: () => fetch(`/api/lab-reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-reports"] }),
  });

  if (report.status === "pending") {
    return (
      <div className="p-4 bg-muted/30 rounded-xl flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Sample not yet collected</p>
        <button onClick={() => collectMutation.mutate()} disabled={collectMutation.isPending}
          className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition disabled:opacity-50 flex items-center gap-2">
          {collectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
          Collect Sample
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-xl border border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Enter Results</h4>
        <button onClick={addRow} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
          <Plus className="w-3.5 h-3.5" /> Add Parameter
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={row.key} onChange={e => updateRow(i, "key", e.target.value)}
              placeholder="Parameter (e.g. Hemoglobin)"
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={row.value} onChange={e => updateRow(i, "value", e.target.value)}
              placeholder="Value"
              className="w-24 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={row.unit} onChange={e => updateRow(i, "unit", e.target.value)}
              placeholder="Unit"
              className="w-20 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={row.abnormal} onChange={e => updateRow(i, "abnormal", e.target.checked)}
                className="w-4 h-4 accent-destructive" />
              <AlertTriangle className={cn("w-4 h-4", row.abnormal ? "text-destructive" : "text-muted-foreground/40")} />
            </label>
            <button onClick={() => removeRow(i)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Interpretation / Clinical Notes</label>
        <textarea value={interpretation} onChange={e => setInterpretation(e.target.value)} rows={2}
          placeholder="Clinical interpretation of results…"
          className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">Cancel</button>
        <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2">
          {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Submit Report
        </button>
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: LabReport }) {
  const [expanded, setExpanded] = useState(false);
  const hasAbnormal = report.results && Object.values(report.results).some((v: unknown) => (v as Record<string, unknown>)?.abnormal);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
          {report.patientName?.charAt(0) || "P"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{report.patientName || `Patient #${report.patientId}`}</p>
            {hasAbnormal && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                <AlertTriangle className="w-3 h-3" /> Abnormal
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{report.testName} • {format(new Date(report.testDate), "MMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-3">
          {report.status === "pending" && <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full">Pending</span>}
          {report.status === "in_progress" && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">In Progress</span>}
          {report.status === "completed" && <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Completed</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {report.status === "completed" && report.results ? (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted-foreground text-left">
                    <th className="pb-2 pr-4">Parameter</th><th className="pb-2 pr-4">Value</th>
                    <th className="pb-2 pr-4">Unit</th><th className="pb-2">Flag</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(report.results).map(([key, val]) => {
                      const v = val as Record<string, unknown>;
                      return (
                        <tr key={key} className={cn("", v.abnormal && "bg-red-50")}>
                          <td className="py-2 pr-4 font-medium">{key}</td>
                          <td className="py-2 pr-4">{String(v.value)}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{String(v.unit || "")}</td>
                          <td className="py-2">{v.abnormal ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <span className="text-muted-foreground/50">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {report.interpretation && (
                <div className="p-3 bg-muted/30 rounded-xl text-sm text-foreground">{report.interpretation}</div>
              )}
            </div>
          ) : (
            <ResultEntryForm report={report} onDone={() => setExpanded(false)} />
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Labs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"pending" | "in_progress" | "completed">("pending");

  const { data: reports = [], isLoading } = useQuery<LabReport[]>({
    queryKey: ["lab-reports", tab],
    queryFn: () => fetch(`/api/lab-reports?status=${tab}`).then(r => r.json()),
    enabled: !!user,
  });

  const tabs = [
    { id: "pending", label: "Pending", icon: TestTube },
    { id: "in_progress", label: "In Progress", icon: FlaskConical },
    { id: "completed", label: "Completed", icon: CheckCircle },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Lab Queue</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Manage test orders, sample collection, and result entry</p>
      </div>

      <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl w-max">
        {tabs.map(t => (
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
          <TestTube className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-muted-foreground">No {tab.replace("_", " ")} tests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}
