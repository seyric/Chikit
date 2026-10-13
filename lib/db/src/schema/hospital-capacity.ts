import { pgTable, serial, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export * from "./bedCategories";
export * from "./hospitalFacilities";
export * from "./hospitalBeds";
export * from "./bedAssignments";
export * from "./bedReservations";
export * from "./hospitalCapacitySnapshots";
export * from "./admissionCoordination";
export * from "./interHospitalTransfers";
export * from "./hospitalCapacityAlerts";
export * from "./hospitalRoutes";