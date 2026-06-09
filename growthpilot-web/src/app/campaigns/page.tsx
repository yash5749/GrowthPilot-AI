"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Campaign, Segment, CreateCampaignDto } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Send, Check, Rocket, Eye } from "lucide-react";

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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Label>Message Template</Label>
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
