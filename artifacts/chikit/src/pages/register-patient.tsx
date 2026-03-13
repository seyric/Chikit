import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { UserPlus, CreditCard, Heart, Phone, CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const API_BASE = "/api";

interface NewPatient {
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies: string;
  chronicConditions: string;
  govtIdType: string;
  govtIdNumber: string;
}

const GOVT_ID_TYPES = ["Aadhaar", "PAN", "Passport", "Voter ID", "Driving License", "ABHA / Health ID"];

export default function RegisterPatient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [form, setForm] = useState<NewPatient>({
    name: "", dateOfBirth: "", gender: "", bloodGroup: "", phone: "", email: "",
    address: "", emergencyContact: "", emergencyPhone: "", allergies: "",
    chronicConditions: "", govtIdType: "", govtIdNumber: "",
  });
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdPatient, setCreatedPatient] = useState<any>(null);

  const set = (field: keyof NewPatient) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const registerMutation = useMutation({
    mutationFn: async (data: NewPatient) => {
      const res = await fetch(`${API_BASE}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: (patient) => {
      setCreatedPatient(patient);
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dateOfBirth || !form.gender || !form.phone) {
      toast({ title: "Required fields missing", description: "Please fill in name, date of birth, gender, and phone.", variant: "destructive" });
      return;
    }
    registerMutation.mutate(form);
  };

  const copyId = () => {
    navigator.clipboard.writeText(createdPatient?.chikitHealthId ?? "");
    toast({ title: "Copied!", description: "Chikit Health ID copied to clipboard." });
  };

  if (step === "success" && createdPatient) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Patient Registered!</h2>
              <p className="text-muted-foreground">A unique Chikit Health ID has been generated</p>
            </div>

            <div className="bg-white rounded-xl border-2 border-primary/30 p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Chikit Health ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold font-mono text-primary tracking-widest">
                    {createdPatient.chikitHealthId}
                  </span>
                  <Button variant="ghost" size="icon" onClick={copyId}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-left">
                <div>
                  <p className="text-muted-foreground text-xs">Patient Name</p>
                  <p className="font-medium">{createdPatient.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Patient Code</p>
                  <p className="font-medium font-mono">{createdPatient.patientCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{createdPatient.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Blood Group</p>
                  <p className="font-medium">{createdPatient.bloodGroup || "—"}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Please note down the Chikit Health ID. The patient can use this ID to access their records across any Chikit-enabled hospital.
            </p>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(`/patients/${createdPatient.id}`)}>
                View Patient Record
              </Button>
              <Button onClick={() => { setStep("form"); setForm({ name: "", dateOfBirth: "", gender: "", bloodGroup: "", phone: "", email: "", address: "", emergencyContact: "", emergencyPhone: "", allergies: "", chronicConditions: "", govtIdType: "", govtIdNumber: "" }); }}>
                Register Another Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Register New Patient</h1>
          <p className="text-muted-foreground text-sm">A Chikit Health ID will be automatically generated</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="Enter full name" value={form.name} onChange={set("name")} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
              <Input id="dob" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
            </div>
            <div className="space-y-1">
              <Label>Gender <span className="text-red-500">*</span></Label>
              <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Blood Group</Label>
              <Select value={form.bloodGroup} onValueChange={(v) => setForm((f) => ({ ...f, bloodGroup: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Mobile Number <span className="text-red-500">*</span></Label>
              <Input id="phone" placeholder="+91 99999 99999" value={form.phone} onChange={set("phone")} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="patient@email.com" value={form.email} onChange={set("email")} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Full address" value={form.address} onChange={set("address")} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Government ID */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Government Identity Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>ID Type</Label>
              <Select value={form.govtIdType} onValueChange={(v) => setForm((f) => ({ ...f, govtIdType: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {GOVT_ID_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="govtId">ID Number</Label>
              <Input id="govtId" placeholder="Enter ID number" value={form.govtIdNumber} onChange={set("govtIdNumber")} />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="ec">Contact Name</Label>
              <Input id="ec" placeholder="Emergency contact name" value={form.emergencyContact} onChange={set("emergencyContact")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep">Contact Phone</Label>
              <Input id="ep" placeholder="Emergency contact phone" value={form.emergencyPhone} onChange={set("emergencyPhone")} />
            </div>
          </CardContent>
        </Card>

        {/* Medical Background */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Medical Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea id="allergies" placeholder="List any known allergies (e.g., Penicillin, Sulfa drugs)" value={form.allergies} onChange={set("allergies")} rows={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chronic">Chronic Conditions</Label>
              <Textarea id="chronic" placeholder="List any chronic conditions (e.g., Diabetes, Hypertension)" value={form.chronicConditions} onChange={set("chronicConditions")} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/patients")}>Cancel</Button>
          <Button type="submit" disabled={registerMutation.isPending}>
            <UserPlus className="w-4 h-4 mr-2" />
            {registerMutation.isPending ? "Registering..." : "Register Patient"}
          </Button>
        </div>
      </form>
    </div>
  );
}
