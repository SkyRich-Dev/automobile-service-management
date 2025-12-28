import { AppSidebar } from "@/components/AppSidebar";
import { useJobCards } from "@/hooks/use-job-cards";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WarningIcon from "@mui/icons-material/Warning";

const COLUMNS = [
  { id: "APPOINTED", label: "Appointed" },
  { id: "CHECKED_IN", label: "Checked In" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "QC_PENDING", label: "QC Pending" },
  { id: "READY_FOR_DELIVERY", label: "Ready" },
];

const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  APPOINTED: "info",
  CHECKED_IN: "info",
  IN_PROGRESS: "warning",
  ON_HOLD: "error",
  QC_PENDING: "secondary",
  READY_FOR_DELIVERY: "success",
  DELIVERED: "default",
};

export default function ServiceOperations() {
  const { data: jobCards, isLoading } = useJobCards();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }} data-testid="page-service">
      <AppSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: "240px", overflowX: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Service Operations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage service workflow and job cards.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} data-testid="button-add-job">
            New Job Card
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 3, pb: 4, minWidth: "max-content" }}>
          {COLUMNS.map((column) => {
            const jobsInColumn = jobCards?.filter((j) => j.status === column.id) || [];

            return (
              <Box key={column.id} sx={{ width: 300, flexShrink: 0 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, px: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                    {column.label}
                  </Typography>
                  <Chip label={jobsInColumn.length} size="small" color={statusColors[column.id] || "default"} />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {jobsInColumn.map((job) => (
                    <Link key={job.id} href={`/job-cards/${job.id}`} style={{ textDecoration: "none" }}>
                      <Card
                        elevation={1}
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": { elevation: 4, transform: "translateY(-2px)" },
                        }}
                        data-testid={`card-job-${job.id}`}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              #{job.id}
                            </Typography>
                            {job.sla_deadline && new Date(job.sla_deadline) < new Date() && (
                              <WarningIcon sx={{ fontSize: 16, color: "error.main" }} />
                            )}
                          </Box>

                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                            {job.vehicle_info?.split(" - ")[0] || "Vehicle"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {job.customer_name}
                          </Typography>

                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: 1, borderColor: "divider" }}>
                            <Typography variant="caption" color="text.secondary">
                              {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : "Recently"}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              ${job.estimated_amount}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}

                  {jobsInColumn.length === 0 && (
                    <Box
                      sx={{
                        height: 100,
                        border: 2,
                        borderStyle: "dashed",
                        borderColor: "grey.300",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "grey.100",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No jobs
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
