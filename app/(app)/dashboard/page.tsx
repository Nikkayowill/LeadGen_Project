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
  { key: "totalLeads", title: "Total leads", helper: "Businesses in pipeline", icon: ListChecks },
  { key: "followUpsDue", title: "Due today", helper: "Calls and messages waiting", icon: CalendarClock },
  { key: "demosBooked", title: "Demos booked", helper: "Warm website conversations", icon: MonitorPlay },
  { key: "wonDeals", title: "Won deals", helper: "Closed website projects", icon: Trophy }
] as const;

export default async function DashboardPage() {
  try {
    const stats = await getDashboardStats();
    return (
      <div className="space-y-7">
        <section className="overflow-hidden rounded-3xl border border-sky-300/15 bg-gradient-to-br from-sky-400/20 via-card/90 to-blue-950/70 p-6 shadow-[0_26px_80px_rgba(2,8,23,0.35)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
            <PageHeader
              title="Sales dashboard"
              description="Track local business leads, follow-ups, demos, and website opportunities from one workspace."
              actions={
                <Button asChild>
                  <Link href="/leads/new">
                    Add lead
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/70">Pipeline value</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                {formatCurrency(stats.potentialRevenue)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Estimated active website revenue using one-time build fees plus first-year monthly support.
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
                    <p className="mt-1 text-xs text-sky-200/55">{card.helper}</p>
                  </div>
                  <div className="rounded-xl border border-sky-300/15 bg-sky-400/10 p-2 text-sky-200">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight">{stats[card.key]}</div>
                </CardContent>
              </Card>
            );
          })}
          <Card className="border-sky-300/20 bg-sky-400/10">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-sky-100">Revenue forecast</CardTitle>
                <p className="mt-1 text-xs text-sky-200/65">Active pipeline value</p>
              </div>
              <div className="rounded-xl border border-sky-200/20 bg-sky-300/15 p-2 text-sky-100">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{formatCurrency(stats.potentialRevenue)}</div>
              <p className="mt-1 text-xs text-sky-100/70">One-time plus first-year monthly fees</p>
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
