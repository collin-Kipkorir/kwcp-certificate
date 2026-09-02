import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCCzXkKyFJn4KxLwoKbdZt9HNBDMNYtpZk",
  authDomain: "kwcp-12b10.firebaseapp.com",
  databaseURL: "https://kwcp-12b10-default-rtdb.firebaseio.com",
  projectId: "kwcp-12b10",
  storageBucket: "kwcp-12b10.firebasestorage.app",
  messagingSenderId: "709247628471",
  appId: "1:709247628471:web:bda972c7c6a1b889458932",
  measurementId: "G-T0RLR6KG2F",
};

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getDatabase> | null = null;

function ensureInitialized() {
  if (db && app) return;
  try {
    app = initializeApp(firebaseConfig);
    try {
      // Analytics may throw in some non-browser environments; ignore errors
      // but don't call it on import to avoid Installations requests on page load.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const analytics = getAnalytics(app);
    } catch {
      /* ignore analytics errors */
    }
    db = getDatabase(app);
  } catch (err) {
    // Leave db null if initialization fails (e.g., offline or blocked).
    db = null;
    app = null;
    // Do not throw here; callers will handle missing `db` with clearer errors.
  }
}

function sanitizeKey(s: string) {
  // Encode and escape characters not allowed in RTDB keys: . # $ [ ]
  return encodeURIComponent(s).replace(/[.#$\[\]]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export async function createUserInDb(user: Record<string, unknown>) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  const email = ((user["email"] as string) ?? "").trim().toLowerCase();
  const idx = sanitizeKey(email);
  try {
    const existing = await get(ref(db, `emails/${idx}`));
    if (existing.exists()) {
      throw new Error("Email already exists (remote)");
    }

    const updates: Record<string, unknown> = {};
    updates[`users/${user["id"]}`] = user;
    updates[`emails/${idx}`] = user["id"];

    await update(ref(db), updates);
  } catch (err) {
    throw new Error(`Firebase create failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function findUserByEmail(email: string) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  const norm = email.trim().toLowerCase();
  const idx = sanitizeKey(norm);
  try {
    // Prefer indexed lookup
    const idSnap = await get(ref(db, `emails/${idx}`));
    if (idSnap.exists()) {
      const id = idSnap.val() as string;
      const userSnap = await get(ref(db, `users/${id}`));
      if (!userSnap.exists()) return null;
      return userSnap.val() as Record<string, unknown>;
    }

    // Fallback to older query-by-child
    const q = query(ref(db, "users"), orderByChild("email"), equalTo(norm));
    const snap = await get(q as any);
    if (!snap.exists()) return null;
    const val = snap.val() as Record<string, Record<string, unknown>>;
    const key = Object.keys(val)[0];
    if (!key) return null;
    return val[key];
  } catch (err) {
    throw new Error(`Firebase lookup failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Admin functions
export async function createAdminInDb(admin: Record<string, unknown>) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  const email = ((admin["email"] as string) ?? "").trim().toLowerCase();
  const idx = sanitizeKey(email);
  try {
    const existing = await get(ref(db, `admin_emails/${idx}`));
    if (existing.exists()) {
      throw new Error("Admin email already exists");
    }

    const updates: Record<string, unknown> = {};
    updates[`admins/${admin["id"]}`] = admin;
    updates[`admin_emails/${idx}`] = admin["id"];

    await update(ref(db), updates);
  } catch (err) {
    throw new Error(`Firebase admin create failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function findAdminByEmail(email: string) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  const norm = email.trim().toLowerCase();
  const idx = sanitizeKey(norm);
  try {
    const idSnap = await get(ref(db, `admin_emails/${idx}`));
    if (idSnap.exists()) {
      const id = idSnap.val() as string;
      const adminSnap = await get(ref(db, `admins/${id}`));
      if (!adminSnap.exists()) return null;
      return adminSnap.val() as Record<string, unknown>;
    }
    return null;
  } catch (err) {
    throw new Error(`Firebase admin lookup failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Admin settings functions
export async function loadAdminSettingsFromDb() {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    const snap = await get(ref(db, "admin_settings"));
    if (!snap.exists()) return null;
    return snap.val() as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Firebase settings load failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function saveAdminSettingsToDb(settings: Record<string, unknown>) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    await set(ref(db, "admin_settings"), settings);
  } catch (err) {
    throw new Error(`Firebase settings save failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Certificate catalog functions
export async function saveCertificateCatalogToDb(items: Record<string, unknown>[]) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    const updates: Record<string, unknown> = {};
    for (const item of items) {
      const id = String(item["id"] ?? sanitizeKey(String(item["title"] ?? "")));
      updates[`certificate_catalog/${id}`] = item;
    }
    await update(ref(db), updates);
  } catch (err) {
    throw new Error(`Firebase certificate catalog save failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function loadCertificateCatalogFromDb() {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    const snap = await get(ref(db, "certificate_catalog"));
    if (!snap.exists()) return [];
    const data = snap.val() as Record<string, Record<string, unknown>>;
    return Object.values(data)
      .filter((item) => item && typeof item === "object")
      .sort((a, b) => {
        const aTime = new Date((a["createdAt"] as string) ?? "1970-01-01").getTime();
        const bTime = new Date((b["createdAt"] as string) ?? "1970-01-01").getTime();
        return bTime - aTime;
      });
  } catch (err) {
    throw new Error(`Firebase certificate catalog load failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function deleteCertificateCatalogItemFromDb(id: string) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    await set(ref(db, `certificate_catalog/${id}`), null);
  } catch (err) {
    throw new Error(`Firebase certificate catalog deletion failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Certificate counter functions
export async function loadCertificateCounterFromDb(): Promise<number> {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    const snap = await get(ref(db, "certificate_counter"));
    if (!snap.exists()) return 1;
    return (snap.val() as number) ?? 1;
  } catch (err) {
    throw new Error(`Firebase counter load failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function saveCertificateCounterToDb(counter: number) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    await set(ref(db, "certificate_counter"), counter);
  } catch (err) {
    throw new Error(`Firebase counter save failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Certificate functions
export async function saveCertificateToDb(certificate: Record<string, unknown>) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    const id = certificate["id"] as string;
    await set(ref(db, `certificates/${id}`), certificate);
  } catch (err) {
    throw new Error(`Firebase certificate save failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function loadCertificatesFromDb() {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    const snap = await get(ref(db, "certificates"));
    if (!snap.exists()) return [];
    const data = snap.val() as Record<string, Record<string, unknown>>;
    // Convert to array and sort by createdAt descending
    return Object.values(data).sort((a, b) => {
      const aTime = new Date((a["createdAt"] as string) ?? "").getTime();
      const bTime = new Date((b["createdAt"] as string) ?? "").getTime();
      return bTime - aTime;
    });
  } catch (err) {
    throw new Error(`Firebase certificates load failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Payment functions
export async function savePaymentToDb(payment: Record<string, unknown>) {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    const id = `${payment["certificateId"]}_${payment["userId"]}`.replace(/undefined/g, "");
    await set(ref(db, `payments/${id}`), payment);
  } catch (err) {
    throw new Error(`Firebase payment save failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function loadPaymentsFromDb() {
  ensureInitialized();
  if (!db) throw new Error("Firebase not initialized or offline");
  try {
    const snap = await get(ref(db, "payments"));
    if (!snap.exists()) return [];
    const data = snap.val() as Record<string, Record<string, unknown>>;
    return Object.values(data);
  } catch (err) {
    throw new Error(`Firebase payments load failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
