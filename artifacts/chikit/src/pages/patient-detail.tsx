import { useState } from "react";
import { useRoute } from "wouter";
import { useGetPatientTimeline } from "@workspace/api-client-react";
import { User, Calendar, Activity, Pill, BrainCircuit, FileText, Loader2, Thermometer, HeartPulse } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const patientId = Number(params?.id);
  const { data: timeline, isLoading } = useGetPatientTimeline(patientId, { query: { enabled: !!patientId } });
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!timeline) return <div>Patient not found</div>;

  const { patient, medicalRecords, prescriptions, aiAnalyses } = timeline;

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "records", label: "Medical Records", icon: Activity },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
    { id: "ai", label: "AI Analysis", icon: BrainCircuit },
  ];

  return (
    <div className="space-y-6">
      {/* Patient Header Card */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-display text-3xl font-bold shadow-lg shadow-primary/20">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">{patient.name}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="w-4 h-4"/> {patient.patientCode}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}</span>
              <span className="capitalize border-l pl-3 border-border">{patient.gender}</span>
              <span className="border-l pl-3 border-border">{patient.bloodGroup || 'Blood Type Unrecorded'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary/90 transition">
            Book Appointment
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl w-max">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all",
              activeTab === tab.id 
                ? "bg-card text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-foreground">{patient.phone || '-'}</p></div>
                  <div><p className="text-muted-foreground">Email</p><p className="font-medium text-foreground">{patient.email || '-'}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Address</p><p className="font-medium text-foreground">{patient.address || '-'}</p></div>
                  <div><p className="text-muted-foreground">Emergency Contact</p><p className="font-medium text-foreground">{patient.emergencyContact || '-'}</p></div>
                  <div><p className="text-muted-foreground">Emergency Phone</p><p className="font-medium text-foreground">{patient.emergencyPhone || '-'}</p></div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4 text-destructive flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Medical Alerts</h3>
                <div className="space-y-4">
                  <div><p className="text-sm font-semibold text-muted-foreground mb-1">Allergies</p><p className="text-foreground">{patient.allergies || 'None recorded'}</p></div>
                  <div><p className="text-sm font-semibold text-muted-foreground mb-1">Chronic Conditions</p><p className="text-foreground">{patient.chronicConditions || 'None recorded'}</p></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-accent/10 to-primary/5 rounded-2xl p-6 border border-accent/20">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-accent"/> Latest AI Summary</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {aiAnalyses.find(a => a.analysisType === 'patient_summary')?.summary || 'No AI summary generated recently. Click "AI Analysis" tab to generate one.'}
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
                    <p className="text-sm text-muted-foreground">{format(new Date(record.visitDate), 'MMMM d, yyyy')} • Dr. {record.doctorName}</p>
                  </div>
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full">Record #{record.id}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Diagnosis</p>
                    <p>{record.diagnosis || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Treatment Plan</p>
                    <p>{record.treatmentPlan || 'None'}</p>
                  </div>
                </div>
                {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4">
                    {record.vitalSigns.bloodPressure && <span className="flex items-center gap-1.5 text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium"><HeartPulse className="w-4 h-4"/> {record.vitalSigns.bloodPressure}</span>}
                    {record.vitalSigns.temperature && <span className="flex items-center gap-1.5 text-sm bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg font-medium"><Thermometer className="w-4 h-4"/> {record.vitalSigns.temperature}°C</span>}
                    {record.vitalSigns.heartRate && <span className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium"><Activity className="w-4 h-4"/> {record.vitalSigns.heartRate} bpm</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Keeping Prescriptions and AI tabs simple for now */}
        {activeTab === "prescriptions" && (
           <div className="space-y-4">
             {prescriptions.length === 0 ? <p className="p-8 text-center text-muted-foreground">No prescriptions</p> : 
               prescriptions.map(rx => (
                 <div key={rx.id} className="bg-card p-6 rounded-2xl border shadow-sm flex justify-between">
                   <div>
                     <h4 className="font-bold">{rx.diagnosis || 'Prescription'}</h4>
                     <p className="text-sm text-muted-foreground">{format(new Date(rx.prescriptionDate), 'PPP')}</p>
                     <ul className="mt-3 space-y-2">
                       {rx.medications.map((m, i) => (
                         <li key={i} className="flex gap-3 text-sm"><Pill className="w-4 h-4 text-primary"/> <b>{m.name}</b> - {m.dosage}, {m.frequency} for {m.duration}</li>
                       ))}
                     </ul>
                   </div>
                 </div>
               ))
             }
           </div>
        )}
        
        {activeTab === "ai" && (
          <div className="space-y-4">
            {aiAnalyses.map(ai => (
              <div key={ai.id} className="bg-card p-6 rounded-2xl border-l-4 border-l-accent shadow-sm">
                 <div className="flex justify-between items-center mb-3">
                   <h4 className="font-bold capitalize flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-accent"/> {ai.analysisType.replace('_', ' ')}</h4>
                   <span className={clsx("px-3 py-1 text-xs font-bold rounded-full uppercase", 
                     ai.urgencyLevel === 'critical' ? 'bg-red-100 text-red-700' :
                     ai.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                     'bg-green-100 text-green-700'
                   )}>{ai.urgencyLevel} Priority</span>
                 </div>
                 <p className="text-foreground leading-relaxed">{ai.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
