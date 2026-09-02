import { FiAward, FiShield } from "react-icons/fi";
import { APP_FULL_NAME, APP_NAME } from "@/utils/constants";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-card">
      <div className="kenya-stripe h-1 w-full" />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <FiAward className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {APP_NAME} — {APP_FULL_NAME}
            </p>
            <p className="text-xs text-muted-foreground">
              Every certificate carries a unique number and QR verification code.
            </p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <FiShield className="h-4 w-4 shrink-0" />
          Government-grade security and verification.
        </p>
      </div>
    </footer>
  );
}
