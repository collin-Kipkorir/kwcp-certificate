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
import { loadAdminSettings } from "@/utils/certificateDb";

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

  const startPayment = async () => {
    if (normalized.length < 9) {
      setError("Enter a valid M-Pesa phone number");
      return;
    }
    setError("");
    setStage("pending");

    try {
      const admin = await loadAdminSettings();
      const channelId = admin?.paylorChannelId as string | undefined;

      // Normalize to international MSISDN (e.g., 2547XXXXXXXX)
      let msisdn = normalized;
      if (msisdn.startsWith("0") && msisdn.length >= 9) msisdn = `254${msisdn.slice(1)}`;
      if (msisdn.length === 9) msisdn = `254${msisdn}`;

      const reference = `${certificateId}-${Date.now().toString(36)}`;
      // Idempotency key for safe retries — ensures duplicate charges are prevented
      const idempotencyKey = `${reference}-stk-push`;

      const payload: Record<string, unknown> = {
        phone: msisdn,
        amount,
        reference,
        description: `Payment for ${certificateTitle}`,
      };
      if (channelId) payload["channelId"] = channelId;

      // Call local proxy to avoid CORS and keep API keys server-side
      const res = await fetch(`/api/stk-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ ...payload, channelId }),
      });

      if (!res.ok) {
        // Try to parse Paylor error structure for better error messages
        let errorMsg = `Payment request failed (${res.status})`;
        try {
          const errorData = (await res.json()) as any;
          if (errorData.error?.details?.[0]?.message) {
            errorMsg = errorData.error.details[0].message;
          } else if (errorData.error?.message) {
            errorMsg = errorData.error.message;
          } else if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch {
          // Fallback if response isn't JSON
        }
        throw new Error(errorMsg);
      }

      const data = (await res.json()) as { transactionId?: string; status?: string };
      const txId = data.transactionId;
      if (!txId) throw new Error("No transaction id returned from Paylor");

      // Poll transaction status until COMPLETED or FAILED (timeout ~2 minutes)
      const start = Date.now();
      const timeoutMs = 120_000;

      const poll = async (): Promise<any> => {
        const q = await fetch(`/api/transactions/${encodeURIComponent(txId)}`);
        if (!q.ok) {
          let errorMsg = `Transaction query failed (${q.status})`;
          try {
            const errorData = (await q.json()) as any;
            if (errorData.error?.message) {
              errorMsg = errorData.error.message;
            } else if (errorData.message) {
              errorMsg = errorData.message;
            }
          } catch {
            // Fallback if response isn't JSON
          }
          throw new Error(errorMsg);
        }
        return q.json();
      };

      while (Date.now() - start < timeoutMs) {
        // small delay between polls
        await new Promise((r) => setTimeout(r, 3000));
        const statusResp = await poll();
        const status = statusResp?.status as string | undefined;
        if (status === "COMPLETED") {
          // Use provider metadata or providerRef as receipt when available
          const receipt = statusResp?.metadata?.mpesaReceipt ?? statusResp?.providerRef ?? txId;
          setStage("success");
          onPaid(msisdn, receipt);
          window.setTimeout(() => onOpenChange(false), 1200);
          return;
        }
        if (status === "FAILED") {
          throw new Error("Payment failed or was declined");
        }
        // otherwise continue polling
      }

      throw new Error("Payment not confirmed in time — please try again or check later");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStage("form");
      console.error("STK push error:", err);
    }
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
