import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Heart, FileText, Pill, TestTube, Calendar, ShieldCheck,
  LogOut, Clock, ChevronRight, Activity, Bell, Loader2,
  CheckCircle, XCircle, AlertTriangle, HeartPulse, Thermometer,
  Building, Plus, Fingerprint
} from "lucide-react";
import { AbhaPanel } from "@/components/AbhaCard";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "My Health", href: "/patient-portal", icon: Heart },
  { name: "ABHA Health ID", href: "/patient-portal/abha", icon: Fingerprint },
  { name: "Appointments", href: "/patient-portal/appointments", icon: Calendar },
  { name: "Medical Records", href: "/patient-portal/records", icon: FileText },
  { name: "Prescriptions", href: "/patient-portal/prescriptions", icon: Pill },
  { name: "Lab Results", href: "/patient-portal/labs", icon: TestTube },
  { name: "Consents", href: "/patient-portal/consents", icon: ShieldCheck },
];

function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl z-20 shrink-0">
        <div className="flex items-center px-6 py-5 border-b border-sidebar-border gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-sidebar-primary" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-sidebar-foreground">Chikit</span>
            <p className="text-xs text-sidebar-foreground/50">Patient Portal</p>
          </div>
        </div>
        <div className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/patient-portal" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 font-medium text-sm",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="p-3 border-t border-sidebar-border space-y-1.5">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-sidebar-accent/40 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center font-bold text-sidebar-primary text-sm shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "P"}
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50">Patient</p>
            </div>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/55 hover:bg-destructive/15 hover:text-red-400 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-card border-b border-border flex items-center px-8 h-16 justify-between shrink-0 shadow-sm">
          <h1 className="font-display text-lg font-semibold text-foreground">
            {navItems.find(n => n.href === location || (n.href !== "/patient-portal" && location.startsWith(n.href)))?.name ?? "Patient Portal"}
          </h1>
          <button className="relative p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}

