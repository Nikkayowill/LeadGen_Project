import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  FileText,
  LayoutDashboard,
  ListChecks,
  Plus,
  Radar,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/dashboard" className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/30 bg-sky-400/15 text-sky-200 shadow-[0_0_28px_rgba(56,189,248,0.18)]">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-wide text-foreground">SiteScout</p>
                <p className="truncate text-xs text-sky-200/70">Local website sales pipeline</p>
              </div>
            </div>
          </Link>
          <Button asChild size="sm">
            <Link href="/leads/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New lead
            </Link>
          </Button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-transparent px-3 text-sm text-muted-foreground transition hover:border-sky-300/20 hover:bg-sky-400/10 hover:text-sky-100"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}
