import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const [activeTab, setActiveTab] = useState<"suppliers" | "orders">("suppliers");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    <div className="flex h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Suppliers & Procurement</h1>
              <p className="text-muted-foreground">Manage vendors and purchase orders</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-new-supplier">
                <Building className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
              <Button data-testid="button-new-po">
                <Package className="h-4 w-4 mr-2" />
                New Purchase Order
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Suppliers</p>
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
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
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
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${totalOutstanding.toLocaleString()}
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
                    <p className="text-sm text-muted-foreground">Total Orders</p>
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
              Suppliers
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              onClick={() => setActiveTab("orders")}
              data-testid="tab-orders"
            >
              <Package className="h-4 w-4 mr-2" />
              Purchase Orders
            </Button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "suppliers" ? "Search suppliers..." : "Search orders..."}
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
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ORDERED">Ordered</SelectItem>
                  <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
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
                  <p className="text-muted-foreground">No suppliers found</p>
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
                          <span className="text-sm font-medium">{supplier.rating || "N/A"}</span>
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
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className={cn(
                          "font-medium",
                          parseFloat(supplier.outstanding_balance) > 0 && "text-orange-600"
                        )}>
                          ${parseFloat(supplier.outstanding_balance || "0").toLocaleString()}
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
                  <p className="text-muted-foreground">No purchase orders found</p>
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
                            <p className="font-medium">{po.po_number}</p>
                            <p className="text-sm text-muted-foreground">{po.supplier_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-medium">${parseFloat(po.grand_total).toLocaleString()}</p>
                          </div>
                          {po.expected_delivery && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Expected</p>
                              <p className="text-sm">{po.expected_delivery}</p>
                            </div>
                          )}
                          <Badge className={cn("text-xs", PO_STATUS_COLORS[po.status])}>
                            {po.status.replace(/_/g, " ")}
                          </Badge>
                          <Button size="sm" variant="outline" data-testid={`button-view-po-${po.id}`}>
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
