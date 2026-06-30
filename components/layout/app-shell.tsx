import Link from "next/link";
import {
  CalendarClock,
  Compass,
  FileText,
  LayoutDashboard,
  ListChecks,
  Plus,
  Radar,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: ListChecks },
  { href: "/lead-finder", label: "Lead finder", icon: Radar },
  { href: "/leads/new", label: "Add lead", icon: Plus },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { href: "/pitch-generator", label: "Pitches", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-40 border-b border-border bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="min-w-0" aria-label="Scoutline dashboard">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-sm border border-primary/25 bg-foreground text-background shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold uppercase tracking-normal text-foreground">Scoutline</p>
                <p className="truncate text-xs font-medium text-muted-foreground">Local prospect command</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/leads/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New lead
              </Link>
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto border-t border-border/70 px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-9 items-center gap-2 rounded-sm border border-transparent px-3 text-sm font-medium text-muted-foreground transition hover:border-border hover:bg-secondary/75 hover:text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
