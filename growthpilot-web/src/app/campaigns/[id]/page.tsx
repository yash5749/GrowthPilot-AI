"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Campaign, Communication, CampaignAnalytics, InsightSummary } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { InsightCard } from "@/components/shared/insight-card";
import { FunnelStepBar } from "@/components/shared/funnel-step-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, Check, Sparkles, Loader2, ArrowLeft, MessageSquare, Users2, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("funnel");

  const [aiInsights, setAiInsights] = useState<InsightSummary | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);

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

  const handleApprove = async () => {
    try { await api.campaigns.approve(id); fetchAll(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed to approve"); }
  };

  const handleSend = async () => {
    try { await api.campaigns.send(id); fetchAll(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed to send"); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="h-7 w-64 rounded bg-muted animate-pulse" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-3" /> Back to Campaigns
        </Link>
        <EmptyState
          icon={<Send className="size-5" />}
          title="Campaign not found"
          description={error || "The campaign you're looking for doesn't exist."}
        />
      </div>
    );
  }

  const eventFunnel = [
    { label: "Sent", value: analytics?.sentCount ?? communications.filter((c) => c.status !== "pending").length, total: communications.length || 1 },
    { label: "Delivered", value: analytics?.deliveredCount ?? communications.filter((c) => c.deliveredAt).length, total: communications.length || 1 },
    { label: "Opened", value: analytics?.openedCount ?? communications.filter((c) => c.openedAt).length, total: communications.length || 1 },
    { label: "Clicked", value: analytics?.clickedCount ?? communications.filter((c) => c.clickedAt).length, total: communications.length || 1 },
    { label: "Purchased", value: analytics?.purchasedCount ?? communications.filter((c) => c.purchasedAt).length, total: communications.length || 1 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-3" /> Back to Campaigns
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground">{campaign.objective}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
            <span className="capitalize">Channel: {campaign.channel}</span>
            <span>Segment: {campaign.segment?.name || "—"}</span>
            {campaign.sentAt && <span>Sent: {new Date(campaign.sentAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {campaign.status === "draft" && (
            <Button size="sm" onClick={handleApprove}>
              <Check className="size-3.5 mr-1.5" /> Approve
            </Button>
          )}
          {campaign.status === "approved" && (
            <Button size="sm" onClick={handleSend}>
              <Send className="size-3.5 mr-1.5" /> Send Campaign
            </Button>
          )}
        </div>
      </div>

      <SectionCard title="Message Template" icon={<MessageSquare className="size-3.5" />}>
        <div className="rounded-lg bg-surface-subtle p-4 text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
          {campaign.messageTemplate}
        </div>
      </SectionCard>

      {analytics && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: <Users2 className="size-4" />, label: "Audience", value: analytics.audienceSize },
            { icon: <Send className="size-4" />, label: "Delivered", value: analytics.deliveredCount },
            { icon: <BarChart3 className="size-4" />, label: "Opened", value: analytics.openedCount },
            { icon: <TrendingUp className="size-4" />, label: "Clicked", value: analytics.clickedCount },
            { icon: <DollarSign className="size-4" />, label: "Purchased", value: analytics.purchasedCount },
            { icon: <DollarSign className="size-4" />, label: "Revenue", value: `$${analytics.revenueAttributed.toFixed(2)}` },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="flex justify-center mb-2 text-muted-foreground">{m.icon}</div>
              <p className="text-lg font-semibold text-foreground">{m.value}</p>
              <p className="mt-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <SectionCard>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="-mx-5 -mt-5 px-5 border-b border-border mb-5">
            <TabsList className="h-11 gap-6 bg-transparent">
              <TabsTrigger
                value="funnel"
                className="text-xs data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none bg-transparent pb-3 px-0"
              >
                Event Funnel
              </TabsTrigger>
              <TabsTrigger
                value="recipients"
                className="text-xs data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none bg-transparent pb-3 px-0"
              >
                Recipients ({communications.length})
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="text-xs data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none bg-transparent pb-3 px-0"
              >
                <Sparkles className="size-3 mr-1" />
                AI Insights
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="funnel" className="mt-0 space-y-5">
            <FunnelStepBar steps={eventFunnel} />

            {analytics && (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {[
                  { label: "Delivery Rate", value: analytics.rates.deliveryRate },
                  { label: "Open Rate", value: analytics.rates.openRate },
                  { label: "Click Rate", value: analytics.rates.clickRate },
                  { label: "Conversion Rate", value: analytics.rates.conversionRate },
                ].map((r) => (
                  <div key={r.label} className="rounded-lg border border-border bg-surface-subtle p-4 text-center">
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {(r.value * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipients" className="mt-0">
            {communications.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No communications yet. Send the campaign to see recipients.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Customer</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Status</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Sent</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Delivered</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Opened</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Clicked</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Purchased</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communications.map((c) => (
                      <TableRow key={c.id} className="border-b border-border">
                        <TableCell className="py-3">
                          <p className="text-xs font-medium text-foreground">{c.customer?.name || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">{c.customer?.email}</p>
                        </TableCell>
                        <TableCell className="py-3"><StatusBadge status={c.status} /></TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{c.deliveredAt ? new Date(c.deliveredAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{c.openedAt ? new Date(c.openedAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{c.clickedAt ? new Date(c.clickedAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{c.purchasedAt ? new Date(c.purchasedAt).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            {!aiInsights && !aiInsightsLoading && !aiInsightsError && (
              <div className="py-12 text-center space-y-3">
                <Sparkles className="size-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Generate AI-powered insights for this campaign.</p>
                <Button size="sm" onClick={handleGenerateInsights} disabled={aiInsightsLoading}>
                  {aiInsightsLoading ? (
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5 mr-1.5" />
                  )}
                  Generate Insights
                </Button>
              </div>
            )}
            {aiInsightsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {aiInsightsError && (
              <div className="py-12 text-center">
                <p className="text-xs text-destructive">{aiInsightsError}</p>
                <Button variant="outline" size="xs" onClick={handleGenerateInsights} className="mt-3">Retry</Button>
              </div>
            )}
            {aiInsights && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-foreground" />
                  <h3 className="text-xs font-semibold text-foreground">AI Campaign Analysis</h3>
                </div>
                <div className="grid gap-3">
                  <InsightCard
                    variant="default"
                    label="Summary"
                    description={aiInsights.summary}
                  />
                  <InsightCard
                    variant="insight"
                    label="Key Insight"
                    description={aiInsights.insight}
                  />
                  <InsightCard
                    variant="action"
                    label="Next Best Action"
                    description={aiInsights.nextBestAction}
                  />
                </div>
                <Button variant="outline" size="xs" onClick={handleGenerateInsights} disabled={aiInsightsLoading}>
                  <Sparkles className="size-3 mr-1" />
                  Refresh
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>
    </div>
  );
}
