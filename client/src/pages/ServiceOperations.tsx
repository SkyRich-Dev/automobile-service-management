import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useJobCards, useTransitionJobCard, useCreateJobCard } from "@/hooks/use-job-cards";
import { useCustomers, useVehicles } from "@/hooks/use-crm";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  User,
  DollarSign,
  Loader2,
} from "lucide-react";

const WORKFLOW_COLUMNS = [
  { id: "APPOINTMENT", label: "Appointment", gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  { id: "CHECK_IN", label: "Check-in", gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" },
  { id: "INSPECTION", label: "Inspection", gradient: "from-teal-500 to-teal-600", bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400" },
  { id: "JOB_CARD", label: "Job Card", gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  { id: "ESTIMATE", label: "Estimate", gradient: "from-green-500 to-green-600", bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
  { id: "APPROVAL", label: "Approval", gradient: "from-lime-500 to-lime-600", bg: "bg-lime-500/10", text: "text-lime-600 dark:text-lime-400" },
  { id: "EXECUTION", label: "Execution", gradient: "from-yellow-500 to-yellow-600", bg: "bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-400" },
  { id: "QC", label: "QC", gradient: "from-amber-500 to-amber-600", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  { id: "BILLING", label: "Billing", gradient: "from-orange-500 to-orange-600", bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
  { id: "DELIVERY", label: "Delivery", gradient: "from-red-500 to-red-600", bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" },
  { id: "COMPLETED", label: "Completed", gradient: "from-slate-500 to-slate-600", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400" },
];


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

export default function ServiceOperations() {
  const { data: jobCards, isLoading, refetch } = useJobCards();
  const transitionMutation = useTransitionJobCard();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Service Operations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              11-Stage Workflow: Drag jobs through the pipeline or use quick actions
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-add-job"
          >
            <Plus className="h-4 w-4" />
            New Job Card
          </Button>
        </header>

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
                      onTransition={(newStage) => handleTransition(job.id, newStage)}
                      isPending={transitionMutation.isPending}
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
      </main>

      <CreateJobDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
