// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Search,
  Phone,
  Mail,
  Building,
  CheckCircle,
  Clock,
  Calendar,
  Award,
  Filter,
  UserCheck,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface Doctor {
  id: number;
  userId: number;
  hospitalId: number;
  name: string;
  email: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  phone: string;
  isAvailable: boolean;
  opdRoom: string;
  opdTimings: string;
  hospitalName: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
}

export default function Doctors() {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  const { data: doctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["doctors"],
    queryFn: () => fetch("/api/doctors").then(r => r.json()),
  });

  const departments = [
    "all",
    ...Array.from(new Set(doctors.map(d => d.department))).filter(Boolean)
  ];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch =
      doc.name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      doc.department?.toLowerCase().includes(search.toLowerCase()) ||
      doc.licenseNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === "all" || doc.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-transparent p-6 rounded-3xl border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shadow-inner">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  AIIMS Jodhpur Faculty & Doctors
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Apex Institute
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                Senior Consultants, Professors & Specialists across all clinical departments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-card rounded-xl border border-border shadow-sm text-center">
              <p className="text-xs text-muted-foreground font-medium">Total Specialists</p>
              <p className="text-lg font-bold text-foreground">{doctors.length}</p>
            </div>
            <div className="px-4 py-2 bg-card rounded-xl border border-border shadow-sm text-center">
              <p className="text-xs text-muted-foreground font-medium">On Duty Now</p>
              <p className="text-lg font-bold text-emerald-600">
                {doctors.filter(d => d.isAvailable).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search doctor, specialty, room..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>

        {/* Department Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all",
                selectedDept === dept
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {dept === "all" ? "All Departments" : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doc, idx) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-lg shadow-inner group-hover:scale-105 transition-transform">
                    {doc.name?.split(" ").slice(-1)[0]?.charAt(0) || "D"}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      {doc.specialization}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
                    doc.isAvailable
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      doc.isAvailable ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  {doc.isAvailable ? "Available" : "In Rounds"}
                </span>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground border-t border-border/60 pt-3">
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                  <span className="truncate">{doc.qualification || "Super-Specialist"} · {doc.experienceYears || 15}+ Yrs Exp</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                  <span className="truncate font-medium text-foreground">{doc.opdRoom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                  <span>{doc.opdTimings}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                  <span className="font-mono">{doc.licenseNumber}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
              <a
                href={`tel:${doc.phone}`}
                className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition"
                title="Call doctor"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${doc.email}`}
                className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition"
                title="Email doctor"
              >
                <Mail className="w-4 h-4" />
              </a>
              <Link
                href={`/appointments?doctorId=${doc.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" /> Book Consultation
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
