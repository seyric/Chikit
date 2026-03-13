import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Heart, FileText, Pill, TestTube, Calendar, ShieldCheck,
  LogOut, User, Clock, ChevronRight, Activity, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "My Health", href: "/patient-portal", icon: Heart },
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
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 font-medium text-sm",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
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
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-card border-b border-border flex items-center px-8 h-16 justify-between shrink-0 shadow-sm">
          <h1 className="font-display text-lg font-semibold text-foreground">
            {navItems.find(n => n.href === location)?.name ?? "Patient Portal"}
          </h1>
          <button className="relative p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function PatientHome() {
  const { user } = useAuth();

  const quickActions = [
    { icon: Calendar, label: "Book Appointment", href: "/patient-portal/appointments", color: "bg-primary/10 text-primary" },
    { icon: Pill, label: "My Prescriptions", href: "/patient-portal/prescriptions", color: "bg-accent/10 text-accent" },
    { icon: TestTube, label: "Lab Results", href: "/patient-portal/labs", color: "bg-yellow-500/10 text-yellow-600" },
    { icon: ShieldCheck, label: "Manage Consents", href: "/patient-portal/consents", color: "bg-emerald-500/10 text-emerald-600" },
  ];

  const healthStats = [
    { label: "Visits This Year", value: "4", icon: Activity, trend: "+1" },
    { label: "Active Prescriptions", value: "2", icon: Pill, trend: "" },
    { label: "Pending Lab Results", value: "1", icon: TestTube, trend: "" },
    { label: "Upcoming Appointments", value: "1", icon: Calendar, trend: "" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-gradient-to-r from-primary to-accent text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-2xl">
            {user?.name?.charAt(0)?.toUpperCase() || "P"}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h2>
            <p className="text-white/80 text-sm mt-0.5">Your health summary for today</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/60 text-xs">Chikit Health ID</p>
            <p className="font-mono font-bold text-white">CHK-2025-{String(user?.id ?? 0).padStart(6, "0")}</p>
          </div>
        </div>
      </motion.div>

      {/* Health stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {healthStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-card-border rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              {stat.trend && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{stat.trend}</span>}
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link href={action.href} className="flex flex-col items-center gap-3 p-5 bg-card border border-card-border rounded-2xl hover:shadow-md hover:border-primary/30 transition-all group text-center">
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

      {/* Recent Activity */}
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-4">Recent Activity</h3>
        <div className="bg-card border border-card-border rounded-2xl divide-y divide-border">
          {[
            { icon: TestTube, color: "text-yellow-600 bg-yellow-500/10", title: "Blood Panel Results Ready", time: "2 days ago", detail: "View your CBC and lipid profile results" },
            { icon: Pill, color: "text-accent bg-accent/10", title: "Prescription Renewed", time: "1 week ago", detail: "Metformin 500mg - 30 tablets" },
            { icon: Calendar, color: "text-primary bg-primary/10", title: "Appointment Completed", time: "2 weeks ago", detail: "Dr. Priya Sharma — General Consultation" },
            { icon: ShieldCheck, color: "text-emerald-600 bg-emerald-500/10", title: "Consent Granted", time: "1 month ago", detail: "City General Hospital — Record Access" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                {item.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-primary" />
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-sm">This section is being built as part of the clinical workflow completion phase.</p>
    </div>
  );
}

export default function PatientPortal() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const renderContent = () => {
    if (location === "/patient-portal" || location === "/patient-portal/") return <PatientHome />;
    if (location.startsWith("/patient-portal/appointments")) return <ComingSoon title="My Appointments" />;
    if (location.startsWith("/patient-portal/records")) return <ComingSoon title="Medical Records" />;
    if (location.startsWith("/patient-portal/prescriptions")) return <ComingSoon title="My Prescriptions" />;
    if (location.startsWith("/patient-portal/labs")) return <ComingSoon title="Lab Results" />;
    if (location.startsWith("/patient-portal/consents")) return <ComingSoon title="Consent Management" />;
    return <PatientHome />;
  };

  return <PatientLayout>{renderContent()}</PatientLayout>;
}
