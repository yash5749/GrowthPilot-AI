"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Segment, CreateSegmentDto, SegmentSuggestion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Sparkles, Eye, Tags } from "lucide-react";

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", ruleJson: "{}" });

  const [previewResult, setPreviewResult] = useState<{ segment: Segment; count: number; customers: { id: string; name: string; email: string }[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiResult, setAiResult] = useState<SegmentSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchSegments = () => {
    setLoading(true);
    api.segments
      .list()
      .then(setSegments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSegments(); }, []);

  const handleCreate = async () => {
    try {
      const dto: CreateSegmentDto = {
        name: form.name,
        description: form.description || undefined,
        ruleJson: JSON.parse(form.ruleJson || "{}"),
      };
      await api.segments.create(dto);
      setCreateOpen(false);
      setForm({ name: "", description: "", ruleJson: "{}" });
      fetchSegments();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    try {
      const res = await api.segments.preview(id);
      setPreviewResult(res);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!aiGoal.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.segments.aiSuggest(aiGoal);
      setAiResult(res);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "AI suggest failed");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiResult) return;
    setForm({
      name: aiResult.name,
      description: aiResult.reason,
      ruleJson: JSON.stringify(aiResult.ruleJson, null, 2),
    });
    setAiOpen(false);
    setAiResult(null);
    setAiGoal("");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Segments</h1>
        <div className="flex gap-2">
          <Dialog open={aiOpen} onOpenChange={setAiOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggest
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Segment Suggestion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Describe your business goal</Label>
                  <Textarea
                    placeholder="e.g., I want to re-engage customers who haven't shopped in 3 months but spent over $100"
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                  />
                </div>
                <Button onClick={handleAiSuggest} disabled={aiLoading || !aiGoal.trim()}>
                  {aiLoading ? "Thinking..." : "Generate Segment"}
                </Button>
                {aiResult && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <p className="font-semibold">{aiResult.name}</p>
                      <p className="text-sm text-muted-foreground">{aiResult.reason}</p>
                      <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(aiResult.ruleJson, null, 2)}</pre>
                      <Button size="sm" onClick={applyAiSuggestion}>
                        Apply to Form
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-2" />
              New Segment
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Segment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VIP Shoppers" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="High-value repeat customers" />
                </div>
                <div className="space-y-2">
                  <Label>Rules (JSON)</Label>
                  <Textarea
                    value={form.ruleJson}
                    onChange={(e) => setForm({ ...form, ruleJson: e.target.value })}
                    placeholder='{"totalSpent_gte": 500, "lastOrderDays_lte": 90}'
                    className="font-mono text-xs h-24"
                  />
                </div>
                <Button onClick={handleCreate} disabled={!form.name.trim()}>
                  Create Segment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : segments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Tags className="h-8 w-8 mx-auto mb-2" />
            <p>No segments yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  {s.aiGenerated && <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" />AI</Badge>}
                </div>
                {s.description && (
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between gap-3">
                <pre className="text-xs bg-muted p-2 rounded max-h-24 overflow-auto">
                  {JSON.stringify(s.ruleJson, null, 2)}
                </pre>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger render={<Button variant="outline" size="sm" className="flex-1" onClick={() => handlePreview(s.id)} />}>
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Preview: {s.name}</DialogTitle>
                      </DialogHeader>
                      {previewLoading ? (
                        <div className="h-32 flex items-center justify-center text-muted-foreground">Loading...</div>
                      ) : previewResult && previewResult.segment.id === s.id ? (
                        <div className="space-y-4 py-2">
                          <p className="text-lg font-bold">{previewResult.count} customer{previewResult.count !== 1 ? "s" : ""}</p>
                          {previewResult.customers.length > 0 ? (
                            <div className="space-y-2">
                              {previewResult.customers.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-2 rounded border">
                                  <span className="font-medium text-sm">{c.name}</span>
                                  <span className="text-xs text-muted-foreground">{c.email}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No customers match this segment.</p>
                          )}
                        </div>
                      ) : null}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
