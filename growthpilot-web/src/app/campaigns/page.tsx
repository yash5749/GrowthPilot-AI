"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Campaign, Segment, CreateCampaignDto, MessageSuggestion, ChannelRecommendation } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Send, Check, Eye, Sparkles, Wand2, Lightbulb, Loader2, Rocket } from "lucide-react";
import Link from "next/link";

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
          <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="size-3.5 mr-1.5" />
              New Campaign
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden max-h-[90vh]">
              <div className="border-b border-[#ebebeb] px-6 py-5">
                <DialogTitle className="text-base font-semibold text-[#171717]">
                  Campaign Studio
                </DialogTitle>
                <DialogDescription className="text-xs text-[#888888] mt-1">
                  Set up your campaign details, generate AI copy, and review before creating.
                </DialogDescription>
              </div>

              <Tabs value={studioTab} onValueChange={setStudioTab} className="flex-1">
                <div className="border-b border-[#ebebeb] px-6">
                  <TabsList className="h-10 gap-6 bg-transparent">
                    <TabsTrigger
                      value="details"
                      className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
                    >
                      1. Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="message"
                      className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
                    >
                      2. Message
                    </TabsTrigger>
                    <TabsTrigger
                      value="channel"
                      className="text-xs data-[state=active]:text-[#171717] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#171717] rounded-none bg-transparent pb-3 px-0"
                    >
                      3. Channel
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
                  <TabsContent value="details" className="mt-0 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-[#4d4d4d]">Campaign Name</Label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="VIP Reactivation"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-[#4d4d4d]">Target Segment</Label>
                        <Select value={form.segmentId} onValueChange={(v) => setForm({ ...form, segmentId: v ?? "" })}>
                          <SelectTrigger className="h-9 text-xs">
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
                      <Label className="text-xs font-medium text-[#4d4d4d]">Objective</Label>
                      <Input
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
                      <ArrowRightIcon className="size-3.5 ml-1.5" />
                    </Button>
                  </TabsContent>

                  <TabsContent value="message" className="mt-0 space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-[#4d4d4d]">Message Template</Label>
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
                        value={form.messageTemplate}
                        onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })}
                        placeholder="Hi {{name}}, we miss you! Come back and get 15% off..."
                        className="min-h-[120px] text-xs"
                      />
                      <p className="text-[11px] text-[#a1a1a1]">
                        Use {"{{name}}"}, {"{{email}}"} as placeholders
                      </p>
                    </div>

                    {messageError && (
                      <p className="text-xs text-red-600">{messageError}</p>
                    )}

                    {messageResult && (
                      <div className="rounded-lg border border-[#d3e5ff] bg-[#d3e5ff]/10 p-4 space-y-3">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="size-3 text-[#0070f3]" />
                          <p className="text-xs font-medium text-[#171717]">AI Generated Message</p>
                        </div>
                        {messageResult.subject && (
                          <div className="text-xs">
                            <span className="font-medium text-[#4d4d4d]">Subject: </span>
                            <span className="text-[#171717]">{messageResult.subject}</span>
                          </div>
                        )}
                        <div className="rounded border border-[#ebebeb] bg-white p-3 text-xs font-mono whitespace-pre-wrap text-[#4d4d4d]">
                          {messageResult.body}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-[#4d4d4d]">CTA: </span>
                          <span className="text-[#171717]">{messageResult.cta}</span>
                        </div>
                        {messageResult.placeholders.length > 0 && (
                          <div className="text-[11px] text-[#888888]">
                            Placeholders: {messageResult.placeholders.join(", ")}
                          </div>
                        )}
                        <Button size="xs" variant="secondary" onClick={applyMessage} className="w-full">
                          Apply to Template
                        </Button>
                      </div>
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
                        <ArrowRightIcon className="size-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="channel" className="mt-0 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-[#4d4d4d]">Channel</Label>
                      <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v ?? "whatsapp" })}>
                        <SelectTrigger className="h-9 text-xs">
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
                        <Label className="text-xs font-medium text-[#4d4d4d]">Channel Recommendation</Label>
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
                          Recommend
                        </Button>
                      </div>
                      {channelError && <p className="text-xs text-red-600">{channelError}</p>}
                      {channelResult && (
                        <div className="rounded-lg border border-[#d3e5ff] bg-[#d3e5ff]/10 p-4 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Lightbulb className="size-3 text-[#0070f3]" />
                            <span className="text-xs font-medium text-[#171717]">Recommended: </span>
                            <span className="text-xs font-semibold text-[#0070f3] capitalize">{channelResult.recommendedChannel}</span>
                          </div>
                          <p className="text-xs text-[#888888]">{channelResult.reason}</p>
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => setForm({ ...form, channel: channelResult.recommendedChannel })}
                            className="w-full"
                          >
                            Use {channelResult.recommendedChannel.charAt(0).toUpperCase() + channelResult.recommendedChannel.slice(1)}
                          </Button>
                        </div>
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
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[#ebebeb] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#ebebeb] bg-white p-8 text-center">
          <p className="text-sm text-[#888888]">{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Send className="size-5" />}
          title="No campaigns yet"
          description="Create your first campaign to start reaching your customers."
          action={
            <Dialog>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus className="size-3.5 mr-1.5" />
                New Campaign
              </DialogTrigger>
            </Dialog>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="group rounded-xl border border-[#ebebeb] bg-white px-5 py-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-[#171717]">{c.name}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[#888888]">{c.objective}</p>
                  <div className="mt-2 flex items-center gap-4 text-[11px] text-[#a1a1a1]">
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
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
