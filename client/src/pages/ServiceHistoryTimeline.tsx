import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { AppSidebar } from "@/components/AppSidebar";
import { useSidebar } from "@/lib/sidebar-context";
import { useLocalization } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Car,
  Bike,
  Calendar,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  ArrowLeft,
  FileText,
  Receipt,
  User,
  MapPin,
  Gauge,
  Shield,
  TrendingUp,
  Wallet,
  History,
} from "lucide-react";
import { STAGE_BADGE_COLORS, WORKFLOW_STAGE_DEFINITIONS } from "@/config";

interface Vehicle {
  id: number;
  vehicle_id: string;
  plate_number: string;
  make: string;
  model: string;
  variant: string | null;
  year: number | null;
  color: string | null;
  current_odometer: number;
  vehicle_type: string;
  customer: {
    id: number;
    name: string;
    phone: string;
  };
}

interface ServiceEvent {
  id: number;
  event_type: string;
  actor: string | null;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string | null;
}

interface Task {
  id: number;
  name: string;
  status: string;
  labor_cost: number;
}

interface Estimate {
  id: number;
  estimate_number: string;
  grand_total: number;
  approval_status: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  grand_total: number;
  payment_status: string;
}

interface TimelineItem {
  id: number;
  job_card_number: string;
  service_tracking_id: string;
  workflow_stage: string;
  job_type: string;
  priority: string;
  complaint: string | null;
  diagnosis: string | null;
  odometer_in: number;
  odometer_out: number | null;
  estimated_amount: number;
  actual_amount: number;
  is_warranty: boolean;
  is_amc: boolean;
  customer_rating: number | null;
  customer_feedback: string | null;
  created_at: string | null;
  promised_delivery: string | null;
  actual_delivery: string | null;
  branch: { id: number; name: string } | null;
  service_advisor: string | null;
  lead_technician: string | null;
  events: ServiceEvent[];
  tasks: Task[];
  estimates: Estimate[];
  invoices: Invoice[];
}

interface ServiceHistoryData {
  vehicle: Vehicle;
  summary: {
    total_services: number;
    completed_services: number;
    total_spent: number;
    average_rating: number;
    warranty_services: number;
    amc_services: number;
  };
  available_years: number[];
  timeline: TimelineItem[];
}

