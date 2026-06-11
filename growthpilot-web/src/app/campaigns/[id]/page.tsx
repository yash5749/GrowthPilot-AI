"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Campaign, Communication, CampaignAnalytics, InsightSummary } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, Check, Sparkles, Loader2, ArrowLeft, MessageSquare, Users2, BarChart3 } from "lucide-react";
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
        <div className="h-5 w-32 rounded bg-[#ebebeb] animate-pulse" />
        <div className="h-7 w-64 rounded bg-[#ebebeb] animate-pulse" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[#ebebeb] animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-[#ebebeb] animate-pulse" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs text-[#888888] hover:text-[#171717] mb-4">
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
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs text-[#888888] hover:text-[#171717]">
        <ArrowLeft className="size-3" /> Back to Campaigns
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#171717]">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-[#888888]">{campaign.objective}</p>
          <div className="flex items-center gap-4 text-xs text-[#a1a1a1]">
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

      <div className="rounded-xl border border-[#ebebeb] bg-white">
        <div className="border-b border-[#ebebeb] px-5 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-3.5 text-[#888888]" />
            <h2 className="text-xs font-medium text-[#171717]">Message Template</h2>
          </div>
        </div>
        <div className="p-5">
          <div className="rounded-lg bg-[#fafafa] p-4 text-xs font-mono whitespace-pre-wrap text-[#4d4d4d] leading-relaxed">
            {campaign.messageTemplate}
          </div>
        </div>
      </div>

      {analytics && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: <Users2 className="size-4" />, label: "Audience", value: analytics.audienceSize },
            { icon: <Send className="size-4" />, label: "Delivered", value: analytics.deliveredCount },
            { icon: <BarChart3 className="size-4" />, label: "Opened", value: analytics.openedCount },
            { icon: <BarChart3 className="size-4" />, label: "Clicked", value: analytics.clickedCount },
            { icon: <BarChart3 className="size-4" />, label: "Purchased", value: analytics.purchasedCount },
            { icon: <BarChart3 className="size-4" />, label: "Revenue", value: `$${analytics.revenueAttributed.toFixed(2)}` },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-[#ebebeb] bg-white p-4 text-center">
              <div className="flex justify-center mb-2 text-[#888888]">{m.icon}</div>
              <p className="text-lg font-semibold text-[#171717]">{m.value}</p>
              <p className="mt-0.5 text-[11px] font-medium tracking-wide text-[#888888] uppercase">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-[#ebebeb] bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-[#ebebeb] px-5">
            <TabsList className="h-11 gap-6 bg-transparent">
              <TabsTrigger
                value="funnel"
                className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
              >
                Event Funnel
              </TabsTrigger>
              <TabsTrigger
                value="recipients"
                className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
              >
                Recipients ({communications.length})
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
              >
                <Sparkles className="size-3 mr-1" />
                AI Insights
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-5">
            <TabsContent value="funnel" className="mt-0 space-y-5">
              <div className="space-y-4">
                {eventFunnel.map((step) => {
                  const pct = Math.min(100, (step.value / step.total) * 100);
                  return (
                    <div key={step.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#4d4d4d]">{step.label}</span>
                        <span className="font-semibold text-[#171717]">{step.value}</span>
                      </div>
                      <div className="relative h-2.5 overflow-hidden rounded-full bg-[#f5f5f5]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-[#171717] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {analytics && (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  {[
                    { label: "Delivery Rate", value: analytics.rates.deliveryRate },
                    { label: "Open Rate", value: analytics.rates.openRate },
                    { label: "Click Rate", value: analytics.rates.clickRate },
                    { label: "Conversion Rate", value: analytics.rates.conversionRate },
                  ].map((r) => (
                    <div key={r.label} className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4 text-center">
                      <p className="text-xs text-[#888888]">{r.label}</p>
                      <p className="mt-1 text-xl font-semibold text-[#171717]">
                        {(r.value * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recipients" className="mt-0">
              {communications.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#888888]">
                  No communications yet. Send the campaign to see recipients.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-[#ebebeb]">
                        <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Customer</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Status</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Sent</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Delivered</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Opened</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Clicked</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Purchased</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communications.map((c) => (
                        <TableRow key={c.id} className="border-b border-[#ebebeb]">
                          <TableCell className="py-3">
                            <p className="text-xs font-medium text-[#171717]">{c.customer?.name || "—"}</p>
                            <p className="text-[11px] text-[#888888]">{c.customer?.email}</p>
                          </TableCell>
                          <TableCell className="py-3"><StatusBadge status={c.status} /></TableCell>
                          <TableCell className="py-3 text-xs text-[#888888]">{c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="py-3 text-xs text-[#888888]">{c.deliveredAt ? new Date(c.deliveredAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="py-3 text-xs text-[#888888]">{c.openedAt ? new Date(c.openedAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="py-3 text-xs text-[#888888]">{c.clickedAt ? new Date(c.clickedAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="py-3 text-xs text-[#888888]">{c.purchasedAt ? new Date(c.purchasedAt).toLocaleDateString() : "—"}</TableCell>
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
                  <Sparkles className="size-8 mx-auto text-[#a1a1a1]" />
                  <p className="text-sm text-[#888888]">Generate AI-powered insights for this campaign.</p>
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
                  <Loader2 className="size-6 animate-spin text-[#888888]" />
                </div>
              )}
              {aiInsightsError && (
                <div className="py-12 text-center">
                  <p className="text-xs text-red-600">{aiInsightsError}</p>
                  <Button variant="outline" size="xs" onClick={handleGenerateInsights} className="mt-3">Retry</Button>
                </div>
              )}
              {aiInsights && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#171717]" />
                    <h3 className="text-xs font-semibold text-[#171717]">AI Campaign Analysis</h3>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4">
                      <p className="text-[11px] font-medium text-[#888888] tracking-wide uppercase mb-1">Summary</p>
                      <p className="text-xs text-[#4d4d4d] leading-relaxed">{aiInsights.summary}</p>
                    </div>
                    <div className="rounded-lg border border-[#d3e5ff] bg-[#d3e5ff]/10 p-4">
                      <p className="text-[11px] font-medium text-[#888888] tracking-wide uppercase mb-1">Key Insight</p>
                      <p className="text-xs text-[#171717] leading-relaxed">{aiInsights.insight}</p>
                    </div>
                    <div className="rounded-lg border border-[#e0f2f1] bg-[#e0f2f1]/30 p-4">
                      <p className="text-[11px] font-medium text-[#888888] tracking-wide uppercase mb-1">Next Best Action</p>
                      <p className="text-xs font-medium text-[#171717]">{aiInsights.nextBestAction}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="xs" onClick={handleGenerateInsights} disabled={aiInsightsLoading}>
                    <Sparkles className="size-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
