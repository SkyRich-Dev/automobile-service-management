import { useState, useEffect } from "react";
import { useSidebar } from "@/lib/sidebar-context";
import { AppSidebar } from "@/components/AppSidebar";
import { 
  useJobCard, 
  useJobCardAIInsight, 
  useCreateTask, 
  useUpdateTask,
  useAllowedTransitions,
  useTransitionJobCard,
  useStartTask,
  useCompleteTask,
  useAddRemark,
  useNotifyCustomer,
  useEscalate
} from "@/hooks/use-job-cards";
import { useParams, Link } from "wouter";
import { format, formatDistanceToNow, differenceInMinutes, isPast } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Bell,
  MessageSquare,
  Wrench,
  Package,
  ClipboardCheck,
  Lightbulb,
  Play,
  CheckCircle,
  Timer,
  Building,
  Phone,
  Mail,
  Calendar,
  FileText,
  UserCheck,
  Settings,
} from "lucide-react";
import {
  getStageLabel,
  getTaskStatusLabel,
  getEventTypeConfig,
  PRIORITY_DEFINITIONS,
  BUSINESS_RULES,
  MESSAGES,
  STAGE_BADGE_COLORS,
} from "@/config";

function LoadingSkeleton() {
  const { isCollapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className={cn(
        "flex-1 p-6 transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
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

const STAGE_COLORS = STAGE_BADGE_COLORS;

function SLACountdown({ deadline }: { deadline: string | null | undefined }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!deadline) return;
    
    const update = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const overdue = isPast(deadlineDate);
      setIsOverdue(overdue);
      
      if (overdue) {
        const mins = Math.abs(differenceInMinutes(now, deadlineDate));
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        setTimeLeft(`${hours}h ${minutes}m overdue`);
      } else {
        setTimeLeft(formatDistanceToNow(deadlineDate, { addSuffix: false }));
      }
    };
    
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return <span className="text-muted-foreground">Not set</span>;

  return (
    <span className={cn(
      "font-medium",
      isOverdue ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
    )}>
      {isOverdue && <AlertTriangle className="inline h-3 w-3 mr-1" />}
      {timeLeft}
    </span>
  );
}

export default function JobCardDetail() {
  const { isCollapsed } = useSidebar();
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, refetch } = useJobCard(Number(id));
  const { data: transitions } = useAllowedTransitions(Number(id));
  const generateInsight = useJobCardAIInsight();
  const transitionJobCard = useTransitionJobCard();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const startTask = useStartTask();
  const completeTask = useCompleteTask();
  const { toast } = useToast();
  
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState("");
  const [transitionComment, setTransitionComment] = useState("");
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyChannel, setNotifyChannel] = useState("EMAIL");
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateLevel, setEscalateLevel] = useState("MANAGER");
  
  const addRemark = useAddRemark();
  const notifyCustomer = useNotifyCustomer();
  const escalate = useEscalate();
  
  const [workSummaryOpen, setWorkSummaryOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(true);
  const [partsOpen, setPartsOpen] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);

  if (isLoading || !job) {
    return <LoadingSkeleton />;
  }

  const handleGenerateInsight = () => {
    generateInsight.mutate(job.id, {
      onSuccess: () => {
        toast({ title: "AI insight generated successfully" });
        refetch();
      },
      onError: (error) => {
        toast({ title: "Failed to generate insight", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleTransition = () => {
    if (!selectedTransition) {
      toast({ title: "Please select a stage", variant: "destructive" });
      return;
    }
    if (!transitionComment.trim()) {
      toast({ title: "Please add a comment for this transition", variant: "destructive" });
      return;
    }
    
    transitionJobCard.mutate(
      { id: job.id, newStage: selectedTransition, comment: transitionComment },
      {
        onSuccess: () => {
          toast({ title: "Stage updated successfully" });
          setTransitionDialogOpen(false);
          setSelectedTransition("");
          setTransitionComment("");
          refetch();
        },
        onError: (error) => {
          toast({ title: "Failed to update stage", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;

    createTask.mutate(
      { job_card: job.id, description: newTaskDesc, status: "PENDING" },
      {
        onSuccess: () => {
          setNewTaskDesc("");
          toast({ title: "Task added" });
          refetch();
        },
      }
    );
  };

  const handleStartTask = (taskId: number) => {
    startTask.mutate(
      { taskId, jobCardId: job.id },
      {
        onSuccess: () => {
          toast({ title: "Task started" });
          refetch();
        },
        onError: (error) => {
          toast({ title: "Failed to start task", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const handleCompleteTask = (taskId: number) => {
    completeTask.mutate(
      { taskId, jobCardId: job.id },
      {
        onSuccess: () => {
          toast({ title: "Task completed" });
          refetch();
        },
        onError: (error) => {
          toast({ title: "Failed to complete task", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const toggleTask = (taskId: number, currentCompleted: boolean) => {
    updateTask.mutate(
      { id: taskId, jobCardId: job.id, status: !currentCompleted ? "COMPLETED" : "PENDING" },
      { onSuccess: () => refetch() }
    );
  };

  const handleAddRemark = () => {
    if (!remarkText.trim()) return;
    addRemark.mutate(
      { jobCardId: job.id, remark: remarkText },
      {
        onSuccess: () => {
          toast({ title: "Remark added successfully" });
          setRemarkDialogOpen(false);
          setRemarkText("");
          refetch();
        },
        onError: (error) => {
          toast({ title: "Failed to add remark", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const handleNotifyCustomer = () => {
    notifyCustomer.mutate(
      { jobCardId: job.id, message: notifyMessage || undefined, channel: notifyChannel },
      {
        onSuccess: () => {
          toast({ title: "Customer notified successfully" });
          setNotifyDialogOpen(false);
          setNotifyMessage("");
          refetch();
        },
        onError: (error) => {
          toast({ title: "Failed to notify customer", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const handleEscalate = () => {
    if (!escalateReason.trim()) {
      toast({ title: "Please provide a reason for escalation", variant: "destructive" });
      return;
    }
    escalate.mutate(
      { jobCardId: job.id, reason: escalateReason, level: escalateLevel },
      {
        onSuccess: () => {
          toast({ title: "Job card escalated successfully" });
          setEscalateDialogOpen(false);
          setEscalateReason("");
          refetch();
        },
        onError: (error) => {
          toast({ title: "Failed to escalate", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const slaDeadline = job.sla_deadline;
  const isOverdue = slaDeadline && isPast(new Date(slaDeadline));

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-job-detail">
      <AppSidebar />
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        {/* Sticky Header */}
        <header className={cn(
          "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4",
          isOverdue && "border-red-300 dark:border-red-800"
        )}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <Link href="/service">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold" data-testid="text-job-number">
                    {job.job_card_number}
                  </h1>
                  <Badge className={cn("text-xs", STAGE_COLORS[job.workflow_stage])} data-testid="badge-stage">
                    {job.workflow_stage.replace(/_/g, " ")}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      SLA BREACH
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1" data-testid="text-tracking-id">
                  Tracking: {job.service_tracking_id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Action Buttons */}
              <Button variant="outline" size="sm" onClick={() => setNotifyDialogOpen(true)} data-testid="button-notify">
                <Bell className="h-4 w-4 mr-1" />
                Notify
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRemarkDialogOpen(true)} data-testid="button-remark">
                <MessageSquare className="h-4 w-4 mr-1" />
                Remark
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEscalateDialogOpen(true)} className={cn(isOverdue && "border-red-500 text-red-600")} data-testid="button-escalate">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Escalate
              </Button>
              
              {/* Stage Transition */}
              {transitions?.allowed_transitions && transitions.allowed_transitions.length > 0 && (
                <Button onClick={() => setTransitionDialogOpen(true)} data-testid="button-change-stage">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Change Stage
                </Button>
              )}
            </div>
          </div>

          {/* Key Info Bar */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="font-medium truncate" data-testid="text-vehicle-info">
                  {job.vehicle_detail?.plate_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium truncate" data-testid="text-customer-name">
                  {job.customer_detail?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Advisor</p>
                <p className="font-medium truncate">{job.advisor_name || "Not assigned"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Technician</p>
                <p className="font-medium truncate">{job.technician_name || "Not assigned"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="font-medium">{job.created_at ? format(new Date(job.created_at), "PP") : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">SLA Countdown</p>
                <SLACountdown deadline={slaDeadline} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Details */}
            <div className="space-y-4 lg:col-span-2">
              {/* Vehicle & Customer Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      Vehicle Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Make/Model</span>
                      <span className="font-medium">{job.vehicle_detail?.make} {job.vehicle_detail?.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plate</span>
                      <span className="font-mono font-medium">{job.vehicle_detail?.plate_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VIN</span>
                      <span className="font-mono text-xs">{job.vehicle_detail?.vin || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Odometer In</span>
                      <span className="font-medium">{job.odometer_in?.toLocaleString()} km</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{job.customer_detail?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {job.customer_detail?.phone}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-xs truncate max-w-[150px] flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {job.customer_detail?.email}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Summary */}
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

              {/* Collapsible: Work Summary */}
              <Collapsible open={workSummaryOpen} onOpenChange={setWorkSummaryOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Work Summary
                        </span>
                        {workSummaryOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Issues Reported</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {job.complaint || "No issues reported"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Diagnosis</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {job.diagnosis || "Diagnosis pending"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Estimated Hours</h4>
                          <p className="text-lg font-bold">{job.estimated_hours || "0"} hrs</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Estimated Amount</h4>
                          <p className="text-lg font-bold">${parseFloat(job.estimated_amount || "0").toLocaleString()}</p>
                        </div>
                      </div>
                      {!job.ai_summary && (
                        <Button
                          onClick={handleGenerateInsight}
                          disabled={generateInsight.isPending}
                          variant="outline"
                          className="w-full gap-2"
                          data-testid="button-ai-insight"
                        >
                          {generateInsight.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Generate AI Insight
                        </Button>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Collapsible: Service Tasks */}
              <Collapsible open={tasksOpen} onOpenChange={setTasksOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          Service Tasks
                          <Badge variant="secondary" className="ml-2">{job.tasks?.length || 0}</Badge>
                        </span>
                        {tasksOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {job.tasks?.map((task) => {
                        const isCompleted = task.status === "COMPLETED";
                        const isInProgress = task.status === "IN_PROGRESS";
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "rounded-lg p-3 border",
                              isCompleted ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" :
                              isInProgress ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800" :
                              "bg-muted border-transparent"
                            )}
                            data-testid={`task-${task.id}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <button 
                                  className="shrink-0 mt-0.5"
                                  onClick={() => toggleTask(task.id, isCompleted)}
                                >
                                  {isCompleted ? (
                                    <CheckSquare className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Square className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <p className={cn("text-sm font-medium", isCompleted && "line-through text-muted-foreground")}>
                                    {task.description}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    {task.technician_name && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {task.technician_name}
                                      </span>
                                    )}
                                    {task.start_time && (
                                      <span className="flex items-center gap-1">
                                        <Play className="h-3 w-3" />
                                        {format(new Date(task.start_time), "p")}
                                      </span>
                                    )}
                                    {task.end_time && (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        {format(new Date(task.end_time), "p")}
                                      </span>
                                    )}
                                    {task.is_rework && (
                                      <Badge variant="destructive" className="text-xs">Rework</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!isCompleted && !isInProgress && (
                                  <Button size="sm" variant="ghost" onClick={() => handleStartTask(task.id)}>
                                    <Play className="h-3 w-3" />
                                  </Button>
                                )}
                                {isInProgress && (
                                  <Button size="sm" variant="ghost" onClick={() => handleCompleteTask(task.id)}>
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
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
                        <Button type="submit" size="icon" disabled={!newTaskDesc.trim()} data-testid="button-add-task">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </form>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Collapsible: Parts & Consumables */}
              <Collapsible open={partsOpen} onOpenChange={setPartsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          Parts & Consumables
                        </span>
                        {partsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="py-8 text-center text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Parts tracking available in Inventory module</p>
                        <p className="text-xs mt-1">Parts Amount: ${parseFloat(job.parts_amount?.toString() || "0").toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Collapsible: Quality Check */}
              <Collapsible open={qcOpen} onOpenChange={setQcOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                          Quality Check
                        </span>
                        {qcOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {job.inspection ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Inspection Status</span>
                            <Badge variant={job.inspection.is_completed ? "default" : "secondary"}>
                              {job.inspection.is_completed ? "Completed" : "Pending"}
                            </Badge>
                          </div>
                          {job.inspection.findings && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Findings</h4>
                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{job.inspection.findings}</p>
                            </div>
                          )}
                          {job.inspection.recommendations && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Recommendations</h4>
                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{job.inspection.recommendations}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No inspection data yet</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Collapsible: Recommendations */}
              <Collapsible open={recommendationsOpen} onOpenChange={setRecommendationsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-muted-foreground" />
                          Future Advice & Recommendations
                        </span>
                        {recommendationsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="py-8 text-center text-muted-foreground">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Recommendations will be added after service completion</p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Right Column - Timeline */}
            <div className="space-y-4">
              <Card className="sticky top-[180px]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Service Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative ml-3 border-l-2 border-border pl-6 max-h-[500px] overflow-y-auto">
                    {job.timeline_events?.map((event, idx) => (
                      <div key={idx} className="relative mb-6 last:mb-0">
                        <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                        <p className="text-xs text-muted-foreground">
                          {event.timestamp ? format(new Date(event.timestamp), "PP p") : "Unknown"}
                        </p>
                        <p className="text-sm font-semibold">
                          {event.event_type.replace(/_/g, " ")}
                        </p>
                        {event.actor_name && (
                          <p className="text-xs text-muted-foreground">
                            By: {event.actor_name} {event.actor_role && `(${event.actor_role})`}
                          </p>
                        )}
                        {event.old_value && event.new_value && (
                          <p className="text-xs text-muted-foreground">
                            {event.old_value} → {event.new_value}
                          </p>
                        )}
                        {event.comment && (
                          <div className="mt-2 rounded-lg bg-muted p-2">
                            <p className="text-xs italic text-muted-foreground">"{event.comment}"</p>
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

              {/* Estimates */}
              {job.estimates && job.estimates.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Estimates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {job.estimates.map((est) => (
                      <div key={est.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">{est.estimate_number}</p>
                          <p className="text-xs text-muted-foreground">v{est.version}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">${parseFloat(est.grand_total).toLocaleString()}</p>
                          <Badge variant={est.approval_status === "APPROVED" ? "default" : "secondary"} className="text-xs">
                            {est.approval_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Stage Transition Dialog */}
      <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Service Stage</DialogTitle>
            <DialogDescription>
              Current stage: {job.workflow_stage.replace(/_/g, " ")}. Select a new stage and provide a comment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Stage</label>
              <Select value={selectedTransition} onValueChange={setSelectedTransition}>
                <SelectTrigger data-testid="select-new-stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {transitions?.allowed_transitions?.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Comment (Required)</label>
              <Textarea
                placeholder="Enter reason for stage change..."
                value={transitionComment}
                onChange={(e) => setTransitionComment(e.target.value)}
                className="mt-1"
                data-testid="input-transition-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransition} disabled={transitionJobCard.isPending} data-testid="button-confirm-transition">
              {transitionJobCard.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Remark Dialog */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remark</DialogTitle>
            <DialogDescription>
              Add a note or comment to this job card. This will be logged in the timeline.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your remark..."
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            data-testid="input-remark"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRemark} disabled={!remarkText.trim() || addRemark.isPending} data-testid="button-add-remark">
              {addRemark.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Remark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Customer Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify Customer</DialogTitle>
            <DialogDescription>
              Send a notification to the customer about their vehicle service status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Channel</label>
              <Select value={notifyChannel} onValueChange={setNotifyChannel}>
                <SelectTrigger data-testid="select-notify-channel">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Message (Optional)</label>
              <Textarea
                placeholder="Custom message for the customer..."
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                className="mt-1"
                data-testid="input-notify-message"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty to use default status update message</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleNotifyCustomer} disabled={notifyCustomer.isPending} data-testid="button-send-notify">
              {notifyCustomer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Job Card</DialogTitle>
            <DialogDescription>
              Escalate this job card to management for urgent attention.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Escalation Level</label>
              <Select value={escalateLevel} onValueChange={setEscalateLevel}>
                <SelectTrigger data-testid="select-escalate-level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="MANAGER">Branch Manager</SelectItem>
                  <SelectItem value="REGIONAL_MANAGER">Regional Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Required)</label>
              <Textarea
                placeholder="Explain why this job card needs escalation..."
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                className="mt-1"
                data-testid="input-escalate-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEscalate} 
              disabled={!escalateReason.trim() || escalate.isPending} 
              variant="destructive"
              data-testid="button-confirm-escalate"
            >
              {escalate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
