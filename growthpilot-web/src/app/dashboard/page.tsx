"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { DashboardAnalytics } from "@/lib/types";
import { MetricCard } from "@/components/shared/metric-card";
import { SectionCard } from "@/components/shared/section-card";
import { InsightCard } from "@/components/shared/insight-card";
import { FunnelStepBar } from "@/components/shared/funnel-step-bar";
import { CTABanner } from "@/components/shared/cta-banner";
import { FadeIn } from "@/components/shared/fade-in";
import { MetricGridSkeleton, SectionCardSkeleton } from "@/components/shared/loading-skeleton";
import {
  Users,
  ShoppingCart,
  Tags,
  Send,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  BarChart3,
  Target,
  MessageSquare,
  Rocket,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CsvImportDialog } from "@/components/shared/csv-import-dialog";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersImportOpen, setOrdersImportOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const d = await api.analytics.dashboard();
      setData(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // fetchDashboard is also called by the import dialog onClose;
  // inlining it here would split the data-loading logic in two.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div className="space-y-4">
          <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          <div className="h-7 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
            <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
        <MetricGridSkeleton />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SectionCardSkeleton />
            <SectionCardSkeleton height="h-32" />
          </div>
          <div className="space-y-6">
            <SectionCardSkeleton height="h-48" />
            <SectionCardSkeleton height="h-48" />
          </div>
        </div>
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <section className="flex flex-col gap-4 pb-6 border-b border-border">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Shopper Outreach CRM
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            GrowthPilot AI
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Autonomous shopper outreach copilot for consumer brands.
          </p>
        </section>
        <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Failed to load dashboard data.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { aggregateCounters: c, rates: r } = data;

  const funnelSteps = [
    { label: "Sent", value: c.sentCount, total: c.sentCount || 1 },
    { label: "Delivered", value: c.deliveredCount, total: c.sentCount || 1 },
    { label: "Opened", value: c.openedCount, total: c.deliveredCount || 1 },
    { label: "Clicked", value: c.clickedCount, total: c.openedCount || 1 },
    { label: "Purchased", value: c.purchasedCount, total: c.clickedCount || 1 },
  ];

  const ratesData = [
    { label: "Delivery Rate", value: r.deliveryRate },
    { label: "Open Rate", value: r.openRate },
    { label: "Click Rate", value: r.clickRate },
    { label: "Conversion Rate", value: r.conversionRate },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      <FadeIn as="section">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-muted/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-muted/20 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />
          <div className="relative px-8 py-10">
            <div className="flex items-start justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="size-4 text-foreground" />
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Shopper Outreach CRM
                  </p>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
                  GrowthPilot AI
                </h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg">
                  Autonomous shopper outreach copilot for consumer brands.
                  Segment audiences, generate AI-powered messages,
                  and track campaign performance.
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <Link href="/campaigns">
                    <Button>
                      <Plus className="size-3.5 mr-1.5" />
                      New Campaign
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="outline">
                      <BarChart3 className="size-3.5 mr-1.5" />
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden lg:flex flex-col items-end gap-4 shrink-0 pt-1">
                <div className="text-right">
                  <p className="text-3xl font-semibold tracking-tight text-foreground">
                    ${data.revenueAttributed.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Revenue Attributed</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{data.totalCustomers}</p>
                    <p className="text-[11px] text-muted-foreground/70">Customers</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{data.campaignsSent}</p>
                    <p className="text-[11px] text-muted-foreground/70">Campaigns Sent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FadeIn delay={50}><MetricCard label="Total Customers" value={data.totalCustomers} icon={<Users className="size-4" />} /></FadeIn>
        <FadeIn delay={100}><MetricCard label="Total Orders" value={data.totalOrders} icon={<ShoppingCart className="size-4" />} /></FadeIn>
        <FadeIn delay={150}><MetricCard label="Active Segments" value={data.activeSegments} icon={<Tags className="size-4" />} /></FadeIn>
        <FadeIn delay={200}><MetricCard label="Campaigns Sent" value={data.campaignsSent} icon={<Send className="size-4" />} /></FadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <FadeIn delay={100}>
            <SectionCard title="Campaign Funnel">
              <FunnelStepBar steps={funnelSteps} />
            </SectionCard>
          </FadeIn>

          <FadeIn delay={150}>
            <SectionCard title="Event Breakdown">
              <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-border">
                {[
                  { label: "Sent", value: c.sentCount },
                  { label: "Delivered", value: c.deliveredCount },
                  { label: "Failed", value: c.failedCount },
                  { label: "Opened", value: c.openedCount },
                  { label: "Clicked", value: c.clickedCount },
                  { label: "Purchased", value: c.purchasedCount },
                ].map((item) => (
                  <div key={item.label} className="px-4 py-5 text-center">
                    <p className="text-lg font-semibold text-foreground">{item.value}</p>
                    <p className="mt-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </FadeIn>
        </div>

        <div className="space-y-6">
          <FadeIn delay={150}>
            <SectionCard title="Conversion Rates">
              <div className="divide-y divide-border">
                {ratesData.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {(item.value * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </FadeIn>

          <FadeIn delay={200}>
            <SectionCard
              title="AI Snapshot"
              icon={<Sparkles className="size-3.5" />}
              action={
                <Link
                  href="/campaigns"
                  className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="size-3" />
                </Link>
              }
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <InsightCard
                    variant="metric"
                    label="Revenue Attributed"
                    value={`$${data.revenueAttributed.toLocaleString()}`}
                    description="Total revenue attributed to campaign outreach"
                  />
                  <InsightCard
                    variant="insight"
                    label="Best Performing Rate"
                    value={`${(Math.max(...Object.values(r)) * 100).toFixed(1)}%`}
                    description="Highest conversion metric across all campaigns"
                  />
                </div>
              </div>
            </SectionCard>
          </FadeIn>
        </div>
      </div>

      <FadeIn delay={250}>
        <CTABanner
          title="Ready to create a campaign?"
          description="Launch a new outreach campaign in minutes — AI will help with copy and channel selection."
          action={
            <Link href="/campaigns">
              <Button size="sm">
                <Plus className="size-3.5 mr-1.5" />
                New Campaign
              </Button>
            </Link>
          }
        />
      </FadeIn>

      <FadeIn delay={280}>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Upload className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Import Orders</p>
              <p className="text-xs text-muted-foreground">Upload a CSV with order data to populate the system</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOrdersImportOpen(true)}>
            <Upload className="size-3.5 mr-1.5" />
            Import CSV
          </Button>
        </div>
      </FadeIn>

      <CsvImportDialog
        open={ordersImportOpen}
        onOpenChange={(open) => {
          setOrdersImportOpen(open);
          if (!open) fetchDashboard();
        }}
        onImport={(file) => api.orders.import(file)}
        title="Import Orders"
        description="Upload a CSV file with order data. Expected columns: customerId, customerEmail, orderTotal, currency, orderedAt, channel, status."
      />

      <FadeIn delay={300} as="section" className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="size-4 text-foreground" />
          <h2 className="text-sm font-semibold text-foreground">About GrowthPilot AI</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="size-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground">Audience Segmentation</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Define rules-based segments or let AI suggest high-value audiences
              based on customer behavior, purchase patterns, and lifetime value.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="size-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground">AI-Powered Messaging</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate personalized message copy tailored to each segment. Review,
              edit, and approve before sending across WhatsApp, email, or SMS.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground">Campaign Analytics</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track delivery, opens, clicks, and attributed revenue in real time.
              Get AI-powered insights and next-best-action recommendations.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
