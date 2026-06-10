"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Campaign, Communication, CampaignAnalytics, InsightSummary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Check, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, comms, a] = await Promise.all([
        api.campaigns.get(id),
        api.communications.listByCampaign(id),
        api.analytics.campaign(id).catch(() => null),
      ]);
      setCampaign(c);
      setCommunications(comms);
      setAnalytics(a);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const [aiInsights, setAiInsights] = useState<InsightSummary | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setAiInsightsLoading(true);
    setAiInsightsError(null);
    setAiInsights(null);
    try {
      const res = await api.ai.generateInsights({ campaignId: id });
      setAiInsights(res);
    } catch (e: unknown) {
      setAiInsightsError(e instanceof Error ? e.message : "Failed to generate insights");
    } finally {
      setAiInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-8">
        <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3 w-3" /> Back to Campaigns
        </Link>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>{error || "Campaign not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      await api.campaigns.approve(id);
      fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to approve");
    }
  };

  const handleSend = async () => {
    try {
      await api.campaigns.send(id);
      fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to send");
    }
  };

  const eventFunnel = [
    { label: "Sent", value: analytics?.sentCount ?? communications.filter((c) => c.status !== "pending").length, total: communications.length || 1 },
    { label: "Delivered", value: analytics?.deliveredCount ?? communications.filter((c) => c.deliveredAt).length, total: communications.length || 1 },
    { label: "Opened", value: analytics?.openedCount ?? communications.filter((c) => c.openedAt).length, total: communications.length || 1 },
    { label: "Clicked", value: analytics?.clickedCount ?? communications.filter((c) => c.clickedAt).length, total: communications.length || 1 },
    { label: "Purchased", value: analytics?.purchasedCount ?? communications.filter((c) => c.purchasedAt).length, total: communications.length || 1 },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/campaigns" className="hover:text-foreground">Campaigns</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{campaign.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-muted-foreground">{campaign.objective}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Channel: {campaign.channel}</span>
            <span>Segment: {campaign.segment?.name || "—"}</span>
            {campaign.sentAt && <span>Sent: {new Date(campaign.sentAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <Button onClick={handleApprove}>
              <Check className="h-4 w-4 mr-2" /> Approve
            </Button>
          )}
          {campaign.status === "approved" && (
            <Button onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" /> Send Campaign
            </Button>
          )}
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Audience Size", value: analytics.audienceSize },
            { label: "Delivered", value: analytics.deliveredCount },
            { label: "Opened", value: analytics.openedCount },
            { label: "Clicked", value: analytics.clickedCount },
            { label: "Purchased", value: analytics.purchasedCount },
            { label: "Revenue", value: `$${analytics.revenueAttributed.toFixed(2)}` },
          ].map((m) => (
            <Card key={m.label}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-xl font-bold mt-1">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
            {campaign.messageTemplate}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="funnel">Event Funnel</TabsTrigger>
          <TabsTrigger value="recipients">Recipients ({communications.length})</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventFunnel.map((step) => (
                <div key={step.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{step.label}</span>
                    <span className="font-medium">{step.value}</span>
                  </div>
                  <Progress value={(step.value / step.total) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>

          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Delivery Rate", value: (analytics.rates.deliveryRate * 100).toFixed(1) },
                { label: "Open Rate", value: (analytics.rates.openRate * 100).toFixed(1) },
                { label: "Click Rate", value: (analytics.rates.clickRate * 100).toFixed(1) },
                { label: "Conversion Rate", value: (analytics.rates.conversionRate * 100).toFixed(1) },
              ].map((r) => (
                <Card key={r.label}>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                    <p className="text-2xl font-bold mt-1">{r.value}%</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recipients" className="mt-4">
          {communications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No communications yet. Send the campaign to see recipients.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Purchased</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communications.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium">{c.customer?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{c.customer?.email}</p>
                      </TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell>{c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{c.deliveredAt ? new Date(c.deliveredAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{c.openedAt ? new Date(c.openedAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{c.clickedAt ? new Date(c.clickedAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{c.purchasedAt ? new Date(c.purchasedAt).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              {!aiInsights && !aiInsightsLoading && !aiInsightsError && (
                <div className="text-center space-y-3">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Generate AI-powered insights for this campaign.</p>
                  <Button onClick={handleGenerateInsights} disabled={aiInsightsLoading}>
                    {aiInsightsLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Insights
                  </Button>
                </div>
              )}
              {aiInsightsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {aiInsightsError && (
                <div className="text-center">
                  <p className="text-sm text-destructive">{aiInsightsError}</p>
                  <Button variant="outline" size="sm" onClick={handleGenerateInsights} className="mt-3">
                    Retry
                  </Button>
                </div>
              )}
              {aiInsights && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">AI Campaign Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Summary</p>
                      <p className="text-sm">{aiInsights.summary}</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Key Insight</p>
                      <p className="text-sm">{aiInsights.insight}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Next Best Action</p>
                      <p className="text-sm font-medium">{aiInsights.nextBestAction}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleGenerateInsights} disabled={aiInsightsLoading}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
