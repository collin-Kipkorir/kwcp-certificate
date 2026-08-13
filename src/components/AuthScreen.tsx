import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { FiAward, FiLoader, FiShield, FiSmartphone, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { APP_FULL_NAME, APP_NAME, COUNTIES } from "@/utils/constants";

type Mode = "register" | "login";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("register");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    county: "Nairobi",
    password: "",
    confirm: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const u = await login(form.email, form.password);
        toast.success(`Welcome back, ${u.fullName.split(" ")[0]}`);
      } else {
        if (form.password.length < 6) throw new Error("Password must be at least 6 characters");
        if (form.password !== form.confirm) throw new Error("Passwords do not match");
        const u = await register(form);
        toast.success(`Account created — welcome, ${u.fullName.split(" ")[0]}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kenya-bg grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between p-8 text-white xl:p-12 lg:flex">
        <div className="kenya-stripe absolute inset-x-0 top-0 h-1.5" />
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10">
            <FiAward className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight">{APP_NAME}</p>
            <p className="truncate text-sm opacity-80">{APP_FULL_NAME}</p>
          </div>
        </div>

        <div className="max-w-md space-y-6 py-10">
          <h2 className="text-3xl leading-tight font-bold xl:text-4xl">
            Certified workers. Verified certificates.
          </h2>
          <ul className="space-y-4 text-sm opacity-90">
            {[
              { icon: FiShield, text: "QR-verified certificates issued in your name" },
              { icon: FiSmartphone, text: "Pay securely with M-Pesa STK Push" },
              { icon: FiCheckCircle, text: "Instant PDF, PNG and print-ready A4 download" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs opacity-70">
          Records are stored securely on this device for the demo release.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
        <div className="animate-in fade-in slide-in-from-bottom-3 w-full max-w-xl">
          <div className="mb-6 flex items-center gap-3 text-white lg:hidden">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10">
              <FiAward className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold">{APP_NAME}</p>
              <p className="truncate text-xs opacity-80">{APP_FULL_NAME}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-8">
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {(["register", "login"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    mode === m
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "register" ? "Create account" : "Log in"}
                </button>
              ))}
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "register" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "register"
                ? "Start your professional certification journey."
                : "Log in to generate and download your certificates."}
            </p>

            <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {mode === "register" ? (
                <Field
                  id="fullName"
                  label="Full Name"
                  className="sm:col-span-2"
                  value={form.fullName}
                  onChange={(v) => set("fullName", v)}
                  placeholder="John Musa Okello"
                />
              ) : null}

              <Field
                id="email"
                label="Email"
                type="email"
                className={mode === "login" ? "sm:col-span-2" : ""}
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="you@example.com"
              />

              {mode === "register" ? (
                <>
                  <Field
                    id="phone"
                    label="Phone (M-Pesa)"
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                    placeholder="+2547…"
                  />
                  <Field
                    id="nationalId"
                    label="National ID"
                    value={form.nationalId}
                    onChange={(v) => set("nationalId", v)}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Select value={form.county} onValueChange={(v) => set("county", v)}>
                      <SelectTrigger id="county">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {COUNTIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}

              <Field
                id="password"
                label="Password"
                type="password"
                className={mode === "login" ? "sm:col-span-2" : ""}
                value={form.password}
                onChange={(v) => set("password", v)}
              />

              {mode === "register" ? (
                <Field
                  id="confirm"
                  label="Confirm Password"
                  type="password"
                  value={form.confirm}
                  onChange={(v) => set("confirm", v)}
                />
              ) : null}

              <Button type="submit" disabled={loading} className="mt-2 w-full sm:col-span-2">
                {loading ? <FiLoader className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading
                  ? "Please wait…"
                  : mode === "register"
                    ? "Create account"
                    : "Log in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "register" ? "Already have an account?" : "New to KWCP?"}{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setMode(mode === "register" ? "login" : "register")}
              >
                {mode === "register" ? "Log in" : "Create one"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        required
        maxLength={120}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
