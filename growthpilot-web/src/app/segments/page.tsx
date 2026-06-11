"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Segment, CreateSegmentDto, SegmentSuggestion } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AIResultCard } from "@/components/shared/ai-result-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Sparkles, Eye, Tags, Users as UsersIcon, Loader2, ChevronRight } from "lucide-react";

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", ruleJson: "{}" });

  const [previewResult, setPreviewResult] = useState<{ segment: Segment; count: number; customers: { id: string; name: string; email: string }[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      <PageHeader
        title="Segments"
        description="Define and manage audience segments"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
              <Sparkles className="size-3.5 mr-1.5" />
              AI Suggest
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5 mr-1.5" />
              New Segment
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : segments.length === 0 ? (
        <EmptyState
          icon={<Tags className="size-5" />}
          title="No segments yet"
          description="Create a segment to group your customers by behavior or attributes."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5 mr-1.5" />
              New Segment
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <div key={s.id} className="flex flex-col rounded-xl border border-border bg-card transition-all hover:shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{s.name}</h3>
                    {s.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                    )}
                  </div>
                  {s.aiGenerated && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
                      <Sparkles className="size-2.5" />
                      AI
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 px-5 py-4">
                <pre className="text-[11px] bg-surface-subtle border border-border p-3 rounded-lg font-mono overflow-auto max-h-24 leading-relaxed text-muted-foreground">
                  {JSON.stringify(s.ruleJson, null, 2)}
                </pre>
              </div>
              <div className="border-t border-border px-5 py-3">
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full"
                  onClick={() => {
                    handlePreview(s.id);
                    setPreviewOpen(true);
                  }}
                >
                  <Eye className="size-3 mr-1" />
                  Preview Audience
                  <ChevronRight className="size-3 ml-auto" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-foreground">AI Segment Suggestion</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Describe your business goal and AI will suggest a segment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-goal" className="text-xs font-medium text-foreground">Describe your business goal</Label>
              <Textarea
                id="ai-goal"
                placeholder="e.g., I want to re-engage customers who haven't shopped in 3 months but spent over $100"
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>
            <Button size="sm" onClick={handleAiSuggest} disabled={aiLoading || !aiGoal.trim()}>
              {aiLoading ? (
                <Loader2 className="size-3 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="size-3 mr-1.5" />
              )}
              {aiLoading ? "Thinking..." : "Generate Segment"}
            </Button>
            {aiResult && (
              <AIResultCard title="Suggested Segment">
                <p className="text-sm font-semibold text-foreground mb-1">{aiResult.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{aiResult.reason}</p>
                <pre className="text-[11px] bg-card border border-border p-2 rounded font-mono overflow-x-auto text-muted-foreground mb-3">
                  {JSON.stringify(aiResult.ruleJson, null, 2)}
                </pre>
                <Button size="xs" variant="secondary" onClick={applyAiSuggestion} className="w-full">
                  Apply to Form
                </Button>
              </AIResultCard>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-foreground">Create Segment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define rules to group your customers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name" className="text-xs font-medium text-foreground">Name</Label>
              <Input id="segment-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VIP Shoppers" className="h-9 text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment-desc" className="text-xs font-medium text-foreground">Description</Label>
              <Input id="segment-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="High-value repeat customers" className="h-9 text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment-rules" className="text-xs font-medium text-foreground">Rules (JSON)</Label>
              <Textarea
                id="segment-rules"
                value={form.ruleJson}
                onChange={(e) => setForm({ ...form, ruleJson: e.target.value })}
                placeholder='{"totalSpent_gte": 500, "lastOrderDays_lte": 90}'
                className="font-mono text-xs h-24"
              />
            </div>
            <Button size="sm" onClick={handleCreate} disabled={!form.name.trim()} className="w-full">
              Create Segment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-foreground">
              Preview: {previewResult?.segment?.name || "Segment"}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : previewResult ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-muted-foreground" />
                <p className="text-lg font-semibold text-foreground">
                  {previewResult.count} customer{previewResult.count !== 1 ? "s" : ""}
                </p>
              </div>
              {previewResult.customers.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewResult.customers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-xs font-medium text-foreground">{c.name}</span>
                      <span className="text-[11px] text-muted-foreground">{c.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No customers match this segment.</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
