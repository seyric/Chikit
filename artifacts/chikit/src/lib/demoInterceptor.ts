// @ts-nocheck
import { demoStore } from "./demoData";

const DEMO_USERS: Record<string, any> = {
  admin: {
    id: 1,
    name: "Dr. Arvind Mathur (Admin)",
    email: "admin@chikit.health",
    role: "admin",
    hospitalId: 1,
    phone: "+91 98290 44551",
    hospitalName: "AIIMS Jodhpur",
    isActive: true,
  },
  doctor: {
    id: 2,
    name: "Dr. Arvind Mathur",
    email: "doctor@chikit.health",
    role: "doctor",
    hospitalId: 1,
    phone: "+91 98290 44551",
    hospitalName: "AIIMS Jodhpur",
    isActive: true,
  },
  pharmacist: {
    id: 3,
    name: "Ramesh Patel",
    email: "pharmacist@chikit.health",
    role: "pharmacist",
    hospitalId: 1,
    phone: "+91 98297 22334",
    hospitalName: "AIIMS Jodhpur",
    isActive: true,
  },
  receptionist: {
    id: 4,
    name: "Kavita Rao",
    email: "receptionist@chikit.health",
    role: "receptionist",
    hospitalId: 1,
    phone: "+91 98290 55667",
    hospitalName: "AIIMS Jodhpur",
    isActive: true,
  },
  lab_technician: {
    id: 5,
    name: "Sunil Verma",
    email: "lab@chikit.health",
    role: "lab_technician",
    hospitalId: 1,
    phone: "+91 98298 33445",
    hospitalName: "AIIMS Jodhpur",
    isActive: true,
  },
  radiology_technician: {
    id: 6,
    name: "Dr. Ananya Sen",
    email: "radiology@chikit.health",
    role: "radiology_technician",
    hospitalId: 1,
    phone: "+91 98299 44556",
    hospitalName: "AIIMS Jodhpur",
    isActive: true,
  },
  nurse: {
    id: 7,
    name: "Sister Mary Kutty",
    email: "nurse@chikit.health",
    role: "nurse",
    hospitalId: 1,
    phone: "+91 98296 11223",
    hospitalName: "AIIMS Jodhpur",
    isActive: true,
  },
  patient: {
    id: 8,
    name: "Rajesh Kumar Sharma",
    email: "patient@chikit.health",
    role: "patient",
    hospitalId: 1,
    phone: "+91 98290 12345",
    hospitalName: "AIIMS Jodhpur",
    abhaNumber: "91-4523-8821-9042",
    chikitHealthId: "CHK-2025-JOD001",
    isActive: true,
  }
};

