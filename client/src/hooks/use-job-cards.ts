import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number | null;
  plate_number: string;
  vin: string;
  color: string | null;
  vehicle_type?: string;
  fuel_type?: string;
}

interface Customer {
  id: number;
  customer_id: string;
  name: string;
  phone: string;
  email: string;
  loyalty_points?: number;
}

interface Task {
  id: number;
  task_number: string;
  description: string;
  category?: string;
  status: string;
  priority: string;
  assigned_technician?: number;
  technician_name?: string;
  estimated_hours: string;
  actual_hours: string;
  start_time?: string;
  end_time?: string;
  checklist: unknown[];
  checklist_completed: boolean;
  evidence_photos: string[];
  qc_passed?: boolean;
  is_rework: boolean;
}

interface ServiceEvent {
  id: number;
  event_type: string;
  actor_name: string;
  actor_role?: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
  evidence?: unknown[];
  timestamp: string;
}

interface Estimate {
  id: number;
  version: number;
  estimate_number: string;
  labor_total: string;
  parts_total: string;
  discount: string;
  tax: string;
  grand_total: string;
  approval_status: string;
  created_at: string;
}

interface DigitalInspection {
  id: number;
  is_completed: boolean;
  findings?: string;
  recommendations?: string;
  checklist_data?: Record<string, unknown>;
  photos?: string[];
  videos?: string[];
}

interface AllowedTransition {
  value: string;
  label: string;
}

interface JobCard {
  id: number;
  job_card_number: string;
  service_tracking_id: string;
  branch?: number;
  branch_name?: string;
  vehicle: number;
  vehicle_info: string;
  customer: number;
  customer_name: string;
  service_advisor?: number;
  advisor_name?: string;
  lead_technician?: number;
  technician_name?: string;
  workflow_stage: string;
  job_type: string;
  priority: string;
  complaint?: string;
  diagnosis?: string;
  odometer_in: number;
  estimated_hours: string;
  estimated_amount: string;
  actual_amount?: string;
  labor_amount?: string;
  parts_amount?: string;
  is_warranty: boolean;
  allowed_transitions?: AllowedTransition[];
  is_amc: boolean;
  is_insurance: boolean;
  is_goodwill: boolean;
  promised_delivery?: string;
  sla_deadline?: string;
  actual_delivery?: string;
  ai_summary?: string;
  customer_rating?: number;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface JobCardDetail extends JobCard {
  tasks: Task[];
  timeline_events: ServiceEvent[];
  estimates: Estimate[];
  inspection?: DigitalInspection;
  vehicle_detail: Vehicle;
  customer_detail: Customer;
}

const API_BASE = "/api";

export function useJobCards(stage?: string) {
  return useQuery<JobCard[]>({
    queryKey: ["job-cards", stage],
    queryFn: async () => {
      const url = stage 
        ? `${API_BASE}/job-cards/?stage=${stage}`
        : `${API_BASE}/job-cards/`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job cards");
      const data = await res.json();
      return data.map((jc: JobCard) => ({
        ...jc,
        status: jc.workflow_stage
      }));
    },
  });
}

export function useJobCard(id: number) {
  return useQuery<JobCardDetail | null>({
    queryKey: ["job-cards", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/job-cards/${id}/`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch job card details");
      const data = await res.json();
      return {
        ...data,
        status: data.workflow_stage
      };
    },
    enabled: !!id,
  });
}

export function useWorkflowStages() {
  return useQuery<{ value: string; label: string }[]>({
    queryKey: ["workflow-stages"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/workflow/stages/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workflow stages");
      return res.json();
    },
  });
}

export function useAllowedTransitions(jobCardId: number) {
  return useQuery<{ current_stage: string; allowed_transitions: { value: string; label: string }[] }>({
    queryKey: ["job-cards", jobCardId, "transitions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/job-cards/${jobCardId}/allowed_transitions/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch allowed transitions");
      return res.json();
    },
    enabled: !!jobCardId,
  });
}

export function useTransitionJobCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newStage, comment }: { id: number; newStage: string; comment?: string }) => {
      const res = await fetch(`${API_BASE}/job-cards/${id}/transition/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_stage: newStage, comment }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to transition job card");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.id] });
    },
  });
}

export function useCreateJobCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      vehicle: number;
      customer: number;
      branch?: number;
      job_type?: string;
      priority?: string;
      complaint?: string;
      estimated_amount?: string;
    }) => {
      const res = await fetch(`${API_BASE}/job-cards/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create job card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-cards"] });
    },
  });
}

export function useUpdateJobCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<JobCard>) => {
      const res = await fetch(`${API_BASE}/job-cards/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update job card");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.id] });
    },
  });
}

export function useJobCardAIInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/job-cards/${id}/ai_insight/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate AI insight");
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards", id] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      job_card: number;
      description: string;
      category?: string;
      status?: string;
      priority?: string;
      estimated_hours?: string;
    }) => {
      const res = await fetch(`${API_BASE}/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.job_card] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, jobCardId, ...updates }: { id: number; jobCardId: number } & Partial<Task>) => {
      const res = await fetch(`${API_BASE}/tasks/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.jobCardId] });
    },
  });
}

export function useStartTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, jobCardId }: { taskId: number; jobCardId: number }) => {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/start/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start task");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.jobCardId] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, jobCardId, checklist, evidence_photos, notes }: { 
      taskId: number; 
      jobCardId: number;
      checklist?: unknown[];
      evidence_photos?: string[];
      notes?: string;
    }) => {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/complete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist, evidence_photos, notes }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to complete task");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.jobCardId] });
    },
  });
}

export function useAddRemark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobCardId, remark }: { jobCardId: number; remark: string }) => {
      const res = await fetch(`${API_BASE}/job-cards/${jobCardId}/add_remark/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add remark");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.jobCardId] });
    },
  });
}

export function useNotifyCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobCardId, message, channel }: { jobCardId: number; message?: string; channel?: string }) => {
      const res = await fetch(`${API_BASE}/job-cards/${jobCardId}/notify_customer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, channel }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to notify customer");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.jobCardId] });
    },
  });
}

export function useEscalate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobCardId, reason, level }: { jobCardId: number; reason: string; level?: string }) => {
      const res = await fetch(`${API_BASE}/job-cards/${jobCardId}/escalate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, level }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to escalate");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-cards", variables.jobCardId] });
    },
  });
}

export interface ServiceEventItem {
  id: number;
  event_type: string;
  actor_name: string;
  actor_role?: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  timestamp: string;
  job_card_number?: string;
  job_card_id?: number;
}

export function useServiceEvents() {
  return useQuery<ServiceEventItem[]>({
    queryKey: ["service-events"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/service-events/`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch service events");
      return res.json();
    },
  });
}

export type { JobCard, JobCardDetail, Task, ServiceEvent, Estimate, Vehicle, Customer, DigitalInspection };
