import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { useJobCards, useTransitionJobCard, useCreateJobCard, useServiceEvents } from "@/hooks/use-job-cards";
import { useCustomers, useVehicles } from "@/hooks/use-crm";
import { Link } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  AlertTriangle,
  MoreHorizontal,
  ArrowRight,
  Clock,
  Car,
  Bike,
  User,
  DollarSign,
  Loader2,
  LayoutGrid,
  List,
  Activity,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  History,
  Search,
  Filter,
  ArrowLeft,
  FileText,
  Receipt,
  Gauge,
  Shield,
  TrendingUp,
  IndianRupee,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Star,
  MapPin,
  Calendar,
  ChevronRight,
} from "lucide-react";
import {
  WORKFLOW_STAGES,
  WORKFLOW_STAGE_DEFINITIONS,
  STAGE_BADGE_COLORS,
  BUSINESS_RULES,
  getStageConfig,
  getStageLabel,
  getEventTypeConfig,
  isHighPriority,
  PRIORITY_DEFINITIONS,
  MESSAGES,
  formatMessage,
  UI_CONFIG,
} from "@/config";

type ViewMode = "kanban" | "list" | "activity" | "history";
type SortField = "job_card_number" | "customer_name" | "workflow_stage" | "priority" | "created_at" | "estimated_amount";
type SortDirection = "asc" | "desc";

const WORKFLOW_COLUMNS = WORKFLOW_STAGES;


function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-6">
          <div className="skeleton mb-2 h-8 w-48" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-72 shrink-0">
              <div className="skeleton mb-3 h-10 rounded-lg" />
              <div className="space-y-3">
                <div className="skeleton h-32 rounded-xl" />
                <div className="skeleton h-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

interface AllowedTransition {
  value: string;
  label: string;
}

interface JobCardItemProps {
  job: {
    id: number;
    job_card_number?: string;
    vehicle_info?: string;
    customer_name?: string;
    estimated_amount?: string;
    created_at?: string;
    sla_deadline?: string;
    priority?: string;
    workflow_stage?: string;
    allowed_transitions?: AllowedTransition[];
  };
  column: typeof WORKFLOW_COLUMNS[0];
  onTransition: (newStage: string) => void;
  isPending: boolean;
}

