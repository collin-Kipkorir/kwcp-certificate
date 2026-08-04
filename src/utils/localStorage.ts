import { DEFAULT_ADMIN_SETTINGS, STORAGE_KEYS } from "./constants";
import type { AdminSettings, CertificateDraft, GeneratedCertificate } from "@/types/Certificate";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded */
  }
}

export const loadAdminSettings = (): AdminSettings => ({
  ...DEFAULT_ADMIN_SETTINGS,
  ...read<Partial<AdminSettings>>(STORAGE_KEYS.admin, {}),
});
export const saveAdminSettings = (s: AdminSettings) => write(STORAGE_KEYS.admin, s);

export const loadCounter = (): number => read<number>(STORAGE_KEYS.counter, 1);
export const saveCounter = (n: number) => write(STORAGE_KEYS.counter, n);

export const loadCertificates = (): GeneratedCertificate[] =>
  read<GeneratedCertificate[]>(STORAGE_KEYS.certificates, []);
export const saveCertificates = (list: GeneratedCertificate[]) =>
  write(STORAGE_KEYS.certificates, list);

export const loadDraft = (): CertificateDraft =>
  read<CertificateDraft>(STORAGE_KEYS.draft, { name: "", certificate: "" });
export const saveDraft = (d: CertificateDraft) => write(STORAGE_KEYS.draft, d);

export const loadTheme = (): "light" | "dark" =>
  read<"light" | "dark">(STORAGE_KEYS.theme, "light");
export const saveTheme = (t: "light" | "dark") => write(STORAGE_KEYS.theme, t);

export function exportStorage(): string {
  return JSON.stringify(
    {
      adminSettings: loadAdminSettings(),
      certificateCounter: loadCounter(),
      generatedCertificates: loadCertificates(),
    },
    null,
    2,
  );
}

export function importStorage(json: string) {
  const data = JSON.parse(json) as {
    adminSettings?: AdminSettings;
    certificateCounter?: number;
    generatedCertificates?: GeneratedCertificate[];
  };
  if (data.adminSettings) saveAdminSettings({ ...DEFAULT_ADMIN_SETTINGS, ...data.adminSettings });
  if (typeof data.certificateCounter === "number") saveCounter(data.certificateCounter);
  if (Array.isArray(data.generatedCertificates)) saveCertificates(data.generatedCertificates);
}