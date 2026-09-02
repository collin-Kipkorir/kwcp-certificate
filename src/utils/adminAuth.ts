import { STORAGE_KEYS } from "./constants";
import { createAdminInDb, findAdminByEmail } from "@/lib/firebase";

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
    /* ignore */
  }
}

/** Lightweight, demo-only obfuscation. Not real security — replace with a backend later. */
function hash(password: string): string {
  let h = 5381;
  for (let i = 0; i < password.length; i++) h = (h * 33) ^ password.charCodeAt(i);
  return `d${(h >>> 0).toString(36)}`;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "super_admin" | "admin";
  createdAt: string;
}

export interface StoredAdminUser extends AdminUser {
  passwordHash: string;
}

interface AdminSessionData {
  id: string;
  timestamp: number;
}

const SESSION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export function loadAdminSession(): AdminUser | null {
  const data = read<AdminSessionData | null>(STORAGE_KEYS.adminSession, null);
  if (!data) return null;

  // Check if session has expired
  const now = Date.now();
  if (now - data.timestamp > SESSION_TIMEOUT_MS) {
    saveAdminSession(null);
    return null;
  }

  const admin = loadStoredAdmins().find((a) => a.id === data.id);
  if (!admin) return null;
  const { passwordHash: _ignored, ...rest } = admin;
  return rest;
}

export const saveAdminSession = (id: string | null) => {
  if (id === null) {
    write(STORAGE_KEYS.adminSession, null);
  } else {
    write(STORAGE_KEYS.adminSession, {
      id,
      timestamp: Date.now(),
    } as AdminSessionData);
  }
};

export const updateAdminSessionTimestamp = () => {
  const data = read<AdminSessionData | null>(STORAGE_KEYS.adminSession, null);
  if (data) {
    write(STORAGE_KEYS.adminSession, {
      id: data.id,
      timestamp: Date.now(),
    } as AdminSessionData);
  }
};

const loadStoredAdmins = (): StoredAdminUser[] =>
  read<StoredAdminUser[]>(STORAGE_KEYS.admins, []);
const saveStoredAdmins = (admins: StoredAdminUser[]) =>
  write(STORAGE_KEYS.admins, admins);

export async function createAdminUser(input: {
  email: string;
  password: string;
  fullName: string;
  role?: "super_admin" | "admin";
}): Promise<AdminUser> {
  const email = input.email.trim().toLowerCase();
  const stored = loadStoredAdmins();

  // Check local duplicates
  if (stored.some((a) => a.email === email)) {
    throw new Error("An admin account with this email already exists");
  }

  const admin: StoredAdminUser = {
    id: `ADMIN-${Date.now().toString(36).toUpperCase()}`,
    email,
    fullName: input.fullName.trim(),
    role: input.role || "admin",
    createdAt: new Date().toISOString(),
    passwordHash: hash(input.password),
  };

  // Try Firebase
  try {
    await createAdminInDb(admin as unknown as Record<string, unknown>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      throw new Error("An admin account with this email already exists");
    }
    console.error("Firebase admin creation failed:", msg);
    throw new Error(`Failed to save admin to Firebase: ${msg}`);
  }

  // Save to local storage
  stored.push(admin);
  saveStoredAdmins(stored);

  saveAdminSession(admin.id);
  const { passwordHash: _ignored, ...rest } = admin;
  return rest;
}

export async function loginAdminUser(email: string, password: string): Promise<AdminUser> {
  const normalized = email.trim().toLowerCase();

  // First try Firebase
  try {
    const remote = await findAdminByEmail(normalized);
    if (remote) {
      const storedHash = (remote.passwordHash as string) ?? "";
      if (storedHash !== hash(password)) throw new Error("Invalid email or password");
      const id = (remote.id as string) ?? (remote.email as string);

      // Save to local storage
      const stored = loadStoredAdmins();
      const existingIndex = stored.findIndex((a) => a.id === id);
      const adminToStore = remote as unknown as StoredAdminUser;
      if (existingIndex >= 0) {
        stored[existingIndex] = adminToStore;
      } else {
        stored.push(adminToStore);
      }
      saveStoredAdmins(stored);

      saveAdminSession(id);
      const { passwordHash: _ignored, ...rest } = adminToStore;
      return rest as AdminUser;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Firebase admin lookup failed, falling back to local storage:", msg);
  }

  // Fallback to local storage
  const admin = loadStoredAdmins().find((a) => a.email === normalized);
  if (!admin || admin.passwordHash !== hash(password)) {
    throw new Error("Invalid email or password");
  }

  saveAdminSession(admin.id);
  const { passwordHash: _ignored, ...rest } = admin;
  return rest;
}

export const logoutAdminUser = () => saveAdminSession(null);
