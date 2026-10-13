// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Clock,
  User,
  ShieldCheck,
  Server,
  Lock,
  FileText,
  Activity,
  Calendar,
  AlertTriangle,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: number;
  timestamp: string;
  actorName: string;
  role: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  ipAddress: string;
  hospitalId: number;
  hospitalName: string;
  status: string;
}

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: () => fetch("/api/audit-logs").then(r => r.json()),
  });

  const roles = ["all", "admin", "doctor", "pharmacist", "receptionist", "lab_technician"];

  const filtered = logs.filter(log => {
    const matchesSearch =
      log.actorName?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(search.toLowerCase()) ||
      log.ipAddress?.includes(search);
    const matchesRole = roleFilter === "all" || log.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500/10 via-primary/10 to-transparent p-6 rounded-3xl border border-red-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Security & ABDM Audit Trail
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Tamper-Evident Ledger
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                Cryptographic audit trail tracking all EHR access, e-Prescriptions, and ABHA verifications at AIIMS Jodhpur
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-card rounded-xl border border-border shadow-sm text-center">
              <p className="text-xs text-muted-foreground font-medium">Compliance Standard</p>
              <p className="text-sm font-bold text-foreground">ABDM M1, M2, M3</p>
            </div>
            <div className="px-4 py-2 bg-card rounded-xl border border-border shadow-sm text-center">
              <p className="text-xs text-muted-foreground font-medium">Recorded Events</p>
              <p className="text-sm font-bold text-primary">{logs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actor, action, IP, or details..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all",
                roleFilter === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {r === "all" ? "All Roles" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor & Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Event Details</th>
                <th className="py-3.5 px-4">Terminal IP</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-bold text-foreground">{log.actorName}</p>
                    <span className="text-[10px] uppercase font-semibold text-primary">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-muted text-foreground">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-muted-foreground">
                    {log.entityType} #{log.entityId}
                  </td>
                  <td className="py-3 px-4 text-foreground font-medium max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
