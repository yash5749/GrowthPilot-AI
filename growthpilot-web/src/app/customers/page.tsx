"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn } from "@/components/shared/fade-in";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Users, ShoppingCart, DollarSign, MapPin, Mail, Phone, Calendar, Upload } from "lucide-react";
import { CsvImportDialog } from "@/components/shared/csv-import-dialog";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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

  // fetchCustomers is also called by pagination and handles search
  // internally; duplicating it inline would create two sources of truth.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCustomers(1); }, [fetchCustomers]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <FadeIn>
        <PageHeader
          title="Customers"
          description={`${meta.total} customer${meta.total !== 1 ? "s" : ""} imported`}
          actions={
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="size-3.5 mr-1.5" />
              Import CSV
            </Button>
          }
        />
      </FadeIn>

      <FadeIn delay={50}>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search customers..."
            className="h-9 pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </FadeIn>

      {error && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : !error && customers.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="No customers found"
          description={search ? "Try a different search term." : "Import customer data to get started."}
        />
      ) : (
        <>
          <FadeIn delay={100}>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3 pl-5">Name</TableHead>
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Email</TableHead>
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">City</TableHead>
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Orders</TableHead>
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3">Total Spent</TableHead>
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-3 pr-5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id} className="border-b border-border">
                      <TableCell className="py-3 pl-5">
                        <span className="text-xs font-medium text-foreground">{c.name}</span>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">{c.city || "—"}</TableCell>
                      <TableCell className="py-3 text-xs font-medium text-foreground">{c.orderCount}</TableCell>
                      <TableCell className="py-3 text-xs font-medium text-foreground">${c.totalSpent.toFixed(2)}</TableCell>
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
          </FadeIn>

          <FadeIn delay={150}>
            <DataTablePagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={(p) => fetchCustomers(p)}
            />
          </FadeIn>
        </>
      )}

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(file) => api.customers.import(file)}
        title="Import Customers"
        description="Upload a CSV file with customer data. Expected columns: name, email, phone, city."
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto" style={{ maxWidth: "min(576px, 100vw - 2rem)" } as React.CSSProperties}>
          {selected && (
            <>
              <SheetHeader className="border-b border-border pb-4 px-6 pt-5">
                <SheetTitle className="text-sm font-semibold text-foreground">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 px-6 pb-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
                      <Mail className="size-3" /> Email
                    </p>
                    <p className="mt-1 text-xs text-foreground">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
                      <Phone className="size-3" /> Phone
                    </p>
                    <p className="mt-1 text-xs text-foreground">{selected.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
                      <MapPin className="size-3" /> City
                    </p>
                    <p className="mt-1 text-xs text-foreground">{selected.city || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
                      <Calendar className="size-3" /> Created
                    </p>
                    <p className="mt-1 text-xs text-foreground">{new Date(selected.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selected.metrics && (
                  <div className="border-t border-border pt-5">
                    <h4 className="text-xs font-medium text-foreground mb-4">Customer Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-border bg-surface-subtle p-4">
                        <DollarSign className="size-3.5 text-muted-foreground mb-2" />
                        <p className="text-[11px] text-muted-foreground">Total Spent</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">${selected.metrics.totalSpent.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-subtle p-4">
                        <ShoppingCart className="size-3.5 text-muted-foreground mb-2" />
                        <p className="text-[11px] text-muted-foreground">Orders</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{selected.metrics.orderCount}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-subtle p-4">
                        <DollarSign className="size-3.5 text-muted-foreground mb-2" />
                        <p className="text-[11px] text-muted-foreground">Avg Order Value</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">${selected.metrics.averageOrderValue.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-subtle p-4">
                        <MapPin className="size-3.5 text-muted-foreground mb-2" />
                        <p className="text-[11px] text-muted-foreground">Last Order</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">
                          {selected.metrics.lastOrderAt
                            ? new Date(selected.metrics.lastOrderAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selected.orders && selected.orders.length > 0 && (
                  <div className="border-t border-border pt-5">
                    <h4 className="text-xs font-medium text-foreground mb-3">Recent Orders</h4>
                    <div className="space-y-2">
                      {selected.orders.slice(0, 5).map((o) => (
                        <div key={o.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <p className="text-xs font-medium text-foreground">${o.orderTotal.toFixed(2)}</p>
                            <p className="text-[11px] text-muted-foreground">{o.channel} · {o.status}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
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
