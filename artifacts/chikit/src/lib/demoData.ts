// @ts-nocheck
/**
 * AIIMS Jodhpur Virtual Healthcare Platform — High-Fidelity In-Memory Mock & State Store
 * Provides seamless 100% reliable fallback and stateful interactions across all portals:
 * - Admin Command Center (AIIMS Jodhpur Telemetry, Department Control, Governance)
 * - Doctor Portal (OPD, Prescriptions, AI Clinical Decision Support)
 * - Patient Portal (ABHA login, Appointments, Records, Rx)
 * - Pharmacist Portal (Dispensing queue, inventory, formulary)
 * - Receptionist Portal (OPD Token issuance, appointments scheduling)
 * - Lab Tech Portal (Pathology & Biochemistry test results entry)
 * - Radiology Portal (Modality reports & CT/MRI imaging)
 * - Nurse / Ward Portal (Bed occupancy & bedside vitals recording)
 */

export interface DemoHospital {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  type: string;
  category: string;
  careType: string;
  discipline: string;
  specialties: string;
  bedCount: number;
  numDoctors: number;
  location: string;
  sourceId: string;
  isActive: boolean;
  emergencyPhone: string;
  abhaFacilityId: string;
}

export const INITIAL_HOSPITALS: DemoHospital[] = [
  {
    id: 1,
    name: "All India Institute of Medical Sciences (AIIMS), Jodhpur",
    slug: "aiims-jodhpur",
    address: "Basni Industrial Area Phase-2, Near Marudhar Hospital",
    city: "Jodhpur",
    state: "Rajasthan",
    district: "Jodhpur",
    pincode: "342005",
    phone: "0291-2740741",
    emergencyPhone: "0291-2740744",
    email: "dean@aiimsjodhpur.edu.in",
    website: "https://www.aiimsjodhpur.edu.in",
    type: "Apex Autonomous Government Institute",
    category: "Super-Speciality Tertiary Care Hospital",
    careType: "Tertiary / Quaternary",
    discipline: "Allopathic / Multi-Speciality",
    specialties: "Cardiology, Pulmonary Medicine, Neurology, Orthopedics, Oncology, Pediatrics, Critical Care, Radiology, Pathology",
    bedCount: 960,
    numDoctors: 245,
    location: "26.2389, 73.0243",
    sourceId: "AIIMS-JOD-001",
    abhaFacilityId: "IN0810001249",
    isActive: true,
  },
  {
    id: 2,
    name: "All India Institute of Medical Sciences (AIIMS), New Delhi",
    slug: "aiims-delhi",
    address: "Sri Aurobindo Marg, Ansari Nagar",
    city: "New Delhi",
    state: "Delhi",
    district: "South Delhi",
    pincode: "110029",
    phone: "011-26588500",
    emergencyPhone: "011-26588700",
    email: "director@aiims.edu",
    website: "https://www.aiims.edu",
    type: "Autonomous Apex Hospital",
    category: "Government",
    careType: "Tertiary",
    discipline: "Allopathic",
    specialties: "Multi-Speciality, Cardiac Surgery, Organ Transplant, Oncology",
    bedCount: 2478,
    numDoctors: 850,
    location: "28.5672, 77.2100",
    sourceId: "AIIMS-DEL-001",
    abhaFacilityId: "IN0710000001",
    isActive: true,
  },
  {
    id: 3,
    name: "Apollo Hospitals, Greams Road",
    slug: "apollo-chennai",
    address: "21 Greams Lane, Off Greams Road",
    city: "Chennai",
    state: "Tamil Nadu",
    district: "Chennai",
    pincode: "600006",
    phone: "044-28290200",
    emergencyPhone: "1066",
    email: "info@apollohospitals.com",
    website: "https://www.apollohospitals.com",
    type: "Corporate Multi-Speciality",
    category: "Private",
    careType: "Tertiary",
    discipline: "Allopathic",
    specialties: "Cardiology, Oncology, Robotic Surgery, Orthopedics",
    bedCount: 650,
    numDoctors: 310,
    location: "13.0569, 80.2518",
    sourceId: "APOLLO-CHE-001",
    abhaFacilityId: "IN3310004521",
    isActive: true,
  },
  {
    id: 4,
    name: "Fortis Memorial Research Institute",
    slug: "fortis-gurugram",
    address: "Sector 44, Opposite HUDA City Centre",
    city: "Gurugram",
    state: "Haryana",
    district: "Gurugram",
    pincode: "122002",
    phone: "0124-4962200",
    emergencyPhone: "105010",
    email: "contactus.fmri@fortishealthcare.com",
    website: "https://www.fortishealthcare.com",
    type: "Multi-Speciality Hospital",
    category: "Private",
    careType: "Tertiary",
    discipline: "Allopathic",
    specialties: "Neurosciences, Oncology, Renal Sciences, Cardiac Sciences",
    bedCount: 400,
    numDoctors: 180,
    location: "28.4595, 77.0725",
    sourceId: "FORTIS-GUR-001",
    abhaFacilityId: "IN0610008819",
    isActive: true,
  },
  {
    id: 5,
    name: "G B Pant Hospital, Port Blair",
    slug: "gbpant-portblair",
    address: "GB Pant Road, City Centre",
    city: "Port Blair",
    state: "Andaman and Nicobar Islands",
    district: "South Andaman",
    pincode: "744103",
    phone: "03192-233665",
    emergencyPhone: "03192-233455",
    email: "health.and@nic.in",
    website: "http://www.and.nic.in/health",
    type: "Government District Hospital",
    category: "Public/ Government",
    careType: "Secondary / Tertiary",
    discipline: "Allopathic",
    specialties: "Surgery, Medicine, Gynaecology, Pediatrics, ENT, Pathology, Ophthalmology",
    bedCount: 460,
    numDoctors: 75,
    location: "11.6234, 92.7265",
    sourceId: "GBPANT-PB-001",
    abhaFacilityId: "IN3510000045",
    isActive: true,
  }
];

