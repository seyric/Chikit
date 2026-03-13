import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import hospitalsRouter from "./hospitals.js";
import doctorsRouter from "./doctors.js";
import patientsRouter from "./patients.js";
import appointmentsRouter from "./appointments.js";
import medicalRecordsRouter from "./medical-records.js";
import labReportsRouter from "./lab-reports.js";
import radiologyRouter from "./radiology.js";
import prescriptionsRouter from "./prescriptions.js";
import aiRouter from "./ai.js";
import auditRouter from "./audit.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/hospitals", hospitalsRouter);
router.use("/doctors", doctorsRouter);
router.use("/patients", patientsRouter);
router.use("/appointments", appointmentsRouter);
router.use("/medical-records", medicalRecordsRouter);
router.use("/lab-reports", labReportsRouter);
router.use("/radiology-reports", radiologyRouter);
router.use("/prescriptions", prescriptionsRouter);
router.use("/ai", aiRouter);
router.use("/audit-logs", auditRouter);
router.use("/stats", statsRouter);

export default router;
