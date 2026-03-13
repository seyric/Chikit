import { useState } from "react";
import { useListPatients, useCreatePatient, CreatePatientRequestGender } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, Plus, UserCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Patients() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: patients, isLoading, refetch } = useListPatients({ search });
  
  const createPatient = useCreatePatient();
  const [formData, setFormData] = useState({
    name: "", dateOfBirth: "", gender: "other" as CreatePatientRequestGender, phone: ""
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPatient.mutateAsync({ data: formData });
    setIsModalOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients by name or code..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Patient
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50 text-muted-foreground text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">Patient</th>
                <th className="p-4">Code</th>
                <th className="p-4">Age/DOB</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {patients?.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <Link href={`/patients/${p.id}`} className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</span>
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground font-mono text-sm">{p.patientCode}</td>
                  <td className="p-4 text-foreground">{format(new Date(p.dateOfBirth), 'MMM d, yyyy')}</td>
                  <td className="p-4 capitalize text-foreground">{p.gender}</td>
                  <td className="p-4 text-foreground">{p.phone || '-'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {patients?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-display text-xl font-bold">Add New Patient</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Date of Birth</label>
                <input required type="date" value={formData.dateOfBirth} onChange={e=>setFormData({...formData, dateOfBirth: e.target.value})} className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Gender</label>
                <select value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value as CreatePatientRequestGender})} className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-border font-semibold hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createPatient.isPending} className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                  {createPatient.isPending ? "Saving..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
