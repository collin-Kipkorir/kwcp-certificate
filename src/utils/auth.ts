import { STORAGE_KEYS } from "./constants";
import type { AppUser, PaymentRecord, StoredUser } from "@/types/Certificate";

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

export function loadSession(): AppUser | null {
  const id = read<string | null>(STORAGE_KEYS.session, null);
  if (!id) return null;
  const user = loadUsers().find((u) => u.id === id);
  if (!user) return null;
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}
export const saveSession = (id: string | null) => write(STORAGE_KEYS.session, id);

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  county: string;
  password: string;
}

export function registerUser(input: RegisterInput): AppUser {
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
  saveUsers([...users, user]);
  saveSession(user.id);
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}

export function loginUser(email: string, password: string): AppUser {
  const user = loadUsers().find((u) => u.email === email.trim().toLowerCase());
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
