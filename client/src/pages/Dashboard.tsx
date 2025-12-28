import { useAuth } from "@/hooks/use-auth";
import { useJobCards } from "@/hooks/use-job-cards";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  LinearProgress,
  Grid,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import InventoryIcon from "@mui/icons-material/Inventory";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const stageColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  APPOINTMENT: "info",
  CHECK_IN: "info",
  INSPECTION: "primary",
  JOB_CARD: "primary",
  ESTIMATE: "secondary",
  APPROVAL: "warning",
  EXECUTION: "warning",
  QC: "secondary",
  BILLING: "success",
  DELIVERY: "success",
  COMPLETED: "default",
};

const STAGE_COLORS = [
  "#64b5f6", "#4fc3f7", "#4dd0e1", "#4db6ac", "#81c784",
  "#aed581", "#dce775", "#fff176", "#ffb74d", "#ff8a65", "#90a4ae"
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: jobCards, isLoading } = useJobCards();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const totalJobs = jobCards?.length || 0;
  const inExecution = jobCards?.filter((j) => j.workflow_stage === "EXECUTION" || j.status === "EXECUTION").length || 0;
  const completed = jobCards?.filter((j) => j.workflow_stage === "COMPLETED" || j.status === "COMPLETED").length || 0;
  const pendingApproval = jobCards?.filter((j) => j.workflow_stage === "APPROVAL" || j.status === "APPROVAL").length || 0;
  const inQC = jobCards?.filter((j) => j.workflow_stage === "QC" || j.status === "QC").length || 0;
  const revenue = jobCards?.reduce((acc, curr) => acc + Number(curr.estimated_amount || 0), 0) || 0;

  const stageData = [
    { name: "Appointment", value: jobCards?.filter((j) => j.workflow_stage === "APPOINTMENT").length || 0 },
    { name: "Check-in", value: jobCards?.filter((j) => j.workflow_stage === "CHECK_IN").length || 0 },
    { name: "Inspection", value: jobCards?.filter((j) => j.workflow_stage === "INSPECTION").length || 0 },
    { name: "Job Card", value: jobCards?.filter((j) => j.workflow_stage === "JOB_CARD").length || 0 },
    { name: "Estimate", value: jobCards?.filter((j) => j.workflow_stage === "ESTIMATE").length || 0 },
    { name: "Approval", value: jobCards?.filter((j) => j.workflow_stage === "APPROVAL").length || 0 },
    { name: "Execution", value: jobCards?.filter((j) => j.workflow_stage === "EXECUTION").length || 0 },
    { name: "QC", value: jobCards?.filter((j) => j.workflow_stage === "QC").length || 0 },
    { name: "Billing", value: jobCards?.filter((j) => j.workflow_stage === "BILLING").length || 0 },
    { name: "Delivery", value: jobCards?.filter((j) => j.workflow_stage === "DELIVERY").length || 0 },
    { name: "Completed", value: jobCards?.filter((j) => j.workflow_stage === "COMPLETED").length || 0 },
  ].filter(d => d.value > 0);

  const statsCards = [
    { title: "Total Revenue", value: `$${revenue.toLocaleString()}`, subtitle: "From all job cards", icon: TrendingUpIcon, color: "#10b981" },
    { title: "In Execution", value: inExecution, subtitle: "Jobs being worked on", icon: BuildIcon, color: "#3b82f6" },
    { title: "Pending Approval", value: pendingApproval, subtitle: "Awaiting customer approval", icon: WarningIcon, color: "#f59e0b" },
    { title: "In QC", value: inQC, subtitle: "Quality check pending", icon: CheckCircleIcon, color: "#8b5cf6" },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }} data-testid="page-dashboard">
      <AppSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: "240px" }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom data-testid="text-dashboard-title">
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.first_name || user?.username}. Here&apos;s your service operations overview.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Grid item key={stat.title} xs={12} sm={6} md={3}>
              <Card elevation={2} data-testid={`card-stat-${index}`}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <stat.icon sx={{ color: stat.color, fontSize: 20 }} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                  Jobs by Workflow Stage
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} width={80} />
                      <Tooltip
                        cursor={{ fill: "#F1F5F9" }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Bar dataKey="value" fill="#1976d2" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card elevation={2} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                  Recent Job Cards
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {jobCards?.slice(0, 6).map((job) => (
                    <Box
                      key={job.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: "grey.100",
                        borderRadius: 1,
                      }}
                      data-testid={`card-job-${job.id}`}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {job.job_card_number || `#${job.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {job.customer_name}
                        </Typography>
                      </Box>
                      <Chip
                        label={(job.workflow_stage || job.status || "").replace(/_/g, " ")}
                        size="small"
                        color={stageColors[job.workflow_stage || job.status || ""] || "default"}
                        sx={{ fontSize: 10, height: 22 }}
                      />
                    </Box>
                  ))}
                  {(!jobCards || jobCards.length === 0) && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                      No recent jobs found.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                  Workflow Pipeline Overview
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {[
                    { stage: "APPOINTMENT", label: "Appointment" },
                    { stage: "CHECK_IN", label: "Check-in" },
                    { stage: "INSPECTION", label: "Inspection" },
                    { stage: "JOB_CARD", label: "Job Card" },
                    { stage: "ESTIMATE", label: "Estimate" },
                    { stage: "APPROVAL", label: "Approval" },
                    { stage: "EXECUTION", label: "Execution" },
                    { stage: "QC", label: "QC" },
                    { stage: "BILLING", label: "Billing" },
                    { stage: "DELIVERY", label: "Delivery" },
                    { stage: "COMPLETED", label: "Complete" },
                  ].map((item, index) => {
                    const count = jobCards?.filter((j) => j.workflow_stage === item.stage || j.status === item.stage).length || 0;
                    return (
                      <Box
                        key={item.stage}
                        sx={{
                          flex: 1,
                          minWidth: 80,
                          p: 1.5,
                          bgcolor: STAGE_COLORS[index],
                          borderRadius: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h5" fontWeight="bold" sx={{ color: index < 8 ? "black" : "white" }}>
                          {count}
                        </Typography>
                        <Typography variant="caption" sx={{ color: index < 8 ? "black" : "white", opacity: 0.8 }}>
                          {item.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