export const INITIAL_DOCTORS = [
  {
    id: 1,
    userId: 2,
    hospitalId: 1,
    name: "Dr. Arvind Mathur",
    email: "dr.mathur@chikit.health",
    specialization: "General Medicine & Geriatrics",
    department: "Internal Medicine",
    licenseNumber: "MCI-RAJ-29401",
    phone: "+91 98290 44551",
    isAvailable: true,
    opdRoom: "OPD Block A, Room 104",
    opdTimings: "Mon-Sat: 09:00 AM - 02:00 PM",
    hospitalName: "All India Institute of Medical Sciences (AIIMS), Jodhpur",
    qualification: "MBBS, MD (Medicine), FACP",
    experienceYears: 24,
    consultationFee: 0, // AIIMS OPD nominal
  },
  {
    id: 2,
    userId: 3,
    hospitalId: 1,
    name: "Dr. Priya Sharma",
    email: "dr.priya@chikit.health",
    specialization: "Interventional Cardiology",
    department: "Cardiology",
    licenseNumber: "MCI-DEL-33890",
    phone: "+91 98291 55662",
    isAvailable: true,
    opdRoom: "Cardiac Centre, Room 202",
    opdTimings: "Mon, Wed, Fri: 10:00 AM - 03:00 PM",
    hospitalName: "All India Institute of Medical Sciences (AIIMS), Jodhpur",
    qualification: "MBBS, MD (Medicine), DM (Cardiology, AIIMS New Delhi)",
    experienceYears: 16,
    consultationFee: 0,
  },
  {
    id: 3,
    userId: 4,
    hospitalId: 1,
    name: "Dr. Rajesh Verma",
    email: "dr.verma@chikit.health",
    specialization: "Pulmonary & Critical Care Medicine",
    department: "Pulmonology",
    licenseNumber: "MCI-RAJ-41209",
    phone: "+91 98292 66773",
    isAvailable: true,
    opdRoom: "OPD Block B, Room 112",
    opdTimings: "Tue, Thu, Sat: 09:30 AM - 02:30 PM",
    hospitalName: "All India Institute of Medical Sciences (AIIMS), Jodhpur",
    qualification: "MBBS, MD (Pulmonary Medicine), DM (Critical Care)",
    experienceYears: 14,
    consultationFee: 0,
  },
  {
    id: 4,
    userId: 5,
    hospitalId: 1,
    name: "Dr. Sneha Patel",
    email: "dr.sneha@chikit.health",
    specialization: "Pediatrics & Neonatology",
    department: "Pediatrics",
    licenseNumber: "MCI-GUJ-51092",
    phone: "+91 98293 77884",
    isAvailable: true,
    opdRoom: "Mother & Child Wing, Room 101",
    opdTimings: "Mon-Sat: 09:00 AM - 01:00 PM",
    hospitalName: "All India Institute of Medical Sciences (AIIMS), Jodhpur",
    qualification: "MBBS, MD (Pediatrics), Fellowship in Neonatal Intensive Care",
    experienceYears: 11,
    consultationFee: 0,
  },
  {
    id: 5,
    userId: 6,
    hospitalId: 1,
    name: "Dr. Amit Rao",
    email: "dr.amit@chikit.health",
    specialization: "Orthopedics & Joint Replacement",
    department: "Orthopedics",
    licenseNumber: "MCI-MAH-62184",
    phone: "+91 98294 88995",
    isAvailable: false,
    opdRoom: "Trauma & Ortho Wing, Room 305",
    opdTimings: "Mon, Wed, Fri: 09:00 AM - 02:00 PM",
    hospitalName: "All India Institute of Medical Sciences (AIIMS), Jodhpur",
    qualification: "MBBS, MS (Orthopedics), MCh (Joint Replacement)",
    experienceYears: 18,
    consultationFee: 0,
  },
  {
    id: 6,
    userId: 7,
    hospitalId: 1,
    name: "Dr. Sunita Meena",
    email: "dr.sunita@chikit.health",
    specialization: "Obstetrics & High-Risk Pregnancy",
    department: "Obstetrics & Gynecology",
    licenseNumber: "MCI-RAJ-38102",
    phone: "+91 98295 99006",
    isAvailable: true,
    opdRoom: "Mother & Child Wing, Room 204",
    opdTimings: "Mon-Fri: 09:00 AM - 02:00 PM",
    hospitalName: "All India Institute of Medical Sciences (AIIMS), Jodhpur",
    qualification: "MBBS, MS (Obstetrics & Gynaecology), DNB",
    experienceYears: 15,
    consultationFee: 0,
  }
];

