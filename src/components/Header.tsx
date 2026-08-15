import { FiMoon, FiSun, FiAward, FiLogOut } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { APP_FULL_NAME, APP_NAME } from "@/utils/constants";

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  /** Hidden admin entry point: triggered by a secret gesture on the brand mark. */
  onSecretAdminTrigger: () => void;
  organization: string;
  ministry: string;
  userName: string;
  onLogout: () => void;
}

export function Header({
  theme,
  onToggleTheme,
  onSecretAdminTrigger,
  organization,
  ministry,
  userName,
  onLogout,
}: Props) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="kenya-stripe h-1.5 w-full" />
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 cursor-default place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm select-none sm:h-11 sm:w-11"
            onClick={onSecretAdminTrigger}
          >
            <FiAward className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-bold tracking-tight sm:text-lg">
                <span className="text-primary">{APP_NAME}</span>
                <span className="hidden sm:inline"> · {APP_FULL_NAME}</span>
              </h1>
              <span className="hidden shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase md:inline">
                Official
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              {organization} · {ministry}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials || "U"}
            </span>
            <span className="max-w-[140px] truncate text-sm">{userName}</span>
          </div>
          <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={onLogout} aria-label="Sign out">
            <FiLogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
