import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FiCheckCircle, FiEye, FiLock, FiSearch, FiShield } from "react-icons/fi";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificatePreview } from "@/components/CertificatePreview";
import { AdminModal } from "@/components/AdminModal";
import { AuthScreen } from "@/components/AuthScreen";
import { PaymentModal } from "@/components/PaymentModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { isPaid } from "@/utils/auth";
import { buildCertificateNumber, buildQrPayload, formatCertificateDate } from "@/utils/certificate";
import { downloadPdf, downloadPng, printCertificate } from "@/utils/pdf";
import {
  loadAdminSettings,
  loadCertificates,
  loadCertificateCounter,
  saveCertificates,
  saveCertificateCounter,
  loadPayments,
  savePayment,
  saveAdminSettings,
} from "@/utils/certificateDb";
import {
  loadDraft,
  saveDraft,
  loadTheme,
  saveTheme,
} from "@/utils/localStorage";
import { DEFAULT_ADMIN_SETTINGS, priceFor } from "@/utils/constants";
import type { AdminSettings, GeneratedCertificate, PaymentRecord } from "@/types/Certificate";

export default function Home() {
  const { user, ready, logout } = useAuth();
  const sheetRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [counter, setCounter] = useState(1);
  const [certificates, setCertificates] = useState<GeneratedCertificate[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [name, setName] = useState("");
  const [certificate, setCertificate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [issued, setIssued] = useState<GeneratedCertificate | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const adminTapsRef = useRef<{ count: number; last: number }>({ count: 0, last: 0 });

  // Secret admin access: Ctrl/Cmd + Shift + A, or 5 quick taps on the brand mark.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setAdminOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSecretAdminTrigger = () => {
    const now = Date.now();
    const state = adminTapsRef.current;
    state.count = now - state.last < 700 ? state.count + 1 : 1;
    state.last = now;
    if (state.count >= 5) {
      state.count = 0;
      setAdminOpen(true);
    }
  };

  const hydrate = async () => {
    try {
      const [s, cnt, certs, pays] = await Promise.all([
        loadAdminSettings(),
        loadCertificateCounter(),
        loadCertificates(),
        loadPayments(),
      ]);
      setSettings(s);
      setCounter(cnt);
      setCertificates(certs);
      setPayments(pays);
    } catch (err) {
      console.error("Failed to hydrate from Firebase:", err);
      toast.error("Failed to load data from server");
    }
  };

  useEffect(() => {
    hydrate();
    const draft = loadDraft();
    setName(draft.name);
    setCertificate(draft.certificate);
    const t = loadTheme();
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  useEffect(() => {
    if (user && !name) setName(user.fullName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    saveDraft({ name, certificate });
  }, [name, certificate]);

  const today = useMemo(() => formatCertificateDate(), []);

  const preview = issued ?? {
    id: buildCertificateNumber(counter),
    name,
    certificate,
    date: today,
  };

  const paid = Boolean(issued && isPaid(payments, issued.id));
  const price = priceFor(certificate || preview.certificate);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const updateSettings = async (s: AdminSettings) => {
    setSettings(s);
    try {
      await saveAdminSettings(s);
    } catch (err) {
      console.error("Failed to save admin settings:", err);
      toast.error("Failed to save settings to server");
    }
  };

  const handleGenerate = () => {
    if (!name.trim()) {
      toast.error("Applicant name is required");
      return;
    }
    if (!certificate) {
      toast.error("Please select a certificate");
      return;
    }

    const key = (n: string, c: string) => `${n.trim().toLowerCase()}|${c.trim().toLowerCase()}`;
    const existing = certificates.find((c) => key(c.name, c.certificate) === key(name, certificate));
    if (existing) {
      setIssued(existing);
      toast.info(`Existing certificate ${existing.id} loaded for this person and title`);
      return;
    }

    setGenerating(true);
    window.setTimeout(async () => {
      try {
        const date = formatCertificateDate();
        const id = buildCertificateNumber(counter);
        const record: GeneratedCertificate = {
          id,
          name: name.trim(),
          certificate,
          date,
          qr: buildQrPayload({ id, name: name.trim(), certificate, date }),
          createdAt: new Date().toISOString(),
        };
        const nextList = [record, ...certificates];
        setCertificates(nextList);
        await saveCertificates(nextList);
        const nextCounter = counter + 1;
        setCounter(nextCounter);
        await saveCertificateCounter(nextCounter);
        setIssued(record);
        setGenerating(false);
        toast.success(`Certificate ${id} generated — pay to unlock the download`);
      } catch (err) {
        console.error("Failed to generate certificate:", err);
        toast.error("Failed to save certificate to server");
        setGenerating(false);
      }
    }, 700);
  };

  const requirePayment = () => {
    if (!issued) return true;
    if (!paid) {
      setPayOpen(true);
      toast.info("Complete the M-Pesa payment to unlock this certificate");
      return true;
    }
    return false;
  };

  const withSheet = async (fn: (node: HTMLElement, fileName: string) => Promise<void>) => {
    if (!sheetRef.current || !issued) return;
    if (requirePayment()) return;
    const t = toast.loading("Preparing file…");
    try {
      await fn(sheetRef.current, `${issued.id}-${issued.name.replace(/\s+/g, "-")}`);
      toast.success("File ready", { id: t });
    } catch {
      toast.error("Could not create the file", { id: t });
    }
  };

  const handlePrint = () => {
    if (requirePayment()) return;
    printCertificate();
  };

  const handlePaid = async (phone: string, receipt: string) => {
    if (!issued || !user) return;
    const record: PaymentRecord = {
      certificateId: issued.id,
      userId: user.id,
      amount: priceFor(issued.certificate),
      phone,
      receipt,
      paidAt: new Date().toISOString(),
    };
    try {
      await savePayment(record);
      const pays = await loadPayments();
      setPayments(pays);
      toast.success(`Payment confirmed · Receipt ${receipt}`);

      // Auto-download the unlocked certificate as A4 landscape PDF.
      window.setTimeout(async () => {
        if (!sheetRef.current) return;
        const t = toast.loading("Downloading your certificate…");
        try {
          await downloadPdf(sheetRef.current, `${issued.id}-${issued.name.replace(/\s+/g, "-")}`);
          toast.success("Certificate downloaded", { id: t });
        } catch {
          toast.error("Could not create the file", { id: t });
        }
      }, 600);
    } catch (err) {
      console.error("Failed to save payment:", err);
      toast.error("Failed to save payment to server");
    }
  };

  const reset = () => {
    setName(user?.fullName ?? "");
    setCertificate("");
    setIssued(null);
  };

  const filtered = certificates
    .filter(
      (c) =>
        !query.trim() ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 10);

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onSecretAdminTrigger={handleSecretAdminTrigger}
        organization={settings.organization}
        ministry={settings.ministry}
        userName={user.fullName}
        onLogout={() => {
          logout();
          toast.success("Signed out");
        }}
      />

      <section className="gov-band border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase">
              <FiShield className="h-3.5 w-3.5" /> Government-style verified issuance
            </span>
            <h2 className="mt-3 text-2xl leading-tight font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Generate your official worker certificate
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Fill in your details, pay securely with M-Pesa, and download a print-ready A4
              landscape certificate with a unique number and QR verification code.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {[
              { label: "Certificates issued", value: certificates.length.toString() },
              { label: "Verified by QR", value: "100%" },
              { label: "Delivery", value: "Instant" },
              { label: "Payment", value: "M-Pesa" },
            ].map((s) => (
              <div
                key={s.label}
                className="gov-card rounded-xl border border-border bg-card px-4 py-3"
              >
                <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  {s.label}
                </dt>
                <dd className="mt-0.5 truncate text-lg font-bold sm:text-xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <CertificateForm
              name={name}
              certificate={certificate}
              generating={generating}
              generated={Boolean(issued)}
              paid={paid}
              price={price}
              onPay={() => setPayOpen(true)}
              onNameChange={setName}
              onCertificateChange={setCertificate}
              onGenerate={handleGenerate}
              onDownloadPdf={() => withSheet(downloadPdf)}
              onDownloadPng={() => withSheet(downloadPng)}
              onPrint={handlePrint}
              onReset={reset}
            />

            {issued ? (
              <div className="animate-in fade-in zoom-in-95 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                {paid ? (
                  <FiCheckCircle className="h-6 w-6 shrink-0 text-primary" />
                ) : (
                  <FiLock className="h-6 w-6 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {paid ? "Certificate unlocked" : "Certificate issued — payment pending"}
                  </p>
                  <p className="truncate text-muted-foreground">{issued.id}</p>
                </div>
              </div>
            ) : null}

            <section className="gov-card rounded-2xl border border-border bg-card p-4 sm:p-6">
              <h2 className="text-base font-semibold sm:text-lg">Recent Certificates</h2>
              <div className="relative mt-3">
                <FiSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name or number"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {filtered.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No certificates yet.</li>
                ) : (
                  filtered.map((c) => (
                    <li
                      key={c.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.id} · {c.certificate} ·{" "}
                          {isPaid(payments, c.id) ? "Paid" : `KES ${priceFor(c.certificate)}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Load certificate ${c.id}`}
                        onClick={() => {
                          setIssued(c);
                          setName(c.name);
                          setCertificate(c.certificate);
                          toast.success("Certificate loaded into preview");
                        }}
                      >
                        <FiEye className="h-4 w-4" />
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          <section className="gov-card min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-6">
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap sm:justify-between">
              <h2 className="truncate text-base font-semibold sm:text-lg">
                Live Certificate Preview
              </h2>
              {issued && !paid ? (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Hidden until payment
                </span>
              ) : null}
            </div>
            <div className="relative overflow-hidden rounded-xl border border-border">
              {/*
                The preview follows a four-state visual rule:
                - No data entered: invisible but still occupies layout (opacity 0)
                - Data entered but not issued: visible (teaser - no blur)
                - Issued but unpaid: fully blurred (blur-3xl) with lock overlay
                - Issued and paid: fully visible and sharp
              */}
              <div
                className={(() => {
                  const hasInput = Boolean(name.trim() || certificate);
                  const isLocked = Boolean(issued && !paid);
                  let classes = "transition-[filter,opacity] duration-300";
                  if (isLocked) {
                    // Issued but unpaid: blur it heavily
                    classes += " pointer-events-none select-none blur-3xl";
                  } else if (!hasInput) {
                    // No data entered: hide it
                    classes += " opacity-0";
                  }
                  // Otherwise (data entered but not issued, OR issued and paid): show normally
                  return classes;
                })()}
                aria-hidden={Boolean(issued && !paid) || (!name.trim() && !certificate) ? true : undefined}
              >
                <CertificatePreview ref={sheetRef} data={preview} settings={settings} />
              </div>

              {issued && !paid ? (
                <div className="animate-in fade-in absolute inset-0 grid place-items-center bg-card/60 p-4 text-center backdrop-blur-sm sm:p-6">
                  <div className="max-w-xs space-y-3 rounded-2xl border border-border bg-card p-6 shadow-lg">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                      <FiLock className="h-5 w-5" />
                    </span>
                    <p className="font-semibold">Certificate locked</p>
                    <p className="text-sm text-muted-foreground">
                      Pay KES {priceFor(issued.certificate).toLocaleString()} via M-Pesa to reveal{" "}
                      {issued.id}. It downloads automatically once payment succeeds.
                    </p>
                    <Button className="w-full sm:w-auto" onClick={() => setPayOpen(true)}>
                      Pay with M-Pesa
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <AdminModal
        open={adminOpen}
        onOpenChange={setAdminOpen}
        settings={settings}
        onSave={updateSettings}
        onResetCounter={() => {
          setCounter(1);
          saveCertificateCounter(1);
          toast.success("Certificate counter reset");
        }}
        onImported={hydrate}
      />

      {issued ? (
        <PaymentModal
          open={payOpen}
          onOpenChange={setPayOpen}
          certificateId={issued.id}
          certificateTitle={issued.certificate}
          amount={priceFor(issued.certificate)}
          defaultPhone={user.phone}
          onPaid={handlePaid}
        />
      ) : null}
    </div>
  );
}
