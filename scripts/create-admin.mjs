import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

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

function sanitizeKey(s) {
  return encodeURIComponent(s).replace(/[.#$\[\]]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function hash(password) {
  let h = 5381;
  for (let i = 0; i < password.length; i++) h = (h * 33) ^ password.charCodeAt(i);
  return `d${(h >>> 0).toString(36)}`;
}

async function main() {
  const [, , emailArg, passwordArg, ...nameParts] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error("Usage: node scripts/create-admin.mjs <email> <password> [Full Name]");
    process.exit(1);
  }

  const email = String(emailArg).trim().toLowerCase();
  const password = String(passwordArg);
  const fullName = nameParts.length ? nameParts.join(" ") : "Administrator";

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  const idx = sanitizeKey(email);
  const existing = await get(ref(db, `admin_emails/${idx}`));
  if (existing.exists()) {
    console.error("An admin with that email already exists in Firebase.");
    process.exit(1);
  }

  const id = `ADMIN-${Date.now().toString(36).toUpperCase()}`;
  const admin = {
    id,
    email,
    fullName,
    role: "super_admin",
    createdAt: new Date().toISOString(),
    passwordHash: hash(password),
  };

  const updates = {};
  updates[`admins/${id}`] = admin;
  updates[`admin_emails/${idx}`] = id;

  await update(ref(db), updates);

  console.log(`Created admin ${email} with id ${id}`);
}

main().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
