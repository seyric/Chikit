import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Building2, MapPin, Phone, Globe, Bed, Stethoscope, Filter, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const API_BASE = "/api";

interface Hospital {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  district?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  type: string;
  category?: string;
  careType?: string;
  discipline?: string;
  specialties?: string;
  bedCount?: number;
  numDoctors?: number;
  location?: string;
  sourceId?: string;
  isActive: boolean;
}

interface HospitalsResponse {
  hospitals: Hospital[];
  total: number;
  page: number;
  limit: number;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return null;
  const cat = category.toLowerCase();
  let variant: "default" | "secondary" | "outline" = "outline";
  if (cat.includes("government") || cat.includes("govt")) variant = "default";
  else if (cat.includes("private")) variant = "secondary";
  return <Badge variant={variant} className="text-xs">{category}</Badge>;
}

export default function HospitalDirectory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
    ...(search ? { search } : {}),
    ...(selectedState ? { state: selectedState } : {}),
    ...(selectedCategory ? { category: selectedCategory } : {}),
  });

  const { data, isLoading, isFetching } = useQuery<HospitalsResponse>({
    queryKey: ["hospitals", search, selectedState, selectedCategory, page],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hospitals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch hospitals");
      return res.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/hospitals/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: (result) => {
      toast({ title: "Import Successful", description: `${result.imported?.toLocaleString()} hospitals imported from the national registry.` });
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
    },
    onError: (err: any) => {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const hospitals = data?.hospitals ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hospital Directory</h1>
          <p className="text-muted-foreground mt-1">
            {total > 0 ? `${total.toLocaleString()} hospitals` : "National hospital registry"}
          </p>
        </div>
        <Button
          onClick={() => importMutation.mutate()}
          disabled={importMutation.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          <Upload className="w-4 h-4 mr-2" />
          {importMutation.isPending ? "Importing..." : "Import National Registry"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search hospital name, city, district..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Select value={selectedState} onValueChange={(v) => { setSelectedState(v === "_all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All States</SelectItem>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v === "_all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Categories</SelectItem>
                <SelectItem value="Government">Government</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Trust">Trust / NGO</SelectItem>
                <SelectItem value="Municipal">Municipal</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import prompt */}
      {total === 0 && !isLoading && (
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-primary/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hospitals in directory</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Import the national hospital registry to populate the directory with 30,000+ hospitals from across India.
            </p>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importMutation.isPending ? "Importing hospitals..." : "Import National Registry (30,274 hospitals)"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {(isLoading || isFetching) && total === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Hospital cards */}
      {hospitals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitals.map((hospital) => (
            <Card key={hospital.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                      {hospital.name}
                    </CardTitle>
                  </div>
                  <CategoryBadge category={hospital.category} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                  <span className="line-clamp-2">
                    {[hospital.district, hospital.city, hospital.state, hospital.pincode]
                      .filter(Boolean).join(", ")}
                  </span>
                </div>
                {hospital.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3 shrink-0 text-primary" />
                    <span className="truncate">{hospital.phone}</span>
                  </div>
                )}
                {(hospital.bedCount || hospital.numDoctors) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {hospital.bedCount && (
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3 text-primary" />
                        {hospital.bedCount} beds
                      </span>
                    )}
                    {hospital.numDoctors && (
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-primary" />
                        {hospital.numDoctors} doctors
                      </span>
                    )}
                  </div>
                )}
                {hospital.specialties && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">
                    {hospital.specialties}
                  </p>
                )}
                {hospital.careType && (
                  <Badge variant="outline" className="text-xs">{hospital.careType}</Badge>
                )}
                {hospital.website && (
                  <a
                    href={hospital.website.startsWith("http") ? hospital.website : `https://${hospital.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                  >
                    <Globe className="w-3 h-3" />
                    {hospital.website}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()} hospitals
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages.toLocaleString()}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
