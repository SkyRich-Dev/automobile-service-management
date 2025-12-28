import { AppSidebar } from "@/components/AppSidebar";
import { useJobCards, useTransitionJobCard } from "@/hooks/use-job-cards";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  AlertTriangle,
  MoreHorizontal,
  ArrowRight,
  Clock,
  Car,
  User,
  DollarSign,
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

interface JobCardProps {
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
  };
  column: typeof WORKFLOW_COLUMNS[0];
  onTransition: (newStage: string) => void;
}

function JobCard({ job, column, onTransition }: JobCardProps) {
  const currentIndex = WORKFLOW_COLUMNS.findIndex((c) => c.id === column.id);
  const nextStage = currentIndex < WORKFLOW_COLUMNS.length - 1 ? WORKFLOW_COLUMNS[currentIndex + 1] : null;
  const isOverdue = job.sla_deadline && new Date(job.sla_deadline) < new Date();
  const isHighPriority = job.priority === "HIGH" || job.priority === "CRITICAL";

  return (
    <Card
      className={cn(
        "group cursor-pointer border-border/50 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30"
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
                {WORKFLOW_COLUMNS.filter((c) => c.id !== column.id).map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={(e) => {
                      e.preventDefault();
                      onTransition(c.id);
                    }}
                  >
                    Move to {c.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
                onTransition(nextStage.id);
              }}
            >
              <span>Move to {nextStage.label}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

export default function ServiceOperations() {
  const { data: jobCards, isLoading, refetch } = useJobCards();
  const transitionMutation = useTransitionJobCard();

  const handleTransition = async (jobId: number, newStage: string) => {
    try {
      await transitionMutation.mutateAsync({
        id: jobId,
        newStage,
        comment: `Transitioned to ${newStage}`,
      });
      refetch();
    } catch (err) {
      console.error("Transition failed:", err);
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
          <Button className="gap-2" data-testid="button-add-job">
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
                    <JobCard
                      key={job.id}
                      job={job}
                      column={column}
                      onTransition={(newStage) => handleTransition(job.id, newStage)}
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
    </div>
  );
}
