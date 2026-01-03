import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocalization } from "@/lib/currency-context";
import { format, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Car,
  User,
  Filter,
  Search,
  Plus,
  FileText,
  Loader2,
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
import { Progress } from "@/components/ui/progress";

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
  contract_value: string;
  billing_model: string;
  services_included: string[];
  services_used: number;
  max_services: number | null;
  services_remaining: number | null;
  km_remaining: number | null;
  utilization_percent: number;
  is_active: boolean;
  is_expired: boolean;
  days_remaining: number;
  priority_handling: boolean;
  auto_renewal: boolean;
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
  TERMINATED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  EXPIRED: "Expired",
  TERMINATED: "Terminated",
};

export default function Contracts() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showExpiring, setShowExpiring] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/contracts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          notes: data.notes,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to create contract");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: t('contracts.createSuccess', 'Contract created successfully') });
    },
    onError: (error) => {
      toast({ title: t('contracts.createError', 'Failed to create contract'), description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
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
      notes: "",
    });
    setSelectedCustomerId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer) {
      toast({ title: t('contracts.selectCustomerRequired', 'Please select a customer'), variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["contracts", typeFilter, statusFilter],
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
    queryKey: ["contracts", "dashboard_stats"],
    queryFn: async () => {
      const res = await fetch("/api/contracts/dashboard_stats/", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: expiringContracts = [] } = useQuery<Contract[]>({
    queryKey: ["contracts", "expiring_soon"],
    queryFn: async () => {
      const res = await fetch("/api/contracts/expiring_soon/?days=30", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filteredContracts = (showExpiring ? expiringContracts : contracts).filter((contract) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contract.customer_name?.toLowerCase().includes(query) ||
        contract.vehicle_info?.toLowerCase().includes(query) ||
        contract.contract_number?.toLowerCase().includes(query) ||
        contract.policy_number?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">{t('contracts.title', 'Contracts & Warranties')}</h1>
              <p className="text-muted-foreground">{t('contracts.subtitle', 'Manage warranties, AMC, and service contracts')}</p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-contract">
              <Plus className="h-4 w-4 mr-2" />
              {t('contracts.newContract', 'New Contract')}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contracts.totalActive', 'Total Active')}</p>
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
                    <p className="text-sm text-muted-foreground">{t('contracts.contractValue', 'Contract Value')}</p>
                    <p className="text-2xl font-bold text-green-600">
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
                    <p className="text-sm text-muted-foreground">{t('contracts.avgUtilization', 'Avg Utilization')}</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardStats?.average_utilization ?? 0}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className={cn((dashboardStats?.pending_approvals ?? 0) > 0 && "border-yellow-500")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contracts.pendingApproval', 'Pending Approval')}</p>
                    <p className="text-2xl font-bold text-yellow-600">{dashboardStats?.pending_approvals ?? 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className={cn((dashboardStats?.expiring_soon ?? 0) > 0 && "border-orange-500")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contracts.expiringSoon', 'Expiring Soon')}</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-expiring-count">
                      {dashboardStats?.expiring_soon ?? 0}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('contracts.searchPlaceholder', 'Search contracts...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48" data-testid="select-type-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('contracts.contractType', 'Contract Type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('contracts.allTypes', 'All Types')}</SelectItem>
                <SelectItem value="WARRANTY">{t('contracts.types.WARRANTY', 'Warranty')}</SelectItem>
                <SelectItem value="EXTENDED_WARRANTY">{t('contracts.types.EXTENDED_WARRANTY', 'Extended Warranty')}</SelectItem>
                <SelectItem value="AMC">{t('contracts.types.AMC', 'AMC')}</SelectItem>
                <SelectItem value="SERVICE_PACKAGE">{t('contracts.types.SERVICE_PACKAGE', 'Service Package')}</SelectItem>
                <SelectItem value="INSURANCE">{t('contracts.types.INSURANCE', 'Insurance')}</SelectItem>
                <SelectItem value="FLEET">{t('contracts.types.FLEET', 'Fleet Contract')}</SelectItem>
                <SelectItem value="SUBSCRIPTION">{t('contracts.types.SUBSCRIPTION', 'Subscription')}</SelectItem>
                <SelectItem value="CORPORATE">{t('contracts.types.CORPORATE', 'Corporate')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder={t('common.status', 'Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('contracts.allStatus', 'All Status')}</SelectItem>
                <SelectItem value="DRAFT">{t('contracts.status.DRAFT', 'Draft')}</SelectItem>
                <SelectItem value="PENDING_APPROVAL">{t('contracts.status.PENDING_APPROVAL', 'Pending Approval')}</SelectItem>
                <SelectItem value="ACTIVE">{t('contracts.status.ACTIVE', 'Active')}</SelectItem>
                <SelectItem value="SUSPENDED">{t('contracts.status.SUSPENDED', 'Suspended')}</SelectItem>
                <SelectItem value="EXPIRED">{t('contracts.status.EXPIRED', 'Expired')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showExpiring ? "default" : "outline"}
              onClick={() => setShowExpiring(!showExpiring)}
              data-testid="button-show-expiring"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t('contracts.expiringSoon', 'Expiring Soon')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('contracts.noContractsFound', 'No contracts found')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContracts.map((contract) => (
                <Card
                  key={contract.id}
                  className={cn(
                    "overflow-visible",
                    contract.is_expired && "opacity-60",
                    contract.days_remaining <= 30 && contract.days_remaining > 0 && "border-orange-500"
                  )}
                  data-testid={`card-contract-${contract.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-medium">{contract.contract_number}</CardTitle>
                        <p className="text-xs text-muted-foreground">{contract.policy_number}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={cn("text-xs", CONTRACT_TYPE_COLORS[contract.contract_type])}>
                          {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
                        </Badge>
                        <Badge className={cn("text-xs", CONTRACT_STATUS_COLORS[contract.status])}>
                          {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{contract.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{contract.vehicle_info}</span>
                    </div>
                    {contract.provider && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{contract.provider}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(contract.start_date), "MMM d, yyyy")} -{" "}
                        {format(new Date(contract.end_date), "MMM d, yyyy")}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('contracts.daysRemaining', 'Days Remaining')}</span>
                        <span className={cn(
                          "font-medium",
                          contract.is_expired && "text-red-600",
                          contract.days_remaining <= 30 && !contract.is_expired && "text-orange-600"
                        )}>
                          {contract.is_expired ? t('contracts.expired', 'Expired') : `${contract.days_remaining} ${t('contracts.days', 'days')}`}
                        </span>
                      </div>
                      {!contract.is_expired && (
                        <Progress
                          value={Math.min(100, (contract.days_remaining / 365) * 100)}
                          className={cn(
                            "h-1.5",
                            contract.days_remaining <= 30 && "[&>div]:bg-orange-500"
                          )}
                        />
                      )}
                    </div>

                    {contract.max_services && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('contracts.servicesUsed', 'Services Used')}</span>
                          <span className="font-medium">
                            {contract.services_used} / {contract.max_services}
                          </span>
                        </div>
                        <Progress
                          value={(contract.services_used / contract.max_services) * 100}
                          className="h-1.5"
                        />
                      </div>
                    )}

                    {contract.utilization_percent !== undefined && contract.utilization_percent > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('contracts.utilization', 'Utilization')}</span>
                          <span className="font-medium">{Math.round(contract.utilization_percent)}%</span>
                        </div>
                        <Progress value={contract.utilization_percent} className="h-1.5" />
                      </div>
                    )}

                    {parseFloat(contract.contract_value) > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('contracts.contractValue', 'Contract Value')}</span>
                          <span className="font-medium">
                            {formatCurrency(parseFloat(contract.contract_value))}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('contracts.createContract', 'Create New Contract')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">{t('contracts.customer', 'Customer')}</Label>
              <Select
                value={formData.customer}
                onValueChange={(value) => {
                  setFormData({ ...formData, customer: value, vehicle: "" });
                  setSelectedCustomerId(value);
                }}
              >
                <SelectTrigger data-testid="select-contract-customer">
                  <SelectValue placeholder={t('contracts.selectCustomer', 'Select customer')} />
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
              <Label htmlFor="vehicle">{t('contracts.vehicleOptional', 'Vehicle (optional)')}</Label>
              <Select
                value={formData.vehicle}
                onValueChange={(value) => setFormData({ ...formData, vehicle: value })}
                disabled={!selectedCustomerId}
              >
                <SelectTrigger data-testid="select-contract-vehicle">
                  <SelectValue placeholder={t('contracts.selectVehicle', 'Select vehicle')} />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_type">{t('contracts.contractType', 'Contract Type')}</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WARRANTY">{t('contracts.types.WARRANTY', 'Warranty')}</SelectItem>
                    <SelectItem value="EXTENDED_WARRANTY">{t('contracts.types.EXTENDED_WARRANTY', 'Extended Warranty')}</SelectItem>
                    <SelectItem value="AMC">{t('contracts.types.AMC', 'AMC')}</SelectItem>
                    <SelectItem value="SERVICE_PACKAGE">{t('contracts.types.SERVICE_PACKAGE', 'Service Package')}</SelectItem>
                    <SelectItem value="INSURANCE">{t('contracts.types.INSURANCE', 'Insurance')}</SelectItem>
                    <SelectItem value="FLEET">{t('contracts.types.FLEET', 'Fleet Contract')}</SelectItem>
                    <SelectItem value="SUBSCRIPTION">{t('contracts.types.SUBSCRIPTION', 'Subscription')}</SelectItem>
                    <SelectItem value="CORPORATE">{t('contracts.types.CORPORATE', 'Corporate')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_model">{t('contracts.billingModel', 'Billing Model')}</Label>
                <Select
                  value={formData.billing_model}
                  onValueChange={(value) => setFormData({ ...formData, billing_model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONE_TIME">{t('contracts.billing.ONE_TIME', 'One Time')}</SelectItem>
                    <SelectItem value="MONTHLY">{t('contracts.billing.MONTHLY', 'Monthly')}</SelectItem>
                    <SelectItem value="QUARTERLY">{t('contracts.billing.QUARTERLY', 'Quarterly')}</SelectItem>
                    <SelectItem value="YEARLY">{t('contracts.billing.YEARLY', 'Yearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">{t('contracts.provider', 'Provider')}</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder={t('contracts.providerPlaceholder', 'e.g., OEM, Insurance Co.')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy_number">{t('contracts.policyNumber', 'Policy Number')}</Label>
                <Input
                  id="policy_number"
                  value={formData.policy_number}
                  onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                  placeholder={t('contracts.policyNumberPlaceholder', 'Policy/Contract ID')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">{t('contracts.startDate', 'Start Date')}</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">{t('contracts.endDate', 'End Date')}</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_value">{t('contracts.contractValue', 'Contract Value')}</Label>
                <Input
                  id="contract_value"
                  type="number"
                  value={formData.contract_value}
                  onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_services">{t('contracts.maxServices', 'Max Services')}</Label>
                <Input
                  id="max_services"
                  type="number"
                  value={formData.max_services}
                  onChange={(e) => setFormData({ ...formData, max_services: e.target.value })}
                  placeholder={t('contracts.maxServicesPlaceholder', 'Leave empty for unlimited')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('contracts.notes', 'Notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('contracts.notesPlaceholder', 'Additional notes...')}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-contract">
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Contract"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
