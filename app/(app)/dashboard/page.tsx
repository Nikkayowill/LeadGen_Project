import Link from "next/link";
import { CalendarClock, DollarSign, ListChecks, MonitorPlay, Trophy } from "lucide-react";
import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { LeadTable } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats } from "@/services/dashboard";

const statCards = [
  { key: "totalLeads", title: "Total leads", icon: ListChecks },
  { key: "followUpsDue", title: "Follow-ups due", icon: CalendarClock },
  { key: "demosBooked", title: "Demos booked", icon: MonitorPlay },
  { key: "wonDeals", title: "Won deals", icon: Trophy }
] as const;

export default async function DashboardPage() {
  try {
    const stats = await getDashboardStats();

    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Track active leads, follow-ups, demos, wins, and potential website revenue."
          actions={
            <Button asChild>
              <Link href="/leads/new">Add lead</Link>
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{stats[card.key]}</div>
                </CardContent>
              </Card>
            );
          })}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Potential revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(stats.potentialRevenue)}</div>
              <p className="mt-1 text-xs text-muted-foreground">One-time plus first-year monthly fees</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent leads</h2>
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
