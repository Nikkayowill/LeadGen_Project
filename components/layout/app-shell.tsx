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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Pipeline MVP</p>
                <p className="truncate text-xs text-muted-foreground">Brand space reserved</p>
              </div>
            </div>
          </Link>
          <Button asChild size="sm">
            <Link href="/leads/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Lead
            </Link>
          </Button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
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