function PatientHome() {
  const { user } = useAuth();
  const { data: appointments = [] } = useQuery<unknown[]>({
    queryKey: ["patient-appointments"],
    queryFn: () => fetch("/api/appointments").then(r => r.json()),
    enabled: !!user,
  });
  const { data: prescriptions = [] } = useQuery<unknown[]>({
    queryKey: ["patient-prescriptions"],
    queryFn: () => fetch("/api/prescriptions").then(r => r.json()),
    enabled: !!user,
  });
  const { data: labReports = [] } = useQuery<unknown[]>({
    queryKey: ["patient-labs"],
    queryFn: () => fetch("/api/lab-reports").then(r => r.json()),
    enabled: !!user,
  });

  const quickActions = [
    { icon: Calendar, label: "Book Appointment", href: "/patient-portal/appointments", color: "bg-primary/10 text-primary" },
    { icon: Fingerprint, label: "ABHA Health ID", href: "/patient-portal/abha", color: "bg-green-500/10 text-green-600" },
    { icon: Pill, label: "My Prescriptions", href: "/patient-portal/prescriptions", color: "bg-accent/10 text-accent" },
    { icon: TestTube, label: "Lab Results", href: "/patient-portal/labs", color: "bg-yellow-500/10 text-yellow-600" },
    { icon: ShieldCheck, label: "Manage Consents", href: "/patient-portal/consents", color: "bg-emerald-500/10 text-emerald-600" },
  ];

  const healthStats = [
    { label: "Appointments", value: appointments.length, icon: Activity },
    { label: "Active Prescriptions", value: (prescriptions as unknown[]).filter((p: unknown) => (p as Record<string, unknown>).status === "active").length, icon: Pill },
    { label: "Pending Lab Results", value: (labReports as unknown[]).filter((l: unknown) => (l as Record<string, unknown>).status === "pending").length, icon: TestTube },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-gradient-to-r from-primary to-accent text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-2xl">
            {user?.name?.charAt(0)?.toUpperCase() || "P"}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h2>
            <p className="text-white/80 text-sm mt-0.5">Your health summary</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/60 text-xs">Chikit Health ID</p>
            <p className="font-mono font-bold text-white">CHK-{new Date().getFullYear()}-{String(user?.id ?? 0).padStart(6, "0")}</p>
          </div>
        </div>
      </motion.div>
      <div className="grid grid-cols-3 gap-4">
        {healthStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link href={action.href} className="flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:shadow-md hover:border-primary/30 transition-all group text-center">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.color)}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{action.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MyAppointments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showBook, setShowBook] = useState(false);
  const [form, setForm] = useState({ hospitalId: "", date: "", time: "", reason: "" });

  const { data: appointments = [], isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["patient-appointments"],
    queryFn: () => fetch("/api/appointments").then(r => r.json()),
    enabled: !!user,
  });
  const { data: hospitals = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ["hospitals-list"],
    queryFn: () => fetch("/api/hospitals?limit=50").then(r => r.json()).then((data: unknown) => (data as Record<string, unknown>).hospitals || []),
    enabled: showBook,
  });

  const bookMutation = useMutation({
    mutationFn: () => fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hospitalId: form.hospitalId ? Number(form.hospitalId) : null,
        appointmentDate: new Date(`${form.date}T${form.time}`).toISOString(),
        reason: form.reason || "General Consultation",
      }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-appointments"] });
      setShowBook(false);
    },
  });

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-xl">My Appointments</h3>
        <button onClick={() => setShowBook(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition">
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {showBook && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h4 className="font-semibold">New Appointment</h4>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hospital</label>
            <select value={form.hospitalId} onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Any Hospital</option>
              {hospitals.slice(0, 20).map((h) => (
                <option key={String(h.id)} value={String(h.id)}>{String(h.name)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Time</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Reason</label>
            <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Fever, follow-up, routine checkup"
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowBook(false)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending || !form.date || !form.time}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {bookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Book"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : appointments.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center bg-card rounded-2xl border border-dashed">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No appointments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(appt => (
              <div key={String(appt.id)} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{String(appt.reason || "Appointment")}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(String(appt.appointmentDate)), "MMM d, yyyy · h:mm a")}</span>
                    {appt.hospitalName && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{String(appt.hospitalName)}</span>}
                  </div>
                </div>
                <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full capitalize flex-shrink-0", statusColors[String(appt.status)] || "bg-muted text-muted-foreground")}>
                  {String(appt.status).replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function MyRecords() {
  const { user } = useAuth();
  const { data: records = [], isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["patient-medical-records"],
    queryFn: () => fetch("/api/medical-records").then(r => r.json()),
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-xl">Medical Records</h3>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : records.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center bg-card rounded-2xl border border-dashed">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No medical records yet</p>
          </div>
        ) : records.map(record => (
          <div key={String(record.id)} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold">{String(record.chiefComplaint || "Visit")}</h4>
                <p className="text-sm text-muted-foreground">{format(new Date(String(record.visitDate)), "MMMM d, yyyy")}{record.doctorName ? ` • Dr. ${record.doctorName}` : ""}</p>
              </div>
            </div>
            {record.diagnosis && <p className="text-sm"><span className="font-semibold text-muted-foreground">Diagnosis: </span>{String(record.diagnosis)}</p>}
            {record.vitalSigns && Object.keys(record.vitalSigns as object).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {(record.vitalSigns as Record<string, unknown>).bloodPressure && (
                  <span className="flex items-center gap-1.5 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium">
                    <HeartPulse className="w-3.5 h-3.5" /> {String((record.vitalSigns as Record<string, unknown>).bloodPressure)}
                  </span>
                )}
                {(record.vitalSigns as Record<string, unknown>).temperature && (
                  <span className="flex items-center gap-1.5 text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg font-medium">
                    <Thermometer className="w-3.5 h-3.5" /> {String((record.vitalSigns as Record<string, unknown>).temperature)}°C
                  </span>
                )}
                {(record.vitalSigns as Record<string, unknown>).heartRate && (
                  <span className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
                    <Activity className="w-3.5 h-3.5" /> {String((record.vitalSigns as Record<string, unknown>).heartRate)} bpm
                  </span>
                )}
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
}

function MyPrescriptions() {
  const { user } = useAuth();
  const { data: prescriptions = [], isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["patient-prescriptions-list"],
    queryFn: () => fetch("/api/prescriptions").then(r => r.json()),
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-xl">My Prescriptions</h3>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : prescriptions.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center bg-card rounded-2xl border border-dashed">
            <Pill className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No prescriptions yet</p>
          </div>
        ) : prescriptions.map(rx => (
          <div key={String(rx.id)} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold">{String(rx.diagnosis || "Prescription")}</h4>
                <p className="text-sm text-muted-foreground">{format(new Date(String(rx.prescriptionDate)), "MMMM d, yyyy")}{rx.doctorName ? ` • Dr. ${rx.doctorName}` : ""}</p>
              </div>
              <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full",
                String(rx.status) === "active" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              )}>{String(rx.status)}</span>
            </div>
            <ul className="space-y-2">
              {((rx.medications as unknown[]) || []).map((m: unknown, i: number) => {
                const med = m as Record<string, string>;
                return (
                  <li key={i} className="flex gap-3 text-sm bg-muted/30 px-3 py-2 rounded-xl">
                    <Pill className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><b>{med.name}</b> — {med.dosage}, {med.frequency} for {med.duration}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      }
    </div>
  );
}

function MyLabResults() {
  const { user } = useAuth();
  const { data: labs = [], isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["patient-labs-list"],
    queryFn: () => fetch("/api/lab-reports").then(r => r.json()),
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-xl">Lab Results</h3>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : labs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center bg-card rounded-2xl border border-dashed">
            <TestTube className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No lab results yet</p>
          </div>
        ) : labs.map(lab => (
          <div key={String(lab.id)} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">{String(lab.testName)}</h4>
                <p className="text-sm text-muted-foreground">{format(new Date(String(lab.testDate)), "MMMM d, yyyy")}</p>
              </div>
              <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full",
                String(lab.status) === "completed" ? "bg-green-100 text-green-700" :
                String(lab.status) === "in_progress" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
              )}>{String(lab.status)}</span>
            </div>
            {lab.interpretation && (
              <p className="mt-3 text-sm text-foreground bg-muted/30 p-3 rounded-xl">{String(lab.interpretation)}</p>
            )}
          </div>
        ))
      }
    </div>
  );
}

function MyAbha({ userId }: { userId?: number }) {
  const { user } = useAuth();
  const { data: abhaMe, isLoading } = useQuery<{
    patientId: number | null;
    abhaNumber: string | null;
    abhaVerified: boolean;
    name: string;
  }>({
    queryKey: ["abha-me"],
    queryFn: () => fetch("/api/abha/me").then(r => r.json()),
    enabled: !!user,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-bold text-xl">ABHA Health ID</h3>
        <p className="text-sm text-muted-foreground mt-1">Your Ayushman Bharat Health Account — Government of India's national health identity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">What is ABHA?</p>
          <p className="text-sm text-foreground leading-relaxed">
            ABHA (Ayushman Bharat Health Account) is a 14-digit unique health ID issued by the Government of India under the National Digital Health Mission (ABDM). It enables seamless sharing of your health records across all participating hospitals.
          </p>
          <div className="flex flex-col gap-1.5 pt-2">
            {["Access records at any ABDM-connected hospital", "One ID for all your health records", "Consent-based, secure data sharing", "Recognised by all government health schemes"].map(b => (
              <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                {b}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Your ABHA Status</p>
          {abhaMe?.abhaVerified && abhaMe?.abhaNumber ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">Active & Verified</span>
              </div>
              <p className="font-mono text-xl font-bold">{abhaMe.abhaNumber}</p>
              <p className="text-white/70 text-sm">Your ABHA is linked and active</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-white/70" />
                <span className="font-bold">Not Enrolled</span>
              </div>
              <p className="text-white/70 text-sm">Enroll below to get your free national health ID</p>
            </div>
          )}
        </div>
      </div>

      {abhaMe?.patientId ? (
        <AbhaPanel patientId={abhaMe.patientId} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
          <Fingerprint className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <div>
            <p className="font-semibold">Complete Your Patient Registration First</p>
            <p className="text-sm text-muted-foreground mt-1">Your ABHA needs to be linked to your clinical record. Please visit any Chikit-enabled hospital to complete patient registration, then return here to enroll your ABHA.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MyConsents() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: consents = [], isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["patient-consents"],
    queryFn: () => fetch("/api/consent-requests").then(r => r.json()),
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => fetch(`/api/consent-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient-consents"] }),
  });

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-xl">Consent Requests</h3>
      <p className="text-sm text-muted-foreground">Manage which hospitals can access your health records</p>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : consents.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center bg-card rounded-2xl border border-dashed">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No consent requests</p>
          </div>
        ) : consents.map(consent => (
          <div key={String(consent.id)} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h4 className="font-bold">Record Access Request</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {String(consent.scope || "Full health record access")} •{" "}
                  {format(new Date(String(consent.createdAt)), "MMM d, yyyy")}
                </p>
                {String(consent.status) === "pending" && (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-700 font-medium">Awaiting your approval</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {String(consent.status) === "pending" ? (
                  <>
                    <button onClick={() => respondMutation.mutate({ id: Number(consent.id), status: "denied" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition">
                      <XCircle className="w-4 h-4" /> Deny
                    </button>
                    <button onClick={() => respondMutation.mutate({ id: Number(consent.id), status: "approved" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                  </>
                ) : (
                  <span className={cn("px-3 py-1.5 text-xs font-bold rounded-lg",
                    String(consent.status) === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>{String(consent.status)}</span>
                )}
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

export default function PatientPortal() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) { window.location.href = "/login"; return null; }

  const renderContent = () => {
    if (location === "/patient-portal" || location === "/patient-portal/") return <PatientHome />;
    if (location.startsWith("/patient-portal/abha")) return <MyAbha userId={user?.id} />;
    if (location.startsWith("/patient-portal/appointments")) return <MyAppointments />;
    if (location.startsWith("/patient-portal/records")) return <MyRecords />;
    if (location.startsWith("/patient-portal/prescriptions")) return <MyPrescriptions />;
    if (location.startsWith("/patient-portal/labs")) return <MyLabResults />;
    if (location.startsWith("/patient-portal/consents")) return <MyConsents />;
    return <PatientHome />;
  };

  return <PatientLayout>{renderContent()}</PatientLayout>;
}