export function setupDemoInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
    const url = new URL(rawUrl, window.location.origin);
    const path = url.pathname;
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

    // Only intercept /api routes
    if (!path.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    // Read body safely if present
    let bodyData: any = null;
    if (init?.body && typeof init.body === "string") {
      try {
        bodyData = JSON.parse(init.body);
      } catch (e) {
        bodyData = init.body;
      }
    }

    const jsonResponse = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
      });
    };

    // 1. AUTH: Login
    if (path === "/api/auth/login" && method === "POST") {
      const email = bodyData?.email || "";
      let matchedUser = DEMO_USERS.admin;

      if (email.includes("doctor") || email.includes("sharma")) matchedUser = DEMO_USERS.doctor;
      else if (email.includes("pharmac")) matchedUser = DEMO_USERS.pharmacist;
      else if (email.includes("reception")) matchedUser = DEMO_USERS.receptionist;
      else if (email.includes("lab")) matchedUser = DEMO_USERS.lab_technician;
      else if (email.includes("radiology")) matchedUser = DEMO_USERS.radiology_technician;
      else if (email.includes("nurse")) matchedUser = DEMO_USERS.nurse;
      else if (email.includes("patient")) matchedUser = DEMO_USERS.patient;

      localStorage.setItem("chikit_demo_user", JSON.stringify(matchedUser));
      const fakeToken = btoa(JSON.stringify({ ...matchedUser, exp: Date.now() + 86400000 * 7 }));
      return jsonResponse({ token: fakeToken, user: matchedUser });
    }

    // 2. AUTH: Me
    if (path === "/api/auth/me") {
      const stored = localStorage.getItem("chikit_demo_user");
      if (stored) {
        return jsonResponse(JSON.parse(stored));
      }
      return jsonResponse(DEMO_USERS.admin);
    }

    // 3. AUTH: OTP flow
    if (path === "/api/auth/send-otp" && method === "POST") {
      return jsonResponse({ message: "OTP sent successfully to mobile", _demo_otp: "123456" });
    }
    if (path === "/api/auth/verify-otp" && method === "POST") {
      const user = DEMO_USERS.patient;
      localStorage.setItem("chikit_demo_user", JSON.stringify(user));
      const fakeToken = btoa(JSON.stringify({ ...user, exp: Date.now() + 86400000 * 7 }));
      return jsonResponse({ token: fakeToken, user });
    }

    // 4. ABHA: Init & Confirm
    if (path === "/api/abha/auth/init" && method === "POST") {
      return jsonResponse({ txnId: "abdm_txn_" + Date.now(), message: "OTP sent to Aadhaar-linked mobile" });
    }
    if (path === "/api/abha/auth/confirm" && method === "POST") {
      const user = DEMO_USERS.patient;
      localStorage.setItem("chikit_demo_user", JSON.stringify(user));
      const fakeToken = btoa(JSON.stringify({ ...user, exp: Date.now() + 86400000 * 7 }));
      return jsonResponse({ token: fakeToken, user });
    }
    if (path === "/api/auth/google" && method === "POST") {
      const user = { ...DEMO_USERS.patient, name: bodyData?.name || "Google User", email: bodyData?.email || "user@gmail.com" };
      localStorage.setItem("chikit_demo_user", JSON.stringify(user));
      const fakeToken = btoa(JSON.stringify({ ...user, exp: Date.now() + 86400000 * 7 }));
      return jsonResponse({ token: fakeToken, user });
    }

    // 5. STATS: Dashboard
    if (path === "/api/stats/dashboard" || path === "/api/stats") {
      return jsonResponse(demoStore.getDashboardStats());
    }

    // 6. HOSPITALS
    if (path === "/api/hospitals" && method === "GET") {
      const search = url.searchParams.get("search")?.toLowerCase() || "";
      let list = demoStore.hospitals;
      if (search) {
        list = list.filter(h => h.name.toLowerCase().includes(search) || h.city.toLowerCase().includes(search) || h.state.toLowerCase().includes(search));
      }
      return jsonResponse({
        hospitals: list,
        total: list.length,
        page: 1,
        limit: 20
      });
    }
    if (path === "/api/hospitals/states") {
      const states = Array.from(new Set(demoStore.hospitals.map(h => h.state)));
      return jsonResponse(states);
    }

    // 7. PATIENTS
    if (path === "/api/patients" && method === "GET") {
      const search = url.searchParams.get("search")?.toLowerCase() || "";
      let list = demoStore.patients;
      if (search) {
        list = list.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.patientCode.toLowerCase().includes(search) ||
          p.phone.includes(search) ||
          (p.abhaNumber && p.abhaNumber.includes(search))
        );
      }
      // Support both pagination wrapper and array callers
      const resultObj: any = {
        patients: list,
        total: list.length,
        page: 1,
        limit: 50
      };
      // Polyfill array methods on the response object for callers expecting direct array
      resultObj[Symbol.iterator] = list[Symbol.iterator].bind(list);
      resultObj.map = list.map.bind(list);
      resultObj.filter = list.filter.bind(list);
      resultObj.length = list.length;
      return jsonResponse(resultObj);
    }
    if (path === "/api/patients" && method === "POST") {
      const newP = demoStore.addPatient(bodyData);
      return jsonResponse(newP, 201);
    }
    if (path.startsWith("/api/patients/") && method === "GET") {
      const id = Number(path.replace("/api/patients/", ""));
      const patient = demoStore.patients.find(p => p.id === id) || demoStore.patients[0];
      const medicalRecords = demoStore.medicalRecords.filter(m => m.patientId === patient.id);
      const appointments = demoStore.appointments.filter(a => a.patientId === patient.id);
      const prescriptions = demoStore.prescriptions.filter(p => p.patientId === patient.id);
      const labReports = demoStore.labReports.filter(l => l.patientId === patient.id);
      return jsonResponse({
        ...patient,
        medicalRecords,
        appointments,
        prescriptions,
        labReports
      });
    }

    // 8. DOCTORS
    if (path === "/api/doctors") {
      return jsonResponse(demoStore.doctors);
    }

    // 9. APPOINTMENTS
    if (path === "/api/appointments" && method === "GET") {
      return jsonResponse(demoStore.appointments);
    }
    if (path === "/api/appointments" && method === "POST") {
      const newA = demoStore.addAppointment(bodyData);
      return jsonResponse(newA, 201);
    }
    if (path.startsWith("/api/appointments/") && (method === "PATCH" || method === "PUT")) {
      const id = Number(path.split("/").pop());
      const updated = demoStore.updateAppointmentStatus(id, bodyData?.status || "completed");
      return jsonResponse(updated);
    }

    // 10. PRESCRIPTIONS
    if (path === "/api/prescriptions" && method === "GET") {
      const status = url.searchParams.get("status");
      let list = demoStore.prescriptions;
      if (status && status !== "all") {
        list = list.filter(p => p.status === status);
      }
      return jsonResponse(list);
    }
    if (path === "/api/prescriptions" && method === "POST") {
      const newRx = demoStore.addPrescription(bodyData);
      return jsonResponse(newRx, 201);
    }
    if (path.startsWith("/api/prescriptions/") && (method === "PATCH" || method === "PUT")) {
      const id = Number(path.split("/").pop());
      const dispensed = demoStore.dispensePrescription(id);
      return jsonResponse(dispensed);
    }

    // 11. LAB REPORTS
    if (path === "/api/lab-reports" && method === "GET") {
      return jsonResponse(demoStore.labReports);
    }
    if (path === "/api/lab-reports" && method === "POST") {
      const newR = demoStore.addLabReport(bodyData);
      return jsonResponse(newR, 201);
    }
    if (path.startsWith("/api/lab-reports/") && (method === "PATCH" || method === "PUT")) {
      const id = Number(path.split("/").pop());
      const updated = demoStore.updateLabReport(id, bodyData);
      return jsonResponse(updated);
    }

    // 12. RADIOLOGY REPORTS
    if (path === "/api/radiology-reports" || path === "/api/radiology") {
      return jsonResponse(demoStore.radiologyReports);
    }

    // 13. MEDICAL RECORDS
    if (path === "/api/medical-records" && method === "GET") {
      return jsonResponse(demoStore.medicalRecords);
    }
    if (path === "/api/medical-records" && method === "POST") {
      const newRec = demoStore.addMedicalRecord(bodyData);
      return jsonResponse(newRec, 201);
    }

    // 14. CAPACITY & WARDS
    if (path === "/api/hospital-capacity" || path.startsWith("/api/hospital-capacity/")) {
      return jsonResponse(demoStore.bedCapacity);
    }

    // 15. BILLING / INVOICES
    if (path === "/api/billing") {
      return jsonResponse(demoStore.invoices);
    }

    // 16. DRUGS FORMULARY
    if (path === "/api/drugs") {
      return jsonResponse(demoStore.drugs);
    }

    // 17. STAFF
    if (path === "/api/staff") {
      return jsonResponse(demoStore.staff);
    }

    // 18. AUDIT LOGS
    if (path === "/api/audit-logs" || path === "/api/audit") {
      return jsonResponse(demoStore.auditLogs);
    }

    // 19. AI (MedGemma)
    if (path === "/api/ai/medgemma/status") {
      return jsonResponse({
        status: "online",
        model: "medgemma-4b-it",
        offlineMode: true,
        device: "local_inference_ready",
        latencyMs: 142,
        activeFacility: "AIIMS Jodhpur",
        lastChecked: new Date().toISOString()
      });
    }
    if (path === "/api/ai/analyze-symptoms" && method === "POST") {
      const symptoms = Array.isArray(bodyData?.symptoms) ? bodyData.symptoms : [bodyData?.symptoms || "fever"];
      const severity = bodyData?.severity || "moderate";
      const duration = bodyData?.duration || "3 days";

      return jsonResponse({
        patientId: bodyData?.patientId || 1,
        modelUsed: "MedGemma 4B IT (Offline Clinical Decision Support)",
        confidenceScore: 0.94,
        findings: [
          `Evaluated reported symptom cluster: ${symptoms.join(", ")} with duration of ${duration}.`,
          `Vital signs and age profile assessed against AIIMS clinical guidelines.`,
          `No emergent red flags detected requiring immediate resuscitation, but requires structured outpatient workup.`
        ],
        differentialDiagnoses: [
          {
            condition: symptoms.some(s => s.toLowerCase().includes("cough") || s.toLowerCase().includes("wheez"))
              ? "Reactive Airway Disease / Bronchial Hyperresponsiveness"
              : "Acute Viral Upper Respiratory Infection",
            probability: 72,
            icd10: "J45.909 / J06.9",
            urgency: severity === "severe" ? "Urgent" : "Routine"
          },
          {
            condition: symptoms.some(s => s.toLowerCase().includes("headache") || s.toLowerCase().includes("thirst"))
              ? "Poorly Controlled Type 2 Diabetes with Osmotic Diuresis"
              : "Acute Allergic Rhinitis / Sinusitis",
            probability: 58,
            icd10: "E11.65 / J30.9",
            urgency: "Routine"
          },
          {
            condition: "Secondary Bacterial Superinfection",
            probability: 24,
            icd10: "J20.9",
            urgency: "Monitor"
          }
        ],
        recommendedInvestigations: [
          "Complete Blood Count (CBC) with Differential",
          "Glycated Hemoglobin (HbA1c) and Fasting Blood Sugar",
          "Peak Expiratory Flow Rate (PEFR) Spirometry",
          "Digital PA Chest Radiograph (if symptoms persist > 7 days)"
        ],
        precautions: [
          "Ensure adequate oral hydration with electrolyte balance.",
          "Avoid unprescribed over-the-counter NSAIDs.",
          "Seek immediate emergency care if oxygen saturation drops below 94% or breathing difficulty worsens."
        ],
        disclaimer: "AI analysis powered by MedGemma is for clinical decision support only and must be verified by a licensed medical practitioner."
      });
    }

    // Default fallback: pass through to original fetch, but catch network/server failure
    try {
      const res = await originalFetch(input, init);
      if (!res.ok && res.status >= 500) {
        // Server returned 500: return empty array or stats
        if (path.includes("patients")) return jsonResponse(demoStore.patients);
        if (path.includes("doctors")) return jsonResponse(demoStore.doctors);
        if (path.includes("appointments")) return jsonResponse(demoStore.appointments);
        if (path.includes("prescriptions")) return jsonResponse(demoStore.prescriptions);
        if (path.includes("labs") || path.includes("lab-reports")) return jsonResponse(demoStore.labReports);
        if (path.includes("radiology")) return jsonResponse(demoStore.radiologyReports);
        if (path.includes("medical-records")) return jsonResponse(demoStore.medicalRecords);
        if (path.includes("stats")) return jsonResponse(demoStore.getDashboardStats());
      }
      return res;
    } catch (networkError) {
      console.warn("[DemoInterceptor] Fetch fallback for", path, networkError);
      return jsonResponse({ status: "ok" });
    }
  };
}
