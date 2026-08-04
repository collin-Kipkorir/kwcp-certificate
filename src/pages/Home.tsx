import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FiCheckCircle, FiDownload, FiSearch } from "react-icons/fi";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificatePreview } from "@/components/CertificatePreview";
import { AdminModal } from "@/components/AdminModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildCertificateNumber, buildQrPayload, formatCertificateDate } from "@/utils/certificate";
import { downloadPdf, downloadPng, printCertificate } from "@/utils/pdf";
import {
  loadAdminSettings,
  loadCertificates,
  loadCounter,
  loadDraft,
  loadTheme,
  saveAdminSettings,
  saveCertificates,
  saveCounter,
  saveDraft,
  saveTheme,
} from "@/utils/localStorage";
import { DEFAULT_ADMIN_SETTINGS } from "@/utils/constants";
import type { AdminSettings, GeneratedCertificate } from "@/types/Certificate";

export default function Home() {
  const sheetRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [counter, setCounter] = useState(1);
  const [certificates, setCertificates] = useState<GeneratedCertificate[]>([]);
  const [name, setName] = useState("");
  const [certificate, setCertificate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [issued, setIssued] = useState<GeneratedCertificate | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");

  const hydrate = () => {
    setSettings(loadAdminSettings());
    setCounter(loadCounter());
    setCertificates(loadCertificates());
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
    saveDraft({ name, certificate });
  }, [name, certificate]);

  const today = useMemo(() => formatCertificateDate(), []);

  const preview = issued ?? {
    id: buildCertificateNumber(counter),
    name,
    certificate,
    date: today,
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const updateSettings = (s: AdminSettings) => {
    setSettings(s);
    saveAdminSettings(s);
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

    setGenerating(true);
    window.setTimeout(() => {
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
      saveCertificates(nextList);
      const nextCounter = counter + 1;
      setCounter(nextCounter);
      saveCounter(nextCounter);
      setIssued(record);
      setGenerating(false);
      toast.success(`Certificate ${id} generated`);
    }, 700);
  };

  const withSheet = async (fn: (node: HTMLElement, fileName: string) => Promise<void>) => {
    if (!sheetRef.current || !issued) return;
    const t = toast.loading("Preparing file…");
    try {
      await fn(sheetRef.current, `${issued.id}-${issued.name.replace(/\s+/g, "-")}`);
      toast.success("File ready", { id: t });
    } catch {
      toast.error("Could not create the file", { id: t });
    }
  };

  const reset = () => {
    setName("");
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAdmin={() => setAdminOpen(true)}
        organization={settings.organization}
        ministry={settings.ministry}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-6">
            <CertificateForm
              name={name}
              certificate={certificate}
              generating={generating}
              generated={Boolean(issued)}
              onNameChange={setName}
              onCertificateChange={setCertificate}
              onGenerate={handleGenerate}
              onDownloadPdf={() => withSheet(downloadPdf)}
              onDownloadPng={() => withSheet(downloadPng)}
              onPrint={printCertificate}
              onReset={reset}
            />

            {issued ? (
              <div className="animate-in fade-in zoom-in-95 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <FiCheckCircle className="h-6 w-6 shrink-0 text-primary" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium">Certificate issued</p>
                  <p className="truncate text-muted-foreground">{issued.id}</p>
                </div>
              </div>
            ) : null}

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Recent Certificates</h2>
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
                          {c.id} · {c.certificate}
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
                        <FiDownload className="h-4 w-4" />
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Live Certificate Preview</h2>
            <div className="overflow-hidden rounded-xl border border-border">
              <CertificatePreview ref={sheetRef} data={preview} settings={settings} />
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
          saveCounter(1);
          toast.success("Certificate counter reset");
        }}
        onImported={hydrate}
      />
    </div>
  );
}