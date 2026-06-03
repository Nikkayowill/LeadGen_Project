import { ErrorState } from "@/components/layout/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { PitchTemplateForm } from "@/components/settings/pitch-template-form";
import { PricingTemplateForm } from "@/components/settings/pricing-template-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DEFAULT_PRICING } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getPitchTemplates, getPricingTemplates } from "@/services/templates";

export default async function SettingsPage() {
  try {
    const [pitchTemplates, pricingTemplates] = await Promise.all([
      getPitchTemplates(),
      getPricingTemplates()
    ]);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage outreach templates and pricing defaults for quick lead creation."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pricing defaults</CardTitle>
              <CardDescription>
                New leads start at {formatCurrency(DEFAULT_PRICING.oneTimePrice)} plus {formatCurrency(DEFAULT_PRICING.monthlyPrice)}/month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingTemplateForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pitch template</CardTitle>
              <CardDescription>Save reusable outreach copy by industry.</CardDescription>
            </CardHeader>
            <CardContent>
              <PitchTemplateForm />
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Saved pricing templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pricingTemplates.length ? (
                pricingTemplates.map((template) => (
                  <div key={template.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{template.template_name}</p>
                      {template.is_default ? <Badge variant="success">Default</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatCurrency(template.one_time_price)} plus {formatCurrency(template.monthly_price)}/month
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No pricing templates"
                  description="Create reusable packages for starter sites, redesigns, or care plans."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved pitch templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pitchTemplates.length ? (
                pitchTemplates.map((template) => (
                  <div key={template.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{template.template_name}</p>
                      {template.industry ? <Badge variant="secondary">{template.industry}</Badge> : null}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{template.message_body}</p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No pitch templates"
                  description="Add templates that can later feed generated AI outreach."
                />
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    );
  } catch (error) {
    return <ErrorState message={error instanceof Error ? error.message : "Settings failed to load."} />;
  }
}