export const INITIAL_PATIENTS = [
  {
    id: 1,
    patientCode: "PT2025001",
    chikitHealthId: "CHK-2025-JOD001",
    name: "Rajesh Kumar Sharma",
    age: 48,
    gender: "male",
    bloodGroup: "B+",
    phone: "+91 98290 12345",
    email: "rajesh.sharma@example.com",
    address: "Plot 42, Shastri Nagar, Jodhpur, Rajasthan 342003",
    abhaNumber: "91-4523-8821-9042",
    abhaAddress: "rajesh.sharma@abdm",
    abhaStatus: "verified",
    govtIdType: "aadhaar",
    govtIdNumber: "XXXX-XXXX-4912",
    emergencyContactName: "Meena Sharma (Spouse)",
    emergencyContactPhone: "+91 98290 12346",
    allergies: ["Penicillin", "Sulfa drugs"],
    chronicConditions: ["Hypertension (Grade 1)", "Type 2 Diabetes Mellitus"],
    primaryHospitalId: 1,
    isActive: true,
    createdAt: "2025-01-10T08:30:00.000Z",
  },
  {
    id: 2,
    patientCode: "PT2025002",
    chikitHealthId: "CHK-2025-JOD002",
    name: "Sunita Devi",
    age: 34,
    gender: "female",
    bloodGroup: "O+",
    phone: "+91 94141 54321",
    email: "sunita.devi@example.com",
    address: "Ward 12, Mandore Road, Jodhpur, Rajasthan 342007",
    abhaNumber: "91-7712-4091-6638",
    abhaAddress: "sunita.devi@abdm",
    abhaStatus: "verified",
    govtIdType: "aadhaar",
    govtIdNumber: "XXXX-XXXX-8103",
    emergencyContactName: "Rakesh Devi (Husband)",
    emergencyContactPhone: "+91 94141 54322",
    allergies: ["None known"],
    chronicConditions: ["Bronchial Asthma (Moderate persistent)"],
    primaryHospitalId: 1,
    isActive: true,
    createdAt: "2025-01-12T10:15:00.000Z",
  },
  {
    id: 3,
    patientCode: "PT2025003",
    chikitHealthId: "CHK-2025-JOD003",
    name: "Vikram Singh Rathore",
    age: 62,
    gender: "male",
    bloodGroup: "A+",
    phone: "+91 98292 88440",
    email: "vikram.rathore@example.com",
    address: "15 Paota 'C' Road, Jodhpur, Rajasthan 342006",
    abhaNumber: "91-3329-8120-4411",
    abhaAddress: "vikram.rathore@abdm",
    abhaStatus: "verified",
    govtIdType: "aadhaar",
    govtIdNumber: "XXXX-XXXX-9941",
    emergencyContactName: "Devendra Singh (Son)",
    emergencyContactPhone: "+91 98292 88441",
    allergies: ["NSAIDs (Gastric upset)"],
    chronicConditions: ["Coronary Artery Disease (s/p PTCA LAD 2024)", "Dyslipidemia"],
    primaryHospitalId: 1,
    isActive: true,
    createdAt: "2025-01-15T09:00:00.000Z",
  },
  {
    id: 4,
    patientCode: "PT2025004",
    chikitHealthId: "CHK-2025-JOD004",
    name: "Anita Sharma",
    age: 29,
    gender: "female",
    bloodGroup: "AB+",
    phone: "+91 94601 77221",
    email: "anita.sharma@example.com",
    address: "House 204, Ratanada, Jodhpur, Rajasthan 342011",
    abhaNumber: "91-8841-2093-1152",
    abhaAddress: "anita.sharma@abdm",
    abhaStatus: "verified",
    govtIdType: "aadhaar",
    govtIdNumber: "XXXX-XXXX-3342",
    emergencyContactName: "Gaurav Sharma (Husband)",
    emergencyContactPhone: "+91 94601 77222",
    allergies: ["None known"],
    chronicConditions: ["Pregnancy (24 weeks gestation, G1P0)"],
    primaryHospitalId: 1,
    isActive: true,
    createdAt: "2025-01-18T11:20:00.000Z",
  },
  {
    id: 5,
    patientCode: "PT2025005",
    chikitHealthId: "CHK-2025-JOD005",
    name: "Mohammad Imran",
    age: 41,
    gender: "male",
    bloodGroup: "O-",
    phone: "+91 97840 33119",
    email: "m.imran@example.com",
    address: "Near Jalori Gate, Old City, Jodhpur, Rajasthan 342001",
    abhaNumber: "91-6204-5519-7823",
    abhaAddress: "m.imran@abdm",
    abhaStatus: "verified",
    govtIdType: "aadhaar",
    govtIdNumber: "XXXX-XXXX-7118",
    emergencyContactName: "Zoya Imran (Sister)",
    emergencyContactPhone: "+91 97840 33120",
    allergies: ["Ciprofloxacin"],
    chronicConditions: ["Gastroesophageal Reflux Disease (GERD)"],
    primaryHospitalId: 1,
    isActive: true,
    createdAt: "2025-01-20T14:40:00.000Z",
  }
];

export const INITIAL_APPOINTMENTS = [
  {
    id: 1,
    patientId: 1,
    doctorId: 1,
    hospitalId: 1,
    appointmentDate: new Date().toISOString(),
    reason: "Routine OPD follow-up for Glycemic control & Blood Pressure check",
    status: "in_progress",
    tokenNumber: "OPD-MED-042",
    patientName: "Rajesh Kumar Sharma",
    doctorName: "Dr. Arvind Mathur",
    hospitalName: "AIIMS Jodhpur",
    department: "Internal Medicine",
  },
  {
    id: 2,
    patientId: 2,
    doctorId: 3,
    hospitalId: 1,
    appointmentDate: new Date(Date.now() + 3600000 * 2).toISOString(),
    reason: "Follow-up for persistent nocturnal wheezing and cough",
    status: "scheduled",
    tokenNumber: "OPD-PULM-018",
    patientName: "Sunita Devi",
    doctorName: "Dr. Rajesh Verma",
    hospitalName: "AIIMS Jodhpur",
    department: "Pulmonology",
  },
  {
    id: 3,
    patientId: 3,
    doctorId: 2,
    hospitalId: 1,
    appointmentDate: new Date(Date.now() + 3600000 * 4).toISOString(),
    reason: "Post-PTCA 6-month evaluation and routine 12-lead ECG",
    status: "scheduled",
    tokenNumber: "OPD-CARD-025",
    patientName: "Vikram Singh Rathore",
    doctorName: "Dr. Priya Sharma",
    hospitalName: "AIIMS Jodhpur",
    department: "Cardiology",
  },
  {
    id: 4,
    patientId: 4,
    doctorId: 6,
    hospitalId: 1,
    appointmentDate: new Date(Date.now() - 3600000 * 3).toISOString(),
    reason: "Second trimester anomaly scan review and iron supplements check",
    status: "completed",
    tokenNumber: "OPD-OBG-011",
    patientName: "Anita Sharma",
    doctorName: "Dr. Sunita Meena",
    hospitalName: "AIIMS Jodhpur",
    department: "Obstetrics & Gynecology",
  },
  {
    id: 5,
    patientId: 5,
    doctorId: 1,
    hospitalId: 1,
    appointmentDate: new Date(Date.now() + 3600000 * 6).toISOString(),
    reason: "Severe burning epigastric discomfort radiating to retrosternal area",
    status: "scheduled",
    tokenNumber: "OPD-MED-058",
    patientName: "Mohammad Imran",
    doctorName: "Dr. Arvind Mathur",
    hospitalName: "AIIMS Jodhpur",
    department: "Internal Medicine",
  }
];

