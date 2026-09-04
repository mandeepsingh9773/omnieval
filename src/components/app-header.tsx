import Link from "next/link";
import { BookOpen, FlaskConical, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeyVaultDialog } from "@/components/byok/key-vault-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

export interface AppHeaderProps {
  /** Short page context shown under the OmniEval wordmark. */
  subtitle: string;
  /** Brand mark inside the primary icon tile. Defaults to FlaskConical. */
  icon?: LucideIcon;
  /** The single cross-page navigation action (Home ↔ Arena). */
  nav: {
    href: string;
    label: string;
    icon: LucideIcon;
  };
  /** Hide the "User Guide" link (used while already viewing the guide). */
  hideGuide?: boolean;
}

export function AppHeader({
  subtitle,
  icon: BrandIcon = FlaskConical,
  nav,
  hideGuide = false,
}: AppHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BrandIcon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">OmniEval</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={nav.href}>
            <nav.icon />
            {nav.label}
          </Link>
        </Button>
        {!hideGuide && (
          <Button asChild variant="outline" size="sm">
            <Link href="/guide">
              <BookOpen />
              User Guide
            </Link>
          </Button>
        )}
        <KeyVaultDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
