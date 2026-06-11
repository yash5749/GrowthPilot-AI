"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Segment, CreateSegmentDto, SegmentSuggestion } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Sparkles, Eye, Tags, Users as UsersIcon, Loader2 } from "lucide-react";

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
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <Sparkles className="size-3.5 mr-1.5" />
                AI Suggest
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold text-[#171717]">AI Segment Suggestion</DialogTitle>
                  <DialogDescription className="text-xs text-[#888888]">
                    Describe your business goal and AI will suggest a segment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#4d4d4d]">Describe your business goal</Label>
                    <Textarea
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
                    <div className="rounded-lg border border-[#d3e5ff] bg-[#d3e5ff]/10 p-4 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3 text-[#0070f3]" />
                        <p className="text-xs font-medium text-[#171717]">{aiResult.name}</p>
                      </div>
                      <p className="text-xs text-[#888888]">{aiResult.reason}</p>
                      <pre className="text-[11px] bg-white border border-[#ebebeb] p-2 rounded font-mono overflow-x-auto">
                        {JSON.stringify(aiResult.ruleJson, null, 2)}
                      </pre>
                      <Button size="xs" variant="secondary" onClick={applyAiSuggestion} className="w-full">
                        Apply to Form
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus className="size-3.5 mr-1.5" />
                New Segment
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold text-[#171717]">Create Segment</DialogTitle>
                  <DialogDescription className="text-xs text-[#888888]">
                    Define rules to group your customers.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#4d4d4d]">Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VIP Shoppers" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#4d4d4d]">Description</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="High-value repeat customers" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#4d4d4d]">Rules (JSON)</Label>
                    <Textarea
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
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-[#ebebeb] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#ebebeb] bg-white p-8 text-center">
          <p className="text-sm text-[#888888]">{error}</p>
        </div>
      ) : segments.length === 0 ? (
        <EmptyState
          icon={<Tags className="size-5" />}
          title="No segments yet"
          description="Create a segment to group your customers by behavior or attributes."
          action={
            <Dialog>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus className="size-3.5 mr-1.5" />
                New Segment
              </DialogTrigger>
            </Dialog>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <div key={s.id} className="flex flex-col rounded-xl border border-[#ebebeb] bg-white transition-shadow hover:shadow-sm">
              <div className="border-b border-[#ebebeb] px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#171717] truncate">{s.name}</h3>
                    {s.description && (
                      <p className="mt-0.5 text-xs text-[#888888] line-clamp-2">{s.description}</p>
                    )}
                  </div>
                  {s.aiGenerated && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-medium text-[#888888] shrink-0">
                      <Sparkles className="size-2.5" />
                      AI
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 px-5 py-4">
                <pre className="text-[11px] bg-[#fafafa] border border-[#ebebeb] p-3 rounded-lg font-mono overflow-auto max-h-24 leading-relaxed">
                  {JSON.stringify(s.ruleJson, null, 2)}
                </pre>
              </div>
              <div className="border-t border-[#ebebeb] px-5 py-3">
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
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-[#171717]">
              Preview: {previewResult?.segment?.name || "Segment"}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-[#888888]" />
            </div>
          ) : previewResult ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-[#888888]" />
                <p className="text-lg font-semibold text-[#171717]">
                  {previewResult.count} customer{previewResult.count !== 1 ? "s" : ""}
                </p>
              </div>
              {previewResult.customers.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewResult.customers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-[#ebebeb] p-3">
                      <span className="text-xs font-medium text-[#171717]">{c.name}</span>
                      <span className="text-[11px] text-[#888888]">{c.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#888888]">No customers match this segment.</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