export const INITIAL_PRESCRIPTIONS = [
  {
    id: 1,
    patientId: 1,
    doctorId: 1,
    hospitalId: 1,
    prescriptionDate: new Date().toISOString(),
    diagnosis: "Essential Hypertension (Grade 1) with Type 2 Diabetes Mellitus (Uncontrolled)",
    status: "active",
    patientName: "Rajesh Kumar Sharma",
    doctorName: "Dr. Arvind Mathur",
    instructions: "Take Metformin immediately after major meals. Avoid skipping breakfast. Monitor fasting blood sugar every Sunday.",
    followUpDays: 30,
    medications: [
      {
        name: "Metformin Hydrochloride 500mg (SR)",
        dosage: "500 mg",
        frequency: "Twice daily (After food)",
        duration: "30 days",
        instructions: "Swallow whole with a glass of water. Do not crush."
      },
      {
        name: "Telmisartan 40mg",
        dosage: "40 mg",
        frequency: "Once daily (Morning)",
        duration: "30 days",
        instructions: "Take at the same time each morning."
      },
      {
        name: "Atorvastatin 10mg",
        dosage: "10 mg",
        frequency: "Once daily (Night)",
        duration: "30 days",
        instructions: "Take before sleeping."
      }
    ]
  },
  {
    id: 2,
    patientId: 2,
    doctorId: 3,
    hospitalId: 1,
    prescriptionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    diagnosis: "Moderate Persistent Asthma with Acute Exacerbation",
    status: "dispensed",
    patientName: "Sunita Devi",
    doctorName: "Dr. Rajesh Verma",
    instructions: "Rinse mouth with plain water after using the inhaler to prevent oral candidiasis.",
    followUpDays: 14,
    medications: [
      {
        name: "Budesonide + Formoterol MDI (200/6 mcg)",
        dosage: "200/6 mcg",
        frequency: "2 puffs twice daily",
        duration: "30 days",
        instructions: "Use with spacer for maximum airway deposition."
      },
      {
        name: "Montelukast 10mg + Levocetirizine 5mg",
        dosage: "10/5 mg",
        frequency: "Once daily at bedtime",
        duration: "15 days",
        instructions: "May cause mild drowsiness."
      },
      {
        name: "Azithromycin 500mg",
        dosage: "500 mg",
        frequency: "Once daily",
        duration: "3 days",
        instructions: "Take 1 hour before or 2 hours after meals."
      }
    ]
  },
  {
    id: 3,
    patientId: 3,
    doctorId: 2,
    hospitalId: 1,
    prescriptionDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    diagnosis: "CAD, Post-PTCA (DES to LAD), Dyslipidemia",
    status: "active",
    patientName: "Vikram Singh Rathore",
    doctorName: "Dr. Priya Sharma",
    instructions: "Dual antiplatelet therapy (DAPT) must NOT be discontinued without consulting cardiologist. Report any unusual bruising.",
    followUpDays: 60,
    medications: [
      {
        name: "Aspirin 75mg + Clopidogrel 75mg",
        dosage: "75/75 mg",
        frequency: "Once daily (Post lunch)",
        duration: "60 days",
        instructions: "Take strictly after meals."
      },
      {
        name: "Rosuvastatin 20mg",
        dosage: "20 mg",
        frequency: "Once daily at night",
        duration: "60 days",
        instructions: "High-intensity statin therapy."
      },
      {
        name: "Metoprolol Succinate 25mg (ER)",
        dosage: "25 mg",
        frequency: "Once daily (Morning)",
        duration: "60 days",
        instructions: "Check pulse; do not take if HR < 55 bpm."
      },
      {
        name: "Pantoprazole 40mg",
        dosage: "40 mg",
        frequency: "Once daily (Before breakfast)",
        duration: "30 days",
        instructions: "Gastroprotection for antiplatelets."
      }
    ]
  }
];

export const INITIAL_LAB_REPORTS = [
  {
    id: 1,
    patientId: 1,
    testName: "Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose",
    testDate: new Date(Date.now() - 86400000).toISOString(),
    status: "completed",
    results: {
      "HbA1c": { value: "7.8", unit: "%", abnormal: true, reference: "< 5.7% Normal, 5.7-6.4% Pre-DM" },
      "Fasting Blood Sugar (FBS)": { value: "146", unit: "mg/dL", abnormal: true, reference: "70 - 100 mg/dL" },
      "Estimated Average Glucose (eAG)": { value: "177", unit: "mg/dL", abnormal: true, reference: "< 126 mg/dL" }
    },
    interpretation: "Glycemic parameters indicate suboptimal control on existing monotherapy. Dose optimization or dual agent recommended.",
    patientName: "Rajesh Kumar Sharma",
    doctorName: "Dr. Arvind Mathur"
  },
  {
    id: 2,
    patientId: 3,
    testName: "Comprehensive Lipid Panel",
    testDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "completed",
    results: {
      "Total Cholesterol": { value: "192", unit: "mg/dL", abnormal: false, reference: "< 200 mg/dL" },
      "LDL Cholesterol": { value: "68", unit: "mg/dL", abnormal: false, reference: "< 70 mg/dL (Post-ACS target)" },
      "HDL Cholesterol": { value: "44", unit: "mg/dL", abnormal: false, reference: "> 40 mg/dL" },
      "Triglycerides": { value: "162", unit: "mg/dL", abnormal: true, reference: "< 150 mg/dL" }
    },
    interpretation: "Target LDL (<70 mg/dL) achieved on Rosuvastatin 20mg. Triglycerides mildly elevated; dietary lifestyle modifications advised.",
    patientName: "Vikram Singh Rathore",
    doctorName: "Dr. Priya Sharma"
  },
  {
    id: 3,
    patientId: 2,
    testName: "Complete Hemogram with Absolute Eosinophil Count",
    testDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "pending",
    results: null,
    interpretation: "Specimen in processing at Central Pathology Core Laboratory.",
    patientName: "Sunita Devi",
    doctorName: "Dr. Rajesh Verma"
  }
];

