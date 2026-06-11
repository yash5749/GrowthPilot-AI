"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, XCircle, SkipForward, AlertTriangle, Loader2 } from "lucide-react";
import type { ImportResult } from "@/lib/types";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<ImportResult>;
  title: string;
  description: string;
}

type Phase = "select" | "importing" | "result";

export function CsvImportDialog({ open, onOpenChange, onImport, title, description }: CsvImportDialogProps) {
  const [phase, setPhase] = useState<Phase>("select");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    setPhase("select");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(open: boolean) {
    if (!open) handleReset();
    onOpenChange(open);
  }

  async function handleImport() {
    if (!file) return;
    setPhase("importing");
    setError(null);
    try {
      const res = await onImport(file);
      setResult(res);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      setPhase("result");
    }
  }

  const hasError = result && result.failed > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {phase === "select" && (
          <div className="space-y-4 py-2">
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center cursor-pointer hover:border-foreground/30 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-8 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-medium text-foreground">
                {file ? file.name : "Click to select a CSV file"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : "Accepts .csv files only"}
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />
            </div>

            {file && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <FileText className="size-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}>
                  <XCircle className="size-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === "importing" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="size-8 text-foreground animate-spin" />
            <p className="text-sm font-medium text-foreground">Importing...</p>
            <p className="text-xs text-muted-foreground">{file?.name}</p>
          </div>
        )}

        {phase === "result" && (
          <div className="space-y-4 py-2">
            {error ? (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Import failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : result && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center rounded-lg border border-border bg-card p-3">
                    <CheckCircle className="size-5 text-emerald-600 mb-1" />
                    <p className="text-lg font-semibold text-foreground">{result.inserted}</p>
                    <p className="text-[11px] text-muted-foreground">Inserted</p>
                  </div>
                  <div className="flex flex-col items-center rounded-lg border border-border bg-card p-3">
                    <SkipForward className="size-5 text-amber-600 mb-1" />
                    <p className="text-lg font-semibold text-foreground">{result.skipped}</p>
                    <p className="text-[11px] text-muted-foreground">Skipped</p>
                  </div>
                  <div className="flex flex-col items-center rounded-lg border border-border bg-card p-3">
                    <XCircle className={`size-5 mb-1 ${hasError ? "text-red-600" : "text-muted-foreground/40"}`} />
                    <p className="text-lg font-semibold text-foreground">{result.failed}</p>
                    <p className="text-[11px] text-muted-foreground">Failed</p>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {result.total} row{result.total !== 1 ? "s" : ""} processed
                </p>

                {result.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-md bg-destructive/5 px-2.5 py-1.5">
                        <AlertTriangle className="size-3 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-medium text-destructive">Row {err.row}</p>
                          <p className="text-[11px] text-muted-foreground">{err.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {phase === "select" && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file}>
                {file ? `Import ${file.name}` : "Select a file"}
              </Button>
            </>
          )}
          {phase === "importing" && (
            <Button variant="outline" disabled>
              <Loader2 className="size-3 animate-spin mr-1" />
              Importing...
            </Button>
          )}
          {phase === "result" && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
              <Button onClick={handleReset}>
                Import another
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
