import Link from "next/link";
import { ArrowUpRight, CalendarClock, DollarSign, ListChecks, MonitorPlay, Trophy } from "lucide-react";
import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { LeadTable } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats } from "@/services/dashboard";

const statCards = [
  { key: "totalLeads", title: "Mapped leads", helper: "Businesses in your route", icon: ListChecks },
  { key: "followUpsDue", title: "Due today", helper: "Timely next touches", icon: CalendarClock },
  { key: "demosBooked", title: "Demos booked", helper: "Warm website conversations", icon: MonitorPlay },
  { key: "wonDeals", title: "Won deals", helper: "Closed website projects", icon: Trophy }
] as const;

export default async function DashboardPage() {
  try {
    const stats = await getDashboardStats();
    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-sm border border-border bg-card p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr] lg:items-end">
            <PageHeader
              title="Route your next website deal"
              description="Scoutline helps you spot local businesses with website gaps, keep follow-ups moving, and turn prospects into booked conversations."
              actions={
                <Button asChild>
                  <Link href="/leads/new">
                    Add lead
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
            <div className="rounded-sm border border-primary/25 bg-primary/[0.06] p-5 shadow-[inset_3px_0_0_hsl(var(--primary))]">
              <p className="text-[11px] font-semibold uppercase tracking-normal text-primary">Pipeline value</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
                {formatCurrency(stats.potentialRevenue)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Estimated active website revenue from build fees plus first-year monthly support.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.key} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
                  </div>
                  <div className="rounded-sm border border-border bg-secondary p-2 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight">{stats[card.key]}</div>
                </CardContent>
              </Card>
            );
          })}
          <Card className="border-accent/30 bg-accent/[0.06] shadow-[inset_3px_0_0_hsl(var(--accent))]">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-foreground">Revenue forecast</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Active pipeline value</p>
              </div>
              <div className="rounded-sm border border-accent/30 bg-accent/15 p-2 text-accent">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{formatCurrency(stats.potentialRevenue)}</div>
              <p className="mt-1 text-xs text-muted-foreground">One-time plus first-year monthly fees</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent leads</h2>
              <p className="text-sm text-muted-foreground">The newest prospects moving through your local website pipeline.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/leads">View all</Link>
            </Button>
          </div>
          {stats.recentLeads.length ? (
            <Card>
              <CardContent className="p-0">
                <LeadTable leads={stats.recentLeads} />
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No leads yet"
              description="Add your first local business lead to start tracking follow-ups, demos, and deals."
              action={
                <Button asChild>
                  <Link href="/leads/new">Add lead</Link>
                </Button>
              }
            />
          )}
        </section>
      </div>
    );
  } catch (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Dashboard failed to load."} />;
  }
}
