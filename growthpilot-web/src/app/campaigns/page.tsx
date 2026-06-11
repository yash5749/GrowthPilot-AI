"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Campaign, Segment, CreateCampaignDto, MessageSuggestion, ChannelRecommendation } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AIResultCard } from "@/components/shared/ai-result-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Send, Check, Eye, Sparkles, Wand2, Lightbulb, Loader2, Rocket, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [studioTab, setStudioTab] = useState("details");
  const [form, setForm] = useState<CreateCampaignDto>({
    name: "",
    objective: "",
    segmentId: "",
    messageTemplate: "",
    channel: "whatsapp",
  });

  const [messageLoading, setMessageLoading] = useState(false);
  const [messageResult, setMessageResult] = useState<MessageSuggestion | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const [channelLoading, setChannelLoading] = useState(false);
  const [channelResult, setChannelResult] = useState<ChannelRecommendation | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([api.campaigns.list(), api.segments.list()]);
      setCampaigns(c);
      setSegments(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stepTabs = ["details", "message", "channel"];
  const stepLabels = ["Details", "Message", "Channel"];
  const currentStep = stepTabs.indexOf(studioTab);

  const handleCreate = async () => {
    try {
      await api.campaigns.create(form);
      setCreateOpen(false);
      setForm({ name: "", objective: "", segmentId: "", messageTemplate: "", channel: "whatsapp" });
      setMessageResult(null);
      setChannelResult(null);
      setStudioTab("details");
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.campaigns.approve(id);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to approve");
    }
  };

  const handleSend = async (id: string) => {
    try {
      await api.campaigns.send(id);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to send");
    }
  };

  const getSegmentName = (): string => {
    const seg = segments.find((s) => s.id === form.segmentId);
    return seg?.name || "";
  };

  const handleGenerateMessage = async () => {
    const segName = getSegmentName();
    if (!segName || !form.objective || !form.channel) {
      setMessageError("Select a segment, objective, and channel first.");
      return;
    }
    setMessageLoading(true);
    setMessageError(null);
    setMessageResult(null);
    try {
      const res = await api.ai.generateMessage({
        segmentName: segName,
        channel: form.channel,
        objective: form.objective,
      });
      setMessageResult(res);
    } catch (e: unknown) {
      setMessageError(e instanceof Error ? e.message : "Failed to generate message");
    } finally {
      setMessageLoading(false);
    }
  };

  const handleRecommendChannel = async () => {
    const segName = getSegmentName();
    if (!segName || !form.objective) {
      setChannelError("Select a segment and objective first.");
      return;
    }
    setChannelLoading(true);
    setChannelError(null);
    setChannelResult(null);
    try {
      const res = await api.ai.recommendChannel({
        segmentName: segName,
        objective: form.objective,
      });
      setChannelResult(res);
    } catch (e: unknown) {
      setChannelError(e instanceof Error ? e.message : "Failed to recommend channel");
    } finally {
      setChannelLoading(false);
    }
  };

  const applyMessage = () => {
    if (!messageResult) return;
    const body = messageResult.body;
    const cta = messageResult.cta;
    const full = messageResult.subject
      ? `Subject: ${messageResult.subject}\n\n${body}\n\n${cta}`
      : `${body}\n\n${cta}`;
    setForm({ ...form, messageTemplate: full });
  };

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setMessageResult(null);
      setMessageError(null);
      setChannelResult(null);
      setChannelError(null);
      setStudioTab("details");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      <PageHeader
        title="Campaigns"
        description="Create, review, and send outreach campaigns"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5 mr-1.5" />
            New Campaign
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Send className="size-5" />}
          title="No campaigns yet"
          description="Create your first campaign to start reaching your customers."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5 mr-1.5" />
              New Campaign
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="group rounded-xl border border-border bg-card px-5 py-4 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.objective}</p>
                  <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground/70">
                    <span>Segment: {c.segment?.name || "—"}</span>
                    <span className="capitalize">Channel: {c.channel}</span>
                    {c.sentAt && <span>Sent: {new Date(c.sentAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="xs" onClick={() => router.push(`/campaigns/${c.id}`)}>
                    <Eye className="size-3 mr-1" />
                    View
                  </Button>
                  {c.status === "draft" && (
                    <Button size="xs" onClick={() => handleApprove(c.id)}>
                      <Check className="size-3 mr-1" />
                      Approve
                    </Button>
                  )}
                  {c.status === "approved" && (
                    <Button size="xs" onClick={() => handleSend(c.id)}>
                      <Send className="size-3 mr-1" />
                      Send
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden max-h-[90vh]">
          <div className="border-b border-border px-6 py-5">
            <DialogTitle className="text-base font-semibold text-foreground">
              Campaign Studio
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Set up your campaign in three steps — define, message, and channel.
            </DialogDescription>
          </div>

          <Tabs value={studioTab} onValueChange={setStudioTab} className="flex-1">
            <div className="border-b border-border px-6">
              <TabsList className="h-auto gap-0 bg-transparent w-full">
                {stepLabels.map((label, i) => (
                  <TabsTrigger
                    key={label}
                    value={stepTabs[i]}
                    disabled={i > currentStep + 1}
                    className={cn(
                      "flex-1 relative text-xs rounded-none bg-transparent pb-3 px-0",
                      "data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground",
                      "data-[state=active]:text-foreground text-muted-foreground",
                      "disabled:opacity-40"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[10px] font-medium",
                        i < currentStep ? "bg-foreground text-background" :
                        i === currentStep ? "bg-foreground text-background" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                      {label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
              <TabsContent value="details" className="mt-0 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name" className="text-xs font-medium text-foreground">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="VIP Reactivation"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-segment" className="text-xs font-medium text-foreground">Target Segment</Label>
                    <Select value={form.segmentId} onValueChange={(v) => setForm({ ...form, segmentId: v ?? "" })}>
                      <SelectTrigger id="campaign-segment" className="h-9 text-xs">
                        <SelectValue placeholder="Select a segment" />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-objective" className="text-xs font-medium text-foreground">Objective</Label>
                  <Input
                    id="campaign-objective"
                    value={form.objective}
                    onChange={(e) => setForm({ ...form, objective: e.target.value })}
                    placeholder="Re-engage high-value lapsed shoppers"
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => setStudioTab("message")}
                  disabled={!form.name || !form.objective || !form.segmentId}
                  className="w-full"
                >
                  Continue to Message
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </TabsContent>

              <TabsContent value="message" className="mt-0 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="campaign-message" className="text-xs font-medium text-foreground">Message Template</Label>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleGenerateMessage}
                      disabled={messageLoading}
                    >
                      {messageLoading ? (
                        <Loader2 className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="size-3 mr-1" />
                      )}
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea
                    id="campaign-message"
                    value={form.messageTemplate}
                    onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })}
                    placeholder="Hi {{name}}, we miss you! Come back and get 15% off..."
                    className="min-h-[120px] text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground/60">
                    Use {"{{name}}"}, {"{{email}}"} as placeholders
                  </p>
                </div>

                {messageError && (
                  <p className="text-xs text-destructive">{messageError}</p>
                )}

                {messageResult && (
                  <AIResultCard title="AI Generated Message">
                    {messageResult.subject && (
                      <div className="text-xs mb-2">
                        <span className="font-medium text-muted-foreground">Subject: </span>
                        <span className="text-foreground">{messageResult.subject}</span>
                      </div>
                    )}
                    <div className="rounded border border-border bg-card p-3 text-xs font-mono whitespace-pre-wrap text-muted-foreground mb-2 leading-relaxed">
                      {messageResult.body}
                    </div>
                    <div className="text-xs mb-2">
                      <span className="font-medium text-muted-foreground">CTA: </span>
                      <span className="text-foreground">{messageResult.cta}</span>
                    </div>
                    {messageResult.placeholders.length > 0 && (
                      <div className="text-[11px] text-muted-foreground/60 mb-3">
                        Placeholders: {messageResult.placeholders.join(", ")}
                      </div>
                    )}
                    <Button size="xs" variant="secondary" onClick={applyMessage} className="w-full">
                      Apply to Template
                    </Button>
                  </AIResultCard>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => setStudioTab("details")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setStudioTab("channel")}
                    disabled={!form.messageTemplate}
                    className="flex-1"
                  >
                    Continue to Channel
                    <ChevronRight className="size-3.5 ml-1.5" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="channel" className="mt-0 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="campaign-channel" className="text-xs font-medium text-foreground">Channel</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v ?? "whatsapp" })}>
                    <SelectTrigger id="campaign-channel" className="h-9 text-xs">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp" className="text-xs">WhatsApp</SelectItem>
                      <SelectItem value="email" className="text-xs">Email</SelectItem>
                      <SelectItem value="sms" className="text-xs">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Channel Recommendation</span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleRecommendChannel}
                      disabled={channelLoading}
                    >
                      {channelLoading ? (
                        <Loader2 className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Lightbulb className="size-3 mr-1" />
                      )}
                      Get AI Recommendation
                    </Button>
                  </div>
                  {channelError && <p className="text-xs text-destructive">{channelError}</p>}
                  {channelResult && (
                    <AIResultCard title="AI Channel Recommendation">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Recommended: </span>
                        <span className="text-xs font-semibold text-foreground capitalize">{channelResult.recommendedChannel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{channelResult.reason}</p>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => setForm({ ...form, channel: channelResult.recommendedChannel })}
                        className="w-full"
                      >
                        Use {channelResult.recommendedChannel.charAt(0).toUpperCase() + channelResult.recommendedChannel.slice(1)}
                      </Button>
                    </AIResultCard>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => setStudioTab("message")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={!form.name || !form.objective || !form.segmentId || !form.messageTemplate}
                    className="flex-1"
                  >
                    <Rocket className="size-3.5 mr-1.5" />
                    Create Campaign
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
