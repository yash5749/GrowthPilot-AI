"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardAnalytics, Campaign } from "@/lib/types";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Send, Users, BarChart3 } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Analytics</h1>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>Failed to load analytics data.</p>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboard) return null;

  const { rates: r, aggregateCounters: c } = dashboard;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Campaigns Sent"
          value={dashboard.campaignsSent}
          icon={<Send className="h-4 w-4" />}
        />
        <MetricCard
          label="Total Customers"
          value={dashboard.totalCustomers}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Total Orders"
          value={dashboard.totalOrders}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          label="Revenue Attributed"
          value={`$${dashboard.revenueAttributed.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Delivery Rate", value: r.deliveryRate, color: "bg-green-500" },
              { label: "Open Rate", value: r.openRate, color: "bg-blue-500" },
              { label: "Click Rate", value: r.clickRate, color: "bg-indigo-500" },
              { label: "Conversion Rate", value: r.conversionRate, color: "bg-purple-500" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-3xl font-bold">{(item.value * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
                <Progress
                  value={item.value * 100}
                  className={`h-2 mt-2 ${item.color}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Sent", value: c.sentCount, pct: c.sentCount > 0 ? 100 : 0 },
              { label: "Delivered", value: c.deliveredCount, pct: c.sentCount > 0 ? (c.deliveredCount / c.sentCount) * 100 : 0 },
              { label: "Failed", value: c.failedCount, pct: c.sentCount > 0 ? (c.failedCount / c.sentCount) * 100 : 0 },
              { label: "Opened", value: c.openedCount, pct: c.deliveredCount > 0 ? (c.openedCount / c.deliveredCount) * 100 : 0 },
              { label: "Clicked", value: c.clickedCount, pct: c.openedCount > 0 ? (c.clickedCount / c.openedCount) * 100 : 0 },
              { label: "Purchased", value: c.purchasedCount, pct: c.clickedCount > 0 ? (c.purchasedCount / c.clickedCount) * 100 : 0 },
            ].map((e) => (
              <div key={e.label} className="flex items-center gap-4">
                <span className="w-24 text-sm">{e.label}</span>
                <div className="flex-1">
                  <Progress value={e.pct} />
                </div>
                <span className="w-16 text-right text-sm font-medium">{e.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No campaigns yet.</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.channel}</p>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
