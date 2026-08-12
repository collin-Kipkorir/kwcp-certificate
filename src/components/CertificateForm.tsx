import {
  FiAward,
  FiDownload,
  FiImage,
  FiPrinter,
  FiPlus,
  FiLoader,
  FiLock,
  FiSmartphone,
} from "react-icons/fi";
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
import { CERTIFICATE_TYPES, priceFor } from "@/utils/constants";

interface Props {
  name: string;
  certificate: string;
  generating: boolean;
  generated: boolean;
  paid: boolean;
  price: number;
  onPay: () => void;
  onNameChange: (v: string) => void;
  onCertificateChange: (v: string) => void;
  onGenerate: () => void;
  onDownloadPdf: () => void;
  onDownloadPng: () => void;
  onPrint: () => void;
  onReset: () => void;
}

export function CertificateForm({
  name,
  certificate,
  generating,
  generated,
  paid,
  price,
  onPay,
  onNameChange,
  onCertificateChange,
  onGenerate,
  onDownloadPdf,
  onDownloadPng,
  onPrint,
  onReset,
}: Props) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <h2 className="text-lg font-semibold">Applicant Details</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The preview updates instantly as you type.
      </p>

      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="applicant-name">Applicant Name</Label>
          <Input
            id="applicant-name"
            value={name}
            maxLength={60}
            placeholder="e.g. John Musa Okello"
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificate-type">Certificate Type</Label>
          <Select value={certificate} onValueChange={onCertificateChange}>
            <SelectTrigger id="certificate-type">
              <SelectValue placeholder="Select a certificate" />
            </SelectTrigger>
            <SelectContent>
              {CERTIFICATE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t} — KES {priceFor(t).toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {certificate ? (
            <p className="text-sm text-muted-foreground">
              Fee: <span className="font-semibold text-foreground">KES {price.toLocaleString()}</span>
            </p>
          ) : null}
        </div>

        <Button className="w-full active:scale-[0.98]" onClick={onGenerate} disabled={generating}>
          {generating ? (
            <FiLoader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FiAward className="mr-2 h-4 w-4" />
          )}
          {generating ? "Generating…" : "Generate Certificate"}
        </Button>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="outline" onClick={onDownloadPdf} disabled={!generated || !paid}>
            <FiDownload className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={onDownloadPng} disabled={!generated || !paid}>
            <FiImage className="mr-2 h-4 w-4" /> PNG
          </Button>
          <Button variant="outline" onClick={onPrint} disabled={!generated || !paid}>
            <FiPrinter className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>

        {generated && !paid ? (
          <div className="animate-in fade-in space-y-3 rounded-xl border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FiLock className="h-4 w-4" /> Downloads locked
            </p>
            <p className="text-sm text-muted-foreground">
              Pay KES {price.toLocaleString()} via M-Pesa STK Push to reveal and download your
              certificate.
            </p>
            <Button className="w-full" onClick={onPay}>
              <FiSmartphone className="mr-2 h-4 w-4" /> Pay KES {price.toLocaleString()}
            </Button>
          </div>
        ) : null}

        {generated ? (
          <Button
            variant="secondary"
            className="animate-in fade-in w-full"
            onClick={onReset}
          >
            <FiPlus className="mr-2 h-4 w-4" /> Generate Another Certificate
          </Button>
        ) : null}
      </div>
    </section>
  );
}