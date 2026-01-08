import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/currency-context";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, User, Car, History, FileText, ScrollText, MessageSquare,
  Phone, Mail, MapPin, Building2, Star, CreditCard, Calendar,
  CheckCircle2, Clock, AlertTriangle, XCircle, Shield, Wrench,
  Plus, ExternalLink, RefreshCw
} from "lucide-react";

interface CustomerOverview {
  id: number;
  customer_id: string;
  name: string;
  phone: string;
  email: string;
  alternate_phone: string | null;
  alternate_email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  pan_number: string | null;
  customer_type: string;
  customer_category: string;
  preferred_channel: string;
  preferred_branch: number | null;
  preferred_branch_name: string | null;
  loyalty_points: number;
  credit_limit: number;
  outstanding_balance: number;
  total_revenue: number;
  total_visits: number;
  last_visit_date: string | null;
  date_of_birth: string | null;
  anniversary_date: string | null;
  notes: string | null;
  tags: string[];
  do_not_contact: boolean;
  is_active: boolean;
  created_at: string;
  vehicles_count: number;
  active_contracts_count: number;
  open_job_cards_count: number;
  pending_invoices_count: number;
  total_service_visits: number;
  last_service_date: string | null;
}

interface VehicleData {
  id: number;
  vehicle_id: string;
  vin: string;
  plate_number: string;
  make: string;
  model: string;
  variant: string | null;
  year: number | null;
  color: string | null;
  vehicle_type: string;
  fuel_type: string | null;
  transmission: string | null;
  current_odometer: number;
  insurance_expiry: string | null;
  warranty_expiry: string | null;
  amc_expiry: string | null;
  service_count: number;
  last_service_date: string | null;
  last_odometer: number;
  active_contract: {
    id: number;
    contract_number: string;
    contract_type: string;
    end_date: string;
    services_remaining: number | null;
  } | null;
  status: string;
}

interface ServiceHistoryItem {
  id: number;
  job_card_number: string;
  service_tracking_id: string;
  vehicle: number;
  vehicle_info: string;
  workflow_stage: string;
  job_type: string;
  priority: string;
  complaint: string | null;
  diagnosis: string | null;
  odometer_in: number;
  odometer_out: number | null;
  estimated_amount: number;
  actual_amount: number | null;
  is_warranty: boolean;
  is_amc: boolean;
  is_insurance: boolean;
  is_goodwill: boolean;
  promised_delivery: string | null;
  actual_delivery: string | null;
  customer_rating: number | null;
  created_at: string;
  advisor_name: string | null;
  technicians: string[];
  service_duration_hours: number | null;
  is_rework: boolean;
  sla_status: string;
  invoice_info: {
    id: number;
    invoice_number: string;
    grand_total: number;
    payment_status: string;
  } | null;
  contract_info: {
    id: number;
    contract_number: string;
    contract_type: string;
  } | null;
}

interface InvoiceData {
  id: number;
  invoice_number: string;
  job_card: number;
  job_card_number: string;
  vehicle_info: string | null;
  labor_total: number;
  parts_total: number;
  consumables_total: number;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  invoice_date: string;
  due_date: string | null;
  contract_covered: boolean;
  contract_type: string | null;
}

interface InvoiceSummary {
  total_invoices: number;
  total_billed: number;
  total_paid: number;
  outstanding_balance: number;
}

interface ContractData {
  id: number;
  contract_number: string;
  contract_type: string;
  status: string;
  provider: string;
  start_date: string;
  end_date: string;
  contract_value: number;
  max_services: number | null;
  services_used: number;
  labor_coverage_percent: number;
  consumables_included: boolean;
  services_included: string[];
  parts_coverage: Record<string, number>;
  is_active: boolean;
  is_expired: boolean;
  days_remaining: number | null;
  services_remaining: number | null;
  utilization_percent: number | null;
  vehicles: { id: number; plate_number: string; make: string; model: string }[];
  created_at: string;
}

interface ContractSummary {
  total: number;
  active: number;
  expired: number;
  expiring_soon: number;
}

interface CommunicationLog {
  id: number;
  interaction_id: string;
  interaction_type: string;
  channel: string;
  direction: string;
  subject: string;
  description: string | null;
  outcome: string | null;
  sentiment: string | null;
  duration_minutes: number | null;
  next_action: string | null;
  next_action_date: string | null;
  initiated_by_name: string | null;
  handled_by_name: string | null;
  related_job_card: string | null;
  delivery_status: string;
  created_at: string;
}

