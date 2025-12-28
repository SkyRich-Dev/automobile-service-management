import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useJobCard, useJobCardAIInsight, useCreateTask, useUpdateTask } from "@/hooks/use-job-cards";
import { useParams } from "wouter";
import { format } from "date-fns";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  TextField,
  IconButton,
  Grid,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import AddIcon from "@mui/icons-material/Add";

const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  APPOINTED: "info",
  CHECKED_IN: "info",
  IN_PROGRESS: "warning",
  ON_HOLD: "error",
  QC_PENDING: "secondary",
  READY_FOR_DELIVERY: "success",
  DELIVERED: "default",
};

export default function JobCardDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, refetch } = useJobCard(Number(id));
  const generateInsight = useJobCardAIInsight();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [newTaskDesc, setNewTaskDesc] = useState("");

  if (isLoading || !job) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={48} />
      </Box>
    );
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
        is_completed: !currentCompleted,
        status: !currentCompleted ? "COMPLETED" : "PENDING",
      },
      {
        onSuccess: () => refetch(),
      }
    );
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }} data-testid="page-job-detail">
      <AppSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: "240px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                Job Card #{job.id}
              </Typography>
              <Chip label={job.status.replace(/_/g, " ")} color={statusColors[job.status] || "default"} />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Created on {job.created_at ? format(new Date(job.created_at), "PPP") : "Unknown"}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={generateInsight.isPending ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleGenerateInsight}
            disabled={generateInsight.isPending}
            sx={{ background: "linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)" }}
            data-testid="button-ai-insight"
          >
            Generate AI Insight
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Vehicle Details
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                        <Typography variant="body2" fontWeight="medium">{job.vehicle_detail?.make} {job.vehicle_detail?.model}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2" color="text.secondary">Plate</Typography>
                        <Typography variant="body2" fontWeight="medium">{job.vehicle_detail?.plate_number}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                        <Typography variant="body2" color="text.secondary">VIN</Typography>
                        <Typography variant="body2" fontWeight="medium">{job.vehicle_detail?.vin}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Customer Details
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body2" fontWeight="medium">{job.customer_detail?.name}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography variant="body2" fontWeight="medium">{job.customer_detail?.phone}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body2" fontWeight="medium">{job.customer_detail?.email}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {job.ai_summary && (
                <Grid item xs={12}>
                  <Card elevation={2} sx={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)", border: "1px solid #c7d2fe" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <AutoAwesomeIcon sx={{ color: "#6366f1" }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color: "#312e81" }}>
                          AI Diagnostics Summary
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: "#3730a3", lineHeight: 1.7 }}>
                        {job.ai_summary}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Service Tasks
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {job.tasks?.map((task) => (
                        <Box
                          key={task.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 1.5,
                            bgcolor: "grey.100",
                            borderRadius: 1,
                            cursor: "pointer",
                            "&:hover": { bgcolor: "grey.200" },
                          }}
                          onClick={() => toggleTask(task.id, task.is_completed)}
                          data-testid={`task-${task.id}`}
                        >
                          <IconButton size="small" sx={{ color: task.is_completed ? "primary.main" : "grey.500" }}>
                            {task.is_completed ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                          </IconButton>
                          <Typography
                            variant="body1"
                            sx={{ textDecoration: task.is_completed ? "line-through" : "none", color: task.is_completed ? "text.secondary" : "text.primary" }}
                          >
                            {task.description}
                          </Typography>
                        </Box>
                      ))}

                      <Box component="form" onSubmit={handleAddTask} sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Add a new task..."
                          value={newTaskDesc}
                          onChange={(e) => setNewTaskDesc(e.target.value)}
                        />
                        <Button type="submit" variant="contained" disabled={!newTaskDesc.trim()} data-testid="button-add-task">
                          <AddIcon />
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card elevation={2} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                  Timeline
                </Typography>
                <Box sx={{ position: "relative", borderLeft: 2, borderColor: "grey.300", ml: 1, pl: 3 }}>
                  {job.timeline_events?.map((event, idx) => (
                    <Box key={idx} sx={{ position: "relative", mb: 3 }}>
                      <Box
                        sx={{
                          position: "absolute",
                          left: -19,
                          top: 4,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          border: 3,
                          borderColor: "background.paper",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {event.timestamp ? format(new Date(event.timestamp), "PP p") : "Unknown"}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {event.event_type.replace(/_/g, " ")}
                      </Typography>
                      {event.status && (
                        <Typography variant="body2" color="text.secondary">
                          Status: {event.status}
                        </Typography>
                      )}
                      {event.comment && (
                        <Box sx={{ mt: 1, p: 1.5, bgcolor: "grey.100", borderRadius: 1, fontStyle: "italic" }}>
                          <Typography variant="body2">&ldquo;{event.comment}&rdquo;</Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