function VehicleSelector({
  onSelect,
  selectedId,
  t,
}: {
  onSelect: (id: number) => void;
  selectedId: number | null;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles", searchTerm],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {t('serviceHistory.selectVehicle', 'Select Vehicle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder={t('serviceHistory.searchVehicle', 'Search by plate number, make, or model...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-vehicle-search"
        />
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {vehicles?.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => onSelect(vehicle.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover-elevate ${
                  selectedId === vehicle.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
                data-testid={`vehicle-card-${vehicle.id}`}
              >
                {vehicle.vehicle_type === "BIKE" ? (
                  <Bike className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Car className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{vehicle.plate_number}</span>
                    <span className="text-xs">|</span>
                    <span>{vehicle.customer?.name}</span>
                  </div>
                </div>
                <Badge variant="outline">{vehicle.vehicle_type}</Badge>
              </div>
            ))}
            {vehicles?.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                {t('serviceHistory.noVehicles', 'No vehicles found')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCards({ summary, formatCurrency, t }: { summary: ServiceHistoryData["summary"]; formatCurrency: (amount: number) => string; t: ReturnType<typeof useTranslation>['t'] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <Wrench className="mb-2 h-6 w-6 text-blue-500" />
          <div className="text-2xl font-bold">{summary.total_services}</div>
          <div className="text-xs text-muted-foreground">{t('serviceHistory.totalServices', 'Total Services')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <CheckCircle2 className="mb-2 h-6 w-6 text-green-500" />
          <div className="text-2xl font-bold">{summary.completed_services}</div>
          <div className="text-xs text-muted-foreground">{t('serviceHistory.completed', 'Completed')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <Wallet className="mb-2 h-6 w-6 text-amber-500" />
          <div className="text-2xl font-bold">
            {formatCurrency(summary.total_spent)}
          </div>
          <div className="text-xs text-muted-foreground">{t('serviceHistory.totalSpent', 'Total Spent')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <Star className="mb-2 h-6 w-6 text-yellow-500" />
          <div className="text-2xl font-bold">{summary.average_rating || "-"}</div>
          <div className="text-xs text-muted-foreground">{t('serviceHistory.avgRating', 'Avg Rating')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <Shield className="mb-2 h-6 w-6 text-purple-500" />
          <div className="text-2xl font-bold">{summary.warranty_services}</div>
          <div className="text-xs text-muted-foreground">{t('serviceHistory.warranty', 'Warranty')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <TrendingUp className="mb-2 h-6 w-6 text-cyan-500" />
          <div className="text-2xl font-bold">{summary.amc_services}</div>
          <div className="text-xs text-muted-foreground">{t('serviceHistory.amc', 'AMC')}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineCard({ item, formatCurrency, t }: { item: TimelineItem; formatCurrency: (amount: number) => string; t: ReturnType<typeof useTranslation>['t'] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stageConfig = WORKFLOW_STAGE_DEFINITIONS[item.workflow_stage];
  const stageBadgeColor =
    STAGE_BADGE_COLORS[item.workflow_stage] ||
    "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";

  return (
    <div className="relative pl-8">
      <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Wrench className="h-3 w-3" />
      </div>
      <div className="absolute bottom-0 left-[11px] top-6 w-0.5 bg-border" />

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="mb-4">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/job-cards/${item.id}`}>
                        <span
                          className="font-semibold text-primary hover:underline"
                          data-testid={`link-job-card-${item.id}`}
                        >
                          {item.job_card_number}
                        </span>
                      </Link>
                      <Badge className={stageBadgeColor}>
                        {stageConfig?.label || item.workflow_stage}
                      </Badge>
                      {item.is_warranty && (
                        <Badge variant="outline" className="border-purple-500 text-purple-600">
                          {t('serviceHistory.warranty', 'Warranty')}
                        </Badge>
                      )}
                      {item.is_amc && (
                        <Badge variant="outline" className="border-cyan-500 text-cyan-600">
                          {t('serviceHistory.amc', 'AMC')}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.created_at
                          ? format(new Date(item.created_at), "dd MMM yyyy")
                          : "-"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {item.odometer_in.toLocaleString()} km
                      </span>
                      {item.branch && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.branch.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(item.actual_amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">{item.job_type}</div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 border-t pt-4">
              {item.complaint && (
                <div>
                  <div className="mb-1 text-sm font-medium">{t('serviceHistory.complaint', 'Complaint')}</div>
                  <p className="text-sm text-muted-foreground">{item.complaint}</p>
                </div>
              )}
              {item.diagnosis && (
                <div>
                  <div className="mb-1 text-sm font-medium">{t('serviceHistory.diagnosis', 'Diagnosis')}</div>
                  <p className="text-sm text-muted-foreground">{item.diagnosis}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm font-medium">{t('serviceHistory.serviceDetails', 'Service Details')}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('serviceHistory.serviceAdvisor', 'Service Advisor')}</span>
                      <span>{item.service_advisor || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('serviceHistory.leadTechnician', 'Lead Technician')}</span>
                      <span>{item.lead_technician || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('serviceHistory.priority', 'Priority')}</span>
                      <span>{item.priority}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm font-medium">{t('serviceHistory.financial', 'Financial')}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('serviceHistory.estimated', 'Estimated')}</span>
                      <span>
                        {formatCurrency(item.estimated_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('serviceHistory.actual', 'Actual')}</span>
                      <span>
                        {formatCurrency(item.actual_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {item.tasks.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium">{t('serviceHistory.tasks', 'Tasks')} ({item.tasks.length})</div>
                  <div className="space-y-1">
                    {item.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-sm"
                      >
                        <span>{task.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatCurrency(task.labor_cost)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.customer_rating && (
                <div className="flex items-center gap-2 rounded bg-amber-50 p-2 dark:bg-amber-950/20">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">{item.customer_rating}/5</span>
                  {item.customer_feedback && (
                    <span className="text-sm text-muted-foreground">
                      - {item.customer_feedback}
                    </span>
                  )}
                </div>
              )}

              {item.events.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium">
                    {t('serviceHistory.activityLog', 'Activity Log')} ({item.events.length})
                  </div>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {item.events.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <Clock className="mt-0.5 h-3 w-3" />
                        <div>
                          <span className="font-medium">{event.actor}</span> - {event.event_type}
                          {event.created_at && (
                            <span className="ml-2">
                              {format(new Date(event.created_at), "dd MMM, HH:mm")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Link href={`/job-cards/${item.id}`}>
                  <Button size="sm" variant="outline" data-testid={`button-view-details-${item.id}`}>
                    <FileText className="mr-1 h-3 w-3" />
                    {t('serviceHistory.viewDetails', 'View Details')}
                  </Button>
                </Link>
                {item.invoices.length > 0 && (
                  <Button size="sm" variant="outline">
                    <Receipt className="mr-1 h-3 w-3" />
                    {item.invoices.length} {t('serviceHistory.invoices', 'Invoice(s)')}
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

export default function ServiceHistoryTimeline() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { isCollapsed, selectedBranch } = useSidebar();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery<ServiceHistoryData>({
    queryKey: ["/api/vehicles", selectedVehicleId, "service_history", yearFilter, stageFilter],
    enabled: !!selectedVehicleId,
  });

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-service-history">
      <AppSidebar />
      <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('serviceHistory.title', 'Service History Timeline')}</h1>
              <p className="text-sm text-muted-foreground">{t('serviceHistory.subtitle', 'View complete service history for any vehicle')}</p>
            </div>
          </div>
          {selectedVehicleId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVehicleId(null)}
              data-testid="button-change-vehicle"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('serviceHistory.changeVehicle', 'Change Vehicle')}
            </Button>
          )}
        </header>

        <div className="flex-1">
            {!selectedVehicleId ? (
              <div className="mx-auto max-w-2xl">
                <VehicleSelector
                  onSelect={setSelectedVehicleId}
                  selectedId={selectedVehicleId}
                  t={t}
                />
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="mb-2 h-12 w-12 text-destructive" />
                <p className="text-muted-foreground">{t('common.error', 'Failed to load service history')}</p>
              </div>
            ) : data ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-4">
                      {data.vehicle.vehicle_type === "BIKE" ? (
                        <Bike className="h-10 w-10 text-primary" />
                      ) : (
                        <Car className="h-10 w-10 text-primary" />
                      )}
                      <div>
                        <div className="text-lg font-semibold">
                          {data.vehicle.year} {data.vehicle.make} {data.vehicle.model}
                          {data.vehicle.variant && ` ${data.vehicle.variant}`}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span>{data.vehicle.plate_number}</span>
                          <span className="text-xs">|</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {data.vehicle.customer.name}
                          </span>
                          <span className="text-xs">|</span>
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {data.vehicle.current_odometer.toLocaleString()} km
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {data.vehicle.color}
                    </Badge>
                  </CardContent>
                </Card>

                <SummaryCards summary={data.summary} formatCurrency={formatCurrency} t={t} />

                <div className="flex flex-wrap items-center gap-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-32" data-testid="select-year-filter">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('serviceHistory.allYears', 'All Years')}</SelectItem>
                      {data.available_years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-40" data-testid="select-stage-filter">
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('serviceHistory.allStages', 'All Stages')}</SelectItem>
                      {Object.entries(WORKFLOW_STAGE_DEFINITIONS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {data.timeline.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Wrench className="mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium">{t('serviceHistory.noHistory', 'No service history found')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('serviceHistory.noHistoryDesc', 'This vehicle has no recorded service visits yet')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="relative">
                    {data.timeline.map((item) => (
                      <TimelineCard key={item.id} item={item} formatCurrency={formatCurrency} t={t} />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
        </div>
      </main>
    </div>
  );
}
