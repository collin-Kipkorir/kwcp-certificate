import { FiMoon, FiSun, FiSettings, FiAward, FiLogOut } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { APP_FULL_NAME, APP_NAME } from "@/utils/constants";

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenAdmin: () => void;
  organization: string;
  ministry: string;
  userName: string;
  onLogout: () => void;
}

export function Header({
  theme,
  onToggleTheme,
  onOpenAdmin,
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
    <header className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <FiAward className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {APP_NAME} · {APP_FULL_NAME}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {organization} · {ministry}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials || "U"}
            </span>
            <span className="max-w-[140px] truncate text-sm">{userName}</span>
          </div>
          <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenAdmin} aria-label="Admin settings">
            <FiSettings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onLogout} aria-label="Sign out">
            <FiLogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
