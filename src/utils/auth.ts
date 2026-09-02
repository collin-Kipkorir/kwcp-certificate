import { STORAGE_KEYS } from "./constants";
import type { AppUser, PaymentRecord, StoredUser } from "@/types/Certificate";
import { createUserInDb, findUserByEmail } from "@/lib/firebase";

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

export const loadUsers = (): StoredUser[] => read<StoredUser[]>(STORAGE_KEYS.users, []);
const saveUsers = (u: StoredUser[]) => write(STORAGE_KEYS.users, u);

const SESSION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

interface SessionData {
  id: string;
  timestamp: number;
}

export function loadSession(): AppUser | null {
  const data = read<SessionData | null>(STORAGE_KEYS.session, null);
  if (!data) return null;
  
  // Check if session has expired (older than 3 minutes)
  const now = Date.now();
  if (now - data.timestamp > SESSION_TIMEOUT_MS) {
    // Session expired, clear it
    saveSession(null);
    return null;
  }
  
  const user = loadUsers().find((u) => u.id === data.id);
  if (!user) return null;
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}

export const saveSession = (id: string | null) => {
  if (id === null) {
    write(STORAGE_KEYS.session, null);
  } else {
    write(STORAGE_KEYS.session, {
      id,
      timestamp: Date.now(),
    } as SessionData);
  }
};

// Update session timestamp on activity to keep user logged in
export const updateSessionTimestamp = () => {
  const data = read<SessionData | null>(STORAGE_KEYS.session, null);
  if (data) {
    write(STORAGE_KEYS.session, {
      id: data.id,
      timestamp: Date.now(),
    } as SessionData);
  }
};

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  county: string;
  password: string;
}

export async function registerUser(input: RegisterInput): Promise<AppUser> {
  const users = loadUsers();
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) {
    throw new Error("An account with this email already exists");
  }
  const user: StoredUser = {
    id: `U-${Date.now().toString(36).toUpperCase()}`,
    fullName: input.fullName.trim(),
    email,
    phone: input.phone.trim(),
    nationalId: input.nationalId.trim(),
    county: input.county,
    createdAt: new Date().toISOString(),
    passwordHash: hash(input.password),
  };

  // Try to persist to Firebase RTDB. If that fails due to a network/permission
  // error we fall back to local storage; if the email already exists remotely
  // surface a clear error to the user.
  try {
    await createUserInDb(user as unknown as Record<string, unknown>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Email already exists")) {
      throw new Error("An account with this email already exists");
    }
    // Surface Firebase write failures so they are visible in the UI and
    // developers can diagnose permission/network issues instead of silently
    // falling back to local storage.
    // eslint-disable-next-line no-console
    console.error("Firebase createUserInDb failed:", msg);
    throw new Error(`Failed to save user to Firebase: ${msg}`);
  }

  saveSession(user.id);
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}

export async function loginUser(email: string, password: string): Promise<AppUser> {
  const normalized = email.trim().toLowerCase();
  // First attempt: query Firebase RTDB
  try {
    const remote = await findUserByEmail(normalized);
    if (remote) {
      const storedHash = (remote["passwordHash"] as string) ?? "";
      if (storedHash !== hash(password)) throw new Error("Invalid email or password");
      const id = (remote["id"] as string) ?? (remote["email"] as string);
      
      // Add/update user in local storage so session can find them on refresh
      const users = loadUsers();
      const existingIndex = users.findIndex((u) => u.id === id);
      const userToStore = remote as unknown as StoredUser;
      if (existingIndex >= 0) {
        users[existingIndex] = userToStore;
      } else {
        users.push(userToStore);
      }
      saveUsers(users);
      
      saveSession(id);
      const { passwordHash: _ignored, ...rest } = userToStore;
      return rest as AppUser;
    }
  } catch (err) {
    // If Firebase lookup fails for reasons other than not-found, warn and
    // continue to fallback to local storage. If it's a more serious error,
    // surface a helpful message.
    const msg = err instanceof Error ? err.message : String(err);
    // If it's a permission or unexpected failure, include hint.
    // eslint-disable-next-line no-console
    console.warn("Firebase lookup failed, falling back to local storage:", msg);
  }

  // Fallback: local storage
  const user = loadUsers().find((u) => u.email === normalized);
  if (!user || user.passwordHash !== hash(password)) {
    throw new Error("Invalid email or password");
  }
  saveSession(user.id);
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}

export const logoutUser = () => saveSession(null);

export const loadPayments = (): PaymentRecord[] =>
  read<PaymentRecord[]>(STORAGE_KEYS.payments, []);

export function savePayment(record: PaymentRecord) {
  const list = loadPayments().filter((p) => p.certificateId !== record.certificateId);
  write(STORAGE_KEYS.payments, [record, ...list]);
}

export const isPaid = (payments: PaymentRecord[], certificateId: string) =>
  payments.some((p) => p.certificateId === certificateId);
