import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Calendar,
  Building,
  Truck,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface POLine {
  id: number;
  part: number;
  part_name: string;
  part_sku: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: string;
  tax_rate: string;
  total: string;
}

interface PurchaseOrderDetail {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name: string;
  branch: number;
  branch_name: string;
  status: string;
  order_date: string;
  expected_delivery: string | null;
  subtotal: string;
  tax_amount: string;
  shipping_cost: string;
  grand_total: string;
  notes: string;
  created_at: string;
  lines: POLine[];
}

interface AllowedTransition {
  value: string;
  label: string;
}

interface TransitionsResponse {
  current_status: string;
  allowed_transitions: AllowedTransition[];
}

const PO_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ORDERED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  PARTIALLY_RECEIVED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  RECEIVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function PODetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: order, isLoading, error } = useQuery<PurchaseOrderDetail>({
    queryKey: ["/api/purchase-orders", id],
    queryFn: async () => {
      const res = await fetch(`/api/purchase-orders/${id}/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch purchase order");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: transitions } = useQuery<TransitionsResponse>({
    queryKey: ["/api/purchase-orders", id, "allowed_transitions"],
    queryFn: async () => {
      const res = await fetch(`/api/purchase-orders/${id}/allowed_transitions/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transitions");
      return res.json();
    },
    enabled: !!id && !!order,
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("POST", `/api/purchase-orders/${id}/update_status/`, { status: newStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders", id, "allowed_transitions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className="ml-64 flex-1 overflow-auto">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className="ml-64 flex-1 overflow-auto">
          <div className="p-6">
            <Link href="/suppliers">
              <Button variant="ghost" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Suppliers
              </Button>
            </Link>
            <Card className="mt-6">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Purchase order not found</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const lines = order.lines || [];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link href="/suppliers">
                <Button variant="ghost" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-po-number">{order.po_number}</h1>
                <p className="text-muted-foreground">Purchase Order Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-sm", PO_STATUS_COLORS[order.status])} data-testid="badge-status">
                {order.status.replace(/_/g, " ")}
              </Badge>
              {transitions?.allowed_transitions && transitions.allowed_transitions.length > 0 && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  {transitions.allowed_transitions.map((t) => (
                    <Button
                      key={t.value}
                      size="sm"
                      variant={t.value === "CANCELLED" ? "destructive" : "default"}
                      onClick={() => updateStatus.mutate(t.value)}
                      disabled={updateStatus.isPending}
                      data-testid={`button-transition-${t.value.toLowerCase()}`}
                    >
                      {t.label}
                    </Button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium" data-testid="text-supplier-name">{order.supplier_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Branch</p>
                    <p className="font-medium" data-testid="text-branch-name">{order.branch_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium" data-testid="text-order-date">{order.order_date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium" data-testid="text-expected-delivery">
                      {order.expected_delivery || "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {lines.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No line items in this order
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty Ordered</TableHead>
                      <TableHead className="text-right">Qty Received</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax Rate</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={line.id} data-testid={`row-line-${index}`}>
                        <TableCell className="font-medium" data-testid={`text-part-name-${index}`}>
                          {line.part_name}
                        </TableCell>
                        <TableCell data-testid={`text-part-sku-${index}`}>
                          {line.part_sku}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-qty-ordered-${index}`}>
                          {line.quantity_ordered}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-qty-received-${index}`}>
                          {line.quantity_received}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-unit-price-${index}`}>
                          ${parseFloat(line.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-tax-rate-${index}`}>
                          {parseFloat(line.tax_rate).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-medium" data-testid={`text-line-total-${index}`}>
                          ${parseFloat(line.total).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-end gap-2">
                <div className="flex justify-between w-64 gap-4">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium" data-testid="text-subtotal">
                    ${parseFloat(order.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-64 gap-4">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium" data-testid="text-tax">
                    ${parseFloat(order.tax_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-64 gap-4">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span className="font-medium" data-testid="text-shipping">
                    ${parseFloat(order.shipping_cost).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-64 gap-4 pt-2 border-t">
                  <span className="font-semibold">Grand Total:</span>
                  <span className="font-bold text-lg" data-testid="text-grand-total">
                    ${parseFloat(order.grand_total).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground" data-testid="text-notes">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
