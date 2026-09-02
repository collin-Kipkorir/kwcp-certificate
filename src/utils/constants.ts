import type { AdminSettings } from "@/types/Certificate";
import sign from "@/assets/sign.png";
export const APP_NAME = "KWCP";
export const APP_FULL_NAME = "Kenya Workers Certification Portal";

export const DEFAULT_CERTIFICATE_CATALOG = [
  { id: "food-handler", title: "Food Handler Certificate", price: 1500, active: true, createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "public-health", title: "Public Health and Hygiene", price: 1200, active: true, createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "work-ethics", title: "Work Ethics Certificate", price: 800, active: true, createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "fire-safety", title: "Fire Safety Training", price: 2000, active: true, createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "customer-service", title: "Customer Service", price: 900, active: true, createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "occupational-safety", title: "Occupational Safety", price: 1800, active: true, createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "first-aid", title: "Basic First Aid", price: 1000, active: true, createdAt: "2024-01-01T00:00:00.000Z" },
] as const;

export const CERTIFICATE_TYPES = DEFAULT_CERTIFICATE_CATALOG.filter((item) => item.active).map((item) => item.title);

export const CERTIFICATE_PRICES: Record<string, number> = Object.fromEntries(
  DEFAULT_CERTIFICATE_CATALOG.map((item) => [item.title, item.price]),
) as Record<string, number>;

export const priceFor = (
  certificate: string,
  catalog: Array<{ title: string; price: number }> = DEFAULT_CERTIFICATE_CATALOG,
) => {
  const match = catalog.find((item) => item.title === certificate);
  return match?.price ?? CERTIFICATE_PRICES[certificate] ?? 1000;
};

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