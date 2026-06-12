"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 0) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground/60">
        {total} total
      </p>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground/60 mr-1">
          Page {page} of {totalPages}
        </p>
        <Button
          variant="outline"
          size="xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-3" />
        </Button>
        <Button
          variant="outline"
          size="xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-3" />
        </Button>
      </div>
    </div>
  );
}
