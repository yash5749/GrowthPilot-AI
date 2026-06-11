"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Campaign, Segment, CreateCampaignDto, MessageSuggestion, ChannelRecommendation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Send, Check, Rocket, Eye, Sparkles, Loader2, Wand2, Lightbulb } from "lucide-react";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
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

  const applyChannel = (channel: string) => {
    setForm({ ...form, channel });
  };

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setMessageResult(null);
      setMessageError(null);
      setMessageLoading(false);
      setChannelResult(null);
      setChannelError(null);
      setChannelLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Campaign Studio</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VIP Reactivation" />
                </div>
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v ?? "whatsapp" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objective</Label>
                <Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Re-engage high-value lapsed shoppers" />
              </div>

              <div className="space-y-2">
                <Label>Target Segment</Label>
                  <Select value={form.segmentId} onValueChange={(v) => setForm({ ...form, segmentId: v ?? "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Message Template</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateMessage}
                    disabled={messageLoading}
                  >
                    {messageLoading ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3 mr-1" />
                    )}
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  value={form.messageTemplate}
                  onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })}
                  placeholder="Hi {{name}}, we miss you! Come back and get 15% off..."
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{name}}"}, {"{{email}}"} as placeholders
                </p>
              </div>

              {messageError && (
                <p className="text-sm text-destructive">{messageError}</p>
              )}

              {messageResult && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      AI Generated Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {messageResult.subject && (
                      <div>
                        <span className="font-medium">Subject: </span>
                        {messageResult.subject}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap bg-background p-3 rounded border text-xs font-mono">
                      {messageResult.body}
                    </div>
                    <div>
                      <span className="font-medium">CTA: </span>
                      {messageResult.cta}
                    </div>
                    {messageResult.placeholders.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Placeholders: {messageResult.placeholders.join(", ")}
                      </div>
                    )}
                    <Button size="sm" variant="secondary" onClick={applyMessage} className="w-full mt-2">
                      Apply to Template
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Channel Recommendation</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecommendChannel}
                    disabled={channelLoading}
                  >
                    {channelLoading ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Lightbulb className="h-3 w-3 mr-1" />
                    )}
                    Recommend Channel
                  </Button>
                </div>
                {channelError && (
                  <p className="text-sm text-destructive">{channelError}</p>
                )}
                {channelResult && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Recommended: </span>
                        <span className="capitalize text-primary font-semibold">{channelResult.recommendedChannel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{channelResult.reason}</p>
                      <Button size="sm" variant="secondary" onClick={() => applyChannel(channelResult.recommendedChannel)} className="w-full mt-1">
                        Use {channelResult.recommendedChannel.charAt(0).toUpperCase() + channelResult.recommendedChannel.slice(1)}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Button onClick={handleCreate} disabled={!form.name || !form.objective || !form.segmentId || !form.messageTemplate} className="w-full">
                <Rocket className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Send className="h-8 w-8 mx-auto mb-2" />
            <p>No campaigns yet. Create your first campaign.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{c.name}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{c.objective}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Segment: {c.segment?.name || "—"}</span>
                      <span>Channel: {c.channel}</span>
                      {c.sentAt && <span>Sent: {new Date(c.sentAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/campaigns/${c.id}`)}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {c.status === "draft" && (
                      <Button size="sm" onClick={() => handleApprove(c.id)}>
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                    )}
                    {c.status === "approved" && (
                      <Button size="sm" onClick={() => handleSend(c.id)}>
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
