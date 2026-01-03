import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useSidebar } from "@/lib/sidebar-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSupplierPerformance, useParts } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useLocalization } from "@/lib/currency-context";
import {
  Truck,
  Package,
  DollarSign,
  Star,
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  Filter,
  Building,
  Loader2,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Supplier {
  id: number;
  supplier_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gst_number: string;
  pan_number: string;
  payment_terms: string;
  credit_limit: string;
  outstanding_balance: string;
  rating: string;
  categories: string[];
  is_active: boolean;
  created_at: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name: string;
  branch_name: string;
  status: string;
  order_date: string;
  expected_delivery: string;
  grand_total: string;
  created_at: string;
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

export default function Suppliers() {
  const { isCollapsed } = useSidebar();
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"suppliers" | "orders" | "performance">("suppliers");
  const { data: supplierPerformance = [], isLoading: performanceLoading } = useSupplierPerformance();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    gst_number: "",
    pan_number: "",
    payment_terms: "NET_30",
    credit_limit: "",
    categories: "",
  });

  interface POLineItem {
    part: string;
    quantity_ordered: string;
    unit_price: string;
  }

  const [poForm, setPoForm] = useState({
    supplier: "",
    expected_delivery: "",
    notes: "",
  });

  const [poLineItems, setPoLineItems] = useState<POLineItem[]>([
    { part: "", quantity_ordered: "", unit_price: "" },
  ]);

  const { data: parts = [], isLoading: partsLoading } = useParts();

  const createSupplier = useMutation({
    mutationFn: async (data: typeof supplierForm) => {
      const categoriesArray = data.categories
        ? data.categories.split(",").map((c) => c.trim()).filter(Boolean)
        : [];
      const res = await apiRequest("POST", "/api/suppliers/", {
        ...data,
        credit_limit: data.credit_limit || "0",
        categories: categoriesArray,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setSupplierDialogOpen(false);
      setSupplierForm({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        gst_number: "",
        pan_number: "",
        payment_terms: "NET_30",
        credit_limit: "",
        categories: "",
      });
      toast({ title: t('suppliers.messages.supplierCreated', 'Supplier created successfully') });
    },
    onError: (error) => {
      toast({ title: t('suppliers.messages.supplierCreateError', 'Failed to create supplier'), description: error.message, variant: "destructive" });
    },
  });

  const createPO = useMutation({
    mutationFn: async (data: { form: typeof poForm; lines: POLineItem[] }) => {
      if (!profile?.branch) {
        throw new Error(t('suppliers.messages.noBranchAssigned', 'No branch assigned to your profile'));
      }
      const lines_data = data.lines
        .filter((line) => line.part && line.quantity_ordered)
        .map((line) => ({
          part: parseInt(line.part),
          quantity_ordered: parseInt(line.quantity_ordered),
          unit_price: line.unit_price ? parseFloat(line.unit_price) : undefined,
        }));

      const res = await apiRequest("POST", "/api/purchase-orders/", {
        branch: profile.branch,
        supplier: parseInt(data.form.supplier),
        expected_delivery: data.form.expected_delivery || null,
        notes: data.form.notes,
        lines_data: lines_data.length > 0 ? lines_data : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setPoDialogOpen(false);
      setPoForm({ supplier: "", expected_delivery: "", notes: "" });
      setPoLineItems([{ part: "", quantity_ordered: "", unit_price: "" }]);
      toast({ title: t('suppliers.messages.poCreated', 'Purchase order created successfully') });
    },
    onError: (error) => {
      toast({ title: t('suppliers.messages.poCreateError', 'Failed to create PO'), description: error.message, variant: "destructive" });
    },
  });

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.phone) {
      toast({ title: t('suppliers.messages.namePhoneRequired', 'Name and phone are required'), variant: "destructive" });
      return;
    }
    createSupplier.mutate(supplierForm);
  };

  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.supplier) {
      toast({ title: t('suppliers.messages.selectSupplier', 'Please select a supplier'), variant: "destructive" });
      return;
    }
    const validLines = poLineItems.filter((line) => line.part && line.quantity_ordered);
    for (const line of validLines) {
      if (!line.unit_price || parseFloat(line.unit_price) <= 0) {
        toast({ title: t('suppliers.messages.validUnitPrice', 'Please enter a valid unit price for all items'), variant: "destructive" });
        return;
      }
    }
    createPO.mutate({ form: poForm, lines: poLineItems });
  };

  const addLineItem = () => {
    setPoLineItems([...poLineItems, { part: "", quantity_ordered: "", unit_price: "" }]);
  };

  const removeLineItem = (index: number) => {
    if (poLineItems.length > 1) {
      setPoLineItems(poLineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof POLineItem, value: string) => {
    const updated = [...poLineItems];
    updated[index] = { ...updated[index], [field]: value };
    setPoLineItems(updated);
  };

  const calculateSubtotal = () => {
    return poLineItems.reduce((sum, line) => {
      const qty = parseFloat(line.quantity_ordered) || 0;
      const price = parseFloat(line.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  };

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers/", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
  });

  const { data: purchaseOrders = [], isLoading: ordersLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", statusFilter],
    queryFn: async () => {
      let url = "/api/purchase-orders/";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return res.json();
    },
  });

  const activeSuppliers = suppliers.filter((s) => s.is_active);
  const totalOutstanding = suppliers.reduce((sum, s) => sum + parseFloat(s.outstanding_balance || "0"), 0);
  const pendingOrders = purchaseOrders.filter((po) => ["PENDING_APPROVAL", "APPROVED", "ORDERED"].includes(po.status));

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        supplier.name?.toLowerCase().includes(query) ||
        supplier.supplier_id?.toLowerCase().includes(query) ||
        supplier.city?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filteredOrders = purchaseOrders.filter((po) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        po.po_number?.toLowerCase().includes(query) ||
        po.supplier_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">{t('suppliers.title', 'Suppliers & Procurement')}</h1>
              <p className="text-muted-foreground">{t('suppliers.subtitle', 'Manage vendors and purchase orders')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSupplierDialogOpen(true)} data-testid="button-new-supplier">
                <Building className="h-4 w-4 mr-2" />
                {t('suppliers.addSupplier', 'Add Supplier')}
              </Button>
              <Button onClick={() => setPoDialogOpen(true)} data-testid="button-new-po">
                <Package className="h-4 w-4 mr-2" />
                {t('suppliers.createPO', 'New Purchase Order')}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('suppliers.metrics.activeSuppliers', 'Active Suppliers')}</p>
                    <p className="text-2xl font-bold" data-testid="text-total-suppliers">{activeSuppliers.length}</p>
                  </div>
                  <Truck className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('suppliers.metrics.pendingOrders', 'Pending Orders')}</p>
                    <p className="text-2xl font-bold text-blue-600">{pendingOrders.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('suppliers.metrics.outstandingBalance', 'Outstanding Balance')}</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(totalOutstanding)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('suppliers.metrics.totalOrders', 'Total Orders')}</p>
                    <p className="text-2xl font-bold">{purchaseOrders.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-4 border-b">
            <Button
              variant={activeTab === "suppliers" ? "default" : "ghost"}
              onClick={() => setActiveTab("suppliers")}
              data-testid="tab-suppliers"
            >
              <Building className="h-4 w-4 mr-2" />
              {t('suppliers.tabs.suppliers', 'Suppliers')}
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              onClick={() => setActiveTab("orders")}
              data-testid="tab-orders"
            >
              <Package className="h-4 w-4 mr-2" />
              {t('suppliers.tabs.orders', 'Purchase Orders')}
            </Button>
            <Button
              variant={activeTab === "performance" ? "default" : "ghost"}
              onClick={() => setActiveTab("performance")}
              data-testid="tab-performance"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('suppliers.tabs.performance', 'Performance')}
            </Button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "suppliers" ? t('suppliers.searchSuppliers', 'Search suppliers...') : t('suppliers.searchOrders', 'Search orders...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            {activeTab === "orders" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('common.status', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('suppliers.status.all', 'All Status')}</SelectItem>
                  <SelectItem value="DRAFT">{t('suppliers.status.DRAFT', 'Draft')}</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">{t('suppliers.status.PENDING_APPROVAL', 'Pending Approval')}</SelectItem>
                  <SelectItem value="APPROVED">{t('suppliers.status.APPROVED', 'Approved')}</SelectItem>
                  <SelectItem value="ORDERED">{t('suppliers.status.ORDERED', 'Ordered')}</SelectItem>
                  <SelectItem value="PARTIALLY_RECEIVED">{t('suppliers.status.PARTIALLY_RECEIVED', 'Partially Received')}</SelectItem>
                  <SelectItem value="RECEIVED">{t('suppliers.status.RECEIVED', 'Received')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {activeTab === "suppliers" ? (
            suppliersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('suppliers.noSuppliersFound', 'No suppliers found')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSuppliers.map((supplier) => (
                  <Card
                    key={supplier.id}
                    className={cn(!supplier.is_active && "opacity-60")}
                    data-testid={`card-supplier-${supplier.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-medium">{supplier.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{supplier.supplier_id}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{supplier.rating || t('common.na', 'N/A')}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {supplier.contact_person && (
                        <p className="text-sm font-medium">{supplier.contact_person}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                      {(supplier.city || supplier.state) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{[supplier.city, supplier.state].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                      {supplier.categories && supplier.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {supplier.categories.slice(0, 3).map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="pt-2 border-t flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('suppliers.outstanding', 'Outstanding')}</span>
                        <span className={cn(
                          "font-medium",
                          parseFloat(supplier.outstanding_balance) > 0 && "text-orange-600"
                        )}>
                          {formatCurrency(parseFloat(supplier.outstanding_balance || "0"))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('suppliers.noOrdersFound', 'No purchase orders found')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((po) => (
                  <Card key={po.id} data-testid={`card-po-${po.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div>
                            <Link href={`/purchase-orders/${po.id}`}>
                              <span
                                className="font-medium text-primary underline-offset-4 hover:underline cursor-pointer"
                                data-testid={`link-po-${po.id}`}
                              >
                                {po.po_number}
                              </span>
                            </Link>
                            <p className="text-sm text-muted-foreground">{po.supplier_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{t('common.total', 'Total')}</p>
                            <p className="font-medium">{formatCurrency(parseFloat(po.grand_total))}</p>
                          </div>
                          {po.expected_delivery && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{t('suppliers.expected', 'Expected')}</p>
                              <p className="text-sm">{po.expected_delivery}</p>
                            </div>
                          )}
                          <Badge className={cn("text-xs", PO_STATUS_COLORS[po.status])}>
                            {t(`suppliers.status.${po.status}`, po.status.replace(/_/g, " "))}
                          </Badge>
                          <Link href={`/purchase-orders/${po.id}`}>
                            <Button size="sm" variant="outline" data-testid={`button-view-po-${po.id}`}>
                              {t('common.view', 'View')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {activeTab === "performance" && (
            performanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : supplierPerformance.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('suppliers.noPerformanceData', 'No supplier performance data available')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {supplierPerformance.map((perf) => {
                  const getScoreColor = (score: number) => {
                    if (score >= 80) return "text-green-600";
                    if (score >= 60) return "text-yellow-600";
                    return "text-red-600";
                  };
                  const getScoreBg = (score: number) => {
                    if (score >= 80) return "bg-green-500/10";
                    if (score >= 60) return "bg-yellow-500/10";
                    return "bg-red-500/10";
                  };
                  return (
                    <Card key={perf.id} data-testid={`card-performance-${perf.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm font-medium">{perf.supplier_name}</CardTitle>
                          <Badge className={cn("text-lg font-bold", getScoreBg(perf.overall_score), getScoreColor(perf.overall_score))}>
                            {perf.overall_score}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {perf.period_start} - {perf.period_end}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{t('suppliers.performance.onTimeRate', 'On-Time Rate')}</span>
                          </div>
                          <span className={cn("font-medium", getScoreColor(perf.on_time_rate))}>
                            {perf.on_time_rate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span>{t('suppliers.performance.qualityRate', 'Quality Rate')}</span>
                          </div>
                          <span className={cn("font-medium", getScoreColor(perf.quality_rate))}>
                            {perf.quality_rate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>{t('suppliers.performance.priceVariance', 'Price Variance')}</span>
                          </div>
                          <span className={cn("font-medium", parseFloat(perf.price_variance) > 0 ? "text-red-600" : "text-green-600")}>
                            {parseFloat(perf.price_variance) > 0 ? "+" : ""}{perf.price_variance}%
                          </span>
                        </div>
                        <div className="pt-2 border-t grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <p className="text-muted-foreground">{t('suppliers.performance.orders', 'Orders')}</p>
                            <p className="font-medium">{perf.total_orders}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('suppliers.performance.onTime', 'On Time')}</p>
                            <p className="font-medium text-green-600">{perf.orders_on_time}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('suppliers.performance.rejected', 'Rejected')}</p>
                            <p className="font-medium text-red-600">{perf.items_rejected}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>

      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('suppliers.dialog.addSupplier', 'Add New Supplier')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('suppliers.form.companyName', 'Company Name')}</Label>
                <Input
                  id="name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder={t('suppliers.form.companyNamePlaceholder', 'Company name')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">{t('suppliers.form.contactPerson', 'Contact Person')}</Label>
                <Input
                  id="contact_person"
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                  placeholder={t('suppliers.form.contactNamePlaceholder', 'Contact name')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('suppliers.form.phone', 'Phone')}</Label>
                <Input
                  id="phone"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder={t('suppliers.form.phonePlaceholder', 'Phone number')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('suppliers.form.email', 'Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder={t('suppliers.form.emailPlaceholder', 'Email address')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('suppliers.form.address', 'Address')}</Label>
              <Textarea
                id="address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                placeholder={t('suppliers.form.addressPlaceholder', 'Full address')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t('suppliers.form.city', 'City')}</Label>
                <Input
                  id="city"
                  value={supplierForm.city}
                  onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                  placeholder={t('suppliers.form.cityPlaceholder', 'City')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t('suppliers.form.state', 'State')}</Label>
                <Input
                  id="state"
                  value={supplierForm.state}
                  onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
                  placeholder={t('suppliers.form.statePlaceholder', 'State')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst_number">{t('suppliers.form.gstNumber', 'GST Number')}</Label>
                <Input
                  id="gst_number"
                  value={supplierForm.gst_number}
                  onChange={(e) => setSupplierForm({ ...supplierForm, gst_number: e.target.value })}
                  placeholder={t('suppliers.form.gstNumberPlaceholder', 'GST Number')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">{t('suppliers.form.panNumber', 'PAN Number')}</Label>
                <Input
                  id="pan_number"
                  value={supplierForm.pan_number}
                  onChange={(e) => setSupplierForm({ ...supplierForm, pan_number: e.target.value })}
                  placeholder={t('suppliers.form.panNumberPlaceholder', 'PAN Number')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">{t('suppliers.form.paymentTerms', 'Payment Terms')}</Label>
                <Select
                  value={supplierForm.payment_terms}
                  onValueChange={(value) => setSupplierForm({ ...supplierForm, payment_terms: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMEDIATE">{t('suppliers.paymentTerms.IMMEDIATE', 'Immediate')}</SelectItem>
                    <SelectItem value="NET_15">{t('suppliers.paymentTerms.NET_15', 'Net 15')}</SelectItem>
                    <SelectItem value="NET_30">{t('suppliers.paymentTerms.NET_30', 'Net 30')}</SelectItem>
                    <SelectItem value="NET_45">{t('suppliers.paymentTerms.NET_45', 'Net 45')}</SelectItem>
                    <SelectItem value="NET_60">{t('suppliers.paymentTerms.NET_60', 'Net 60')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit_limit">{t('suppliers.form.creditLimit', 'Credit Limit')}</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  value={supplierForm.credit_limit}
                  onChange={(e) => setSupplierForm({ ...supplierForm, credit_limit: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">{t('suppliers.form.categories', 'Item Categories (comma-separated)')}</Label>
              <Input
                id="categories"
                value={supplierForm.categories}
                onChange={(e) => setSupplierForm({ ...supplierForm, categories: e.target.value })}
                placeholder={t('suppliers.form.categoriesPlaceholder', 'e.g., Filters, Oil, Brakes, Tyres')}
                data-testid="input-supplier-categories"
              />
              <p className="text-xs text-muted-foreground">
                {t('suppliers.form.categoriesHelp', 'Enter the types of items this supplier delivers')}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={createSupplier.isPending} data-testid="button-submit-supplier">
                {createSupplier.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('suppliers.creating', 'Creating...')}
                  </>
                ) : (
                  t('suppliers.createSupplier', 'Create Supplier')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('suppliers.dialog.createPO', 'Create Purchase Order')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePOSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="po_supplier">{t('suppliers.form.supplier', 'Supplier')}</Label>
                <Select
                  value={poForm.supplier}
                  onValueChange={(value) => setPoForm({ ...poForm, supplier: value })}
                >
                  <SelectTrigger data-testid="select-po-supplier">
                    <SelectValue placeholder={t('suppliers.form.selectSupplier', 'Select supplier')} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.is_active).map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_delivery">{t('suppliers.form.expectedDelivery', 'Expected Delivery')}</Label>
                <Input
                  id="expected_delivery"
                  type="date"
                  value={poForm.expected_delivery}
                  onChange={(e) => setPoForm({ ...poForm, expected_delivery: e.target.value })}
                  data-testid="input-expected-delivery"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{t('suppliers.form.lineItems', 'Line Items')}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addLineItem}
                  data-testid="button-add-line"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('suppliers.form.addItem', 'Add Item')}
                </Button>
              </div>

              <div className="space-y-2 border rounded-md p-3">
                {poLineItems.map((line, index) => (
                  <div key={index} className="flex items-center gap-2" data-testid={`line-item-${index}`}>
                    <div className="flex-1">
                      <Select
                        value={line.part}
                        onValueChange={(value) => {
                          updateLineItem(index, "part", value);
                          const selectedPart = parts.find((p) => p.id.toString() === value);
                          if (selectedPart && !line.unit_price) {
                            updateLineItem(index, "unit_price", selectedPart.price);
                          }
                        }}
                      >
                        <SelectTrigger data-testid={`select-part-${index}`}>
                          <SelectValue placeholder={t('suppliers.form.selectPart', 'Select part')} />
                        </SelectTrigger>
                        <SelectContent>
                          {partsLoading ? (
                            <SelectItem value="" disabled>
                              {t('common.loading', 'Loading...')}
                            </SelectItem>
                          ) : (
                            parts.map((part) => (
                              <SelectItem key={part.id} value={part.id.toString()}>
                                {part.name} ({part.sku})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      placeholder={t('suppliers.form.qtyPlaceholder', 'Qty')}
                      className="w-20"
                      value={line.quantity_ordered}
                      onChange={(e) => updateLineItem(index, "quantity_ordered", e.target.value)}
                      data-testid={`input-qty-${index}`}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t('suppliers.form.pricePlaceholder', 'Price')}
                      className="w-24"
                      value={line.unit_price}
                      onChange={(e) => updateLineItem(index, "unit_price", e.target.value)}
                      data-testid={`input-price-${index}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLineItem(index)}
                      disabled={poLineItems.length === 1}
                      data-testid={`button-remove-line-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('suppliers.estimatedSubtotal', 'Estimated Subtotal')}</p>
                  <p className="text-lg font-semibold" data-testid="text-subtotal">
                    {formatCurrency(calculateSubtotal())}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="po_notes">{t('suppliers.form.notes', 'Notes')}</Label>
              <Textarea
                id="po_notes"
                value={poForm.notes}
                onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                placeholder={t('suppliers.form.notesPlaceholder', 'Order notes...')}
                rows={2}
                data-testid="textarea-notes"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPoDialogOpen(false)} data-testid="button-cancel-po">
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={createPO.isPending} data-testid="button-submit-po">
                {createPO.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('suppliers.creating', 'Creating...')}
                  </>
                ) : (
                  t('suppliers.createPOButton', 'Create PO')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
