import { useAuth } from "@/hooks/use-auth";
import { useJobCards } from "@/hooks/use-job-cards";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  APPOINTED: "info",
  CHECKED_IN: "info",
  IN_PROGRESS: "warning",
  ON_HOLD: "error",
  QC_PENDING: "secondary",
  READY_FOR_DELIVERY: "success",
  DELIVERED: "default",
};

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
  const inProgress = jobCards?.filter((j) => j.status === "IN_PROGRESS").length || 0;
  const completed = jobCards?.filter((j) => j.status === "READY_FOR_DELIVERY").length || 0;
  const revenue = jobCards?.reduce((acc, curr) => acc + Number(curr.estimated_amount || 0), 0) || 0;

  const chartData = [
    { name: "Mon", jobs: 4 },
    { name: "Tue", jobs: 7 },
    { name: "Wed", jobs: 5 },
    { name: "Thu", jobs: 9 },
    { name: "Fri", jobs: 6 },
    { name: "Sat", jobs: 3 },
  ];

  const statsCards = [
    { title: "Total Revenue", value: `$${revenue.toLocaleString()}`, subtitle: "+20.1% from last month", icon: TrendingUpIcon, color: "#10b981" },
    { title: "Active Jobs", value: inProgress, subtitle: "+4 since yesterday", icon: BuildIcon, color: "#3b82f6" },
    { title: "Completed", value: completed, subtitle: "+12% from last week", icon: CheckCircleIcon, color: "#8b5cf6" },
    { title: "Total Customers", value: "573", subtitle: "+201 this year", icon: PeopleIcon, color: "#f97316" },
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
            Welcome back, {user?.first_name || user?.username}. Here&apos;s what&apos;s happening today.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Grid key={stat.title} item xs={12} sm={6} md={3}>
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
                  Weekly Jobs Overview
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                      <Tooltip
                        cursor={{ fill: "#F1F5F9" }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Bar dataKey="jobs" fill="#1976d2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                  Recent Job Cards
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {jobCards?.slice(0, 5).map((job) => (
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
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {job.vehicle_info}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.customer_name}
                        </Typography>
                      </Box>
                      <Chip
                        label={job.status.replace(/_/g, " ")}
                        size="small"
                        color={statusColors[job.status] || "default"}
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
        </Grid>
      </Box>
    </Box>
  );
}
