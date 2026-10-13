import { z } from "zod";

// ABDM Configuration Schema
export const abdmConfigSchema = z.object({
  // Base URLs for ABDM APIs
  baseUrl: z.string().url().default("https://abha.abdm.gov.in"),
  sandboxBaseUrl: z.string().url().default("https://sandbox.abdm.gov.in"),

  // API Keys and Secrets (should be stored in environment variables)
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),

  // Facility/HIP Information
  hipId: z.string().min(1), // Health Facility ID
  hipName: z.string().min(1),

  // Callback URLs for ABDM interactions
  callbackUrl: z.string().url(),

  // Token settings
  tokenExpiryMinutes: z.number().default(60),
});

// Type for ABDM configuration
export type ABDMConfig = z.infer<typeof abdmConfigSchema>;

// Default configuration (will be overridden by environment variables)
export const getABDMConfig = (): ABDMConfig => {
  return {
    baseUrl: process.env.ABDM_BASE_URL || "https://abha.abdm.gov.in",
    sandboxBaseUrl: process.env.ABDM_SANDBOX_BASE_URL || "https://sandbox.abdm.gov.in",
    apiKey: process.env.ABDM_API_KEY || "",
    apiSecret: process.env.ABDM_API_SECRET || "",
    hipId: process.env.ABDM_HIP_ID || "",
    hipName: process.env.ABDM_HIP_NAME || "Chikit Facility",
    callbackUrl: process.env.ABDM_CALLBACK_URL || "",
    tokenExpiryMinutes: Number(process.env.ABDM_TOKEN_EXPIRY_MINUTES) || 60,
  };
};

// Validate configuration
export const validateABDMConfig = (config: ABDMConfig) => {
  return abdmConfigSchema.safeParse(config);
};