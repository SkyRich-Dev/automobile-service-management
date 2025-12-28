import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number | null;
  plate_number: string;
  vin: string;
  color: string | null;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Task {
  id: number;
  description: string;
  status: string;
  is_completed: boolean;
  labor_cost: string;
}

interface TimelineEvent {
  id: number;
  event_type: string;
  status: string | null;
  actor_name: string;
  role: string | null;
  comment: string | null;
  timestamp: string;
}

interface JobCard {
  id: number;
  vehicle: number;
  vehicle_info: string;
  customer: number;
  customer_name: string;
  advisor: number | null;
  advisor_name: string | null;
  technician: number | null;
  technician_name: string | null;
  status: string;
  estimated_amount: string;
  actual_amount: string | null;
  sla_deadline: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

interface JobCardDetail extends JobCard {
  tasks: Task[];
  timeline_events: TimelineEvent[];
  vehicle_detail: Vehicle;
  customer_detail: Customer;
}

const API_BASE = "/api";

export function useJobCards(status?: string) {
  return useQuery<JobCard[]>({
    queryKey: ["job-cards", status],
    queryFn: async () => {
      const url = status 
        ? `${API_BASE}/job-cards/?status=${status}`
        : `${API_BASE}/job-cards/`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job cards");
      return res.json();
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
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateJobCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      vehicle: number;
      customer: number;
      status?: string;
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
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/job-cards/${id}/ai_insight/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate AI insight");
      return res.json();
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      job_card: number;
      description: string;
      status?: string;
      labor_cost?: string;
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

export type { JobCard, JobCardDetail, Task, TimelineEvent, Vehicle, Customer };