export const INITIAL_RADIOLOGY_REPORTS = [
  {
    id: 1,
    patientId: 2,
    modality: "CT",
    studyName: "High-Resolution Computed Tomography (HRCT) Thorax",
    studyDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "completed",
    patientName: "Sunita Devi",
    doctorName: "Dr. Rajesh Verma",
    findings: "Volumetric HRCT chest demonstrates subtle bronchial wall thickening in bilateral lower lobes. No active alveolar infiltrates, honeycombing, or mediastinal lymphadenopathy. Pleural spaces are clear.",
    impression: "Features consistent with reactive small airway disease / asthma with mild bronchospasm. No consolidation or interstitial lung disease.",
    radiologistName: "Dr. Ananya Sen, MD (Radio-Diagnosis)"
  },
  {
    id: 2,
    patientId: 3,
    modality: "Echo",
    studyName: "Transthoracic 2D Echocardiography with Color Doppler",
    studyDate: new Date(Date.now() - 86400000 * 6).toISOString(),
    status: "completed",
    patientName: "Vikram Singh Rathore",
    doctorName: "Dr. Priya Sharma",
    findings: "Left ventricle of normal size. LVEF visually estimated at 55%. Grade 1 LV diastolic dysfunction (impaired relaxation). No regional wall motion abnormality in LAD territory. Valves structurally normal.",
    impression: "Good post-revascularization left ventricular systolic function. No ischemic mitral regurgitation.",
    radiologistName: "Dr. Ananya Sen, MD (Radio-Diagnosis)"
  },
  {
    id: 3,
    patientId: 1,
    modality: "X-Ray",
    studyName: "Chest X-Ray PA View",
    studyDate: new Date().toISOString(),
    status: "scheduled",
    patientName: "Rajesh Kumar Sharma",
    doctorName: "Dr. Arvind Mathur",
    findings: "",
    impression: "Awaiting patient positioning in Digital X-Ray Room 3",
    radiologistName: "Staff Radiographer"
  }
];

export const INITIAL_MEDICAL_RECORDS = [
  {
    id: 1,
    patientId: 1,
    doctorId: 1,
    hospitalId: 1,
    visitDate: new Date(Date.now() - 86400000).toISOString(),
    chiefComplaint: "Follow up for blood pressure and routine diabetes checkup. Reports occasional mild morning headache.",
    diagnosis: "Essential Hypertension (Stage 1), Type 2 Diabetes Mellitus (Uncontrolled HbA1c 7.8%)",
    symptoms: ["Morning headache", "Increased thirst (polydipsia)", "Mild fatigue"],
    vitalSigns: {
      bloodPressure: "138/88 mmHg",
      heartRate: 74,
      temperature: 98.4,
      spo2: 99,
      respiratoryRate: 16,
      weight: "74 kg",
      height: "172 cm",
      bmi: "25.0"
    },
    treatmentPlan: "Step up Metformin to 500mg BD. Continue Telmisartan 40mg OD. Advised low glycemic index diet and 45 mins brisk walking 5 days/week.",
    notes: "Patient counseled on ABHA consent-based sharing with AIIMS Jodhpur endocrinology unit.",
    followUpDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    patientName: "Rajesh Kumar Sharma",
    doctorName: "Dr. Arvind Mathur"
  },
  {
    id: 2,
    patientId: 2,
    doctorId: 3,
    hospitalId: 1,
    visitDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    chiefComplaint: "Dry nocturnal cough and chest tightness triggered by cold air and dust for past 2 weeks.",
    diagnosis: "Moderate Persistent Bronchial Asthma with cold air hyperresponsiveness",
    symptoms: ["Nocturnal cough", "Wheezing on expiration", "Dyspnea on moderate exertion"],
    vitalSigns: {
      bloodPressure: "122/76 mmHg",
      heartRate: 82,
      temperature: 98.6,
      spo2: 96,
      respiratoryRate: 20
    },
    treatmentPlan: "Prescribed Budesonide/Formoterol 200/6 mcg MDI. Added Montelukast-Levocetirizine. Peak flow charting ordered.",
    notes: "Chest HRCT ordered to rule out bronchiectasis. Review in 2 weeks with peak flow diary.",
    followUpDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    patientName: "Sunita Devi",
    doctorName: "Dr. Rajesh Verma"
  }
];

export const INITIAL_BED_CAPACITY = {
  hospitalName: "AIIMS Jodhpur",
  totalBeds: 960,
  occupiedBeds: 806,
  availableBeds: 154,
  occupancyRate: "83.9%",
  wards: [
    {
      id: "icu",
      name: "Medical & Surgical Intensive Care Unit (ICU)",
      total: 120,
      occupied: 102,
      available: 18,
      ventilatorsTotal: 120,
      ventilatorsInUse: 84,
      status: "normal",
      chargeNurse: "Sister Mary Kutty",
    },
    {
      id: "emergency",
      name: "Emergency & Trauma Resuscitation Ward",
      total: 60,
      occupied: 48,
      available: 12,
      ventilatorsTotal: 25,
      ventilatorsInUse: 18,
      status: "busy",
      chargeNurse: "Staff Nurse Rajesh Beniwal",
    },
    {
      id: "hpc_oxygen",
      name: "High Dependency Unit (HDU / Oxygen Ward)",
      total: 350,
      occupied: 310,
      available: 40,
      ventilatorsTotal: 40,
      ventilatorsInUse: 22,
      status: "normal",
      chargeNurse: "Sister Anjana Thomas",
    },
    {
      id: "general_med",
      name: "General Medical & Surgical Inpatient Ward",
      total: 430,
      occupied: 346,
      available: 84,
      ventilatorsTotal: 0,
      ventilatorsInUse: 0,
      status: "normal",
      chargeNurse: "Staff Nurse Preeti Choudhary",
    }
  ]
};

