import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useJobCard, useJobCardAIInsight, useCreateTask, useUpdateTask } from "@/hooks/use-job-cards";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  CheckSquare,
  Square,
  Plus,
  Car,
  User,
  ArrowLeft,
  Clock,
  Loader2,
} from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-6">
          <div className="skeleton mb-2 h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-48 rounded-xl" />
            <div className="skeleton h-64 rounded-xl" />
          </div>
          <div className="skeleton h-96 rounded-xl" />
        </div>
      </main>
    </div>
  );
}

export default function JobCardDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, refetch } = useJobCard(Number(id));
  const generateInsight = useJobCardAIInsight();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [newTaskDesc, setNewTaskDesc] = useState("");

  if (isLoading || !job) {
    return <LoadingSkeleton />;
  }

  const handleGenerateInsight = () => {
    generateInsight.mutate(job.id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;

    createTask.mutate(
      {
        job_card: job.id,
        description: newTaskDesc,
        status: "PENDING",
      },
      {
        onSuccess: () => {
          setNewTaskDesc("");
          refetch();
        },
      }
    );
  };

  const toggleTask = (taskId: number, currentCompleted: boolean) => {
    updateTask.mutate(
      {
        id: taskId,
        jobCardId: job.id,
        status: !currentCompleted ? "COMPLETED" : "PENDING",
      },
      {
        onSuccess: () => refetch(),
      }
    );
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return "";
    const statusMap: Record<string, string> = {
      APPOINTMENT: "badge-info",
      CHECK_IN: "badge-info",
      INSPECTION: "badge-info",
      EXECUTION: "badge-warning",
      QC: "badge-warning",
      COMPLETED: "badge-success",
      DELIVERED: "badge-success",
    };
    return statusMap[status] || "";
  };

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-job-detail">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Link href="/service">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">
                Job Card #{job.id}
              </h1>
              <Badge
                variant="outline"
                className={cn("text-xs", getStatusBadge(job.workflow_stage || job.status))}
              >
                {(job.workflow_stage || job.status || "").replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created on {job.created_at ? format(new Date(job.created_at), "PPP") : "Unknown"}
            </p>
          </div>
          <Button
            onClick={handleGenerateInsight}
            disabled={generateInsight.isPending}
            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            data-testid="button-ai-insight"
          >
            {generateInsight.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate AI Insight
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Vehicle</span>
                    <span className="text-sm font-medium">
                      {job.vehicle_detail?.make} {job.vehicle_detail?.model}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Plate</span>
                    <span className="text-sm font-medium font-mono">
                      {job.vehicle_detail?.plate_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">VIN</span>
                    <span className="text-sm font-medium font-mono">
                      {job.vehicle_detail?.vin}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">{job.customer_detail?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="text-sm font-medium">{job.customer_detail?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {job.customer_detail?.email}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {job.ai_summary && (
              <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 dark:border-violet-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-violet-900 dark:text-violet-100">
                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    AI Diagnostics Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-violet-800 dark:text-violet-200">
                    {job.ai_summary}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Service Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {job.tasks?.map((task) => {
                  const isCompleted = task.status === "COMPLETED";
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer",
                        isCompleted
                          ? "bg-muted/50"
                          : "bg-muted hover:bg-muted/80"
                      )}
                      onClick={() => toggleTask(task.id, isCompleted)}
                      data-testid={`task-${task.id}`}
                    >
                      <button className="shrink-0">
                        {isCompleted ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <span
                        className={cn(
                          "text-sm",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {task.description}
                      </span>
                    </div>
                  );
                })}

                {(!job.tasks || job.tasks.length === 0) && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No tasks added yet
                  </p>
                )}

                <form onSubmit={handleAddTask} className="mt-4 flex gap-2">
                  <Input
                    placeholder="Add a new task..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newTaskDesc.trim()}
                    data-testid="button-add-task"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative ml-3 border-l-2 border-border pl-6">
                {job.timeline_events?.map((event, idx) => (
                  <div key={idx} className="relative mb-6 last:mb-0">
                    <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                    <p className="text-xs text-muted-foreground">
                      {event.timestamp
                        ? format(new Date(event.timestamp), "PP p")
                        : "Unknown"}
                    </p>
                    <p className="text-sm font-semibold">
                      {event.event_type.replace(/_/g, " ")}
                    </p>
                    {(event as any).status && (
                      <p className="text-xs text-muted-foreground">
                        Status: {(event as any).status}
                      </p>
                    )}
                    {event.comment && (
                      <div className="mt-2 rounded-lg bg-muted p-2">
                        <p className="text-xs italic text-muted-foreground">
                          "{event.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {(!job.timeline_events || job.timeline_events.length === 0) && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No timeline events yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
