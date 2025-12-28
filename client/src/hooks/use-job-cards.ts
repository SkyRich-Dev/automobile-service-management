import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertJobCard, InsertTask } from "@shared/schema";

// GET /api/job-cards
export function useJobCards(status?: string) {
  return useQuery({
    queryKey: [api.jobCards.list.path, status],
    queryFn: async () => {
      const url = status 
        ? buildUrl(api.jobCards.list.path) + `?status=${status}`
        : api.jobCards.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job cards");
      return api.jobCards.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/job-cards/:id
export function useJobCard(id: number) {
  return useQuery({
    queryKey: [api.jobCards.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.jobCards.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch job card details");
      return api.jobCards.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// POST /api/job-cards
export function useCreateJobCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertJobCard) => {
      const res = await fetch(api.jobCards.create.path, {
        method: api.jobCards.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create job card");
      return api.jobCards.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobCards.list.path] });
    },
  });
}

// PUT /api/job-cards/:id
export function useUpdateJobCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertJobCard>) => {
      const url = buildUrl(api.jobCards.update.path, { id });
      const res = await fetch(url, {
        method: api.jobCards.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update job card");
      return api.jobCards.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.jobCards.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.jobCards.get.path, variables.id] });
    },
  });
}

// POST /api/job-cards/:id/ai-insight
export function useJobCardAIInsight() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.jobCards.aiInsight.path, { id });
      const res = await fetch(url, {
        method: api.jobCards.aiInsight.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate AI insight");
      return api.jobCards.aiInsight.responses[200].parse(await res.json());
    },
  });
}

// POST /api/tasks
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTask) => {
      const res = await fetch(api.tasks.create.path, {
        method: api.tasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      return api.tasks.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.jobCards.get.path, variables.jobCardId] });
    },
  });
}

// PUT /api/tasks/:id
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, jobCardId, ...updates }: { id: number, jobCardId: number } & Partial<InsertTask>) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.jobCards.get.path, variables.jobCardId] });
    },
  });
}
