import { useEffect, useState } from "react";
import { FiCheckCircle, FiLoader, FiSmartphone } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Stage = "form" | "pending" | "success";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  certificateId: string;
  certificateTitle: string;
  amount: number;
  defaultPhone: string;
  onPaid: (phone: string, receipt: string) => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  certificateId,
  certificateTitle,
  amount,
  defaultPhone,
  onPaid,
}: Props) {
  const [phone, setPhone] = useState(defaultPhone);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPhone(defaultPhone);
      setStage("form");
      setError("");
    }
  }, [open, defaultPhone]);

  const normalized = phone.replace(/\D/g, "");

  const startPayment = () => {
    if (normalized.length < 9) {
      setError("Enter a valid M-Pesa phone number");
      return;
    }
    setError("");
    setStage("pending");
    // Simulated STK push — replaced by the live Daraja API later.
    window.setTimeout(() => {
      const receipt = `S${Date.now().toString(36).toUpperCase().slice(-8)}`;
      setStage("success");
      onPaid(phone, receipt);
      window.setTimeout(() => onOpenChange(false), 1400);
    }, 3200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (stage === "pending" ? null : onOpenChange(v))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay to unlock your certificate</DialogTitle>
          <DialogDescription>
            M-Pesa STK Push · {certificateTitle} · {certificateId}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">Amount payable</p>
          <p className="text-3xl font-bold">KES {amount.toLocaleString()}</p>
        </div>

        {stage === "form" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
              <Input
                id="mpesa-phone"
                value={phone}
                placeholder="0712 345 678"
                onChange={(e) => setPhone(e.target.value)}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <Button className="w-full" onClick={startPayment}>
              <FiSmartphone className="mr-2 h-4 w-4" /> Send STK Push
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Simulated payment for this demo release.
            </p>
          </div>
        ) : null}

        {stage === "pending" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <FiLoader className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">Check your phone</p>
            <p className="text-sm text-muted-foreground">
              Enter your M-Pesa PIN to authorise KES {amount.toLocaleString()}…
            </p>
          </div>
        ) : null}

        {stage === "success" ? (
          <div className="animate-in fade-in zoom-in-95 flex flex-col items-center gap-3 py-6 text-center">
            <FiCheckCircle className="h-10 w-10 text-primary" />
            <p className="font-semibold">Payment successful</p>
            <p className="text-sm text-muted-foreground">Your certificate is now unlocked.</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
