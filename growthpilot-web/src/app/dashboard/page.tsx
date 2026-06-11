"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardAnalytics } from "@/lib/types";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
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
        <div className="h-7 w-48 rounded-md bg-[#ebebeb] animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#ebebeb] animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 rounded-xl bg-[#ebebeb] animate-pulse" />
          <div className="h-64 rounded-xl bg-[#ebebeb] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageHeader title="Dashboard" />
        <div className="mt-6 rounded-xl border border-[#ebebeb] bg-white p-8 text-center">
          <p className="text-sm text-[#888888]">Failed to load dashboard data.</p>
          <p className="mt-1 text-xs text-[#a1a1a1]">{error}</p>
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
          <div className="rounded-xl border border-[#ebebeb] bg-white">
            <div className="border-b border-[#ebebeb] px-5 py-4">
              <h2 className="text-sm font-medium text-[#171717]">Campaign Funnel</h2>
            </div>
            <div className="p-5 space-y-4">
              {funnelSteps.map((step, i) => {
                const pct = Math.min(100, (step.value / step.total) * 100);
                return (
                  <div key={step.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#4d4d4d]">{step.label}</span>
                      <span className="font-semibold text-[#171717]">{step.value}</span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-[#f5f5f5]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[#171717] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#ebebeb] bg-white">
            <div className="border-b border-[#ebebeb] px-5 py-4">
              <h2 className="text-sm font-medium text-[#171717]">Event Breakdown</h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-[#ebebeb]">
              {[
                { label: "Sent", value: c.sentCount },
                { label: "Delivered", value: c.deliveredCount },
                { label: "Failed", value: c.failedCount },
                { label: "Opened", value: c.openedCount },
                { label: "Clicked", value: c.clickedCount },
                { label: "Purchased", value: c.purchasedCount },
              ].map((item) => (
                <div key={item.label} className="px-4 py-5 text-center">
                  <p className="text-lg font-semibold text-[#171717]">{item.value}</p>
                  <p className="mt-0.5 text-[11px] font-medium tracking-wide text-[#888888] uppercase">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#ebebeb] bg-white">
            <div className="border-b border-[#ebebeb] px-5 py-4">
              <h2 className="text-sm font-medium text-[#171717]">Conversion Rates</h2>
            </div>
            <div className="divide-y divide-[#ebebeb]">
              {ratesData.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-xs text-[#4d4d4d]">{item.label}</span>
                  <span className="text-sm font-semibold text-[#171717]">
                    {(item.value * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#ebebeb] bg-white">
            <div className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-[#888888]" />
                <h2 className="text-sm font-medium text-[#171717]">AI Snapshot</h2>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#888888]">Revenue Attributed</span>
                  <span className="font-semibold text-[#171717]">
                    ${data.revenueAttributed.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#888888]">Best Rate</span>
                  <span className="font-semibold text-[#171717]">
                    {(Math.max(r.deliveryRate, r.openRate, r.clickRate, r.conversionRate) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#888888]">Total Events</span>
                  <span className="font-semibold text-[#171717]">
                    {c.sentCount + c.deliveredCount + c.openedCount + c.clickedCount + c.purchasedCount}
                  </span>
                </div>
              </div>
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#171717] hover:underline"
              >
                View campaign details
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
