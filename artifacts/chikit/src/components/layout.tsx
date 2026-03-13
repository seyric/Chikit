import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import {
  Activity, Calendar, Users, Building, FileText,
  Pill, LayoutDashboard, BrainCircuit, ShieldAlert, LogOut,
  TestTube, FlaskConical, UserCheck, Stethoscope, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

const getRoleBadge = (role?: string) => {
  const badges: Record<string, { label: string; color: string }> = {
    admin: { label: "Admin", color: "bg-primary/20 text-primary" },
    doctor: { label: "Doctor", color: "bg-accent/20 text-accent" },
    nurse: { label: "Nurse", color: "bg-emerald-500/20 text-emerald-400" },
    lab_technician: { label: "Lab Tech", color: "bg-yellow-500/20 text-yellow-400" },
    pharmacist: { label: "Pharmacist", color: "bg-purple-500/20 text-purple-400" },
    receptionist: { label: "Reception", color: "bg-blue-400/20 text-blue-400" },
    radiology_technician: { label: "Radiology", color: "bg-orange-500/20 text-orange-400" },
    patient: { label: "Patient", color: "bg-sidebar-primary/20 text-sidebar-primary" },
    government_authority: { label: "Gov. Auth.", color: "bg-red-400/20 text-red-400" },
  };
  return badges[role ?? ""] ?? { label: role ?? "User", color: "bg-muted/20 text-sidebar-foreground/60" };
};

const getNavItems = (role?: string) => {
  const common = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Medical Records", href: "/medical-records", icon: FileText },
    { name: "Prescriptions", href: "/prescriptions", icon: Pill },
  ];

  if (role === "lab_technician") {
    return [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Lab Queue", href: "/labs", icon: TestTube, highlight: false },
      { name: "Reports", href: "/lab-reports", icon: FlaskConical },
      { name: "AI Assistant", href: "/ai-assistant", icon: BrainCircuit, highlight: true },
    ];
  }

  if (role === "pharmacist") {
    return [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Pharmacy Queue", href: "/prescriptions", icon: Pill },
      { name: "Patients", href: "/patients", icon: Users },
    ];
  }

  if (role === "receptionist") {
    return [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Patients", href: "/patients", icon: Users },
      { name: "Appointments", href: "/appointments", icon: Calendar },
      { name: "Register Patient", href: "/patients/register", icon: UserCheck },
    ];
  }

  if (role === "nurse") {
    return [
      ...common,
      { name: "Lab & Radiology", href: "/labs", icon: Activity },
      { name: "AI Assistant", href: "/ai-assistant", icon: BrainCircuit, highlight: true },
    ];
  }

  if (role === "doctor") {
    return [
      ...common,
      { name: "Lab & Radiology", href: "/labs", icon: Activity },
      { name: "AI Assistant", href: "/ai-assistant", icon: BrainCircuit, highlight: true },
    ];
  }

  if (role === "admin" || role === "government_authority") {
    return [
      ...common,
      { name: "Lab & Radiology", href: "/labs", icon: Activity },
      { name: "AI Assistant", href: "/ai-assistant", icon: BrainCircuit, highlight: true },
      { name: "Doctors", href: "/doctors", icon: Stethoscope },
      { name: "Hospitals", href: "/hospitals", icon: Building },
      { name: "Audit Logs", href: "/audit-logs", icon: ShieldAlert },
    ];
  }

  return [
    ...common,
    { name: "Lab & Radiology", href: "/labs", icon: Activity },
    { name: "AI Assistant", href: "/ai-assistant", icon: BrainCircuit, highlight: true },
  ];
};

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = getNavItems(user?.role);
  const roleBadge = getRoleBadge(user?.role);

  const pageTitle = location === "/"
    ? "Overview"
    : location.split("/").filter(Boolean).map(s => s.replace(/-/g, " ")).join(" / ");

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl z-20 shrink-0">
        {/* Logo */}
        <div className="h-18 flex items-center px-6 py-5 border-b border-sidebar-border gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-sidebar-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-sidebar-foreground">Chikit</span>
        </div>

        {/* Nav */}
        <div className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 font-medium text-sm",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  (item as any).highlight && !isActive && "text-sidebar-primary/90 border border-sidebar-primary/20 hover:border-sidebar-primary/40"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", (item as any).highlight && !isActive && "text-sidebar-primary")} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border space-y-1.5">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-sidebar-accent/40 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center font-bold text-sidebar-primary text-sm shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">{user?.name}</p>
              <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", roleBadge.color)}>
                {roleBadge.label}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/55 hover:bg-destructive/15 hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-card border-b border-border flex items-center px-8 h-16 justify-between shrink-0 shadow-sm">
          <h1 className="font-display text-lg font-semibold text-foreground capitalize">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            {user?.hospitalId && (
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Building className="w-3 h-3" />
                Hospital #{user.hospitalId}
              </span>
            )}
            <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold", roleBadge.color)}>
              {roleBadge.label}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
