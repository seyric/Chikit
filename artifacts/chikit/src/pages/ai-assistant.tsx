import { useState } from "react";
import { useAnalyzeSymptoms, AnalyzeSymptomsRequestSeverity } from "@workspace/api-client-react";
import { BrainCircuit, Loader2, AlertTriangle, Stethoscope, FileText, Activity } from "lucide-react";
import { clsx } from "clsx";

export default function AiAssistant() {
  const [activeTab, setActiveTab] = useState("symptoms");
  const analyzeSymptoms = useAnalyzeSymptoms();
  
  const [symptomsForm, setSymptomsForm] = useState({
    patientId: 1, // hardcoded for demo simplicity if no search implemented
    symptoms: "",
    duration: "",
    severity: "moderate" as AnalyzeSymptomsRequestSeverity,
  });

  const [aiResult, setAiResult] = useState<any>(null);

  const handleSymptomAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await analyzeSymptoms.mutateAsync({
        data: {
          patientId: symptomsForm.patientId,
          symptoms: symptomsForm.symptoms.split(",").map(s => s.trim()),
          duration: symptomsForm.duration,
          severity: symptomsForm.severity
        }
      });
      setAiResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4 ring-8 ring-accent/5">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h2 className="font-display text-3xl font-bold text-foreground">Clinical Decision Support</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Leverage advanced AI models to analyze symptoms, interpret lab results, and generate patient summaries instantly.</p>
      </div>

      <div className="flex border-b border-border">
        {[{ id: "symptoms", label: "Symptom Analysis", icon: Stethoscope },
          { id: "labs", label: "Lab Interpretation", icon: Activity },
          { id: "summary", label: "Patient Summary", icon: FileText }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex-1 py-4 font-semibold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors",
              activeTab === tab.id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left side: Form */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="font-display font-bold text-xl mb-6">Input Details</h3>
          
          {activeTab === "symptoms" && (
            <form onSubmit={handleSymptomAnalysis} className="space-y-5">
              <div>
                 <label className="block text-sm font-semibold mb-2">Patient ID</label>
                 <input type="number" required value={symptomsForm.patientId} onChange={e=>setSymptomsForm({...symptomsForm, patientId: Number(e.target.value)})} className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/50 outline-none" />
              </div>
              <div>
                 <label className="block text-sm font-semibold mb-2">Symptoms (comma separated)</label>
                 <textarea required value={symptomsForm.symptoms} onChange={e=>setSymptomsForm({...symptomsForm, symptoms: e.target.value})} className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/50 outline-none min-h-[100px]" placeholder="fever, cough, chest pain..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-semibold mb-2">Duration</label>
                   <input type="text" value={symptomsForm.duration} onChange={e=>setSymptomsForm({...symptomsForm, duration: e.target.value})} className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/50 outline-none" placeholder="e.g. 3 days" />
                </div>
                <div>
                   <label className="block text-sm font-semibold mb-2">Severity</label>
                   <select value={symptomsForm.severity} onChange={e=>setSymptomsForm({...symptomsForm, severity: e.target.value as any})} className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/50 outline-none">
                     <option value="mild">Mild</option>
                     <option value="moderate">Moderate</option>
                     <option value="severe">Severe</option>
                   </select>
                </div>
              </div>
              <button disabled={analyzeSymptoms.isPending} type="submit" className="w-full py-4 bg-accent text-accent-foreground font-bold rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 transition flex justify-center">
                {analyzeSymptoms.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Run AI Analysis"}
              </button>
            </form>
          )}

          {activeTab !== "symptoms" && (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
               <p>Select Patient ID to load context</p>
               <button className="mt-4 px-6 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium">Coming Soon</button>
            </div>
          )}
        </div>

        {/* Right side: Results */}
        <div className="bg-card min-h-[400px] p-6 rounded-2xl shadow-sm border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -z-10"></div>
          <h3 className="font-display font-bold text-xl mb-6">AI Output</h3>
          
          {!aiResult && !analyzeSymptoms.isPending && (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50 py-12">
               <BrainCircuit className="w-16 h-16" />
               <p>Results will appear here</p>
             </div>
          )}

          {analyzeSymptoms.isPending && (
            <div className="h-full flex flex-col items-center justify-center text-accent space-y-4 py-12">
               <Loader2 className="w-12 h-12 animate-spin" />
               <p className="animate-pulse font-medium">AI is analyzing medical data...</p>
            </div>
          )}

          {aiResult && !analyzeSymptoms.isPending && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-start">
                 <div className="space-y-1">
                   <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Analysis Complete</p>
                   <h4 className="font-bold text-lg">{aiResult.summary}</h4>
                 </div>
                 <span className={clsx(
                   "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                   aiResult.urgencyLevel === "critical" ? "bg-red-50 text-red-600 border-red-200" :
                   aiResult.urgencyLevel === "high" ? "bg-orange-50 text-orange-600 border-orange-200" :
                   "bg-green-50 text-green-600 border-green-200"
                 )}>
                   {aiResult.urgencyLevel} Urgency
                 </span>
               </div>

               <div>
                 <h5 className="font-bold text-foreground mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent"/> Differential Diagnosis</h5>
                 <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                   {aiResult.differentialDiagnosis?.map((d: string, i: number) => <li key={i}>{d}</li>)}
                 </ul>
               </div>

               <div>
                 <h5 className="font-bold text-foreground mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-accent"/> Recommendations</h5>
                 <ul className="space-y-2">
                   {aiResult.recommendations?.map((r: string, i: number) => (
                     <li key={i} className="bg-muted/50 p-3 rounded-lg text-sm text-foreground/80 border border-border/50">{r}</li>
                   ))}
                 </ul>
               </div>

               <div className="mt-8 pt-4 border-t border-border text-xs text-muted-foreground">
                 <strong>Disclaimer:</strong> {aiResult.disclaimer}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ensure local Activity icon import exists for the tabs
import { Activity } from "lucide-react";
