import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Plus, UserCircle, Loader2, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

const API_BASE = "/api";

export default function Patients() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients", debouncedSearch],
    queryFn: async () => {
      const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";
      const res = await fetch(`${API_BASE}/patients${params}`);
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
    enabled: !!user,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    clearTimeout((window as any).__searchTimeout);
    (window as any).__searchTimeout = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, code, phone, or Chikit Health ID..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
        <Link href="/patients/register">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all whitespace-nowrap">
            <Plus className="w-5 h-5" /> Register Patient
          </button>
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50 text-muted-foreground text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">Patient</th>
                <th className="p-4">Chikit ID</th>
                <th className="p-4">Code</th>
                <th className="p-4">Age/DOB</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {patients?.map((p: any) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <Link href={`/patients/${p.id}`} className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</span>
                    </Link>
                  </td>
                  <td className="p-4">
                    {p.chikitHealthId ? (
                      <span className="flex items-center gap-1 text-primary font-mono text-xs font-semibold">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {p.chikitHealthId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground font-mono text-sm">{p.patientCode}</td>
                  <td className="p-4 text-foreground text-sm">
                    {p.dateOfBirth ? format(new Date(p.dateOfBirth), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="p-4 capitalize text-foreground text-sm">{p.gender}</td>
                  <td className="p-4 text-foreground text-sm">{p.phone || '—'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {patients?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No patients found.</p>
                    <p className="text-sm mt-1">Use "Register Patient" to add a new patient with a Chikit Health ID.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
