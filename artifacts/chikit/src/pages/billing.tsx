import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Receipt, Plus, X, IndianRupee, CheckCircle, Clock, AlertCircle, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface LineItem {
  description: string;
  amount: number;
  quantity: number;
}

interface Invoice {
  id: number;
  patientId: number;
  patientName: string | null;
  appointmentId: number | null;
  invoiceNumber: string;
  lineItems: LineItem[];
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  status: string;
  paidAmount: string;
  notes: string | null;
  createdAt: string;
}

interface PatientResult {
  id: number;
  name: string;
  chikitHealthId: string | null;
  phone: string | null;
}

function PatientSearch({ onSelect, selectedId }: { onSelect: (p: PatientResult) => void; selectedId: string }) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: patients } = useQuery({
    queryKey: ["patient-search", q],
    queryFn: async () => {
      if (q.length < 2) return [];
      const res = await fetch(`/api/patients?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.patients || []);
      return (arr as PatientResult[]).slice(0, 8);
    },
    enabled: !!user && q.length >= 2,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selectedId ? `Patient #${selectedId} selected — search to change` : "Search patient by name, phone, or Health ID..."}
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {open && patients && patients.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {patients.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p); setQ(p.name); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-muted/30 text-sm flex justify-between items-center border-b border-border last:border-0"
            >
              <span className="font-medium text-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.chikitHealthId || `#${p.id}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  unpaid: { icon: Clock, color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20", label: "Unpaid" },
  partial: { icon: AlertCircle, color: "bg-orange-500/15 text-orange-400 border-orange-500/20", label: "Partial" },
  paid: { icon: CheckCircle, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", label: "Paid" },
};

export default function Billing() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPatientId, setFilterPatientId] = useState("");
  const [filterPatientName, setFilterPatientName] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [form, setForm] = useState({
    patientId: "",
    appointmentId: "",
    tax: "0",
    discount: "0",
    notes: "",
    lineItems: [{ description: "", amount: 0, quantity: 1 }] as LineItem[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["billing", filterStatus, filterPatientId, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (filterStatus) params.set("status", filterStatus);
      if (filterPatientId) params.set("patientId", filterPatientId);
      const res = await fetch(`/api/billing?${params}`);
      return res.json();
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        patientId: Number(form.patientId),
        appointmentId: form.appointmentId ? Number(form.appointmentId) : null,
        lineItems: form.lineItems.filter(li => li.description && li.amount > 0).map(li => ({
          description: li.description,
          amount: li.amount * li.quantity,
          quantity: li.quantity,
          unitPrice: li.amount,
        })),
        tax: Number(form.tax),
        discount: Number(form.discount),
        notes: form.notes || null,
      };
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
      setShowCreate(false);
      setForm({ patientId: "", appointmentId: "", tax: "0", discount: "0", notes: "", lineItems: [{ description: "", amount: 0, quantity: 1 }] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, paidAmount }: { id: number; status: string; paidAmount?: number }) => {
      const res = await fetch(`/api/billing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paidAmount }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
      setSelectedInvoice(null);
    },
  });

  const invoices: Invoice[] = data?.invoices || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  const subtotal = form.lineItems.reduce((s, li) => s + (li.amount * li.quantity || 0), 0);
  const calcTotal = subtotal + Number(form.tax || 0) - Number(form.discount || 0);

  const addLineItem = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: "", amount: 0, quantity: 1 }] }));
  const removeLineItem = (i: number) => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }));
  const updateLineItem = (i: number, field: keyof LineItem, val: string | number) => {
    setForm(f => ({
      ...f,
      lineItems: f.lineItems.map((li, idx) => idx === i ? { ...li, [field]: field === "description" ? val : Number(val) } : li),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            Billing & Invoices
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{total} invoices</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-2">
          {["", "unpaid", "partial", "paid"].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <PatientSearch
            selectedId={filterPatientId}
            onSelect={(p) => { setFilterPatientId(String(p.id)); setFilterPatientName(p.name); setPage(1); }}
          />
        </div>
        {filterPatientId && (
          <button onClick={() => { setFilterPatientId(""); setFilterPatientName(""); setPage(1); }} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1">
            <X className="w-3 h-3" /> {filterPatientName || `Patient #${filterPatientId}`}
          </button>
        )}
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Create Invoice</h3>
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <PatientSearch
              selectedId={form.patientId}
              onSelect={(p) => setForm(f => ({ ...f, patientId: String(p.id) }))}
            />
            <input type="number" value={form.appointmentId} onChange={e => setForm(f => ({ ...f, appointmentId: e.target.value }))} placeholder="Appointment/Visit ID (optional)" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Line Items</span>
                <button type="button" onClick={addLineItem} className="text-xs text-primary font-medium hover:underline">+ Add Item</button>
              </div>
              {form.lineItems.map((li, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input value={li.description} onChange={e => updateLineItem(i, "description", e.target.value)} placeholder="Description" className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input type="number" value={li.quantity || ""} onChange={e => updateLineItem(i, "quantity", e.target.value)} placeholder="Qty" className="w-20 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input type="number" value={li.amount || ""} onChange={e => updateLineItem(i, "amount", e.target.value)} placeholder="Rate" className="w-28 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <span className="text-sm text-muted-foreground w-20 text-right">{(li.amount * li.quantity).toFixed(2)}</span>
                  {form.lineItems.length > 1 && (
                    <button type="button" onClick={() => removeLineItem(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input type="number" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} placeholder="Tax" className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="Discount" className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="flex items-center justify-end gap-1 text-foreground font-semibold">
                <IndianRupee className="w-4 h-4" />
                {calcTotal.toFixed(2)}
              </div>
            </div>

            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50">
                {createMutation.isPending ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {selectedInvoice && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{selectedInvoice.invoiceNumber}</h3>
            <button onClick={() => setSelectedInvoice(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium ml-1">{selectedInvoice.patientName || `#${selectedInvoice.patientId}`}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium ml-1">{format(new Date(selectedInvoice.createdAt), "dd MMM yyyy")}</span></div>
            <div><span className="text-muted-foreground">Total:</span> <span className="font-medium ml-1 flex items-center gap-0.5 inline-flex"><IndianRupee className="w-3 h-3" />{Number(selectedInvoice.total).toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">Paid:</span> <span className="font-medium ml-1 flex items-center gap-0.5 inline-flex"><IndianRupee className="w-3 h-3" />{Number(selectedInvoice.paidAmount).toFixed(2)}</span></div>
          </div>
          {selectedInvoice.lineItems && (
            <div className="border border-border rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/30 border-b border-border"><th className="text-left px-4 py-2">Item</th><th className="text-right px-4 py-2">Amount</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {(Array.isArray(selectedInvoice.lineItems) ? selectedInvoice.lineItems : []).map((li, i) => (
                    <tr key={i}><td className="px-4 py-2">{li.description}</td><td className="px-4 py-2 text-right">{Number(li.amount).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-3">
            {selectedInvoice.status !== "paid" && (
              <button onClick={() => updateStatusMutation.mutate({ id: selectedInvoice.id, status: "paid", paidAmount: Number(selectedInvoice.total) })} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500">Mark Paid</button>
            )}
            {selectedInvoice.status === "unpaid" && (
              <button onClick={() => updateStatusMutation.mutate({ id: selectedInvoice.id, status: "partial", paidAmount: Number(selectedInvoice.total) / 2 })} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-500">Mark Partial</button>
            )}
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((inv, i) => {
            const sc = statusConfig[inv.status] || statusConfig.unpaid;
            const StatusIcon = sc.icon;
            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedInvoice(inv)}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{inv.patientName || `Patient #${inv.patientId}`} — {format(new Date(inv.createdAt), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1", sc.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                    <span className="text-foreground font-semibold text-sm flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {Number(inv.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {invoices.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No invoices found</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm bg-muted/30 rounded-lg hover:bg-muted/50 disabled:opacity-30">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm bg-muted/30 rounded-lg hover:bg-muted/50 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
