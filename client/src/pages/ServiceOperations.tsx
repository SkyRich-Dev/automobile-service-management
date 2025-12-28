import { AppSidebar } from "@/components/AppSidebar";
import { useJobCards, useWorkflowStages, useTransitionJobCard } from "@/hooks/use-job-cards";
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
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WarningIcon from "@mui/icons-material/Warning";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useState } from "react";

const WORKFLOW_COLUMNS = [
  { id: "APPOINTMENT", label: "Appointment", color: "#64b5f6" },
  { id: "CHECK_IN", label: "Check-in", color: "#4fc3f7" },
  { id: "INSPECTION", label: "Inspection", color: "#4dd0e1" },
  { id: "JOB_CARD", label: "Job Card", color: "#4db6ac" },
  { id: "ESTIMATE", label: "Estimate", color: "#81c784" },
  { id: "APPROVAL", label: "Approval", color: "#aed581" },
  { id: "EXECUTION", label: "Execution", color: "#dce775" },
  { id: "QC", label: "QC", color: "#fff176" },
  { id: "BILLING", label: "Billing", color: "#ffb74d" },
  { id: "DELIVERY", label: "Delivery", color: "#ff8a65" },
  { id: "COMPLETED", label: "Completed", color: "#90a4ae" },
];

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

export default function ServiceOperations() {
  const { data: jobCards, isLoading, refetch } = useJobCards();
  const { data: workflowStages } = useWorkflowStages();
  const transitionMutation = useTransitionJobCard();
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; jobId: number; stage: string } | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, jobId: number, currentStage: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor({ el: event.currentTarget, jobId, stage: currentStage });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleTransition = async (newStage: string) => {
    if (!menuAnchor) return;
    try {
      await transitionMutation.mutateAsync({
        id: menuAnchor.jobId,
        newStage,
        comment: `Transitioned to ${newStage}`,
      });
      refetch();
    } catch (err) {
      console.error("Transition failed:", err);
    }
    handleMenuClose();
  };

  const getNextStage = (currentStage: string): string | null => {
    const currentIndex = WORKFLOW_COLUMNS.findIndex((c) => c.id === currentStage);
    if (currentIndex >= 0 && currentIndex < WORKFLOW_COLUMNS.length - 1) {
      return WORKFLOW_COLUMNS[currentIndex + 1].id;
    }
    return null;
  };

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
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: "240px", overflowX: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Service Operations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              11-Stage Workflow: Appointment → Check-in → Inspection → Job Card → Estimate → Approval → Execution → QC → Billing → Delivery → Complete
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} data-testid="button-add-job">
            New Job Card
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 2, pb: 4, minWidth: "max-content" }}>
          {WORKFLOW_COLUMNS.map((column) => {
            const jobsInColumn = jobCards?.filter((j) => j.workflow_stage === column.id || j.status === column.id) || [];

            return (
              <Box key={column.id} sx={{ width: 260, flexShrink: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    px: 1,
                    py: 0.5,
                    bgcolor: column.color,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "black", fontWeight: "bold", textTransform: "uppercase", fontSize: 11 }}>
                    {column.label}
                  </Typography>
                  <Chip label={jobsInColumn.length} size="small" sx={{ bgcolor: "white", fontWeight: "bold" }} />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {jobsInColumn.map((job) => {
                    const nextStage = getNextStage(column.id);
                    return (
                      <Card
                        key={job.id}
                        elevation={1}
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
                          position: "relative",
                        }}
                        data-testid={`card-job-${job.id}`}
                      >
                        <Link href={`/job-cards/${job.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <CardContent sx={{ p: 2, pb: "12px !important" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                {job.job_card_number || `#${job.id}`}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {job.sla_deadline && new Date(job.sla_deadline) < new Date() && (
                                  <WarningIcon sx={{ fontSize: 14, color: "error.main" }} />
                                )}
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, job.id, column.id)}
                                  sx={{ p: 0.25 }}
                                >
                                  <MoreVertIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </Box>

                            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                              {job.vehicle_info?.split(" - ")[0] || "Vehicle"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                              {job.customer_name}
                            </Typography>

                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography variant="caption" color="text.secondary">
                                {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : ""}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" color="success.main">
                                ${job.estimated_amount}
                              </Typography>
                            </Box>

                            {nextStage && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
                                <Button
                                  size="small"
                                  variant="text"
                                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                                  sx={{ p: 0, minWidth: 0, fontSize: 11 }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    transitionMutation.mutate({
                                      id: job.id,
                                      newStage: nextStage,
                                    });
                                  }}
                                >
                                  Move to {WORKFLOW_COLUMNS.find((c) => c.id === nextStage)?.label}
                                </Button>
                              </Box>
                            )}
                          </CardContent>
                        </Link>
                      </Card>
                    );
                  })}

                  {jobsInColumn.length === 0 && (
                    <Box
                      sx={{
                        height: 80,
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
                      <Typography variant="caption" color="text.secondary">
                        No jobs
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Menu anchorEl={menuAnchor?.el} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          {menuAnchor && WORKFLOW_COLUMNS.filter((c) => c.id !== menuAnchor.stage).map((column) => (
            <MenuItem key={column.id} onClick={() => handleTransition(column.id)}>
              Move to {column.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
}
