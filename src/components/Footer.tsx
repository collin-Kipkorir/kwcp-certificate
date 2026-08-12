import { APP_FULL_NAME, APP_NAME } from "@/utils/constants";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        {APP_NAME} — {APP_FULL_NAME} · Accounts, certificates and payments are stored locally in
        this browser for the demo release.
      </div>
    </footer>
  );
}