function JobCardItem({ job, column, onTransition, isPending }: JobCardItemProps) {
  const allowedTransitions = job.allowed_transitions || [];
  const nextStage = allowedTransitions[0];
  const isOverdue = job.sla_deadline && new Date(job.sla_deadline) < new Date();
  const isHighPriority = job.priority === "HIGH" || job.priority === "CRITICAL";

  return (
    <Card
      className={cn(
        "group cursor-pointer border-border/50 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30",
        isPending && "opacity-50 pointer-events-none"
      )}
      data-testid={`card-job-${job.id}`}
    >
      <Link href={`/job-cards/${job.id}`} className="block">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {job.job_card_number || `#${job.id}`}
              </span>
              {isOverdue && (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              )}
              {isHighPriority && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  {job.priority}
                </Badge>
              )}
            </div>
            {allowedTransitions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {allowedTransitions.map((transition) => {
                    const stage = WORKFLOW_COLUMNS.find((c) => c.id === transition.value);
                    return (
                      <DropdownMenuItem
                        key={transition.value}
                        onClick={(e) => {
                          e.preventDefault();
                          onTransition(transition.value);
                        }}
                      >
                        Move to {stage?.label || transition.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold leading-tight">
              {job.vehicle_info?.split(" - ")[0] || "Vehicle"}
            </span>
          </div>

          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{job.customer_name || "Customer"}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {job.created_at
                ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
                : ""}
            </div>
            <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
              {job.estimated_amount || "0"}
            </div>
          </div>

          {nextStage && column.id !== "COMPLETED" && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 h-8 w-full justify-center gap-1.5 border border-dashed border-border text-xs hover:border-primary hover:bg-primary/5"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTransition(nextStage.value);
              }}
            >
              <span>Move to {WORKFLOW_COLUMNS.find((c) => c.id === nextStage.value)?.label || nextStage.label}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateJobDialog({ open, onOpenChange, onSuccess }: CreateJobDialogProps) {
  const { toast } = useToast();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles(
    selectedCustomer ? parseInt(selectedCustomer) : undefined
  );
  const createJobCard = useCreateJobCard();

  const [formData, setFormData] = useState({
    vehicle: "",
    job_type: "REGULAR",
    priority: "NORMAL",
    complaint: "",
    estimated_amount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !formData.vehicle) {
      toast({
        title: "Validation Error",
        description: "Please select a customer and vehicle",
        variant: "destructive",
      });
      return;
    }

    try {
      await createJobCard.mutateAsync({
        customer: parseInt(selectedCustomer),
        vehicle: parseInt(formData.vehicle),
        job_type: formData.job_type,
        priority: formData.priority,
        complaint: formData.complaint,
        estimated_amount: formData.estimated_amount || "0",
      });
      toast({
        title: "Job Card Created",
        description: "New service job has been created successfully",
      });
      onSuccess();
      onOpenChange(false);
      setSelectedCustomer("");
      setFormData({
        vehicle: "",
        job_type: "REGULAR",
        priority: "NORMAL",
        complaint: "",
        estimated_amount: "",
      });
    } catch (err) {
      toast({
        title: "Creation Failed",
        description: err instanceof Error ? err.message : "Failed to create job card",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Job Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select
              value={selectedCustomer}
              onValueChange={(value) => {
                setSelectedCustomer(value);
                setFormData({ ...formData, vehicle: "" });
              }}
            >
              <SelectTrigger data-testid="select-customer">
                <SelectValue placeholder={customersLoading ? "Loading..." : "Select customer"} />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle</Label>
            <Select
              value={formData.vehicle}
              onValueChange={(value) => setFormData({ ...formData, vehicle: value })}
              disabled={!selectedCustomer}
            >
              <SelectTrigger data-testid="select-vehicle">
                <SelectValue placeholder={vehiclesLoading ? "Loading..." : "Select vehicle"} />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.make} {vehicle.model} - {vehicle.plate_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type</Label>
              <Select
                value={formData.job_type}
                onValueChange={(value) => setFormData({ ...formData, job_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Regular Service</SelectItem>
                  <SelectItem value="EXPRESS">Express Service</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                  <SelectItem value="BODY_WORK">Body Work</SelectItem>
                  <SelectItem value="ACCIDENT">Accident Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint">Customer Complaint</Label>
            <Textarea
              id="complaint"
              placeholder="Describe the issue or service required..."
              value={formData.complaint}
              onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_amount">Estimated Amount ($)</Label>
            <Input
              id="estimated_amount"
              type="number"
              placeholder="0.00"
              value={formData.estimated_amount}
              onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createJobCard.isPending} data-testid="button-submit-job">
              {createJobCard.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Job Card"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ListViewProps {
  jobCards: ReturnType<typeof useJobCards>["data"];
  onTransition: (jobId: number, newStage: string) => void;
  isPending: boolean;
}

function ListView({ jobCards, onTransition, isPending }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedJobs = useMemo(() => {
    if (!jobCards) return [];
    return [...jobCards].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortField) {
        case "job_card_number":
          aVal = a.job_card_number || "";
          bVal = b.job_card_number || "";
          break;
        case "customer_name":
          aVal = a.customer_name || "";
          bVal = b.customer_name || "";
          break;
        case "workflow_stage":
          aVal = WORKFLOW_COLUMNS.findIndex((c) => c.id === a.workflow_stage);
          bVal = WORKFLOW_COLUMNS.findIndex((c) => c.id === b.workflow_stage);
          break;
        case "priority":
          const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
          break;
        case "created_at":
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
        case "estimated_amount":
          aVal = parseFloat(a.estimated_amount || "0");
          bVal = parseFloat(b.estimated_amount || "0");
          break;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [jobCards, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => toggleSort(field)}
      data-testid={`header-sort-${field}`}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  return (
    <Card className="border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader field="job_card_number">Job Card</SortHeader>
            <TableHead>Vehicle</TableHead>
            <SortHeader field="customer_name">Customer</SortHeader>
            <SortHeader field="workflow_stage">Stage</SortHeader>
            <SortHeader field="priority">Priority</SortHeader>
            <SortHeader field="estimated_amount">Amount</SortHeader>
            <SortHeader field="created_at">Created</SortHeader>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedJobs.map((job) => {
            const column = WORKFLOW_COLUMNS.find((c) => c.id === job.workflow_stage);
            const isOverdue = job.sla_deadline && new Date(job.sla_deadline) < new Date();
            const allowedTransitions = job.allowed_transitions || [];
            return (
              <TableRow key={job.id} data-testid={`row-job-${job.id}`}>
                <TableCell>
                  <Link href={`/job-cards/${job.id}`} className="font-mono text-sm hover:underline">
                    {job.job_card_number || `#${job.id}`}
                  </Link>
                  {isOverdue && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-destructive" />}
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{job.vehicle_info?.split(" - ")[0] || "Vehicle"}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{job.customer_name || "Customer"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", column?.bg, column?.text)}>
                    {column?.label || job.workflow_stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={job.priority === "CRITICAL" || job.priority === "HIGH" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {job.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="h-3.5 w-3.5" />
                    {job.estimated_amount || "0"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : ""}
                </TableCell>
                <TableCell>
                  {allowedTransitions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {allowedTransitions.map((transition) => {
                          const stage = WORKFLOW_COLUMNS.find((c) => c.id === transition.value);
                          return (
                            <DropdownMenuItem key={transition.value} onClick={() => onTransition(job.id, transition.value)}>
                              Move to {stage?.label || transition.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {sortedJobs.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No job cards found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function ActivityView() {
  const { data: serviceEvents, isLoading } = useServiceEvents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const eventIcon = (eventType: string) => {
    switch (eventType) {
      case "WORKFLOW_TRANSITION":
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case "REMARK_ADDED":
        return <Activity className="h-4 w-4 text-green-500" />;
      case "CUSTOMER_NOTIFIED":
        return <User className="h-4 w-4 text-purple-500" />;
      case "ESCALATION":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const eventLabel = (eventType: string) => {
    switch (eventType) {
      case "WORKFLOW_TRANSITION":
        return "Stage Change";
      case "REMARK_ADDED":
        return "Remark Added";
      case "CUSTOMER_NOTIFIED":
        return "Customer Notified";
      case "ESCALATION":
        return "Escalation";
      case "TASK_STARTED":
        return "Task Started";
      case "TASK_COMPLETED":
        return "Task Completed";
      case "PART_ISSUED":
        return "Part Issued";
      case "AI_INSIGHT":
        return "AI Insight";
      default:
        return eventType.replace(/_/g, " ");
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="divide-y divide-border">
            {serviceEvents?.map((event) => (
              <div key={event.id} className="flex gap-4 p-4 hover-elevate" data-testid={`activity-${event.id}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  {eventIcon(event.event_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {eventLabel(event.event_type)}
                    </Badge>
                    {event.job_card_number && (
                      <Link href={`/job-cards/${event.job_card_id}`} className="font-mono text-xs text-primary hover:underline">
                        {event.job_card_number}
                      </Link>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {event.timestamp ? format(new Date(event.timestamp), "MMM d, h:mm a") : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{event.comment || event.new_value || "No description"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    by {event.actor_name || "System"} {event.actor_role && `(${event.actor_role})`}
                  </p>
                </div>
              </div>
            ))}
            {(!serviceEvents || serviceEvents.length === 0) && (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface KanbanViewProps {
  jobCards: ReturnType<typeof useJobCards>["data"];
  onTransition: (jobId: number, newStage: string) => void;
  isPending: boolean;
}

function KanbanView({ jobCards, onTransition, isPending }: KanbanViewProps) {
  return (
    <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
      {WORKFLOW_COLUMNS.map((column) => {
        const jobsInColumn = jobCards?.filter((j) => j.workflow_stage === column.id) || [];

        return (
          <div key={column.id} className="kanban-column">
            <div
              className={cn(
                "kanban-header text-white",
                `bg-gradient-to-r ${column.gradient}`
              )}
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                {column.label}
              </span>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30"
              >
                {jobsInColumn.length}
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              {jobsInColumn.map((job) => (
                <JobCardItem
                  key={job.id}
                  job={job}
                  column={column}
                  onTransition={(newStage) => onTransition(job.id, newStage)}
                  isPending={isPending}
                />
              ))}

              {jobsInColumn.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                  <span className="text-xs text-muted-foreground">
                    No jobs in this stage
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface HistoryVehicle {
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
  customer: { id: number; name: string; phone: string };
}

interface HistoryServiceEvent {
  id: number;
  event_type: string;
  actor: string | null;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string | null;
}

interface HistoryTask {
  id: number;
  name: string;
  status: string;
  labor_cost: number;
}

interface HistoryEstimate {
  id: number;
  estimate_number: string;
  grand_total: number;
  approval_status: string;
}

interface HistoryInvoice {
  id: number;
  invoice_number: string;
  grand_total: number;
  payment_status: string;
}

interface HistoryTimelineItem {
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
  events: HistoryServiceEvent[];
  tasks: HistoryTask[];
  estimates: HistoryEstimate[];
  invoices: HistoryInvoice[];
}

interface ServiceHistoryData {
  vehicle: HistoryVehicle;
  summary: {
    total_services: number;
    completed_services: number;
    total_spent: number;
    average_rating: number;
    warranty_services: number;
    amc_services: number;
  };
  available_years: number[];
  timeline: HistoryTimelineItem[];
}

function HistoryVehicleSelector({
  onSelect,
  selectedId,
}: {
  onSelect: (id: number) => void;
  selectedId: number | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const vehicleUrl = searchTerm ? `/api/vehicles/?search=${encodeURIComponent(searchTerm)}` : "/api/vehicles/";
  const { data: vehicles, isLoading } = useQuery<HistoryVehicle[]>({
    queryKey: [vehicleUrl],
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Search Vehicle for Service History</span>
        </div>
        <Input
          placeholder="Search by plate number, make, or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-history-vehicle-search"
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
                  selectedId === vehicle.id ? "border-primary bg-primary/5" : "border-border"
                }`}
                data-testid={`history-vehicle-card-${vehicle.id}`}
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
              <div className="py-8 text-center text-muted-foreground">No vehicles found</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistorySummaryCards({ summary }: { summary: ServiceHistoryData["summary"] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <Wrench className="mb-2 h-6 w-6 text-blue-500" />
          <div className="text-2xl font-bold">{summary.total_services}</div>
          <div className="text-xs text-muted-foreground">Total Services</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <CheckCircle2 className="mb-2 h-6 w-6 text-green-500" />
          <div className="text-2xl font-bold">{summary.completed_services}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <IndianRupee className="mb-2 h-6 w-6 text-amber-500" />
          <div className="text-2xl font-bold">
            {BUSINESS_RULES.CURRENCY_SYMBOL}
            {summary.total_spent.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Total Spent</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <Star className="mb-2 h-6 w-6 text-yellow-500" />
          <div className="text-2xl font-bold">{summary.average_rating || "-"}</div>
          <div className="text-xs text-muted-foreground">Avg Rating</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <Shield className="mb-2 h-6 w-6 text-purple-500" />
          <div className="text-2xl font-bold">{summary.warranty_services}</div>
          <div className="text-xs text-muted-foreground">Warranty</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center p-4">
          <TrendingUp className="mb-2 h-6 w-6 text-cyan-500" />
          <div className="text-2xl font-bold">{summary.amc_services}</div>
          <div className="text-xs text-muted-foreground">AMC</div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTimelineCard({ item }: { item: HistoryTimelineItem }) {
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
            <div className="cursor-pointer p-4 pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/job-cards/${item.id}`}>
                        <span className="font-semibold text-primary hover:underline" data-testid={`link-history-job-card-${item.id}`}>
                          {item.job_card_number}
                        </span>
                      </Link>
                      <Badge className={stageBadgeColor}>{stageConfig?.label || item.workflow_stage}</Badge>
                      {item.is_warranty && (
                        <Badge variant="outline" className="border-purple-500 text-purple-600">Warranty</Badge>
                      )}
                      {item.is_amc && (
                        <Badge variant="outline" className="border-cyan-500 text-cyan-600">AMC</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.created_at ? format(new Date(item.created_at), "dd MMM yyyy") : "-"}
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
                    {BUSINESS_RULES.CURRENCY_SYMBOL}
                    {item.actual_amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">{item.job_type}</div>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 border-t pt-4">
              {item.complaint && (
                <div>
                  <div className="mb-1 text-sm font-medium">Complaint</div>
                  <p className="text-sm text-muted-foreground">{item.complaint}</p>
                </div>
              )}
              {item.diagnosis && (
                <div>
                  <div className="mb-1 text-sm font-medium">Diagnosis</div>
                  <p className="text-sm text-muted-foreground">{item.diagnosis}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm font-medium">Service Details</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Advisor</span>
                      <span>{item.service_advisor || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lead Technician</span>
                      <span>{item.lead_technician || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority</span>
                      <span>{item.priority}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm font-medium">Financial</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated</span>
                      <span>{BUSINESS_RULES.CURRENCY_SYMBOL}{item.estimated_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual</span>
                      <span>{BUSINESS_RULES.CURRENCY_SYMBOL}{item.actual_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {item.tasks.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium">Tasks ({item.tasks.length})</div>
                  <div className="space-y-1">
                    {item.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-sm">
                        <span>{task.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{task.status}</Badge>
                          <span className="text-muted-foreground">{BUSINESS_RULES.CURRENCY_SYMBOL}{task.labor_cost}</span>
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
                    <span className="text-sm text-muted-foreground">- {item.customer_feedback}</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Link href={`/job-cards/${item.id}`}>
                  <Button size="sm" variant="outline" data-testid={`button-history-view-details-${item.id}`}>
                    <FileText className="mr-1 h-3 w-3" />
                    View Details
                  </Button>
                </Link>
                {item.invoices.length > 0 && (
                  <Button size="sm" variant="outline">
                    <Receipt className="mr-1 h-3 w-3" />
                    {item.invoices.length} Invoice(s)
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

function ServiceHistoryView() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const buildHistoryUrl = () => {
    if (!selectedVehicleId) return "";
    let url = `/api/vehicles/${selectedVehicleId}/service_history/`;
    const params = new URLSearchParams();
    if (yearFilter !== "all") params.append("year", yearFilter);
    if (stageFilter !== "all") params.append("stage", stageFilter);
    if (params.toString()) url += `?${params.toString()}`;
    return url;
  };

  const { data, isLoading, error } = useQuery<ServiceHistoryData>({
    queryKey: [buildHistoryUrl()],
    enabled: !!selectedVehicleId,
  });

  if (!selectedVehicleId) {
    return (
      <div className="mx-auto max-w-2xl">
        <HistoryVehicleSelector onSelect={setSelectedVehicleId} selectedId={selectedVehicleId} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-2 h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load service history</p>
        <Button variant="outline" className="mt-4" onClick={() => setSelectedVehicleId(null)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Select Different Vehicle
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">{data.vehicle.color}</Badge>
            <Button variant="ghost" size="sm" onClick={() => setSelectedVehicleId(null)} data-testid="button-change-history-vehicle">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Change Vehicle
            </Button>
          </div>
        </CardContent>
      </Card>

      <HistorySummaryCards summary={data.summary} />

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32" data-testid="select-history-year-filter">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {data.available_years.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40" data-testid="select-history-stage-filter">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(WORKFLOW_STAGE_DEFINITIONS).map(([key, def]) => (
              <SelectItem key={key} value={key}>{def.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        {data.timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <History className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No service history found for this vehicle</p>
          </div>
        ) : (
          <div className="space-y-0">
            {data.timeline.map((item) => (
              <HistoryTimelineCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServiceOperations() {
  const { data: jobCards, isLoading, refetch } = useJobCards();
  const transitionMutation = useTransitionJobCard();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const handleTransition = async (jobId: number, newStage: string) => {
    try {
      await transitionMutation.mutateAsync({
        id: jobId,
        newStage,
        comment: `Transitioned to ${newStage}`,
      });
      toast({
        title: "Transition Successful",
        description: `Job moved to ${WORKFLOW_COLUMNS.find((c) => c.id === newStage)?.label}`,
      });
      refetch();
    } catch (err) {
      toast({
        title: "Transition Failed",
        description: err instanceof Error ? err.message : "Failed to transition job",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-service">
      <AppSidebar />
      <main className="ml-64 flex-1 overflow-x-auto p-6">
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Service Operations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {viewMode === "kanban" && "11-Stage Workflow: Drag jobs through the pipeline or use quick actions"}
              {viewMode === "list" && "View all job cards in a sortable table format"}
              {viewMode === "activity" && "Recent activity timeline across all job cards"}
              {viewMode === "history" && "Search vehicles and view their complete service history"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-border p-1" data-testid="view-toggle">
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
                onClick={() => setViewMode("kanban")}
                data-testid="button-view-kanban"
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
                List
              </Button>
              <Button
                variant={viewMode === "activity" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
                onClick={() => setViewMode("activity")}
                data-testid="button-view-activity"
              >
                <Activity className="h-4 w-4" />
                Activity
              </Button>
              <Button
                variant={viewMode === "history" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
                onClick={() => setViewMode("history")}
                data-testid="button-view-history"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </div>
            <Button
              className="gap-2"
              onClick={() => setCreateDialogOpen(true)}
              data-testid="button-add-job"
            >
              <Plus className="h-4 w-4" />
              New Job Card
            </Button>
          </div>
        </header>

        {viewMode === "kanban" && (
          <KanbanView
            jobCards={jobCards}
            onTransition={handleTransition}
            isPending={transitionMutation.isPending}
          />
        )}

        {viewMode === "list" && (
          <ListView
            jobCards={jobCards}
            onTransition={handleTransition}
            isPending={transitionMutation.isPending}
          />
        )}

        {viewMode === "activity" && <ActivityView />}

        {viewMode === "history" && <ServiceHistoryView />}
      </main>

      <CreateJobDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
