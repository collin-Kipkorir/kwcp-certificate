import type { AdminSettings } from "@/types/Certificate";
import sign from "@/assets/sign.png";
export const APP_NAME = "KWCP";
export const APP_FULL_NAME = "Kenya Workers Certification Portal";

export const CERTIFICATE_TYPES = [
  "Food Handler Certificate",
  "Public Health and Hygiene",
  "Work Ethics Certificate",
  "Fire Safety Training",
  "Customer Service",
  "Occupational Safety",
  "Basic First Aid",
];

/** Price in KES per certificate title. */
export const CERTIFICATE_PRICES: Record<string, number> = {
  "Food Handler Certificate": 1500,
  "Public Health and Hygiene": 1200,
  "Work Ethics Certificate": 800,
  "Fire Safety Training": 2000,
  "Customer Service": 900,
  "Occupational Safety": 1800,
  "Basic First Aid": 1000,
};

export const priceFor = (certificate: string) => CERTIFICATE_PRICES[certificate] ?? 1000;

export const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos","Kajiado","Nyeri","Meru",
  "Kakamega","Bungoma","Trans Nzoia","Kericho","Bomet","Kilifi","Kwale","Taita Taveta","Garissa",
  "Mandera","Wajir","Marsabit","Isiolo","Turkana","West Pokot","Samburu","Baringo","Laikipia",
  "Elgeyo Marakwet","Nandi","Vihiga","Busia","Siaya","Homa Bay","Migori","Kisii","Nyamira","Narok",
  "Tharaka Nithi","Embu","Kitui","Makueni","Muranga","Kirinyaga","Nyandarua","Lamu","Tana River",
];

export const ADMIN_PASSWORD = "admin123";

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  logo: "",
  // Default signature uses the bundled asset `src/assets/sign.png`.
  // To change, replace `src/assets/sign.png` with your preferred image (file name: sign.png).
  signature: sign,
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
  users: "kwcpUsers",
  session: "kwcpSession",
  payments: "kwcpPayments",
  admins: "kwcpAdmins",
  adminSession: "kwcpAdminSession",
} as const;