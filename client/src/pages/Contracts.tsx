import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useSidebar } from "@/lib/sidebar-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getCsrfToken } from "@/lib/queryClient";
import { useLocalization } from "@/lib/currency-context";
import { format, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Shield, Calendar, AlertTriangle, CheckCircle, Car, User, Search,
  Plus, FileText, Loader2, Eye, ArrowUpDown, ChevronRight,
  Clock, Wrench, TrendingUp, Building2, RefreshCw, XCircle,
  CheckCircle2, Pause, Play, Ban, Send, BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface Vehicle {
  id: number;
  customer: number;
  plate_number: string;
  make: string;
  model: string;
}

interface CoverageRule {
  id: number;
  service_type: string;
  is_covered: boolean;
  coverage_percent: string;
  max_amount: string | null;
  visit_limit: number | null;
  visits_used: number;
  notes: string;
}

interface ContractVehicleItem {
  id: number;
  vehicle: number;
  vehicle_info: string;
  registration_number: string;
  added_at: string;
  is_active: boolean;
}

interface Contract {
  id: number;
  contract_number: string;
  vehicle: number | null;
  vehicle_info: string | null;
  customer: number;
  customer_name: string;
  branch: number | null;
  branch_name: string | null;
  contract_type: string;
  status: string;
  provider: string;
  policy_number: string;
  start_date: string;
  end_date: string;
  coverage_period_months: number;
  contract_value: string;
  billing_model: string;
  tax_rate: string;
  discount_percent: string;
  deductible: string;
  services_included: string[];
  services_used: number;
  max_services: number | null;
  services_remaining: number | null;
  km_remaining: number | null;
  km_used: number;
  coverage_km_limit: number | null;
  labor_coverage_percent: string;
  consumables_included: boolean;
  utilization_percent: number;
  is_active: boolean;
  is_expired: boolean;
  days_remaining: number;
  priority_handling: boolean;
  auto_renewal: boolean;
  response_time_hours: number;
  resolution_time_hours: number;
  suspension_reason: string;
  termination_reason: string;
  terms_conditions: string;
  coverage_rules: CoverageRule[];
  contract_vehicles: ContractVehicleItem[];
  created_by_name: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLogEntry {
  id: number;
  action: string;
  actor_name: string | null;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  job_card_number: string | null;
  notes: string;
  created_at: string;
}

interface DashboardStats {
  total_active: number;
  expiring_soon: number;
  total_contract_value: number;
  pending_approvals: number;
  average_utilization: number;
  by_type: { contract_type: string; count: number; value: number }[];
}

const CONTRACT_TYPE_COLORS: Record<string, string> = {
  WARRANTY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  EXTENDED_WARRANTY: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  AMC: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  SERVICE_PACKAGE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  INSURANCE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  FLEET: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  SUBSCRIPTION: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  CORPORATE: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  OEM_DEALER: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  WARRANTY: "Warranty",
  EXTENDED_WARRANTY: "Extended Warranty",
  AMC: "AMC",
  SERVICE_PACKAGE: "Service Package",
  INSURANCE: "Insurance",
  FLEET: "Fleet Contract",
  SUBSCRIPTION: "Subscription",
  CORPORATE: "Corporate",
  OEM_DEALER: "OEM/Dealer",
  CUSTOM: "Custom",
};

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  SUSPENDED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  TERMINATED: "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  EXPIRED: "Expired",
  TERMINATED: "Terminated",
};

const BILLING_LABELS: Record<string, string> = {
  ONE_TIME: "One Time",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

const AUDIT_ACTION_COLORS: Record<string, string> = {
  CREATED: "text-blue-600",
  UPDATED: "text-gray-600",
  ACTIVATED: "text-green-600",
  SUSPENDED: "text-orange-600",
  RESUMED: "text-emerald-600",
  TERMINATED: "text-red-600",
  RENEWED: "text-indigo-600",
  SERVICE_CONSUMED: "text-purple-600",
};

export default function Contracts() {
  const { isCollapsed } = useSidebar();
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showExpiring, setShowExpiring] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [detailContract, setDetailContract] = useState<Contract | null>(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [actionDialog, setActionDialog] = useState<{ type: string; contract: Contract } | null>(null);
  const [actionReason, setActionReason] = useState("");

  const [formData, setFormData] = useState({
    customer: "",
    vehicle: "",
    contract_type: "WARRANTY",
    provider: "",
    policy_number: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(addYears(new Date(), 1), "yyyy-MM-dd"),
    contract_value: "",
    billing_model: "ONE_TIME",
    max_services: "",
    labor_coverage_percent: "100",
    coverage_km_limit: "",
    response_time_hours: "24",
    consumables_included: false,
    priority_handling: false,
    auto_renewal: false,
    notes: "",
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers/", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: isDialogOpen,
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["vehicles", selectedCustomerId],
    queryFn: async () => {
      const url = selectedCustomerId
        ? `/api/vehicles/?customer_id=${selectedCustomerId}`
        : "/api/vehicles/";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: isDialogOpen && !!selectedCustomerId,
  });

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts/", typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("contract_type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const url = `/api/contracts/${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return res.json();
    },
  });

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ["/api/contracts/", "dashboard_stats"],
    queryFn: async () => {
      const res = await fetch("/api/contracts/dashboard_stats/", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: expiringContracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts/", "expiring_soon"],
    queryFn: async () => {
      const res = await fetch("/api/contracts/expiring_soon/?days=30", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: auditLogs = [] } = useQuery<AuditLogEntry[]>({
    queryKey: ["/api/contracts/", detailContract?.id, "audit_log"],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${detailContract!.id}/audit_log/`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!detailContract,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const csrfToken = getCsrfToken();
      const res = await fetch("/api/contracts/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify({
          customer: parseInt(data.customer),
          vehicle: data.vehicle ? parseInt(data.vehicle) : null,
          contract_type: data.contract_type,
          provider: data.provider,
          policy_number: data.policy_number,
          start_date: data.start_date,
          end_date: data.end_date,
          contract_value: data.contract_value || "0",
          billing_model: data.billing_model,
          max_services: data.max_services ? parseInt(data.max_services) : null,
          labor_coverage_percent: data.labor_coverage_percent || "100",
          coverage_km_limit: data.coverage_km_limit ? parseInt(data.coverage_km_limit) : null,
          response_time_hours: parseInt(data.response_time_hours) || 24,
          consumables_included: data.consumables_included,
          priority_handling: data.priority_handling,
          auto_renewal: data.auto_renewal,
          terms_conditions: data.notes,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to create contract");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Contract created successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to create contract", description: error.message, variant: "destructive" });
    },
  });

  const workflowMutation = useMutation({
    mutationFn: async ({ id, action, data }: { id: number; action: string; data?: any }) => {
      const csrfToken = getCsrfToken();
      const res = await fetch(`/api/contracts/${id}/${action}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(data || {}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Action failed" }));
        throw new Error(err.error || "Action failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/"] });
      setDetailContract(data);
      setActionDialog(null);
      setActionReason("");
      toast({ title: "Contract updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customer: "", vehicle: "", contract_type: "WARRANTY", provider: "", policy_number: "",
      start_date: format(new Date(), "yyyy-MM-dd"), end_date: format(addYears(new Date(), 1), "yyyy-MM-dd"),
      contract_value: "", billing_model: "ONE_TIME", max_services: "", labor_coverage_percent: "100",
      coverage_km_limit: "", response_time_hours: "24", consumables_included: false,
      priority_handling: false, auto_renewal: false, notes: "",
    });
    setSelectedCustomerId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredContracts = useMemo(() => {
    const list = showExpiring ? expiringContracts : contracts;
    let result = list.filter((contract) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        contract.customer_name?.toLowerCase().includes(q) ||
        contract.vehicle_info?.toLowerCase().includes(q) ||
        contract.contract_number?.toLowerCase().includes(q) ||
        contract.policy_number?.toLowerCase().includes(q) ||
        contract.provider?.toLowerCase().includes(q)
      );
    });
    result.sort((a, b) => {
      let valA: any, valB: any;
      switch (sortField) {
        case "contract_number": valA = a.contract_number; valB = b.contract_number; break;
        case "customer_name": valA = a.customer_name; valB = b.customer_name; break;
        case "contract_type": valA = a.contract_type; valB = b.contract_type; break;
        case "status": valA = a.status; valB = b.status; break;
        case "contract_value": valA = parseFloat(a.contract_value); valB = parseFloat(b.contract_value); break;
        case "days_remaining": valA = a.days_remaining; valB = b.days_remaining; break;
        case "utilization_percent": valA = a.utilization_percent; valB = b.utilization_percent; break;
        default: valA = a.created_at; valB = b.created_at;
      }
      if (typeof valA === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
    return result;
  }, [contracts, expiringContracts, showExpiring, searchQuery, sortField, sortDir]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contracts.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [contracts]);

  const getWorkflowActions = (contract: Contract) => {
    const actions: { label: string; action: string; icon: any; variant: any; needsReason?: boolean }[] = [];
    switch (contract.status) {
      case "DRAFT":
        actions.push({ label: "Submit for Approval", action: "submit_for_approval", icon: Send, variant: "default" });
        break;
      case "PENDING_APPROVAL":
        actions.push({ label: "Approve", action: "approve", icon: CheckCircle2, variant: "default" });
        actions.push({ label: "Reject", action: "reject", icon: XCircle, variant: "destructive", needsReason: true });
        break;
      case "ACTIVE":
        actions.push({ label: "Suspend", action: "suspend", icon: Pause, variant: "outline", needsReason: true });
        actions.push({ label: "Terminate", action: "terminate", icon: Ban, variant: "destructive", needsReason: true });
        break;
      case "SUSPENDED":
        actions.push({ label: "Resume", action: "resume", icon: Play, variant: "default" });
        actions.push({ label: "Terminate", action: "terminate", icon: Ban, variant: "destructive", needsReason: true });
        break;
    }
    return actions;
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === field ? "text-primary" : "text-muted-foreground/50")} />
      </div>
    </TableHead>
  );

  const workflowSteps = ["DRAFT", "PENDING_APPROVAL", "ACTIVE"];
  const getStepIndex = (status: string) => {
    if (status === "EXPIRED" || status === "TERMINATED") return 3;
    if (status === "SUSPENDED") return 2;
    return workflowSteps.indexOf(status);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className={cn("flex-1 overflow-auto transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Contracts & Warranties</h1>
              <p className="text-muted-foreground">Manage warranties, AMC, service contracts & coverage</p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-contract">
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("ACTIVE"); setShowExpiring(false); }}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Active</p>
                    <p className="text-2xl font-bold" data-testid="text-total-active">{dashboardStats?.total_active ?? 0}</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Value</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-total-value">
                      {formatCurrency(dashboardStats?.total_contract_value ?? 0)}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Utilization</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardStats?.average_utilization ?? 0}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", (dashboardStats?.pending_approvals ?? 0) > 0 && "border-yellow-500")}
                  onClick={() => { setStatusFilter("PENDING_APPROVAL"); setShowExpiring(false); }}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold text-yellow-600">{dashboardStats?.pending_approvals ?? 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", (dashboardStats?.expiring_soon ?? 0) > 0 && "border-orange-500")}
                  onClick={() => { setShowExpiring(true); setStatusFilter("all"); }}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-expiring-count">
                      {dashboardStats?.expiring_soon ?? 0}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: "all", label: "All", count: contracts.length },
                { key: "ACTIVE", label: "Active", count: statusCounts["ACTIVE"] || 0 },
                { key: "DRAFT", label: "Draft", count: statusCounts["DRAFT"] || 0 },
                { key: "PENDING_APPROVAL", label: "Pending", count: statusCounts["PENDING_APPROVAL"] || 0 },
                { key: "SUSPENDED", label: "Suspended", count: statusCounts["SUSPENDED"] || 0 },
                { key: "EXPIRED", label: "Expired", count: statusCounts["EXPIRED"] || 0 },
              ].map(({ key, label, count }) => (
                <Button
                  key={key}
                  variant={statusFilter === key && !showExpiring ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter(key); setShowExpiring(false); }}
                  data-testid={`button-status-${key.toLowerCase()}`}
                >
                  {label} {count > 0 && <Badge variant="secondary" className="ml-1 text-xs h-5">{count}</Badge>}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by contract #, customer, vehicle, provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48" data-testid="select-type-filter">
                <SelectValue placeholder="Contract Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(CONTRACT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showExpiring ? "default" : "outline"}
              onClick={() => setShowExpiring(!showExpiring)}
              data-testid="button-show-expiring"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Expiring Soon
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No contracts found</p>
                <p className="text-sm text-muted-foreground mt-1">Create a new contract to get started</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortHeader field="contract_number">Contract #</SortHeader>
                      <SortHeader field="customer_name">Customer</SortHeader>
                      <TableHead>Vehicle</TableHead>
                      <SortHeader field="contract_type">Type</SortHeader>
                      <SortHeader field="status">Status</SortHeader>
                      <TableHead>Validity</TableHead>
                      <SortHeader field="days_remaining">Days Left</SortHeader>
                      <SortHeader field="contract_value">Value</SortHeader>
                      <SortHeader field="utilization_percent">Utilization</SortHeader>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow
                        key={contract.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          contract.is_expired && "opacity-60",
                          contract.days_remaining <= 30 && contract.days_remaining > 0 && !contract.is_expired && "bg-orange-50/50 dark:bg-orange-950/10"
                        )}
                        onClick={() => { setDetailContract(contract); setDetailTab("overview"); }}
                        data-testid={`row-contract-${contract.id}`}
                      >
                        <TableCell>
                          <div>
                            <span className="font-medium text-primary">{contract.contract_number}</span>
                            {contract.policy_number && (
                              <p className="text-xs text-muted-foreground">{contract.policy_number}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{contract.customer_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-[180px]">
                            <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate text-sm">{contract.vehicle_info || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", CONTRACT_TYPE_COLORS[contract.contract_type])}>
                            {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", CONTRACT_STATUS_COLORS[contract.status])}>
                            {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(contract.start_date), "dd MMM yy")} – {format(new Date(contract.end_date), "dd MMM yy")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            contract.is_expired ? "text-red-600" :
                            contract.days_remaining <= 30 ? "text-orange-600" : "text-green-600"
                          )}>
                            {contract.is_expired ? "Expired" : `${contract.days_remaining}d`}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(parseFloat(contract.contract_value))}
                        </TableCell>
                        <TableCell>
                          {contract.max_services ? (
                            <div className="flex items-center gap-2">
                              <Progress value={contract.utilization_percent} className="h-2 w-16" />
                              <span className="text-xs text-muted-foreground">{Math.round(contract.utilization_percent)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setDetailContract(contract); setDetailTab("overview"); }}
                            data-testid={`button-view-contract-${contract.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredContracts.length} of {contracts.length} contracts
                </p>
              </div>
            </Card>
          )}

          {dashboardStats?.by_type && dashboardStats.by_type.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Active Contracts by Type</h3>
              <div className="grid gap-3 md:grid-cols-4">
                {dashboardStats.by_type.map((item) => (
                  <Card key={item.contract_type} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => { setTypeFilter(item.contract_type); setStatusFilter("ACTIVE"); setShowExpiring(false); }}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {CONTRACT_TYPE_LABELS[item.contract_type] || item.contract_type}
                          </p>
                          <p className="text-lg font-bold">{item.count}</p>
                          <p className="text-xs text-green-600">{formatCurrency(item.value)}</p>
                        </div>
                        <Badge className={cn("text-xs", CONTRACT_TYPE_COLORS[item.contract_type])}>
                          {CONTRACT_TYPE_LABELS[item.contract_type]?.substring(0, 3) || "?"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!detailContract} onOpenChange={(open) => { if (!open) setDetailContract(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailContract && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl" data-testid="text-detail-contract-number">{detailContract.contract_number}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {detailContract.customer_name} · {CONTRACT_TYPE_LABELS[detailContract.contract_type]}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-sm", CONTRACT_STATUS_COLORS[detailContract.status])} data-testid="badge-detail-status">
                      {CONTRACT_STATUS_LABELS[detailContract.status]}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  {workflowSteps.map((step, idx) => {
                    const currentIdx = getStepIndex(detailContract.status);
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isFinalBad = (detailContract.status === "EXPIRED" || detailContract.status === "TERMINATED") && idx === 2;
                    return (
                      <div key={step} className="flex items-center gap-1 flex-1">
                        <div className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border-2 flex-shrink-0",
                          isCompleted ? "bg-green-500 border-green-500 text-white" :
                          isCurrent && !isFinalBad ? "bg-primary border-primary text-primary-foreground" :
                          isFinalBad ? "bg-red-500 border-red-500 text-white" :
                          "bg-muted border-muted-foreground/30 text-muted-foreground"
                        )}>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                        <span className={cn("text-xs", (isCompleted || isCurrent) ? "font-medium" : "text-muted-foreground")}>
                          {CONTRACT_STATUS_LABELS[step]}
                        </span>
                        {idx < workflowSteps.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
                        )}
                      </div>
                    );
                  })}
                  {(detailContract.status === "EXPIRED" || detailContract.status === "TERMINATED" || detailContract.status === "SUSPENDED") && (
                    <div className="flex items-center gap-1">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      <Badge className={cn("text-xs", CONTRACT_STATUS_COLORS[detailContract.status])}>
                        {CONTRACT_STATUS_LABELS[detailContract.status]}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {getWorkflowActions(detailContract).map((wa) => (
                    <Button
                      key={wa.action}
                      variant={wa.variant as any}
                      size="sm"
                      onClick={() => {
                        if (wa.needsReason) {
                          setActionDialog({ type: wa.action, contract: detailContract });
                        } else {
                          workflowMutation.mutate({ id: detailContract.id, action: wa.action });
                        }
                      }}
                      disabled={workflowMutation.isPending}
                      data-testid={`button-action-${wa.action}`}
                    >
                      <wa.icon className="h-4 w-4 mr-1" />
                      {wa.label}
                    </Button>
                  ))}
                </div>
              </DialogHeader>

              <Tabs value={detailTab} onValueChange={setDetailTab} className="mt-2">
                <TabsList>
                  <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                  <TabsTrigger value="coverage" data-testid="tab-coverage">
                    Coverage Rules ({detailContract.coverage_rules?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="vehicles" data-testid="tab-vehicles">
                    Vehicles ({(detailContract.contract_vehicles?.length || 0) + (detailContract.vehicle ? 1 : 0)})
                  </TabsTrigger>
                  <TabsTrigger value="audit" data-testid="tab-audit">Audit Log</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid gap-4 md:grid-cols-2 mt-2">
                    <Card>
                      <CardContent className="pt-4 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Contract Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Customer</span>
                          <span className="font-medium">{detailContract.customer_name}</span>
                          <span className="text-muted-foreground">Vehicle</span>
                          <span className="font-medium">{detailContract.vehicle_info || "—"}</span>
                          <span className="text-muted-foreground">Branch</span>
                          <span className="font-medium">{detailContract.branch_name || "—"}</span>
                          <span className="text-muted-foreground">Provider</span>
                          <span className="font-medium">{detailContract.provider || "—"}</span>
                          <span className="text-muted-foreground">Policy #</span>
                          <span className="font-medium">{detailContract.policy_number || "—"}</span>
                          <span className="text-muted-foreground">Billing</span>
                          <span className="font-medium">{BILLING_LABELS[detailContract.billing_model] || detailContract.billing_model}</span>
                          <span className="text-muted-foreground">Created By</span>
                          <span className="font-medium">{detailContract.created_by_name || "—"}</span>
                          {detailContract.approved_by_name && (
                            <>
                              <span className="text-muted-foreground">Approved By</span>
                              <span className="font-medium">{detailContract.approved_by_name}</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Validity & Usage</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Start Date</span>
                          <span className="font-medium">{format(new Date(detailContract.start_date), "dd MMM yyyy")}</span>
                          <span className="text-muted-foreground">End Date</span>
                          <span className="font-medium">{format(new Date(detailContract.end_date), "dd MMM yyyy")}</span>
                          <span className="text-muted-foreground">Days Remaining</span>
                          <span className={cn("font-bold",
                            detailContract.is_expired ? "text-red-600" :
                            detailContract.days_remaining <= 30 ? "text-orange-600" : "text-green-600"
                          )}>
                            {detailContract.is_expired ? "Expired" : `${detailContract.days_remaining} days`}
                          </span>
                          {detailContract.max_services && (
                            <>
                              <span className="text-muted-foreground">Services</span>
                              <span className="font-medium">{detailContract.services_used} / {detailContract.max_services}</span>
                            </>
                          )}
                          {detailContract.coverage_km_limit && (
                            <>
                              <span className="text-muted-foreground">KM Used</span>
                              <span className="font-medium">{detailContract.km_used?.toLocaleString()} / {detailContract.coverage_km_limit?.toLocaleString()}</span>
                            </>
                          )}
                          <span className="text-muted-foreground">Utilization</span>
                          <div className="flex items-center gap-2">
                            <Progress value={detailContract.utilization_percent} className="h-2 w-20" />
                            <span className="font-medium">{Math.round(detailContract.utilization_percent)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Financial Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Contract Value</span>
                          <span className="font-bold text-green-600">{formatCurrency(parseFloat(detailContract.contract_value))}</span>
                          <span className="text-muted-foreground">Tax Rate</span>
                          <span className="font-medium">{detailContract.tax_rate}%</span>
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium">{detailContract.discount_percent}%</span>
                          <span className="text-muted-foreground">Deductible</span>
                          <span className="font-medium">{formatCurrency(parseFloat(detailContract.deductible || "0"))}</span>
                          <span className="text-muted-foreground">Labor Coverage</span>
                          <span className="font-medium">{detailContract.labor_coverage_percent}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Wrench className="h-4 w-4" /> Service Configuration</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Response Time</span>
                          <span className="font-medium">{detailContract.response_time_hours}h</span>
                          <span className="text-muted-foreground">Resolution Time</span>
                          <span className="font-medium">{detailContract.resolution_time_hours}h</span>
                          <span className="text-muted-foreground">Consumables</span>
                          <Badge variant={detailContract.consumables_included ? "default" : "outline"} className="text-xs w-fit">
                            {detailContract.consumables_included ? "Included" : "Not Included"}
                          </Badge>
                          <span className="text-muted-foreground">Priority</span>
                          <Badge variant={detailContract.priority_handling ? "default" : "outline"} className="text-xs w-fit">
                            {detailContract.priority_handling ? "Yes" : "No"}
                          </Badge>
                          <span className="text-muted-foreground">Auto Renewal</span>
                          <Badge variant={detailContract.auto_renewal ? "default" : "outline"} className="text-xs w-fit">
                            {detailContract.auto_renewal ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        {detailContract.services_included?.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Services Included</p>
                            <div className="flex flex-wrap gap-1">
                              {detailContract.services_included.map((s) => (
                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {(detailContract.suspension_reason || detailContract.termination_reason) && (
                    <Card className="mt-4 border-orange-300">
                      <CardContent className="pt-4">
                        {detailContract.suspension_reason && (
                          <div>
                            <p className="text-sm font-semibold text-orange-600 flex items-center gap-1">
                              <Pause className="h-4 w-4" /> Suspension Reason
                            </p>
                            <p className="text-sm mt-1">{detailContract.suspension_reason}</p>
                          </div>
                        )}
                        {detailContract.termination_reason && (
                          <div className="mt-2">
                            <p className="text-sm font-semibold text-red-600 flex items-center gap-1">
                              <Ban className="h-4 w-4" /> Termination Reason
                            </p>
                            <p className="text-sm mt-1">{detailContract.termination_reason}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {detailContract.terms_conditions && (
                    <Card className="mt-4">
                      <CardContent className="pt-4">
                        <p className="text-sm font-semibold mb-1">Terms & Conditions</p>
                        <p className="text-sm text-muted-foreground">{detailContract.terms_conditions}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="coverage">
                  {detailContract.coverage_rules?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Covered</TableHead>
                          <TableHead>Coverage %</TableHead>
                          <TableHead>Max Amount</TableHead>
                          <TableHead>Visit Limit</TableHead>
                          <TableHead>Visits Used</TableHead>
                          <TableHead>Remaining</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailContract.coverage_rules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.service_type}</TableCell>
                            <TableCell>
                              <Badge variant={rule.is_covered ? "default" : "destructive"} className="text-xs">
                                {rule.is_covered ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell>{rule.coverage_percent}%</TableCell>
                            <TableCell>{rule.max_amount ? formatCurrency(parseFloat(rule.max_amount)) : "—"}</TableCell>
                            <TableCell>{rule.visit_limit ?? "Unlimited"}</TableCell>
                            <TableCell>{rule.visits_used}</TableCell>
                            <TableCell>
                              {rule.visit_limit ? (
                                <span className={cn("font-medium",
                                  (rule.visit_limit - rule.visits_used) <= 1 ? "text-orange-600" : "text-green-600"
                                )}>
                                  {Math.max(0, rule.visit_limit - rule.visits_used)}
                                </span>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center">
                      <Wrench className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No coverage rules defined</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="vehicles">
                  <div className="space-y-4 mt-2">
                    {detailContract.vehicle_info && (
                      <Card>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Car className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{detailContract.vehicle_info}</p>
                                <p className="text-xs text-muted-foreground">Primary Vehicle</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Primary</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {detailContract.contract_vehicles?.length > 0 ? (
                      detailContract.contract_vehicles.map((cv) => (
                        <Card key={cv.id}>
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Car className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{cv.vehicle_info}</p>
                                  <p className="text-xs text-muted-foreground">Added {format(new Date(cv.added_at), "dd MMM yyyy")}</p>
                                </div>
                              </div>
                              <Badge variant={cv.is_active ? "default" : "secondary"} className="text-xs">
                                {cv.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : !detailContract.vehicle_info ? (
                      <div className="py-8 text-center">
                        <Car className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No vehicles linked to this contract</p>
                      </div>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="audit">
                  {auditLogs.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {auditLogs.map((log) => (
                        <Card key={log.id}>
                          <CardContent className="py-3 px-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn("font-semibold text-sm", AUDIT_ACTION_COLORS[log.action] || "text-gray-600")}>
                                    {log.action.replace(/_/g, " ")}
                                  </span>
                                  {log.actor_name && (
                                    <span className="text-xs text-muted-foreground">by {log.actor_name}</span>
                                  )}
                                </div>
                                {log.notes && <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>}
                                {log.old_values?.status && log.new_values?.status && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {CONTRACT_STATUS_LABELS[log.old_values.status] || log.old_values.status} → {CONTRACT_STATUS_LABELS[log.new_values.status] || log.new_values.status}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(log.created_at), "dd MMM yyyy HH:mm")}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No audit log entries</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!actionDialog} onOpenChange={(open) => { if (!open) { setActionDialog(null); setActionReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.type === "suspend" && "Suspend Contract"}
              {actionDialog?.type === "terminate" && "Terminate Contract"}
              {actionDialog?.type === "reject" && "Reject Contract"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.type === "suspend" && "This will suspend the contract. Services will not be covered until resumed."}
              {actionDialog?.type === "terminate" && "This will permanently terminate the contract. This action cannot be undone."}
              {actionDialog?.type === "reject" && "This will reject the approval request and return the contract to Draft status."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>Reason</Label>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Provide a reason for this action..."
              rows={3}
              data-testid="input-action-reason"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionDialog) {
                  const dataKey = actionDialog.type === "terminate" ? "reason" :
                                  actionDialog.type === "suspend" ? "reason" : "comments";
                  workflowMutation.mutate({
                    id: actionDialog.contract.id,
                    action: actionDialog.type,
                    data: { [dataKey]: actionReason },
                  });
                }
              }}
              className={cn(actionDialog?.type === "terminate" && "bg-red-600 hover:bg-red-700")}
              data-testid="button-confirm-action"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Contract</DialogTitle>
            <DialogDescription>Set up a new warranty, AMC, or service contract</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select
                  value={formData.customer}
                  onValueChange={(value) => {
                    setFormData({ ...formData, customer: value, vehicle: "" });
                    setSelectedCustomerId(value);
                  }}
                >
                  <SelectTrigger data-testid="select-contract-customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select
                  value={formData.vehicle}
                  onValueChange={(value) => setFormData({ ...formData, vehicle: value })}
                  disabled={!selectedCustomerId}
                >
                  <SelectTrigger data-testid="select-contract-vehicle">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.make} {vehicle.model} - {vehicle.plate_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select value={formData.contract_type} onValueChange={(v) => setFormData({ ...formData, contract_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Billing Model</Label>
                <Select value={formData.billing_model} onValueChange={(v) => setFormData({ ...formData, billing_model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BILLING_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., OEM Warranty"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Contract Value</Label>
                <Input type="number" value={formData.contract_value}
                  onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                  placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Max Services</Label>
                <Input type="number" value={formData.max_services}
                  onChange={(e) => setFormData({ ...formData, max_services: e.target.value })}
                  placeholder="Unlimited" />
              </div>
              <div className="space-y-2">
                <Label>Labor Coverage %</Label>
                <Input type="number" value={formData.labor_coverage_percent}
                  onChange={(e) => setFormData({ ...formData, labor_coverage_percent: e.target.value })}
                  placeholder="100" min="0" max="100" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>KM Limit</Label>
                <Input type="number" value={formData.coverage_km_limit}
                  onChange={(e) => setFormData({ ...formData, coverage_km_limit: e.target.value })}
                  placeholder="Unlimited" />
              </div>
              <div className="space-y-2">
                <Label>Response Time (hrs)</Label>
                <Input type="number" value={formData.response_time_hours}
                  onChange={(e) => setFormData({ ...formData, response_time_hours: e.target.value })}
                  placeholder="24" />
              </div>
              <div className="space-y-2">
                <Label>Policy Number</Label>
                <Input value={formData.policy_number}
                  onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                  placeholder="Policy/Contract ID" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={formData.consumables_included}
                  onChange={(e) => setFormData({ ...formData, consumables_included: e.target.checked })}
                  className="rounded" />
                Consumables Included
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={formData.priority_handling}
                  onChange={(e) => setFormData({ ...formData, priority_handling: e.target.checked })}
                  className="rounded" />
                Priority Handling
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={formData.auto_renewal}
                  onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
                  className="rounded" />
                Auto Renewal
              </label>
            </div>

            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter terms, conditions, and notes..." rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-contract">
                {createMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                ) : "Create Contract"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
