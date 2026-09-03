import type { CertificateCatalogItem, GeneratedCertificate, PaymentRecord } from "@/types/Certificate";
import {
  saveCertificateToDb,
  loadCertificatesFromDb,
  saveCertificateCounterToDb,
  loadCertificateCounterFromDb,
  savePaymentToDb,
  loadPaymentsFromDb,
  saveAdminSettingsToDb,
  loadAdminSettingsFromDb,
  saveCertificateCatalogToDb,
  loadCertificateCatalogFromDb,
  deleteCertificateCatalogItemFromDb,
} from "@/lib/firebase";
import { DEFAULT_ADMIN_SETTINGS, DEFAULT_CERTIFICATE_CATALOG } from "./constants";
import type { AdminSettings } from "@/types/Certificate";

// Keep local copies for fast access during app runtime
let certificateCache: GeneratedCertificate[] | null = null;
let paymentCache: PaymentRecord[] | null = null;
let adminSettingsCache: AdminSettings | null = null;
let certificateCounterCache: number | null = null;
let certificateCatalogCache: CertificateCatalogItem[] | null = null;

/**
 * Load certificates from Firebase (with local cache)
 */
export async function loadCertificates(): Promise<GeneratedCertificate[]> {
  if (certificateCache !== null) {
    return certificateCache;
  }

  try {
    const certs = await loadCertificatesFromDb();
    certificateCache = certs as unknown as GeneratedCertificate[];
    return certificateCache;
  } catch (err) {
    console.warn("Failed to load certificates from Firebase:", err);
    certificateCache = [];
    return [];
  }
}

/**
 * Save certificate to Firebase and update cache
 */
export async function saveCertificate(cert: GeneratedCertificate): Promise<void> {
  try {
    await saveCertificateToDb(cert as unknown as Record<string, unknown>);
    // Update cache: add to front of list
    if (!certificateCache) {
      certificateCache = [];
    }
    certificateCache = [cert, ...certificateCache.filter((c) => c.id !== cert.id)];
  } catch (err) {
    console.error("Failed to save certificate to Firebase:", err);
    throw err;
  }
}

/**
 * Save all certificates to Firebase and update cache
 */
export async function saveCertificates(certs: GeneratedCertificate[]): Promise<void> {
  try {
    for (const cert of certs) {
      await saveCertificateToDb(cert as unknown as Record<string, unknown>);
    }
    certificateCache = certs;
  } catch (err) {
    console.error("Failed to save certificates to Firebase:", err);
    throw err;
  }
}

/**
 * Load certificate counter from Firebase (with local cache)
 */
export async function loadCertificateCounter(): Promise<number> {
  if (certificateCounterCache !== null) {
    return certificateCounterCache;
  }

  try {
    const counter = await loadCertificateCounterFromDb();
    certificateCounterCache = counter;
    return counter;
  } catch (err) {
    console.warn("Failed to load certificate counter from Firebase:", err);
    certificateCounterCache = 1;
    return 1;
  }
}

/**
 * Save certificate counter to Firebase and update cache
 */
export async function saveCertificateCounter(counter: number): Promise<void> {
  try {
    await saveCertificateCounterToDb(counter);
    certificateCounterCache = counter;
  } catch (err) {
    console.error("Failed to save certificate counter to Firebase:", err);
    throw err;
  }
}

/**
 * Load payments from Firebase (with local cache)
 */
export async function loadPayments(): Promise<PaymentRecord[]> {
  if (paymentCache !== null) {
    return paymentCache;
  }

  try {
    const payments = await loadPaymentsFromDb();
    paymentCache = payments as unknown as PaymentRecord[];
    return paymentCache;
  } catch (err) {
    console.warn("Failed to load payments from Firebase:", err);
    paymentCache = [];
    return [];
  }
}

/**
 * Save payment to Firebase and update cache
 */
export async function savePayment(payment: PaymentRecord): Promise<void> {
  try {
    await savePaymentToDb(payment as unknown as Record<string, unknown>);
    if (!paymentCache) {
      paymentCache = [];
    }
    paymentCache = [payment, ...paymentCache.filter((p) => p.certificateId !== payment.certificateId)];
  } catch (err) {
    console.error("Failed to save payment to Firebase:", err);
    throw err;
  }
}

/**
 * Load certificate catalog from Firebase (with local cache and defaults)
 */
export async function loadCertificateCatalog(): Promise<CertificateCatalogItem[]> {
  if (certificateCatalogCache !== null) {
    return certificateCatalogCache;
  }

  try {
    const items = await loadCertificateCatalogFromDb();
    if (items && items.length) {
      certificateCatalogCache = items as unknown as CertificateCatalogItem[];
      return certificateCatalogCache;
    }
  } catch (err) {
    console.warn("Failed to load certificate catalog from Firebase:", err);
  }

  certificateCatalogCache = [...DEFAULT_CERTIFICATE_CATALOG];
  return certificateCatalogCache;
}

export async function saveCertificateCatalog(items: CertificateCatalogItem[]): Promise<void> {
  try {
    await saveCertificateCatalogToDb(items as unknown as Record<string, unknown>[]);
    certificateCatalogCache = items;
  } catch (err) {
    console.error("Failed to save certificate catalog to Firebase:", err);
    throw err;
  }
}

export async function deleteCertificateCatalogItem(id: string): Promise<void> {
  try {
    await deleteCertificateCatalogItemFromDb(id);
    if (certificateCatalogCache) {
      certificateCatalogCache = certificateCatalogCache.filter((item) => item.id !== id);
    }
  } catch (err) {
    console.error("Failed to delete certificate catalog item:", err);
    throw err;
  }
}

/**
 * Load admin settings from Firebase (with local cache and defaults)
 */
export async function loadAdminSettings(): Promise<AdminSettings> {
  if (adminSettingsCache !== null) {
    return adminSettingsCache;
  }

  try {
    const settings = await loadAdminSettingsFromDb();
    if (settings) {
      adminSettingsCache = { ...DEFAULT_ADMIN_SETTINGS, ...settings } as AdminSettings;
      return adminSettingsCache;
    }
  } catch (err) {
    console.warn("Failed to load admin settings from Firebase:", err);
  }

  adminSettingsCache = DEFAULT_ADMIN_SETTINGS;
  return adminSettingsCache;
}

/**
 * Save admin settings to Firebase and update cache
 */
export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  try {
    await saveAdminSettingsToDb(settings as unknown as Record<string, unknown>);
    adminSettingsCache = settings;
  } catch (err) {
    console.error("Failed to save admin settings to Firebase:", err);
    throw err;
  }
}

/**
 * Clear all caches (useful after logout or manual refresh)
 */
export function clearCaches(): void {
  certificateCache = null;
  paymentCache = null;
  adminSettingsCache = null;
  certificateCounterCache = null;
  certificateCatalogCache = null;
}
