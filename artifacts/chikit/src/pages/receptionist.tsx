import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Calendar, UserCheck, Search, Plus, Clock, CheckCircle, Loader2,
  User, Stethoscope, X, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  reason: string;
  status: string;
  patientName: string;
  doctorName: string;
  hospitalName: string;
}

interface Patient { id: number; name: string; patientCode: string; phone: string; }
interface Doctor { id: number; userId: number; specialization: string; name?: string; }

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Receptionist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState({ doctorId: "", date: "", time: "", reason: "" });
  const [bookError, setBookError] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => fetch("/api/appointments").then(r => r.json()),
    enabled: !!user,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => fetch("/api/patients").then(r => r.json()),
    enabled: !!user,
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["doctors"],
    queryFn: () => fetch("/api/doctors").then(r => r.json()),
    enabled: !!user,
  });

  const checkInMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const bookMutation = useMutation({
    mutationFn: (data: object) => fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(r => { if (!r.ok) throw new Error("Booking failed"); return r.json(); }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setShowBookModal(false);
      setSelectedPatient(null);
      setForm({ doctorId: "", date: "", time: "", reason: "" });
    },
    onError: () => setBookError("Failed to book appointment. Please try again."),
  });

  const todayAppointments = appointments.filter(a => {
    const d = new Date(a.appointmentDate);
    return d >= today && d < tomorrow;
  });

  const filtered = todayAppointments.filter(a =>
    !search || a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    a.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
    a.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPatients = patients.filter(p =>
    patientSearch.length > 1 && (
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.patientCode?.toLowerCase().includes(patientSearch.toLowerCase())
    )
  );

  const handleBook = () => {
    if (!selectedPatient || !form.doctorId || !form.date || !form.time) {
      setBookError("All fields are required."); return;
    }
    setBookError("");
    const apptDate = new Date(`${form.date}T${form.time}`);
    bookMutation.mutate({
      patientId: selectedPatient.id,
      doctorId: Number(form.doctorId),
      hospitalId: user?.hospitalId ?? null,
      appointmentDate: apptDate.toISOString(),
      reason: form.reason || "General Consultation",
    });
  };

  const stats = [
    { label: "Today's Appointments", value: todayAppointments.length, icon: Calendar, color: "text-blue-500 bg-blue-500/10" },
    { label: "Checked In", value: todayAppointments.filter(a => a.status === "in_progress").length, icon: UserCheck, color: "text-amber-500 bg-amber-500/10" },
    { label: "Completed", value: todayAppointments.filter(a => a.status === "completed").length, icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
    { label: "Scheduled", value: todayAppointments.filter(a => a.status === "scheduled").length, icon: Clock, color: "text-primary bg-primary/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Reception Desk</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <button
          onClick={() => setShowBookModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-md hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
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

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-display font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Today's Queue</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patient or doctor…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No appointments today</p>
            <p className="text-sm text-muted-foreground/70">Book one using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()).map(appt => (
              <div key={appt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {appt.patientName?.charAt(0) || "P"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{appt.patientName || `Patient #${appt.patientId}`}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Stethoscope className="w-3 h-3" />
                    {appt.doctorName || `Doctor #${appt.doctorId}`} — {appt.reason}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                  <Clock className="w-4 h-4" />
                  {format(new Date(appt.appointmentDate), "hh:mm a")}
                </div>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize flex-shrink-0", statusColors[appt.status] || "bg-muted text-muted-foreground")}>
                  {appt.status.replace("_", " ")}
                </span>
                {appt.status === "scheduled" && (
                  <button
                    onClick={() => checkInMutation.mutate(appt.id)}
                    disabled={checkInMutation.isPending}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {checkInMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                    Check In
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-display font-bold text-xl">Book Appointment</h3>
              <button onClick={() => setShowBookModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Patient</label>
                {selectedPatient ? (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{selectedPatient.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedPatient.patientCode}</p>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                      placeholder="Search patient name or ID…"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    />
                    {filteredPatients.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                        {filteredPatients.slice(0, 5).map(p => (
                          <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearch(""); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left">
                            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.patientCode}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Doctor</label>
                <select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select a doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name || `Dr. #${d.id}`} — {d.specialization}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    min={format(new Date(), "yyyy-MM-dd")}
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Reason</label>
                <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. General Consultation, Follow-up"
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              {bookError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {bookError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowBookModal(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleBook} disabled={bookMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {bookMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</> : "Confirm Booking"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
