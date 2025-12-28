import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Car,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsSummary {
  period_days: number;
  total_jobs: number;
  completed_jobs: number;
  completion_rate: number;
  total_revenue: number;
  labor_revenue: number;
  parts_revenue: number;
  average_job_value: number;
  sla_compliance_rate: number;
  new_customers: number;
  appointments_scheduled: number;
  appointments_completed: number;
  stage_distribution: Array<{ workflow_stage: string; count: number }>;
  daily_revenue: Array<{ day: string; revenue: number }>;
}

const STAGE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6"
];

const STAGE_LABELS: Record<string, string> = {
  APPOINTMENT: "Appointment",
  CHECK_IN: "Check-in",
  INSPECTION: "Inspection",
  JOB_CARD: "Job Card",
  ESTIMATE: "Estimate",
  APPROVAL: "Approval",
  EXECUTION: "Execution",
  QC: "QC",
  BILLING: "Billing",
  DELIVERY: "Delivery",
  COMPLETED: "Completed",
};

export default function Analytics() {
  const [period, setPeriod] = useState("30");

  const { data: analytics, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary", { days: period }],
  });

  const stageData = analytics?.stage_distribution?.map((item) => ({
    name: STAGE_LABELS[item.workflow_stage] || item.workflow_stage,
    value: item.count,
  })) || [];

  const revenueData = analytics?.daily_revenue?.map((item) => ({
    date: item.day,
    revenue: item.revenue,
  })) || [];

  return (
    <div className="flex h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Business insights and performance metrics</p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40" data-testid="select-period">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold" data-testid="text-total-revenue">
                          ${analytics.total_revenue.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Labor: ${analytics.labor_revenue.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Jobs Completed</p>
                        <p className="text-2xl font-bold" data-testid="text-completed-jobs">
                          {analytics.completed_jobs} / {analytics.total_jobs}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">{analytics.completion_rate}% rate</span>
                        </div>
                      </div>
                      <Car className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Job Value</p>
                        <p className="text-2xl font-bold" data-testid="text-avg-job-value">
                          ${analytics.average_job_value.toFixed(0)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(analytics.sla_compliance_rate < 80 && "border-orange-500")}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">SLA Compliance</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          analytics.sla_compliance_rate >= 80 ? "text-green-600" : "text-orange-600"
                        )} data-testid="text-sla-compliance">
                          {analytics.sla_compliance_rate}%
                        </p>
                        <Progress
                          value={analytics.sla_compliance_rate}
                          className={cn(
                            "h-1.5 mt-2",
                            analytics.sla_compliance_rate < 80 && "[&>div]:bg-orange-500"
                          )}
                        />
                      </div>
                      {analytics.sla_compliance_rate >= 80 ? (
                        <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                      ) : (
                        <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">New Customers</p>
                        <p className="text-2xl font-bold">{analytics.new_customers}</p>
                      </div>
                      <Users className="h-8 w-8 text-indigo-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Appointments</p>
                        <p className="text-2xl font-bold">
                          {analytics.appointments_completed} / {analytics.appointments_scheduled}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-cyan-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Parts Revenue</p>
                        <p className="text-2xl font-bold">${analytics.parts_revenue.toLocaleString()}</p>
                      </div>
                      <Activity className="h-8 w-8 text-pink-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Period</p>
                        <p className="text-2xl font-bold">{analytics.period_days} days</p>
                      </div>
                      <Clock className="h-8 w-8 text-gray-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {revenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            className="text-xs"
                            tickFormatter={(value) => format(new Date(value), "MMM d")}
                          />
                          <YAxis
                            className="text-xs"
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                            labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No revenue data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Jobs by Stage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stageData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stageData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            className="text-xs"
                          />
                          <Tooltip />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {stageData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No stage data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stage Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {stageData.map((stage, index) => (
                      <div key={stage.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: STAGE_COLORS[index % STAGE_COLORS.length] }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{stage.name}</p>
                          <p className="text-2xl font-bold">{stage.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No analytics data available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