export const INITIAL_INVOICES = [
  {
    id: 1,
    invoiceNumber: "INV-AIIMS-2025-00104",
    patientId: 1,
    patientName: "Rajesh Kumar Sharma",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "paid",
    subtotal: "450.00",
    tax: "0.00",
    discount: "0.00",
    total: "450.00",
    paidAmount: "450.00",
    lineItems: [
      { description: "Super-Speciality OPD Registration & Consultation", amount: 50, quantity: 1 },
      { description: "HbA1c & Fasting Glucose Automated Lab Panel", amount: 400, quantity: 1 }
    ],
    notes: "Payment received via UPI (Ref: 43810294120)"
  },
  {
    id: 2,
    invoiceNumber: "INV-AIIMS-2025-00105",
    patientId: 2,
    patientName: "Sunita Devi",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "paid",
    subtotal: "1250.00",
    tax: "0.00",
    discount: "0.00",
    total: "1250.00",
    paidAmount: "1250.00",
    lineItems: [
      { description: "Pulmonary OPD Consultation Fee", amount: 50, quantity: 1 },
      { description: "High-Resolution Thoracic CT (HRCT)", amount: 1200, quantity: 1 }
    ],
    notes: "Covered under Chiranjeevi / Ayushman Bharat PM-JAY scheme (100% cashless)"
  },
  {
    id: 3,
    invoiceNumber: "INV-AIIMS-2025-00106",
    patientId: 3,
    patientName: "Vikram Singh Rathore",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "paid",
    subtotal: "950.00",
    tax: "0.00",
    discount: "0.00",
    total: "950.00",
    paidAmount: "950.00",
    lineItems: [
      { description: "Cardiology OPD Follow-up", amount: 50, quantity: 1 },
      { description: "Color Doppler 2D Echocardiogram", amount: 900, quantity: 1 }
    ],
    notes: "Central Government Health Scheme (CGHS) Beneficiary"
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    actorName: "Dr. Arvind Mathur",
    role: "doctor",
    action: "create",
    entityType: "prescription",
    entityId: 1,
    details: "e-Prescription issued for Rajesh Kumar Sharma (Metformin + Telmisartan + Atorvastatin)",
    ipAddress: "172.16.24.12",
    hospitalId: 1,
    hospitalName: "AIIMS Jodhpur",
    status: "success",
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    actorName: "Kavita Rao",
    role: "receptionist",
    action: "create",
    entityType: "appointment_token",
    entityId: 1,
    details: "Issued OPD Token OPD-MED-042 for Rajesh Kumar Sharma via ABHA QR scan",
    ipAddress: "172.16.10.05",
    hospitalId: 1,
    hospitalName: "AIIMS Jodhpur",
    status: "success",
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    actorName: "Sunil Verma",
    role: "lab_technician",
    action: "update",
    entityType: "lab_report",
    entityId: 1,
    details: "Dispatched verified Glycated Hemoglobin (HbA1c: 7.8%) results",
    ipAddress: "172.16.18.22",
    hospitalId: 1,
    hospitalName: "AIIMS Jodhpur",
    status: "success",
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actorName: "Ramesh Patel",
    role: "pharmacist",
    action: "update",
    entityType: "prescription",
    entityId: 2,
    details: "Dispensed Budesonide MDI + Azithromycin for Sunita Devi",
    ipAddress: "172.16.30.14",
    hospitalId: 1,
    hospitalName: "AIIMS Jodhpur",
    status: "success",
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    actorName: "Chikit System Administrator",
    role: "admin",
    action: "verify",
    entityType: "abha_identity",
    entityId: 1,
    details: "ABHA Health Facility Registry (HFR) heartbeat verified: IN0810001249",
    ipAddress: "172.16.1.1",
    hospitalId: 1,
    hospitalName: "AIIMS Jodhpur",
    status: "success",
  }
];

export const INITIAL_STAFF = [
  { id: 1, name: "Dr. Arvind Mathur", role: "doctor", department: "Internal Medicine", email: "dr.mathur@chikit.health", phone: "+91 98290 44551", status: "on_duty" },
  { id: 2, name: "Dr. Priya Sharma", role: "doctor", department: "Cardiology", email: "dr.priya@chikit.health", phone: "+91 98291 55662", status: "on_duty" },
  { id: 3, name: "Dr. Rajesh Verma", role: "doctor", department: "Pulmonology", email: "dr.verma@chikit.health", phone: "+91 98292 66773", status: "on_duty" },
  { id: 4, name: "Sister Mary Kutty", role: "nurse", department: "ICU & Critical Care", email: "nurse@chikit.health", phone: "+91 98296 11223", status: "on_duty" },
  { id: 5, name: "Ramesh Patel", role: "pharmacist", department: "Central Pharmacy", email: "pharmacist@chikit.health", phone: "+91 98297 22334", status: "on_duty" },
  { id: 6, name: "Sunil Verma", role: "lab_technician", department: "Clinical Pathology", email: "lab@chikit.health", phone: "+91 98298 33445", status: "on_duty" },
  { id: 7, name: "Dr. Ananya Sen", role: "radiology_technician", department: "Radio-Diagnosis", email: "radiology@chikit.health", phone: "+91 98299 44556", status: "on_duty" },
  { id: 8, name: "Kavita Rao", role: "receptionist", department: "OPD Central Reception", email: "receptionist@chikit.health", phone: "+91 98290 55667", status: "on_duty" },
];

