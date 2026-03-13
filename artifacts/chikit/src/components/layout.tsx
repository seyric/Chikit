import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  Activity, Calendar, Users, Building, FileText, 
  Pill, LayoutDashboard, BrainCircuit, ShieldAlert, LogOut 
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getNavItems = (role?: string) => {
  const items = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Medical Records", href: "/medical-records", icon: FileText },
    { name: "Prescriptions", href: "/prescriptions", icon: Pill },
    { name: "Lab & Radiology", href: "/labs", icon: Activity },
    { name: "AI Assistant", href: "/ai-assistant", icon: BrainCircuit, highlight: true },
  ];

  if (role === "admin") {
    items.push({ name: "Doctors", href: "/doctors", icon: Users });
    items.push({ name: "Hospitals", href: "/hospitals", icon: Building });
    items.push({ name: "Audit Logs", href: "/audit-logs", icon: ShieldAlert });
  }

  return items;
};

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = getNavItems(user?.role);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl z-20">
        <div className="h-20 flex items-center px-6 border-b border-sidebar-border gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Chikit Logo" className="w-8 h-8 rounded-lg shadow-md" />
          <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">Chikit</span>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  item.highlight && !isActive && "text-accent border border-accent/20 hover:border-accent/40"
                )}
              >
                <item.icon className={cn("w-5 h-5", item.highlight && "text-accent")} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3 bg-sidebar-accent/50 rounded-xl mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-card border-b border-border flex items-center px-8 justify-between shrink-0 z-10 shadow-sm">
          <h1 className="font-display text-xl font-semibold text-foreground capitalize">
            {location === "/" ? "Overview" : location.split("/")[1].replace("-", " ")}
          </h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-semibold uppercase tracking-wider">
              {user?.hospitalId ? "Hospital Context Active" : "Global Context"}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
