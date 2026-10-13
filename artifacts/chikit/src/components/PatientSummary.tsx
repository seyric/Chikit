import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface PatientSummaryProps {
  patientId: number;
}

export const PatientSummary = ({ patientId }: PatientSummaryProps) => {
  const { data: summary, isLoading: isLoadingSummary, error: summaryError } = useQuery({
    queryKey: ["patient-summary", patientId],
    queryFn: () =>
      fetch(`/api/patients/${patientId}/summary`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch patient summary");
        return r.json();
      }),
    enabled: !!patientId,
  });

  if (isLoadingSummary) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (summaryError) {
    return <p className="text-red-500 p-8 text-center">Error loading patient summary</p>;
  }

  if (!summary) {
    return <p className="p-8 text-center text-muted-foreground">No summary data available</p>;
  }

  return (
    <div className="space-y-6">
      {/* Patient Info */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="font-display font-bold text-lg mb-4">Patient Information</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{summary.patient.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Patient Code</p>
            <p className="font-medium">{summary.patient.patientCode}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Chikit Health ID</p>
            <p className="font-medium">{summary.patient.chikitHealthId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date of Birth</p>
            <p className="font-medium">{summary.patient.dateOfBirth}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gender</p>
            <p className="font-medium">{summary.patient.gender}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{summary.patient.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{summary.patient.email}</p>
          </div>
        </div>
      </div>

      {/* Vitals */}
      {summary.vitals && (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-display font-bold text-lg mb-4">Vitals (Latest)</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <p className="text-muted-foreground">Blood Pressure</p>
              <p className="font-medium">{summary.vitals.bloodPressure}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Heart Rate</p>
              <p className="font-medium">{summary.vitals.heartRate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Temperature</p>
              <p className="font-medium">{summary.vitals.temperature}</p>
            </div>
            <div>
              <p className="text-muted-foreground">SpO2</p>
              <p className="font-medium">{summary.vitals.spo2}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conditions */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="font-display font-bold text-lg mb-4">Conditions</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">Chronic Conditions</p>
            <p>{summary.conditions.chronic.join(", ") || "None"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">Allergies</p>
            <p>{summary.conditions.allergies.join(", ") || "None"}</p>
          </div>
        </div>
      </div>

      {/* Recent Encounter */}
      {summary.recentEncounter && (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-display font-bold text-lg mb-4">Recent Encounter</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Date</p>
              <p className="font-medium">{summary.recentEncounter.date}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Chief Complaint</p>
              <p className="font-medium">{summary.recentEncounter.chiefComplaint}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Diagnosis</p>
              <p className="font-medium">{summary.recentEncounter.diagnosis}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Treatment Plan</p>
              <p className="font-medium">{summary.recentEncounter.treatmentPlan}</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Prescriptions */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="font-display font-bold text-lg mb-4">Active Prescriptions</h3>
        {summary.activePrescriptions.length > 0 ? (
          <div className="space-y-4">
            {summary.activePrescriptions.map((prescription: any, index: number) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{prescription.medication}</p>
                <p className="text-sm text-muted-foreground">
                  {prescription.dosage} • {prescription.frequency}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 text-center text-muted-foreground">No active prescriptions</p>
        )}
      </div>

      {/* Recent Lab Reports */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="font-display font-bold text-lg mb-4">Recent Lab Reports</h3>
        {summary.recentLabReports.length > 0 ? (
          <div className="space-y-4">
            {summary.recentLabReports.map((lab: any, index: number) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{lab.testName}</p>
                <p className="text-sm text-muted-foreground">
                  {lab.value} {lab.units ?? ""} ({lab.status})
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(lab.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 text-center text-muted-foreground">No recent lab reports</p>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="font-display font-bold text-lg mb-4">Upcoming Appointments</h3>
        {summary.upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {summary.upcomingAppointments.map((appt: any, index: number) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{appt.reason}</p>
                <p className="text-sm text-muted-foreground">
                  With Dr. {appt.doctor} on {new Date(appt.date).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {appt.status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 text-center text-muted-foreground">No upcoming appointments</p>
        )}
      </div>
    </div>
  );
};