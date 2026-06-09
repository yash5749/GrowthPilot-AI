"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);

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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !error && customers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p>No customers found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell>{c.city || "—"}</TableCell>
                    <TableCell>{c.metrics?.orderCount ?? c.orders?.length ?? 0}</TableCell>
                    <TableCell>${(c.metrics?.totalSpent ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Sheet>
                        <SheetTrigger render={<Button variant="ghost" size="sm" />}>
                          View
                        </SheetTrigger>
                        <SheetContent className="w-[500px] sm:max-w-lg overflow-y-auto">
                          {selected && selected.id === c.id && (
                            <>
                              <SheetHeader>
                                <SheetTitle>{selected.name}</SheetTitle>
                              </SheetHeader>
                              <div className="mt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{selected.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{selected.phone || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">City</p>
                                    <p className="font-medium">{selected.city || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Created</p>
                                    <p className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                {selected.metrics && (
                                  <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-3">Metrics</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Total Spent</p>
                                        <p className="text-lg font-bold">${selected.metrics.totalSpent.toFixed(2)}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Orders</p>
                                        <p className="text-lg font-bold">{selected.metrics.orderCount}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Avg Order Value</p>
                                        <p className="text-lg font-bold">${selected.metrics.averageOrderValue.toFixed(2)}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Last Order</p>
                                        <p className="text-lg font-bold">
                                          {selected.metrics.lastOrderAt
                                            ? new Date(selected.metrics.lastOrderAt).toLocaleDateString()
                                            : "—"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {selected.orders && selected.orders.length > 0 && (
                                  <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-3">Recent Orders</h4>
                                    <div className="space-y-2">
                                      {selected.orders.slice(0, 5).map((o) => (
                                        <div key={o.id} className="flex justify-between items-center p-2 rounded border">
                                          <div>
                                            <p className="text-sm font-medium">${o.orderTotal.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">{o.channel} · {o.status}</p>
                                          </div>
                                          <p className="text-xs text-muted-foreground">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>{meta.total} customer{meta.total !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => fetchCustomers(meta.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>Page {meta.page} of {meta.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchCustomers(meta.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