const WORKFLOW_STAGE_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  BILLING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELIVERY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  EXECUTION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  QC: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  APPROVAL: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PARTIAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  UNPAID: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const CONTRACT_TYPE_COLORS: Record<string, string> = {
  WARRANTY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  AMC: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  FLEET: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  EXTENDED_WARRANTY: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
};

const SLA_STATUS_ICONS: Record<string, JSX.Element> = {
  MET: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  ON_TRACK: <Clock className="h-4 w-4 text-blue-600" />,
  AT_RISK: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
  BREACHED: <XCircle className="h-4 w-4 text-red-600" />,
};

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 ml-64">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </main>
    </div>
  );
}

export default function CustomerProfile() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocalization();
  const { isCollapsed } = useSidebar();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const { data: overview, isLoading: overviewLoading } = useQuery<CustomerOverview>({
    queryKey: ["/api/customers", customerId, "360", "overview"],
    enabled: !!customerId,
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<VehicleData[]>({
    queryKey: ["/api/customers", customerId, "360", "vehicles"],
    enabled: !!customerId,
  });

  const { data: serviceHistory = [], isLoading: historyLoading } = useQuery<ServiceHistoryItem[]>({
    queryKey: ["/api/customers", customerId, "360", "service-history"],
    enabled: !!customerId,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery<{ summary: InvoiceSummary; invoices: InvoiceData[] }>({
    queryKey: ["/api/customers", customerId, "360", "invoices"],
    enabled: !!customerId,
  });

  const { data: contractsData, isLoading: contractsLoading } = useQuery<{ summary: ContractSummary; contracts: ContractData[] }>({
    queryKey: ["/api/customers", customerId, "360", "contracts"],
    enabled: !!customerId,
  });

  const { data: communications = [], isLoading: commsLoading } = useQuery<CommunicationLog[]>({
    queryKey: ["/api/customers", customerId, "360", "communications"],
    enabled: !!customerId,
  });

  if (overviewLoading) {
    return <LoadingSkeleton />;
  }

  if (!overview) {
    return (
      <div className="flex min-h-screen bg-background" data-testid="page-customer-profile">
        <AppSidebar />
        <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Customer not found</h2>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/crm")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to CRM
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const filteredServiceHistory = selectedVehicleId
    ? serviceHistory.filter((s) => s.vehicle === selectedVehicleId)
    : serviceHistory;

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-customer-profile">
      <AppSidebar />
      <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/crm")} data-testid="button-back-crm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-2xl font-semibold text-white">
                  {overview.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight" data-testid="text-customer-name">{overview.name}</h1>
                  {overview.active_contracts_count > 0 && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <Shield className="mr-1 h-3 w-3" />
                      Active Contract
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="font-mono" data-testid="text-customer-id">{overview.customer_id}</span>
                  <Badge variant="outline">{overview.customer_category}</Badge>
                  <Badge variant="outline">{overview.customer_type}</Badge>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold" data-testid="text-total-revenue">{formatCurrency(overview.total_revenue)}</p>
                </div>
                <CreditCard className="h-5 w-5 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicles</p>
                  <p className="text-xl font-bold" data-testid="text-vehicles-count">{overview.vehicles_count}</p>
                </div>
                <Car className="h-5 w-5 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Service Visits</p>
                  <p className="text-xl font-bold" data-testid="text-service-visits">{overview.total_service_visits}</p>
                </div>
                <Wrench className="h-5 w-5 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Loyalty Points</p>
                  <p className="text-xl font-bold" data-testid="text-loyalty-points">{overview.loyalty_points}</p>
                </div>
                <Star className="h-5 w-5 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={cn(overview.outstanding_balance > 0 && "border-orange-500")}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className={cn("text-xl font-bold", overview.outstanding_balance > 0 && "text-orange-600")} data-testid="text-outstanding">
                    {formatCurrency(overview.outstanding_balance)}
                  </p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <User className="mr-2 h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">
              <Car className="mr-2 h-4 w-4" /> Vehicles ({overview.vehicles_count})
            </TabsTrigger>
            <TabsTrigger value="service-history" data-testid="tab-service-history">
              <History className="mr-2 h-4 w-4" /> Service History
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">
              <FileText className="mr-2 h-4 w-4" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="contracts" data-testid="tab-contracts">
              <ScrollText className="mr-2 h-4 w-4" /> Contracts ({overview.active_contracts_count})
            </TabsTrigger>
            <TabsTrigger value="communications" data-testid="tab-communications">
              <MessageSquare className="mr-2 h-4 w-4" /> Communications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-phone">{overview.phone}</span>
                    {overview.alternate_phone && (
                      <span className="text-muted-foreground">/ {overview.alternate_phone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-email">{overview.email}</span>
                  </div>
                  {overview.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span data-testid="text-address">
                        {overview.address}
                        {overview.city && `, ${overview.city}`}
                        {overview.state && `, ${overview.state}`}
                        {overview.pincode && ` - ${overview.pincode}`}
                      </span>
                    </div>
                  )}
                  {overview.preferred_branch_name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Preferred Branch: {overview.preferred_branch_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {overview.gst_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST Number</span>
                      <span className="font-mono">{overview.gst_number}</span>
                    </div>
                  )}
                  {overview.pan_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PAN Number</span>
                      <span className="font-mono">{overview.pan_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Limit</span>
                    <span>{formatCurrency(overview.credit_limit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preferred Channel</span>
                    <Badge variant="outline">{overview.preferred_channel}</Badge>
                  </div>
                  {overview.last_visit_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Visit</span>
                      <span>{formatDate(overview.last_visit_date)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Since</span>
                    <span>{formatDate(overview.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {overview.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{overview.notes}</p>
                </CardContent>
              </Card>
            )}

            {overview.tags && overview.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {overview.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4">
            {vehiclesLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : vehicles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No vehicles registered</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => {
                      setSelectedVehicleId(vehicle.id);
                      setActiveTab("service-history");
                    }}
                    data-testid={`card-vehicle-${vehicle.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </CardTitle>
                          <CardDescription>{vehicle.plate_number}</CardDescription>
                        </div>
                        {vehicle.active_contract && (
                          <Badge className={CONTRACT_TYPE_COLORS[vehicle.active_contract.contract_type] || "bg-gray-100"}>
                            <Shield className="mr-1 h-3 w-3" />
                            {vehicle.active_contract.contract_type}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VIN</span>
                        <span className="font-mono text-xs">{vehicle.vin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Odometer</span>
                        <span>{vehicle.current_odometer.toLocaleString()} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service Count</span>
                        <span>{vehicle.service_count}</span>
                      </div>
                      {vehicle.last_service_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Service</span>
                          <span>{formatDate(vehicle.last_service_date)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2 flex-wrap">
                        {vehicle.fuel_type && <Badge variant="outline">{vehicle.fuel_type}</Badge>}
                        {vehicle.transmission && <Badge variant="outline">{vehicle.transmission}</Badge>}
                        <Badge variant="outline">{vehicle.vehicle_type}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="service-history" className="space-y-4">
            {selectedVehicleId && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  Filtered by vehicle: {vehicles.find((v) => v.id === selectedVehicleId)?.plate_number}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedVehicleId(null)}>
                  Clear filter
                </Button>
              </div>
            )}
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredServiceHistory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No service history found</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Card</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>SLA</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Contract</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServiceHistory.map((service) => (
                        <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-mono text-xs">{service.job_card_number}</p>
                              {service.is_rework && (
                                <Badge variant="destructive" className="text-xs mt-1">Rework</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(service.created_at)}</TableCell>
                          <TableCell className="text-xs">{service.vehicle_info}</TableCell>
                          <TableCell>{service.job_type}</TableCell>
                          <TableCell>
                            <Badge className={WORKFLOW_STAGE_COLORS[service.workflow_stage] || "bg-gray-100"}>
                              {service.workflow_stage.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {SLA_STATUS_ICONS[service.sla_status] || <Clock className="h-4 w-4 text-gray-400" />}
                              <span className="text-xs">{service.sla_status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {service.actual_amount ? formatCurrency(service.actual_amount) : "-"}
                          </TableCell>
                          <TableCell>
                            {service.contract_info ? (
                              <Badge className={CONTRACT_TYPE_COLORS[service.contract_info.contract_type] || "bg-gray-100"}>
                                {service.contract_info.contract_type}
                              </Badge>
                            ) : (
                              service.is_warranty ? (
                                <Badge className="bg-blue-100 text-blue-800">WARRANTY</Badge>
                              ) : service.is_amc ? (
                                <Badge className="bg-green-100 text-green-800">AMC</Badge>
                              ) : "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            {invoicesData?.summary && (
              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Total Invoices</p>
                    <p className="text-xl font-bold">{invoicesData.summary.total_invoices}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Total Billed</p>
                    <p className="text-xl font-bold">{formatCurrency(invoicesData.summary.total_billed)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(invoicesData.summary.total_paid)}</p>
                  </CardContent>
                </Card>
                <Card className={cn(invoicesData.summary.outstanding_balance > 0 && "border-orange-500")}>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className={cn("text-xl font-bold", invoicesData.summary.outstanding_balance > 0 && "text-orange-600")}>
                      {formatCurrency(invoicesData.summary.outstanding_balance)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {invoicesLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !invoicesData?.invoices?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No invoices found</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Job Card</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contract</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoicesData.invoices.map((invoice) => (
                        <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                          <TableCell className="font-mono text-xs">{invoice.invoice_number}</TableCell>
                          <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                          <TableCell className="font-mono text-xs">{invoice.job_card_number}</TableCell>
                          <TableCell className="text-xs">{invoice.vehicle_info}</TableCell>
                          <TableCell>{formatCurrency(invoice.grand_total)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(invoice.amount_paid)}</TableCell>
                          <TableCell className={cn(invoice.balance_due > 0 && "text-orange-600")}>
                            {formatCurrency(invoice.balance_due)}
                          </TableCell>
                          <TableCell>
                            <Badge className={PAYMENT_STATUS_COLORS[invoice.payment_status] || "bg-gray-100"}>
                              {invoice.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invoice.contract_covered && invoice.contract_type ? (
                              <Badge className={CONTRACT_TYPE_COLORS[invoice.contract_type] || "bg-gray-100"}>
                                {invoice.contract_type}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            {contractsData?.summary && (
              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Total Contracts</p>
                    <p className="text-xl font-bold">{contractsData.summary.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-xl font-bold text-green-600">{contractsData.summary.active}</p>
                  </CardContent>
                </Card>
                <Card className={cn(contractsData.summary.expiring_soon > 0 && "border-yellow-500")}>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Expiring Soon</p>
                    <p className={cn("text-xl font-bold", contractsData.summary.expiring_soon > 0 && "text-yellow-600")}>
                      {contractsData.summary.expiring_soon}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Expired</p>
                    <p className="text-xl font-bold text-muted-foreground">{contractsData.summary.expired}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            {contractsLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !contractsData?.contracts?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No contracts found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {contractsData.contracts.map((contract) => (
                  <Card key={contract.id} className={cn(!contract.is_active && "opacity-60")} data-testid={`card-contract-${contract.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {contract.contract_number}
                            <Badge className={CONTRACT_TYPE_COLORS[contract.contract_type] || "bg-gray-100"}>
                              {contract.contract_type}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {contract.provider || "Internal Contract"}
                          </CardDescription>
                        </div>
                        <Badge variant={contract.is_active ? "default" : contract.is_expired ? "destructive" : "outline"}>
                          {contract.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Validity</span>
                        <span>{formatDate(contract.start_date)} - {formatDate(contract.end_date)}</span>
                      </div>
                      {contract.days_remaining !== null && contract.is_active && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Days Remaining</span>
                          <span className={cn(contract.days_remaining < 30 && "text-yellow-600 font-medium")}>
                            {contract.days_remaining} days
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contract Value</span>
                        <span className="font-medium">{formatCurrency(contract.contract_value)}</span>
                      </div>
                      {contract.max_services && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Services Used</span>
                            <span>{contract.services_used} / {contract.max_services}</span>
                          </div>
                          <Progress value={(contract.services_used / contract.max_services) * 100} className="h-2" />
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Labor Coverage</span>
                        <span>{contract.labor_coverage_percent}%</span>
                      </div>
                      {contract.vehicles && contract.vehicles.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-1">Covered Vehicles</p>
                          <div className="flex flex-wrap gap-1">
                            {contract.vehicles.map((v) => (
                              <Badge key={v.id} variant="outline" className="text-xs">
                                {v.plate_number}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="communications" className="space-y-4">
            {commsLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : communications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No communications found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {communications.map((comm) => (
                  <Card key={comm.id} data-testid={`card-communication-${comm.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{comm.channel}</Badge>
                            <Badge variant="outline">{comm.interaction_type}</Badge>
                            {comm.direction && (
                              <Badge variant="secondary">{comm.direction}</Badge>
                            )}
                            {comm.sentiment && (
                              <Badge variant={comm.sentiment === "POSITIVE" ? "default" : comm.sentiment === "NEGATIVE" ? "destructive" : "outline"}>
                                {comm.sentiment}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{comm.subject}</h4>
                          {comm.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{comm.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{formatDate(comm.created_at)}</span>
                            {comm.handled_by_name && <span>Handled by: {comm.handled_by_name}</span>}
                            {comm.related_job_card && <span>Job: {comm.related_job_card}</span>}
                          </div>
                        </div>
                        <Badge variant={comm.delivery_status === "SENT" || comm.delivery_status === "DELIVERED" ? "default" : "outline"}>
                          {comm.delivery_status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
