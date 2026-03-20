import { useState, useMemo } from "react";
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
  Edit,
  Eye,
  AlertTriangle,
  ShieldCheck,
  FileText,
  ArrowUpDown,
  Calendar,
  CreditCard,
  Award,
  XCircle,
  ChevronRight,
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
  subtotal: string;
  tax: string;
  created_by_name: string;
  created_at: string;
  lines: any[];
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

const PAYMENT_TERMS_OPTIONS = [
  { value: "IMMEDIATE", label: "Immediate" },
  { value: "NET_15", label: "Net 15" },
  { value: "NET_30", label: "Net 30" },
  { value: "NET_45", label: "Net 45" },
  { value: "NET_60", label: "Net 60" },
  { value: "NET_90", label: "Net 90" },
];

export default function Suppliers() {
  const { isCollapsed, selectedBranch } = useSidebar();
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("suppliers");
  const { data: supplierPerformance = [], isLoading: performanceLoading } = useSupplierPerformance();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [perfSearchQuery, setPerfSearchQuery] = useState("");
  const [perfScoreFilter, setPerfScoreFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const emptySupplierForm = {
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
  };

  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);

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
      setSupplierForm(emptySupplierForm);
      toast({ title: t('suppliers.messages.supplierCreated', 'Supplier created successfully') });
    },
    onError: (error) => {
      toast({ title: t('suppliers.messages.supplierCreateError', 'Failed to create supplier'), description: error.message, variant: "destructive" });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof supplierForm }) => {
      const categoriesArray = data.categories
        ? data.categories.split(",").map((c) => c.trim()).filter(Boolean)
        : [];
      const res = await apiRequest("PATCH", `/api/suppliers/${id}/`, {
        ...data,
        credit_limit: data.credit_limit || "0",
        categories: categoriesArray,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setEditingSupplier(null);
      setSupplierDialogOpen(false);
      setSupplierForm(emptySupplierForm);
      toast({ title: t('suppliers.messages.supplierUpdated', 'Supplier updated successfully') });
    },
    onError: (error) => {
      toast({ title: t('suppliers.messages.supplierUpdateError', 'Failed to update supplier'), description: error.message, variant: "destructive" });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
      toast({ title: t('suppliers.messages.supplierDeleted', 'Supplier deleted successfully') });
    },
    onError: (error) => {
      toast({ title: t('suppliers.messages.supplierDeleteError', 'Failed to delete supplier'), description: error.message, variant: "destructive" });
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
    if (editingSupplier) {
      updateSupplier.mutate({ id: editingSupplier.id, data: supplierForm });
    } else {
      createSupplier.mutate(supplierForm);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone,
      email: supplier.email || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      gst_number: supplier.gst_number || "",
      pan_number: supplier.pan_number || "",
      payment_terms: supplier.payment_terms || "NET_30",
      credit_limit: supplier.credit_limit || "",
      categories: supplier.categories?.join(", ") || "",
    });
    setSupplierDialogOpen(true);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
    setSupplierDialogOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteConfirmOpen(true);
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

  const branchQ = selectedBranch && selectedBranch !== 'all' ? `?branch=${selectedBranch}` : '';
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers/", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
  });

  const { data: purchaseOrders = [], isLoading: ordersLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", selectedBranch],
    queryFn: async () => {
      const res = await fetch(`/api/purchase-orders/${branchQ}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return res.json();
    },
  });

  const activeSuppliers = suppliers.filter((s) => s.is_active);
  const inactiveSuppliers = suppliers.filter((s) => !s.is_active);
  const totalOutstanding = suppliers.reduce((sum, s) => sum + parseFloat(s.outstanding_balance || "0"), 0);
  const totalCreditLimit = suppliers.reduce((sum, s) => sum + parseFloat(s.credit_limit || "0"), 0);
  const pendingOrders = purchaseOrders.filter((po) => ["PENDING_APPROVAL", "APPROVED", "ORDERED"].includes(po.status));
  const totalPOValue = purchaseOrders.reduce((sum, po) => sum + parseFloat(po.grand_total || "0"), 0);
  const avgRating = suppliers.length > 0
    ? suppliers.reduce((sum, s) => sum + parseFloat(s.rating || "0"), 0) / suppliers.length
    : 0;

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    suppliers.forEach((s) => {
      s.categories?.forEach((c) => cats.add(c));
    });
    return Array.from(cats).sort();
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    let result = suppliers.filter((supplier) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        supplier.name?.toLowerCase().includes(query) ||
        supplier.contact_person?.toLowerCase().includes(query) ||
        supplier.phone?.toLowerCase().includes(query) ||
        supplier.email?.toLowerCase().includes(query) ||
        supplier.supplier_id?.toLowerCase().includes(query) ||
        supplier.gst_number?.toLowerCase().includes(query) ||
        supplier.city?.toLowerCase().includes(query);

      const matchesCategory = categoryFilter === "all" ||
        (supplier.categories && supplier.categories.includes(categoryFilter));

      const matchesStatus = activeFilter === "all" ||
        (activeFilter === "active" ? supplier.is_active : !supplier.is_active);

      const matchesRating = ratingFilter === "all" ||
        (supplier.rating && parseFloat(supplier.rating) >= parseInt(ratingFilter));

      return matchesSearch && matchesCategory && matchesStatus && matchesRating;
    });

    result.sort((a, b) => {
      let valA: any, valB: any;
      switch (sortField) {
        case "name": valA = a.name; valB = b.name; break;
        case "rating": valA = parseFloat(a.rating || "0"); valB = parseFloat(b.rating || "0"); break;
        case "outstanding": valA = parseFloat(a.outstanding_balance || "0"); valB = parseFloat(b.outstanding_balance || "0"); break;
        case "credit_limit": valA = parseFloat(a.credit_limit || "0"); valB = parseFloat(b.credit_limit || "0"); break;
        default: valA = a.name; valB = b.name;
      }
      if (typeof valA === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [suppliers, searchQuery, categoryFilter, activeFilter, ratingFilter, sortField, sortDir]);

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        po.po_number?.toLowerCase().includes(query) ||
        po.supplier_name?.toLowerCase().includes(query) ||
        po.branch_name?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  const filteredPerformance = useMemo(() => {
    return supplierPerformance.filter((perf: any) => {
      const query = perfSearchQuery.toLowerCase();
      const matchesSearch = !perfSearchQuery ||
        perf.supplier_name?.toLowerCase().includes(query);
      const score = parseFloat(perf.overall_score || "0");
      const matchesScore = perfScoreFilter === "all" ||
        (perfScoreFilter === "excellent" && score >= 80) ||
        (perfScoreFilter === "good" && score >= 60 && score < 80) ||
        (perfScoreFilter === "poor" && score < 60);
      return matchesSearch && matchesScore;
    });
  }, [supplierPerformance, perfSearchQuery, perfScoreFilter]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const getScoreColor = (score: number | string) => {
    const s = typeof score === "string" ? parseFloat(score) : score;
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  const getScoreBg = (score: number | string) => {
    const s = typeof score === "string" ? parseFloat(score) : score;
    if (s >= 80) return "bg-green-500/10";
    if (s >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const creditUtilization = totalCreditLimit > 0 ? (totalOutstanding / totalCreditLimit) * 100 : 0;

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
              <p className="text-muted-foreground">{t('suppliers.subtitle', 'Manage vendors, purchase orders, and supplier performance')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNewSupplier} data-testid="button-new-supplier">
                <Building className="h-4 w-4 mr-2" />
                {t('suppliers.addSupplier', 'Add Supplier')}
              </Button>
              <Button onClick={() => setPoDialogOpen(true)} data-testid="button-new-po">
                <Package className="h-4 w-4 mr-2" />
                {t('suppliers.createPO', 'New Purchase Order')}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('suppliers.metrics.totalSuppliers', 'Total Suppliers')}</p>
                    <p className="text-2xl font-bold" data-testid="text-total-suppliers">{suppliers.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-600 font-medium">{activeSuppliers.length}</span> active
                      {inactiveSuppliers.length > 0 && (
                        <span className="ml-1">/ <span className="text-red-500">{inactiveSuppliers.length}</span> inactive</span>
                      )}
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('suppliers.metrics.pendingOrders', 'Pending Orders')}</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-pending-orders">{pendingOrders.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{purchaseOrders.length} total orders</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('suppliers.metrics.totalPOValue', 'Total PO Value')}</p>
                    <p className="text-2xl font-bold" data-testid="text-total-po-value">{formatCurrency(totalPOValue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{purchaseOrders.filter(p => p.status === 'RECEIVED').length} received</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('suppliers.metrics.outstandingBalance', 'Outstanding')}</p>
                    <p className={cn("text-2xl font-bold", totalOutstanding > 0 ? "text-orange-600" : "text-green-600")} data-testid="text-outstanding">
                      {formatCurrency(totalOutstanding)}
                    </p>
                    <div className="mt-1">
                      <Progress value={Math.min(creditUtilization, 100)} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">{creditUtilization.toFixed(0)}% credit used</p>
                    </div>
                  </div>
                  <CreditCard className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('suppliers.metrics.avgRating', 'Avg Rating')}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-2xl font-bold" data-testid="text-avg-rating">{avgRating.toFixed(1)}</p>
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{supplierPerformance.length} evaluations</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="suppliers" data-testid="tab-suppliers">
                <Building className="h-4 w-4 mr-2" />
                {t('suppliers.tabs.suppliers', 'Suppliers')} ({suppliers.length})
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                <Package className="h-4 w-4 mr-2" />
                {t('suppliers.tabs.orders', 'Purchase Orders')} ({purchaseOrders.length})
              </TabsTrigger>
              <TabsTrigger value="performance" data-testid="tab-performance">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('suppliers.tabs.performance', 'Performance')} ({supplierPerformance.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suppliers" className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('suppliers.searchSuppliers', 'Search by name, contact, phone, GST...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-suppliers"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-44" data-testid="select-category-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('suppliers.filters.category', 'Category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('suppliers.filters.allCategories', 'All Categories')}</SelectItem>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-36" data-testid="select-status-filter">
                    <SelectValue placeholder={t('common.status', 'Status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('suppliers.filters.allStatus', 'All Status')}</SelectItem>
                    <SelectItem value="active">{t('common.active', 'Active')}</SelectItem>
                    <SelectItem value="inactive">{t('common.inactive', 'Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-36" data-testid="select-rating-filter">
                    <Star className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('suppliers.filters.rating', 'Rating')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('suppliers.filters.allRatings', 'All Ratings')}</SelectItem>
                    <SelectItem value="4">{t('suppliers.filters.fourPlus', '4+ Stars')}</SelectItem>
                    <SelectItem value="3">{t('suppliers.filters.threePlus', '3+ Stars')}</SelectItem>
                    <SelectItem value="2">{t('suppliers.filters.twoPlus', '2+ Stars')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {suppliersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {suppliers.length === 0
                        ? t('suppliers.noSuppliers', 'No suppliers yet. Add your first supplier to get started.')
                        : t('suppliers.noSuppliersMatch', 'No suppliers match your current filters.')}
                    </p>
                    {suppliers.length === 0 && (
                      <Button className="mt-4" onClick={handleNewSupplier}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('suppliers.addFirstSupplier', 'Add First Supplier')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button variant="ghost" size="sm" onClick={() => toggleSort("name")} className="h-8 -ml-3 font-medium">
                              {t('suppliers.table.supplier', 'Supplier')}
                              <ArrowUpDown className="h-3 w-3 ml-1" />
                            </Button>
                          </TableHead>
                          <TableHead>{t('suppliers.table.contact', 'Contact')}</TableHead>
                          <TableHead>{t('suppliers.table.location', 'Location')}</TableHead>
                          <TableHead>{t('suppliers.table.categories', 'Categories')}</TableHead>
                          <TableHead>
                            <Button variant="ghost" size="sm" onClick={() => toggleSort("rating")} className="h-8 -ml-3 font-medium">
                              {t('suppliers.table.rating', 'Rating')}
                              <ArrowUpDown className="h-3 w-3 ml-1" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button variant="ghost" size="sm" onClick={() => toggleSort("outstanding")} className="h-8 -ml-3 font-medium">
                              {t('suppliers.table.outstanding', 'Outstanding')}
                              <ArrowUpDown className="h-3 w-3 ml-1" />
                            </Button>
                          </TableHead>
                          <TableHead>{t('suppliers.table.status', 'Status')}</TableHead>
                          <TableHead className="w-[120px]">{t('common.actions', 'Actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSuppliers.map((supplier) => (
                          <TableRow
                            key={supplier.id}
                            className={cn(!supplier.is_active && "opacity-60")}
                            data-testid={`row-supplier-${supplier.id}`}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{supplier.name}</p>
                                <p className="text-xs text-muted-foreground">{supplier.supplier_id}</p>
                                {supplier.gst_number && (
                                  <p className="text-xs text-muted-foreground">GST: {supplier.gst_number}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                {supplier.contact_person && (
                                  <p className="text-sm font-medium">{supplier.contact_person}</p>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{supplier.phone}</span>
                                </div>
                                {supplier.email && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[140px]">{supplier.email}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {(supplier.city || supplier.state) ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span>{[supplier.city, supplier.state].filter(Boolean).join(", ")}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {supplier.categories?.slice(0, 2).map((cat) => (
                                  <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                                ))}
                                {(supplier.categories?.length || 0) > 2 && (
                                  <Badge variant="outline" className="text-xs">+{(supplier.categories?.length || 0) - 2}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium text-sm">{parseFloat(supplier.rating || "0").toFixed(1)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className={cn(
                                  "font-medium text-sm",
                                  parseFloat(supplier.outstanding_balance) > 0 && "text-orange-600"
                                )}>
                                  {formatCurrency(parseFloat(supplier.outstanding_balance || "0"))}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Limit: {formatCurrency(parseFloat(supplier.credit_limit || "0"))}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={supplier.is_active ? "default" : "secondary"} className="text-xs">
                                {supplier.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setViewingSupplier(supplier)}
                                  data-testid={`button-view-supplier-${supplier.id}`}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleEditSupplier(supplier)}
                                  data-testid={`button-edit-supplier-${supplier.id}`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteClick(supplier)}
                                  data-testid={`button-delete-supplier-${supplier.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <div className="px-4 py-3 border-t text-sm text-muted-foreground">
                    Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('suppliers.searchOrders', 'Search by PO #, supplier, branch...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-orders"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-52" data-testid="select-po-status-filter">
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
                    <SelectItem value="CANCELLED">{t('suppliers.status.CANCELLED', 'Cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 md:grid-cols-4 mb-4">
                {[
                  { label: "Draft", status: "DRAFT", color: "text-gray-600" },
                  { label: "Pending Approval", status: "PENDING_APPROVAL", color: "text-yellow-600" },
                  { label: "Ordered", status: "ORDERED", color: "text-indigo-600" },
                  { label: "Received", status: "RECEIVED", color: "text-green-600" },
                ].map((s) => (
                  <Card key={s.status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(s.status)}>
                    <CardContent className="py-3 px-4">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={cn("text-xl font-bold", s.color)}>
                        {purchaseOrders.filter(po => po.status === s.status).length}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {purchaseOrders.length === 0
                        ? t('suppliers.noOrders', 'No purchase orders yet. Create your first PO to get started.')
                        : t('suppliers.noOrdersMatch', 'No orders match your current filters.')}
                    </p>
                    {purchaseOrders.length === 0 && (
                      <Button className="mt-4" onClick={() => setPoDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('suppliers.createFirstPO', 'Create First PO')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('suppliers.table.poNumber', 'PO Number')}</TableHead>
                          <TableHead>{t('suppliers.table.supplier', 'Supplier')}</TableHead>
                          <TableHead>{t('suppliers.table.branch', 'Branch')}</TableHead>
                          <TableHead>{t('suppliers.table.orderDate', 'Order Date')}</TableHead>
                          <TableHead>{t('suppliers.table.expectedDelivery', 'Expected Delivery')}</TableHead>
                          <TableHead>{t('suppliers.table.items', 'Items')}</TableHead>
                          <TableHead className="text-right">{t('suppliers.table.total', 'Total')}</TableHead>
                          <TableHead>{t('common.status', 'Status')}</TableHead>
                          <TableHead className="w-[80px]">{t('common.actions', 'Actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((po) => (
                          <TableRow key={po.id} data-testid={`row-po-${po.id}`}>
                            <TableCell>
                              <Link href={`/purchase-orders/${po.id}`}>
                                <span className="font-medium text-primary underline-offset-4 hover:underline cursor-pointer" data-testid={`link-po-${po.id}`}>
                                  {po.po_number}
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell className="font-medium">{po.supplier_name}</TableCell>
                            <TableCell className="text-sm">{po.branch_name}</TableCell>
                            <TableCell className="text-sm">{po.order_date || '-'}</TableCell>
                            <TableCell>
                              {po.expected_delivery ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span>{po.expected_delivery}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not set</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {po.lines?.length || 0} items
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(parseFloat(po.grand_total || "0"))}</TableCell>
                            <TableCell>
                              <Badge className={cn("text-xs whitespace-nowrap", PO_STATUS_COLORS[po.status])}>
                                {t(`suppliers.status.${po.status}`, po.status.replace(/_/g, " "))}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Link href={`/purchase-orders/${po.id}`}>
                                <Button size="sm" variant="ghost" className="h-7" data-testid={`button-view-po-${po.id}`}>
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  {t('common.view', 'View')}
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {filteredOrders.length} of {purchaseOrders.length} orders</span>
                    <span>Total Value: <strong className="text-foreground">{formatCurrency(filteredOrders.reduce((s, po) => s + parseFloat(po.grand_total || "0"), 0))}</strong></span>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('suppliers.searchPerformance', 'Search by supplier name...')}
                    value={perfSearchQuery}
                    onChange={(e) => setPerfSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-performance"
                  />
                </div>
                <Select value={perfScoreFilter} onValueChange={setPerfScoreFilter}>
                  <SelectTrigger className="w-44" data-testid="select-score-filter">
                    <Award className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Score Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                    <SelectItem value="good">Good (60-79%)</SelectItem>
                    <SelectItem value="poor">Needs Improvement (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                const avgOnTime = supplierPerformance.length > 0
                  ? supplierPerformance.reduce((s: number, p: any) => s + parseFloat(p.on_time_rate || "0"), 0) / supplierPerformance.length
                  : 0;
                const avgQuality = supplierPerformance.length > 0
                  ? supplierPerformance.reduce((s: number, p: any) => s + parseFloat(p.quality_rate || "0"), 0) / supplierPerformance.length
                  : 0;
                const avgOverall = supplierPerformance.length > 0
                  ? supplierPerformance.reduce((s: number, p: any) => s + parseFloat(p.overall_score || "0"), 0) / supplierPerformance.length
                  : 0;
                const totalRejected = supplierPerformance.reduce((s: number, p: any) => s + (parseInt(p.items_rejected) || 0), 0);
                return (
                  <div className="grid gap-3 md:grid-cols-4">
                    <Card>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Overall Score</p>
                            <p className={cn("text-xl font-bold", getScoreColor(avgOverall))}>{avgOverall.toFixed(1)}%</p>
                          </div>
                          <Award className="h-6 w-6 text-muted-foreground opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Avg On-Time Rate</p>
                            <p className={cn("text-xl font-bold", getScoreColor(avgOnTime))}>{avgOnTime.toFixed(1)}%</p>
                          </div>
                          <Clock className="h-6 w-6 text-muted-foreground opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Quality Rate</p>
                            <p className={cn("text-xl font-bold", getScoreColor(avgQuality))}>{avgQuality.toFixed(1)}%</p>
                          </div>
                          <ShieldCheck className="h-6 w-6 text-muted-foreground opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Total Rejected Items</p>
                            <p className="text-xl font-bold text-red-600">{totalRejected}</p>
                          </div>
                          <XCircle className="h-6 w-6 text-red-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {performanceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredPerformance.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {supplierPerformance.length === 0
                        ? t('suppliers.noPerformanceData', 'No supplier performance data available yet. Performance metrics are calculated from completed purchase orders.')
                        : t('suppliers.noPerformanceMatch', 'No performance records match your current filters.')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('suppliers.table.supplier', 'Supplier')}</TableHead>
                          <TableHead>{t('suppliers.performance.period', 'Period')}</TableHead>
                          <TableHead className="text-center">{t('suppliers.performance.overallScore', 'Overall Score')}</TableHead>
                          <TableHead className="text-center">{t('suppliers.performance.onTimeRate', 'On-Time Rate')}</TableHead>
                          <TableHead className="text-center">{t('suppliers.performance.qualityRate', 'Quality Rate')}</TableHead>
                          <TableHead className="text-center">{t('suppliers.performance.priceVariance', 'Price Variance')}</TableHead>
                          <TableHead className="text-center">{t('suppliers.performance.orders', 'Orders')}</TableHead>
                          <TableHead className="text-center">{t('suppliers.performance.rejected', 'Rejected')}</TableHead>
                          <TableHead className="text-right">{t('suppliers.performance.value', 'Value')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPerformance.map((perf: any) => (
                          <TableRow key={perf.id} data-testid={`row-performance-${perf.id}`}>
                            <TableCell className="font-medium">{perf.supplier_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {perf.period_start} to {perf.period_end}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn("font-bold", getScoreBg(perf.overall_score), getScoreColor(perf.overall_score))}>
                                {perf.overall_score}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn("font-medium", getScoreColor(perf.on_time_rate))}>
                                {perf.on_time_rate}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn("font-medium", getScoreColor(perf.quality_rate))}>
                                {perf.quality_rate}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn("font-medium", parseFloat(perf.price_variance) > 0 ? "text-red-600" : "text-green-600")}>
                                {parseFloat(perf.price_variance) > 0 ? "+" : ""}{perf.price_variance}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div>
                                <span className="font-medium">{perf.total_orders}</span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({perf.orders_on_time} on time)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn("font-medium", perf.items_rejected > 0 && "text-red-600")}>
                                {perf.items_rejected}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(parseFloat(perf.total_value || "0"))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <div className="px-4 py-3 border-t text-sm text-muted-foreground">
                    Showing {filteredPerformance.length} of {supplierPerformance.length} records
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={viewingSupplier !== null} onOpenChange={(open) => !open && setViewingSupplier(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingSupplier?.name}</DialogTitle>
            <DialogDescription>{viewingSupplier?.supplier_id}</DialogDescription>
          </DialogHeader>
          {viewingSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{viewingSupplier.contact_person || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={viewingSupplier.is_active ? "default" : "secondary"}>
                    {viewingSupplier.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium">{viewingSupplier.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium text-sm">{viewingSupplier.email || '-'}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm">{[viewingSupplier.address, viewingSupplier.city, viewingSupplier.state].filter(Boolean).join(", ") || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">GST Number</p>
                  <p className="font-medium text-sm">{viewingSupplier.gst_number || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PAN Number</p>
                  <p className="font-medium text-sm">{viewingSupplier.pan_number || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Payment Terms</p>
                  <p className="font-medium text-sm">{viewingSupplier.payment_terms}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Credit Limit</p>
                  <p className="font-medium text-sm">{formatCurrency(parseFloat(viewingSupplier.credit_limit || "0"))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className={cn("font-medium text-sm", parseFloat(viewingSupplier.outstanding_balance) > 0 && "text-orange-600")}>
                    {formatCurrency(parseFloat(viewingSupplier.outstanding_balance || "0"))}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{parseFloat(viewingSupplier.rating || "0").toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {viewingSupplier.categories?.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                    )) || <span className="text-sm text-muted-foreground">-</span>}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{viewingSupplier.created_at ? new Date(viewingSupplier.created_at).toLocaleDateString() : '-'}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setViewingSupplier(null); handleEditSupplier(viewingSupplier); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Supplier
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={supplierDialogOpen} onOpenChange={(open) => { setSupplierDialogOpen(open); if (!open) { setEditingSupplier(null); setSupplierForm(emptySupplierForm); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? t('suppliers.dialog.editSupplier', 'Edit Supplier') : t('suppliers.dialog.addSupplier', 'Add New Supplier')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('suppliers.form.companyName', 'Company Name')} *</Label>
                <Input
                  id="name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder={t('suppliers.form.companyNamePlaceholder', 'Company name')}
                  required
                  data-testid="input-supplier-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">{t('suppliers.form.contactPerson', 'Contact Person')}</Label>
                <Input
                  id="contact_person"
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                  placeholder={t('suppliers.form.contactNamePlaceholder', 'Contact name')}
                  data-testid="input-contact-person"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('suppliers.form.phone', 'Phone')} *</Label>
                <Input
                  id="phone"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder={t('suppliers.form.phonePlaceholder', '+91 XXXXX XXXXX')}
                  required
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('suppliers.form.email', 'Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder={t('suppliers.form.emailPlaceholder', 'vendor@example.com')}
                  data-testid="input-email"
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
                data-testid="textarea-address"
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
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t('suppliers.form.state', 'State')}</Label>
                <Input
                  id="state"
                  value={supplierForm.state}
                  onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
                  placeholder={t('suppliers.form.statePlaceholder', 'State')}
                  data-testid="input-state"
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
                  placeholder={t('suppliers.form.gstPlaceholder', '29ABCDE1234F1Z5')}
                  data-testid="input-gst"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">{t('suppliers.form.panNumber', 'PAN Number')}</Label>
                <Input
                  id="pan_number"
                  value={supplierForm.pan_number}
                  onChange={(e) => setSupplierForm({ ...supplierForm, pan_number: e.target.value })}
                  placeholder={t('suppliers.form.panPlaceholder', 'ABCDE1234F')}
                  data-testid="input-pan"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">{t('suppliers.form.paymentTerms', 'Payment Terms')}</Label>
                <Select value={supplierForm.payment_terms} onValueChange={(v) => setSupplierForm({ ...supplierForm, payment_terms: v })}>
                  <SelectTrigger data-testid="select-payment-terms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
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
                  placeholder="0"
                  data-testid="input-credit-limit"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories">{t('suppliers.form.categories', 'Categories (comma separated)')}</Label>
              <Input
                id="categories"
                value={supplierForm.categories}
                onChange={(e) => setSupplierForm({ ...supplierForm, categories: e.target.value })}
                placeholder={t('suppliers.form.categoriesPlaceholder', 'Brakes, Filters, Engine Parts')}
                data-testid="input-categories"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setSupplierDialogOpen(false); setEditingSupplier(null); setSupplierForm(emptySupplierForm); }} data-testid="button-cancel-supplier">
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending} data-testid="button-submit-supplier">
                {(createSupplier.isPending || updateSupplier.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving', 'Saving...')}
                  </>
                ) : (
                  editingSupplier ? t('common.update', 'Update') : t('common.create', 'Create')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('suppliers.dialog.deleteTitle', 'Delete Supplier')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('suppliers.dialog.deleteDescription', 'Are you sure you want to delete')} <strong>{supplierToDelete?.name}</strong>?
              {t('suppliers.dialog.deleteWarning', ' This action cannot be undone and will remove all associated data.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => supplierToDelete && deleteSupplier.mutate(supplierToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteSupplier.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('suppliers.dialog.createPO', 'Create Purchase Order')}</DialogTitle>
            <DialogDescription>Create a new purchase order for parts procurement</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePOSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="po_supplier">{t('suppliers.form.supplier', 'Supplier')} *</Label>
                <Select value={poForm.supplier} onValueChange={(v) => setPoForm({ ...poForm, supplier: v })}>
                  <SelectTrigger data-testid="select-po-supplier">
                    <SelectValue placeholder={t('suppliers.form.selectSupplier', 'Select supplier')} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter((s) => s.is_active).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('suppliers.form.lineItems', 'Line Items')}</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLineItem} data-testid="button-add-line">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('suppliers.form.addItem', 'Add Item')}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_80px_100px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Part</span>
                  <span>Qty</span>
                  <span>Unit Price</span>
                  <span></span>
                </div>
                {poLineItems.map((line, index) => (
                  <div key={index} className="grid grid-cols-[1fr_80px_100px_36px] gap-2 items-center" data-testid={`po-line-${index}`}>
                    <Select value={line.part} onValueChange={(v) => {
                      updateLineItem(index, "part", v);
                      const selectedPart = parts.find((p: any) => String(p.id) === v);
                      if (selectedPart && selectedPart.cost_price && !line.unit_price) {
                        updateLineItem(index, "unit_price", String(selectedPart.cost_price));
                      }
                    }}>
                      <SelectTrigger data-testid={`select-part-${index}`}>
                        <SelectValue placeholder="Select part" />
                      </SelectTrigger>
                      <SelectContent>
                        {parts.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity_ordered}
                      onChange={(e) => updateLineItem(index, "quantity_ordered", e.target.value)}
                      data-testid={`input-qty-${index}`}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={line.unit_price}
                      onChange={(e) => updateLineItem(index, "unit_price", e.target.value)}
                      data-testid={`input-price-${index}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => removeLineItem(index)}
                      disabled={poLineItems.length === 1}
                      data-testid={`button-remove-line-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('suppliers.estimatedSubtotal', 'Estimated Subtotal')}</p>
                  <p className="text-lg font-semibold" data-testid="text-subtotal">
                    {formatCurrency(calculateSubtotal())}
                  </p>
                  <p className="text-xs text-muted-foreground">+ 18% GST = {formatCurrency(calculateSubtotal() * 1.18)}</p>
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