export const INITIAL_DRUGS = [
  { id: 1, name: "Metformin 500mg (SR)", genericName: "Metformin Hydrochloride", brandNames: ["Glycomet", "Glucophage"], drugClass: "Biguanide (Antidiabetic)", dosageForms: ["Tablet"], strength: "500 mg", contraindications: ["Severe renal impairment (eGFR < 30)", "Metabolic acidosis"], sideEffects: ["GI upset", "Nausea", "Metallic taste"], pregnancyRisk: "B", interactions: ["Contrast media", "Cimetidine"], stock: 1200, category: "Essential Medicine" },
  { id: 2, name: "Telmisartan 40mg", genericName: "Telmisartan", brandNames: ["Telma", "Micardis"], drugClass: "Angiotensin II Receptor Blocker (ARB)", dosageForms: ["Tablet"], strength: "40 mg", contraindications: ["Pregnancy (2nd/3rd trimester)", "Bilateral renal artery stenosis"], sideEffects: ["Dizziness", "Hyperkalemia"], pregnancyRisk: "D", interactions: ["Potassium supplements", "NSAIDs"], stock: 850, category: "Cardiovascular" },
  { id: 3, name: "Atorvastatin 10mg", genericName: "Atorvastatin Calcium", brandNames: ["Atorva", "Lipitor"], drugClass: "HMG-CoA Reductase Inhibitor (Statin)", dosageForms: ["Tablet"], strength: "10 mg", contraindications: ["Active liver disease", "Pregnancy"], sideEffects: ["Myalgia", "Mild transaminase elevation"], pregnancyRisk: "X", interactions: ["Clarithromycin", "Cyclosporine"], stock: 920, category: "Lipid Lowering" },
  { id: 4, name: "Budesonide 200mcg Inhaler", genericName: "Budesonide", brandNames: ["Budecort", "Pulmicort"], drugClass: "Inhaled Corticosteroid", dosageForms: ["MDI / Inhaler"], strength: "200 mcg/actuation", contraindications: ["Status asthmaticus primary treatment"], sideEffects: ["Oral candidiasis", "Dysphonia"], pregnancyRisk: "B", interactions: ["Strong CYP3A4 inhibitors"], stock: 340, category: "Respiratory" },
  { id: 5, name: "Aspirin 75mg Gastro-Resistant", genericName: "Acetylsalicylic Acid", brandNames: ["Ecosprin", "Disprin"], drugClass: "Antiplatelet / Salicylate", dosageForms: ["Enteric Coated Tablet"], strength: "75 mg", contraindications: ["Active peptic ulcer", "Bleeding disorders"], sideEffects: ["Dyspepsia", "Increased bleeding time"], pregnancyRisk: "D", interactions: ["Warfarin", "Heparin"], stock: 1600, category: "Cardiovascular" },
  { id: 6, name: "Pantoprazole 40mg", genericName: "Pantoprazole Sodium", brandNames: ["Pan 40", "Pantocid"], drugClass: "Proton Pump Inhibitor (PPI)", dosageForms: ["Tablet", "Injection"], strength: "40 mg", contraindications: ["Known hypersensitivity to substituted benzimidazoles"], sideEffects: ["Headache", "Diarrhea"], pregnancyRisk: "B", interactions: ["Atazanavir", "Methotrexate"], stock: 1450, category: "Gastrointestinal" },
  { id: 7, name: "Paracetamol 650mg", genericName: "Acetaminophen", brandNames: ["Dolo 650", "Calpol"], drugClass: "Analgesic / Antipyretic", dosageForms: ["Tablet", "Syrup", "IV Infusion"], strength: "650 mg", contraindications: ["Severe hepatic failure"], sideEffects: ["Rare rash", "Hepatotoxicity in overdose"], pregnancyRisk: "B", interactions: ["Alcohol", "Warfarin (chronic high dose)"], stock: 4500, category: "Essential Analgesic" },
  { id: 8, name: "Azithromycin 500mg", genericName: "Azithromycin Dihydrate", brandNames: ["Azee", "Zithromax"], drugClass: "Macrolide Antibiotic", dosageForms: ["Tablet", "Suspension"], strength: "500 mg", contraindications: ["Cholestatic jaundice history with macrolides"], sideEffects: ["Nausea", "Abdominal cramping", "QT prolongation"], pregnancyRisk: "B", interactions: ["Antacids (absorption delay)", "Digoxin"], stock: 680, category: "Antimicrobial" },
];

/**
 * Stateful storage manager with localStorage persistence
 */
class DemoStore {
  hospitals: DemoHospital[] = INITIAL_HOSPITALS;
  doctors = INITIAL_DOCTORS;
  patients = INITIAL_PATIENTS;
  appointments = INITIAL_APPOINTMENTS;
  prescriptions = INITIAL_PRESCRIPTIONS;
  labReports = INITIAL_LAB_REPORTS;
  radiologyReports = INITIAL_RADIOLOGY_REPORTS;
  medicalRecords = INITIAL_MEDICAL_RECORDS;
  bedCapacity = INITIAL_BED_CAPACITY;
  invoices = INITIAL_INVOICES;
  auditLogs = INITIAL_AUDIT_LOGS;
  staff = INITIAL_STAFF;
  drugs = INITIAL_DRUGS;

