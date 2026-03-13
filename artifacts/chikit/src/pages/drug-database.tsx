import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Search, Pill, AlertTriangle, ChevronDown, ChevronUp, Loader2, X, ShieldAlert, Baby, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Drug {
  id: number;
  name: string;
  genericName: string;
  brandNames: string[];
  drugClass: string;
  dosageForms: string[];
  strength: string | null;
  contraindications: string[];
  sideEffects: string[];
  pregnancyRisk: string | null;
  interactions: string[];
}

const ITEMS_PER_PAGE = 20;

const riskColor: Record<string, string> = {
  A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-yellow-100 text-yellow-700",
  "C/D": "bg-orange-100 text-orange-700",
  "D/X": "bg-red-100 text-red-700",
  D: "bg-red-100 text-red-700",
  X: "bg-red-200 text-red-800",
};

function DrugDetailModal({ drug, onClose }: { drug: Drug; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pill className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">{drug.name}</h2>
              <p className="text-sm text-muted-foreground">{drug.genericName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Drug Class</p>
              <p className="text-sm font-medium">{drug.drugClass}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Strength</p>
              <p className="text-sm font-medium">{drug.strength || "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Brand Names</p>
            <div className="flex flex-wrap gap-1.5">
              {drug.brandNames.map((b, i) => (
                <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">{b}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Dosage Forms</p>
            <div className="flex flex-wrap gap-1.5">
              {drug.dosageForms.map((f, i) => (
                <span key={i} className="px-2.5 py-1 bg-muted text-foreground text-xs font-medium rounded-full">{f}</span>
              ))}
            </div>
          </div>

          {drug.contraindications.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-destructive" /> Contraindications</p>
              <ul className="text-sm space-y-1.5">
                {drug.contraindications.map((c, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />{c}</li>
                ))}
              </ul>
            </div>
          )}

          {drug.sideEffects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Common Side Effects</p>
              <div className="flex flex-wrap gap-1.5">
                {drug.sideEffects.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {drug.interactions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Known Drug Interactions</p>
              <div className="flex flex-wrap gap-1.5">
                {drug.interactions.map((int, i) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">{int}</span>
                ))}
              </div>
            </div>
          )}

          {drug.pregnancyRisk && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
              <Baby className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold">Pregnancy Risk Category:</span>{" "}
                <span className={cn("font-bold", drug.pregnancyRisk === "X" || drug.pregnancyRisk === "D" ? "text-destructive" : "text-foreground")}>
                  {drug.pregnancyRisk}
                </span>
                {drug.pregnancyRisk === "X" && " — Contraindicated in pregnancy"}
                {drug.pregnancyRisk === "D" && " — Evidence of fetal risk"}
                {drug.pregnancyRisk === "C" && " — Risk cannot be ruled out"}
                {drug.pregnancyRisk === "B" && " — No evidence of risk in humans"}
                {drug.pregnancyRisk === "A" && " — Safe in pregnancy"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DrugCard({ drug, onViewDetail }: { drug: Drug; onViewDetail: () => void }) {
  return (
    <div
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onViewDetail}
    >
      <div className="flex items-center gap-4 p-5">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Pill className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground">{drug.name}</h3>
            {drug.strength && <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">{drug.strength}</span>}
          </div>
          <p className="text-sm text-muted-foreground truncate">{drug.genericName} &bull; {drug.drugClass}</p>
          {drug.brandNames.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 truncate">Brands: {drug.brandNames.slice(0, 3).join(", ")}{drug.brandNames.length > 3 ? ` +${drug.brandNames.length - 3}` : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {drug.pregnancyRisk && (
            <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1", riskColor[drug.pregnancyRisk] || "bg-muted text-muted-foreground")}>
              <Baby className="w-3 h-3" /> {drug.pregnancyRisk}
            </span>
          )}
          {drug.interactions.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {drug.interactions.length}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function DrugDatabase() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    clearTimeout((window as Record<string, unknown>).__drugSearchTimer as ReturnType<typeof setTimeout>);
    (window as Record<string, unknown>).__drugSearchTimer = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const { data: drugs = [], isLoading } = useQuery<Drug[]>({
    queryKey: ["drugs", debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      params.set("limit", "200");
      return fetch(`/api/drugs?${params}`).then(r => r.json());
    },
    enabled: !!user,
  });

  const drugClasses = [...new Set(drugs.map(d => d.drugClass))].sort();
  const filtered = filterClass ? drugs.filter(d => d.drugClass === filterClass) : drugs;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedDrugs = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Drug Database</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Search {drugs.length}+ Indian medicines by name, generic, brand, or class</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by drug name, generic name, brand, or class…"
            className="w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <select
          value={filterClass}
          onChange={e => { setFilterClass(e.target.value); setPage(1); }}
          className="px-3 py-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-64"
        >
          <option value="">All Drug Classes</option>
          {drugClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-dashed border-border">
          <Pill className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-muted-foreground">No drugs found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} drug{filtered.length !== 1 ? "s" : ""}
          </p>
          {paginatedDrugs.map(drug => (
            <DrugCard key={drug.id} drug={drug} onViewDetail={() => setSelectedDrug(drug)} />
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "w-9 h-9 text-sm font-medium rounded-lg transition",
                        page === pageNum ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {selectedDrug && <DrugDetailModal drug={selectedDrug} onClose={() => setSelectedDrug(null)} />}
    </div>
  );
}
