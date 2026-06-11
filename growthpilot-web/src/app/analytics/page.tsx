"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardAnalytics, Campaign } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Users,
  BarChart3,
  DollarSign,
  TrendingUp,
  Target,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    Promise.all([api.analytics.dashboard(), api.campaigns.list()])
      .then(([d, c]) => {
        setDashboard(d);
        setCampaigns(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="h-7 w-40 rounded-md bg-[#ebebeb] animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#ebebeb] animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-[#ebebeb] animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageHeader title="Analytics" />
        <div className="mt-6 rounded-xl border border-[#ebebeb] bg-white p-8 text-center">
          <p className="text-sm text-[#888888]">Failed to load analytics data.</p>
          <p className="mt-1 text-xs text-[#a1a1a1]">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { rates: r, aggregateCounters: c } = dashboard;

  const performanceData = [
    { label: "Campaigns Sent", value: dashboard.campaignsSent, icon: Send },
    { label: "Total Customers", value: dashboard.totalCustomers, icon: Users },
    { label: "Total Orders", value: dashboard.totalOrders, icon: BarChart3 },
    { label: "Revenue Attributed", value: `$${dashboard.revenueAttributed.toLocaleString()}`, icon: DollarSign },
  ];

  const ratesData = [
    { label: "Delivery Rate", value: r.deliveryRate, pct: r.deliveryRate * 100 },
    { label: "Open Rate", value: r.openRate, pct: r.openRate * 100 },
    { label: "Click Rate", value: r.clickRate, pct: r.clickRate * 100 },
    { label: "Conversion Rate", value: r.conversionRate, pct: r.conversionRate * 100 },
  ];

  const eventData = [
    { label: "Sent", value: c.sentCount, pct: c.sentCount > 0 ? 100 : 0 },
    { label: "Delivered", value: c.deliveredCount, pct: c.sentCount > 0 ? (c.deliveredCount / c.sentCount) * 100 : 0 },
    { label: "Failed", value: c.failedCount, pct: c.sentCount > 0 ? (c.failedCount / c.sentCount) * 100 : 0, isNegative: true },
    { label: "Opened", value: c.openedCount, pct: c.deliveredCount > 0 ? (c.openedCount / c.deliveredCount) * 100 : 0 },
    { label: "Clicked", value: c.clickedCount, pct: c.openedCount > 0 ? (c.clickedCount / c.openedCount) * 100 : 0 },
    { label: "Purchased", value: c.purchasedCount, pct: c.clickedCount > 0 ? (c.purchasedCount / c.clickedCount) * 100 : 0 },
  ];

  const totalEvents = c.sentCount + c.deliveredCount + c.openedCount + c.clickedCount + c.purchasedCount;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      <PageHeader
        title="Analytics"
        description="Campaign and audience performance metrics"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {performanceData.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-[#ebebeb] bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium tracking-wide text-[#888888] uppercase">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#171717]">
                    {item.value}
                  </p>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#171717]">
                  <Icon className="size-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#ebebeb] bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-[#ebebeb] px-5">
            <TabsList className="h-11 gap-6 bg-transparent">
              <TabsTrigger
                value="overview"
                className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="rates"
                className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
              >
                Conversion Rates
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
              >
                Event Breakdown
              </TabsTrigger>
              <TabsTrigger
                value="campaigns"
                className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
              >
                Campaigns
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-5">
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wide">Event Funnel</h3>
                  {eventData.filter(e => !e.isNegative).map((e) => (
                    <div key={e.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#4d4d4d]">{e.label}</span>
                        <span className="font-medium text-[#171717]">{e.value}</span>
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-[#f5f5f5]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-[#171717]"
                          style={{ width: `${Math.min(100, e.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wide">Performance Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4 text-center">
                      <p className="text-2xl font-semibold text-[#171717]">{totalEvents}</p>
                      <p className="mt-0.5 text-[11px] text-[#888888] uppercase tracking-wide">Total Events</p>
                    </div>
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4 text-center">
                      <p className="text-2xl font-semibold text-[#171717]">{dashboard.campaignsSent}</p>
                      <p className="mt-0.5 text-[#888888] text-[11px] uppercase tracking-wide">Campaigns</p>
                    </div>
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4 text-center">
                      <p className="text-2xl font-semibold text-[#171717]">{dashboard.activeSegments}</p>
                      <p className="mt-0.5 text-[#888888] text-[11px] uppercase tracking-wide">Segments</p>
                    </div>
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4 text-center">
                      <p className="text-2xl font-semibold text-[#171717]">
                        ${dashboard.revenueAttributed.toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[#888888] text-[11px] uppercase tracking-wide">Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rates" className="mt-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ratesData.map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-5 text-center">
                    <p className="text-3xl font-semibold tracking-tight text-[#171717]">
                      {item.pct.toFixed(1)}%
                    </p>
                    <p className="mt-1.5 text-xs text-[#888888]">{item.label}</p>
                    <div className="mt-3 relative h-1.5 overflow-hidden rounded-full bg-[#ebebeb]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[#171717]"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              <div className="space-y-3">
                <div className="grid gap-3">
                  {eventData.map((e) => (
                    <div key={e.label} className="flex items-center gap-4">
                      <span className="w-20 text-xs font-medium text-[#4d4d4d]">{e.label}</span>
                      <div className="flex-1">
                        <div className="relative h-2 overflow-hidden rounded-full bg-[#f5f5f5]">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all ${e.isNegative ? 'bg-red-500' : 'bg-[#171717]'}`}
                            style={{ width: `${Math.min(100, e.pct)}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-16 text-right text-xs font-medium text-[#171717]">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-0">
              {campaigns.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#888888]">
                  No campaigns yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {campaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="flex items-center justify-between rounded-lg border border-[#ebebeb] p-4 transition-colors hover:bg-[#fafafa] group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#171717]">{campaign.name}</p>
                        <p className="text-[11px] text-[#888888] mt-0.5 capitalize">{campaign.channel}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={campaign.status} />
                        <ArrowRight className="size-3.5 text-[#a1a1a1] group-hover:text-[#171717] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