  constructor() {
    this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem("chikit_demo_store");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.patients) this.patients = data.patients;
        if (data.appointments) this.appointments = data.appointments;
        if (data.prescriptions) this.prescriptions = data.prescriptions;
        if (data.labReports) this.labReports = data.labReports;
        if (data.radiologyReports) this.radiologyReports = data.radiologyReports;
        if (data.medicalRecords) this.medicalRecords = data.medicalRecords;
        if (data.auditLogs) this.auditLogs = data.auditLogs;
        if (data.invoices) this.invoices = data.invoices;
      }
    } catch (e) {
      console.warn("Could not load stored demo data, using initial set", e);
    }
  }

  save() {
    try {
      localStorage.setItem("chikit_demo_store", JSON.stringify({
        patients: this.patients,
        appointments: this.appointments,
        prescriptions: this.prescriptions,
        labReports: this.labReports,
        radiologyReports: this.radiologyReports,
        medicalRecords: this.medicalRecords,
        auditLogs: this.auditLogs,
        invoices: this.invoices,
      }));
    } catch (e) {
      console.warn("Could not save demo store", e);
    }
  }

  addPatient(p: any) {
    const id = this.patients.length + 1;
    const newP = {
      id,
      patientCode: `PT2025${String(id).padStart(3, "0")}`,
      chikitHealthId: `CHK-2025-JOD${String(id).padStart(3, "0")}`,
      abhaStatus: "verified",
      isActive: true,
      createdAt: new Date().toISOString(),
      primaryHospitalId: 1,
      ...p
    };
    this.patients.unshift(newP);
    this.addAudit("create", "patient", id, `Registered patient ${newP.name} (ABHA: ${newP.abhaNumber || "Unlinked"})`);
    this.save();
    return newP;
  }

  addAppointment(appt: any) {
    const id = this.appointments.length + 1;
    const patient = this.patients.find(p => p.id === Number(appt.patientId));
    const doctor = this.doctors.find(d => d.id === Number(appt.doctorId));
    const newAppt = {
      id,
      patientId: Number(appt.patientId),
      doctorId: Number(appt.doctorId),
      hospitalId: 1,
      appointmentDate: appt.appointmentDate || appt.date || new Date().toISOString(),
      reason: appt.reason || "General OPD Consultation",
      status: appt.status || "scheduled",
      tokenNumber: `OPD-${doctor?.department?.slice(0, 4).toUpperCase() || "GEN"}-${String(id + 40).padStart(3, "0")}`,
      patientName: patient?.name || `Patient #${appt.patientId}`,
      doctorName: doctor?.name || `Dr. #${appt.doctorId}`,
      hospitalName: "AIIMS Jodhpur",
      department: doctor?.department || "General Medicine"
    };
    this.appointments.unshift(newAppt);
    this.addAudit("create", "appointment", id, `Booked appointment for ${newAppt.patientName} with ${newAppt.doctorName}`);
    this.save();
    return newAppt;
  }

  updateAppointmentStatus(id: number, status: string) {
    const appt = this.appointments.find(a => a.id === id);
    if (appt) {
      appt.status = status;
      this.addAudit("update", "appointment", id, `Updated status to ${status} for appointment #${id}`);
      this.save();
    }
    return appt;
  }

  addPrescription(rx: any) {
    const id = this.prescriptions.length + 1;
    const patient = this.patients.find(p => p.id === Number(rx.patientId));
    const doctor = this.doctors.find(d => d.id === Number(rx.doctorId)) || this.doctors[0];
    const newRx = {
      id,
      patientId: Number(rx.patientId),
      doctorId: doctor.id,
      hospitalId: 1,
      prescriptionDate: new Date().toISOString(),
      diagnosis: rx.diagnosis || "Clinical Diagnosis",
      status: "active",
      patientName: patient?.name || `Patient #${rx.patientId}`,
      doctorName: doctor.name,
      instructions: rx.instructions || "Take as directed",
      followUpDays: rx.followUpDays || 30,
      medications: rx.medications || []
    };
    this.prescriptions.unshift(newRx);
    this.addAudit("create", "prescription", id, `Issued prescription for ${newRx.patientName} (${newRx.medications.length} items)`);
    this.save();
    return newRx;
  }

  dispensePrescription(id: number) {
    const rx = this.prescriptions.find(p => p.id === Number(id));
    if (rx) {
      rx.status = "dispensed";
      this.addAudit("update", "prescription", id, `Pharmacist dispensed all medications for Prescription #${id}`);
      this.save();
    }
    return rx;
  }

  addMedicalRecord(rec: any) {
    const id = this.medicalRecords.length + 1;
    const patient = this.patients.find(p => p.id === Number(rec.patientId));
    const doctor = this.doctors.find(d => d.id === Number(rec.doctorId)) || this.doctors[0];
    const newRec = {
      id,
      patientId: Number(rec.patientId),
      doctorId: doctor.id,
      hospitalId: 1,
      visitDate: rec.visitDate || new Date().toISOString(),
      chiefComplaint: rec.chiefComplaint || "Clinical Consultation",
      diagnosis: rec.diagnosis || "Clinical Diagnosis",
      symptoms: rec.symptoms || [],
      vitalSigns: rec.vitalSigns || {},
      treatmentPlan: rec.treatmentPlan || "Prescribed medical therapy",
      notes: rec.notes || "Recorded in clinical workflow",
      followUpDate: rec.followUpDate,
      createdAt: new Date().toISOString(),
      patientName: patient?.name || `Patient #${rec.patientId}`,
      doctorName: doctor.name
    };
    this.medicalRecords.unshift(newRec);
    this.addAudit("create", "medical_record", id, `Recorded clinical encounter for ${newRec.patientName}`);
    this.save();
    return newRec;
  }

  addLabReport(report: any) {
    const id = this.labReports.length + 1;
    const patient = this.patients.find(p => p.id === Number(report.patientId));
    const newReport = {
      id,
      patientId: Number(report.patientId),
      testName: report.testName,
      testDate: new Date().toISOString(),
      status: report.status || "completed",
      results: report.results || null,
      interpretation: report.interpretation || "",
      patientName: patient?.name || `Patient #${report.patientId}`,
      doctorName: "Dr. Arvind Mathur"
    };
    this.labReports.unshift(newReport);
    this.addAudit("create", "lab_report", id, `Laboratory report generated for ${newReport.testName}`);
    this.save();
    return newReport;
  }

  updateLabReport(id: number, data: any) {
    const report = this.labReports.find(r => r.id === Number(id));
    if (report) {
      if (data.results) report.results = data.results;
      if (data.interpretation) report.interpretation = data.interpretation;
      if (data.status) report.status = data.status;
      this.addAudit("update", "lab_report", id, `Updated lab report #${id}`);
      this.save();
    }
    return report;
  }

  addAudit(action: string, entityType: string, entityId: number, details: string) {
    const id = this.auditLogs.length + 1;
    const actor = JSON.parse(localStorage.getItem("chikit_demo_user") || "null") || {
      name: "Dr. Arvind Mathur",
      role: "doctor"
    };
    this.auditLogs.unshift({
      id,
      timestamp: new Date().toISOString(),
      actorName: actor.name || "AIIMS Staff",
      role: actor.role || "staff",
      action,
      entityType,
      entityId,
      details,
      ipAddress: "172.16.24.12",
      hospitalId: 1,
      hospitalName: "AIIMS Jodhpur",
      status: "success",
    });
  }

  getDashboardStats() {
    return {
      totalPatients: this.patients.length,
      totalDoctors: this.doctors.length,
      totalHospitals: this.hospitals.length,
      todayAppointments: this.appointments.length,
      pendingLabReports: this.labReports.filter(l => l.status === "pending").length,
      recentMedicalRecords: this.medicalRecords.length,
      aiAnalysesToday: 18,
      bedOccupancyRate: 83.9,
      activePrescriptions: this.prescriptions.filter(p => p.status === "active").length,
      abhaLinkingPercentage: 98.4,
      opdTokensIssuedToday: 184,
      hospitalName: "AIIMS Jodhpur",
      hospitalSlug: "aiims-jodhpur",
    };
  }
}

export const demoStore = new DemoStore();
