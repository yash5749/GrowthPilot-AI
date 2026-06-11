"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, ChevronLeft, ChevronRight, Users, ShoppingCart, DollarSign, MapPin } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.customers.list(search || undefined, page);
      setCustomers(res.data);
      setMeta(res.meta);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <PageHeader
        title="Customers"
        description={`${meta.total} customer${meta.total !== 1 ? "s" : ""} imported`}
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#a1a1a1]" />
        <Input
          placeholder="Search customers..."
          className="h-9 pl-9 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-[#ebebeb] bg-white p-8 text-center">
          <p className="text-sm text-[#888888]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-[#ebebeb] animate-pulse" />
          ))}
        </div>
      ) : !error && customers.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="No customers found"
          description={search ? "Try a different search term." : "Import customer data to get started."}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[#ebebeb] bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#ebebeb]">
                  <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3 pl-5">Name</TableHead>
                  <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Email</TableHead>
                  <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">City</TableHead>
                  <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Orders</TableHead>
                  <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3">Total Spent</TableHead>
                  <TableHead className="text-[11px] font-medium text-[#888888] uppercase tracking-wider py-3 pr-5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="border-b border-[#ebebeb]">
                    <TableCell className="py-3 pl-5">
                      <span className="text-xs font-medium text-[#171717]">{c.name}</span>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-[#888888]">{c.email}</TableCell>
                    <TableCell className="py-3 text-xs text-[#888888]">{c.city || "—"}</TableCell>
                    <TableCell className="py-3 text-xs font-medium text-[#171717]">{c.metrics?.orderCount ?? c.orders?.length ?? 0}</TableCell>
                    <TableCell className="py-3 text-xs font-medium text-[#171717]">${(c.metrics?.totalSpent ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="py-3 pr-5 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setSelected(c);
                          setSheetOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#a1a1a1]">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={meta.page <= 1}
                onClick={() => fetchCustomers(meta.page - 1)}
              >
                <ChevronLeft className="size-3" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchCustomers(meta.page + 1)}
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="border-b border-[#ebebeb] pb-4">
                <SheetTitle className="text-sm font-semibold text-[#171717]">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-[#888888] uppercase">Email</p>
                    <p className="mt-1 text-xs text-[#171717]">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-[#888888] uppercase">Phone</p>
                    <p className="mt-1 text-xs text-[#171717]">{selected.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-[#888888] uppercase">City</p>
                    <p className="mt-1 text-xs text-[#171717]">{selected.city || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-[#888888] uppercase">Created</p>
                    <p className="mt-1 text-xs text-[#171717]">{new Date(selected.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selected.metrics && (
                  <div className="border-t border-[#ebebeb] pt-5">
                    <h4 className="text-xs font-medium text-[#171717] mb-4">Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4">
                        <DollarSign className="size-3.5 text-[#888888] mb-2" />
                        <p className="text-[11px] text-[#888888]">Total Spent</p>
                        <p className="mt-0.5 text-sm font-semibold text-[#171717]">${selected.metrics.totalSpent.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4">
                        <ShoppingCart className="size-3.5 text-[#888888] mb-2" />
                        <p className="text-[11px] text-[#888888]">Orders</p>
                        <p className="mt-0.5 text-sm font-semibold text-[#171717]">{selected.metrics.orderCount}</p>
                      </div>
                      <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4">
                        <DollarSign className="size-3.5 text-[#888888] mb-2" />
                        <p className="text-[11px] text-[#888888]">Avg Order Value</p>
                        <p className="mt-0.5 text-sm font-semibold text-[#171717]">${selected.metrics.averageOrderValue.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg border border-[#ebebeb] bg-[#fafafa] p-4">
                        <MapPin className="size-3.5 text-[#888888] mb-2" />
                        <p className="text-[11px] text-[#888888]">Last Order</p>
                        <p className="mt-0.5 text-sm font-semibold text-[#171717]">
                          {selected.metrics.lastOrderAt
                            ? new Date(selected.metrics.lastOrderAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selected.orders && selected.orders.length > 0 && (
                  <div className="border-t border-[#ebebeb] pt-5">
                    <h4 className="text-xs font-medium text-[#171717] mb-3">Recent Orders</h4>
                    <div className="space-y-2">
                      {selected.orders.slice(0, 5).map((o) => (
                        <div key={o.id} className="flex items-center justify-between rounded-lg border border-[#ebebeb] p-3">
                          <div>
                            <p className="text-xs font-medium text-[#171717]">${o.orderTotal.toFixed(2)}</p>
                            <p className="text-[11px] text-[#888888]">{o.channel} · {o.status}</p>
                          </div>
                          <p className="text-[11px] text-[#888888]">
                            {new Date(o.orderedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
