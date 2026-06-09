"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardAnalytics } from "@/lib/types";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, ShoppingCart, Tags, Send, DollarSign, TrendingUp } from "lucide-react";

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
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>Failed to load dashboard data.</p>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { aggregateCounters: c, rates: r } = data;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Revenue Attributed: <span className="font-semibold">${data.revenueAttributed.toLocaleString()}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Customers" value={data.totalCustomers} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Total Orders" value={data.totalOrders} icon={<ShoppingCart className="h-4 w-4" />} />
        <MetricCard label="Active Segments" value={data.activeSegments} icon={<Tags className="h-4 w-4" />} />
        <MetricCard label="Campaigns Sent" value={data.campaignsSent} icon={<Send className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Sent", value: c.sentCount, total: c.sentCount || 1, color: "bg-blue-500" },
              { label: "Delivered", value: c.deliveredCount, total: c.sentCount || 1, color: "bg-green-500" },
              { label: "Opened", value: c.openedCount, total: c.deliveredCount || 1, color: "bg-indigo-500" },
              { label: "Clicked", value: c.clickedCount, total: c.openedCount || 1, color: "bg-purple-500" },
              { label: "Purchased", value: c.purchasedCount, total: c.clickedCount || 1, color: "bg-emerald-500" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <Progress value={(item.value / item.total) * 100} className={item.color} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Delivery Rate", value: r.deliveryRate, icon: TrendingUp },
              { label: "Open Rate", value: r.openRate, icon: TrendingUp },
              { label: "Click Rate", value: r.clickRate, icon: TrendingUp },
              { label: "Conversion Rate", value: r.conversionRate, icon: DollarSign },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{item.label}</span>
                <span className="text-lg font-bold">{(item.value * 100).toFixed(1)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: "Sent", value: c.sentCount },
              { label: "Delivered", value: c.deliveredCount },
              { label: "Failed", value: c.failedCount },
              { label: "Opened", value: c.openedCount },
              { label: "Clicked", value: c.clickedCount },
              { label: "Purchased", value: c.purchasedCount },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
