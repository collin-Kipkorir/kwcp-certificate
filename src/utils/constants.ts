import type { AdminSettings } from "@/types/Certificate";

export const CERTIFICATE_TYPES = [
  "Food Handler Certificate",
  "Public Health and Hygiene",
  "Work Ethics Certificate",
  "Fire Safety Training",
  "Customer Service",
  "Occupational Safety",
  "Basic First Aid",
];

export const ADMIN_PASSWORD = "admin123";

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  logo: "",
  signature: "",
  seal: "",
  watermark: "",
  organization: "Republic of Kenya",
  ministry: "Ministry of Health",
};

export const STORAGE_KEYS = {
  admin: "adminSettings",
  counter: "certificateCounter",
  certificates: "generatedCertificates",
  draft: "applicantDraft",
  theme: "portalTheme",
} as const;