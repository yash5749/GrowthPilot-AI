"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardAnalytics } from "@/lib/types";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { InsightCard } from "@/components/shared/insight-card";
import { FunnelStepBar } from "@/components/shared/funnel-step-bar";
import { CTABanner } from "@/components/shared/cta-banner";
import {
  Users,
  ShoppingCart,
  Tags,
  Send,
  TrendingUp,
  DollarSign,
  Sparkles,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-52 rounded-xl bg-muted animate-pulse" />
            <div className="h-48 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageHeader title="Dashboard" />
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
      <PageHeader
        title="Dashboard"
        description="Campaign performance at a glance"
        actions={
          <Link href="/campaigns">
            <Button size="sm">
              <Plus className="size-3.5 mr-1.5" />
              New Campaign
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Customers"
          value={data.totalCustomers}
          icon={<Users className="size-4" />}
        />
        <MetricCard
          label="Total Orders"
          value={data.totalOrders}
          icon={<ShoppingCart className="size-4" />}
        />
        <MetricCard
          label="Active Segments"
          value={data.activeSegments}
          icon={<Tags className="size-4" />}
        />
        <MetricCard
          label="Campaigns Sent"
          value={data.campaignsSent}
          icon={<Send className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Campaign Funnel">
            <FunnelStepBar steps={funnelSteps} />
          </SectionCard>

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
        </div>

        <div className="space-y-6">
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
        </div>
      </div>

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
    </div>
  );
}
