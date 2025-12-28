import { useAuth } from "@/hooks/use-auth";
import { useJobCards } from "@/hooks/use-job-cards";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const WORKFLOW_STAGES = [
  { id: "APPOINTMENT", label: "Appt", color: "from-blue-400 to-blue-500" },
  { id: "CHECK_IN", label: "Check-in", color: "from-cyan-400 to-cyan-500" },
  { id: "INSPECTION", label: "Inspect", color: "from-teal-400 to-teal-500" },
  { id: "JOB_CARD", label: "Job Card", color: "from-emerald-400 to-emerald-500" },
  { id: "ESTIMATE", label: "Estimate", color: "from-green-400 to-green-500" },
  { id: "APPROVAL", label: "Approval", color: "from-lime-400 to-lime-500" },
  { id: "EXECUTION", label: "Exec", color: "from-yellow-400 to-yellow-500" },
  { id: "QC", label: "QC", color: "from-amber-400 to-amber-500" },
  { id: "BILLING", label: "Billing", color: "from-orange-400 to-orange-500" },
  { id: "DELIVERY", label: "Delivery", color: "from-red-400 to-red-500" },
  { id: "COMPLETED", label: "Done", color: "from-slate-400 to-slate-500" },
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
  color: string;
}) {
  return (
    <Card className="card-hover stat-glow border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
              {trend && (
                <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" />
                  {trend}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn("rounded-xl p-2.5", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-8">
          <div className="skeleton mb-2 h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: jobCards, isLoading } = useJobCards();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const totalJobs = jobCards?.length || 0;
  const inExecution = jobCards?.filter((j) => j.workflow_stage === "EXECUTION").length || 0;
  const pendingApproval = jobCards?.filter((j) => j.workflow_stage === "APPROVAL").length || 0;
  const inQC = jobCards?.filter((j) => j.workflow_stage === "QC").length || 0;
  const completed = jobCards?.filter((j) => j.workflow_stage === "COMPLETED").length || 0;
  const revenue = jobCards?.reduce((acc, curr) => acc + Number(curr.estimated_amount || 0), 0) || 0;

  const stageData = WORKFLOW_STAGES.map((stage) => ({
    name: stage.label,
    value: jobCards?.filter((j) => j.workflow_stage === stage.id).length || 0,
  })).filter((d) => d.value > 0);

  const statsCards = [
    {
      title: "Total Revenue",
      value: `$${revenue.toLocaleString()}`,
      subtitle: "From all service jobs",
      icon: TrendingUp,
      trend: "+12%",
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    {
      title: "In Execution",
      value: inExecution,
      subtitle: "Jobs being worked on",
      icon: Wrench,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Pending Approval",
      value: pendingApproval,
      subtitle: "Awaiting customer OK",
      icon: Clock,
      color: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
    {
      title: "Quality Check",
      value: inQC,
      subtitle: "Inspection pending",
      icon: CheckCircle,
      color: "bg-gradient-to-br from-violet-500 to-violet-600",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background gradient-mesh" data-testid="page-dashboard">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {user?.first_name || user?.username}. Here's your operations overview.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatCard key={stat.title} {...stat} data-testid={`card-stat-${index}`} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base font-semibold">Jobs by Stage</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {totalJobs} Total
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      width={70}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobCards?.slice(0, 6).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                    data-testid={`card-job-${job.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {job.job_card_number || `#${job.id}`}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.customer_name}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px] font-semibold",
                        job.workflow_stage === "COMPLETED" && "badge-success",
                        job.workflow_stage === "EXECUTION" && "badge-info",
                        job.workflow_stage === "APPROVAL" && "badge-warning"
                      )}
                    >
                      {(job.workflow_stage || "").replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
                {(!jobCards || jobCards.length === 0) && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No recent jobs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-border/50">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Workflow Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {WORKFLOW_STAGES.map((stage) => {
                const count = jobCards?.filter((j) => j.workflow_stage === stage.id).length || 0;
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "flex min-w-[90px] flex-1 flex-col items-center rounded-xl p-4 text-white",
                      `bg-gradient-to-br ${stage.color}`
                    )}
                  >
                    <span className="text-2xl font-bold">{count}</span>
                    <span className="mt-0.5 text-[11px] font-medium opacity-90">
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
