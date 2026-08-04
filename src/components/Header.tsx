import { FiMoon, FiSun, FiSettings, FiAward } from "react-icons/fi";
import { Button } from "@/components/ui/button";

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenAdmin: () => void;
  organization: string;
  ministry: string;
}

export function Header({ theme, onToggleTheme, onOpenAdmin, organization, ministry }: Props) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <FiAward className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              Certificate Generation Portal
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {organization} · {ministry}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenAdmin} aria-label="Admin settings">
            <FiSettings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}