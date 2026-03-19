import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSidebar } from "@/lib/sidebar-context";
import { AppSidebar } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/currency-context";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Package,
  Calendar,
  Building,
  Truck,
  ChevronRight,
  FileText,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  actual_delivery: string | null;
  subtotal: string;
  tax: string;
  shipping: string;
  grand_total: string;
  notes: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
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

const STATUS_STEPS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "ORDERED", "RECEIVED"];

export default function PODetail() {
  const { isCollapsed } = useSidebar();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();

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
        <main className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64"
        )}>
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
        <main className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64"
        )}>
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
  const totalQtyOrdered = lines.reduce((s, l) => s + l.quantity_ordered, 0);
  const totalQtyReceived = lines.reduce((s, l) => s + l.quantity_received, 0);
  const receiptProgress = totalQtyOrdered > 0 ? (totalQtyReceived / totalQtyOrdered) * 100 : 0;
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
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
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold" data-testid="text-po-number">{order.po_number}</h1>
                  <Badge className={cn("text-sm", PO_STATUS_COLORS[order.status])} data-testid="badge-status">
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">Purchase Order Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {transitions?.allowed_transitions && transitions.allowed_transitions.length > 0 && (
                transitions.allowed_transitions.map((tr) => (
                  <Button
                    key={tr.value}
                    size="sm"
                    variant={tr.value === "CANCELLED" ? "destructive" : "default"}
                    onClick={() => updateStatus.mutate(tr.value)}
                    disabled={updateStatus.isPending}
                    data-testid={`button-transition-${tr.value.toLowerCase()}`}
                  >
                    {updateStatus.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {tr.value === "CANCELLED" ? "Cancel Order" : tr.label}
                  </Button>
                ))
              )}
            </div>
          </div>

          {!isCancelled && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center gap-1">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2",
                        i <= currentStepIndex
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-muted"
                      )}>
                        {i <= currentStepIndex ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className={cn("text-xs hidden sm:inline", i <= currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {step.replace(/_/g, " ")}
                      </span>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={cn("w-8 md:w-16 h-0.5 mx-1", i < currentStepIndex ? "bg-primary" : "bg-muted")} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
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
                    <p className="text-xs text-muted-foreground">Branch</p>
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
                    <p className="text-xs text-muted-foreground">Order Date</p>
                    <p className="font-medium" data-testid="text-order-date">{order.order_date || 'Not set'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium" data-testid="text-expected-delivery">
                      {order.expected_delivery || "Not set"}
                    </p>
                    {order.actual_delivery && (
                      <p className="text-xs text-green-600">Delivered: {order.actual_delivery}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {(order.status === "ORDERED" || order.status === "PARTIALLY_RECEIVED" || order.status === "RECEIVED") && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Receipt Progress</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {totalQtyReceived} / {totalQtyOrdered} items ({receiptProgress.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={receiptProgress} className="h-2" />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Line Items ({lines.length})</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {totalQtyOrdered} items ordered
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lines.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No line items in this order</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Part</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty Ordered</TableHead>
                      <TableHead className="text-right">Qty Received</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax Rate</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => {
                      const isFullyReceived = line.quantity_received >= line.quantity_ordered;
                      const isPartiallyReceived = line.quantity_received > 0 && line.quantity_received < line.quantity_ordered;
                      return (
                        <TableRow key={line.id} data-testid={`row-line-${index}`}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium" data-testid={`text-part-name-${index}`}>
                            {line.part_name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground" data-testid={`text-part-sku-${index}`}>
                            {line.part_sku}
                          </TableCell>
                          <TableCell className="text-right" data-testid={`text-qty-ordered-${index}`}>
                            {line.quantity_ordered}
                          </TableCell>
                          <TableCell className="text-right" data-testid={`text-qty-received-${index}`}>
                            <span className={cn(
                              isFullyReceived && "text-green-600 font-medium",
                              isPartiallyReceived && "text-orange-600 font-medium"
                            )}>
                              {line.quantity_received}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {isFullyReceived ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                Received
                              </Badge>
                            ) : isPartiallyReceived ? (
                              <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
                                Partial
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right" data-testid={`text-unit-price-${index}`}>
                            {formatCurrency(parseFloat(line.unit_price))}
                          </TableCell>
                          <TableCell className="text-right" data-testid={`text-tax-rate-${index}`}>
                            {parseFloat(line.tax_rate).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-medium" data-testid={`text-line-total-${index}`}>
                            {formatCurrency(parseFloat(line.total))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium" data-testid="text-subtotal">
                      {formatCurrency(parseFloat(order.subtotal || "0"))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (GST)</span>
                    <span className="font-medium" data-testid="text-tax">
                      {formatCurrency(parseFloat(order.tax || "0"))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium" data-testid="text-shipping">
                      {formatCurrency(parseFloat(order.shipping || "0"))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="font-semibold text-lg">Grand Total</span>
                    <span className="font-bold text-lg text-primary" data-testid="text-grand-total">
                      {formatCurrency(parseFloat(order.grand_total || "0"))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.created_by_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Created by:</span>
                      <span className="text-sm font-medium">{order.created_by_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="text-sm font-medium">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}
                    </span>
                  </div>
                  {order.updated_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Last updated:</span>
                      <span className="text-sm font-medium">
                        {new Date(order.updated_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {order.actual_delivery && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Delivered:</span>
                      <span className="text-sm font-medium text-green-600">{order.actual_delivery}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-notes">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
