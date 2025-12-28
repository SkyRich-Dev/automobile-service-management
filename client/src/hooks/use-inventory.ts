import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Part {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  min_stock: number;
  price: string;
  reserved: number;
  location: string | null;
  available_stock: number;
  is_low_stock: boolean;
}

const API_BASE = "/api";

export function useParts() {
  return useQuery<Part[]>({
    queryKey: ["parts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/parts/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch parts");
      return res.json();
    },
  });
}

export function useCreatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Part, "id" | "available_stock" | "is_low_stock">) => {
      const res = await fetch(`${API_BASE}/parts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create part");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  });
}

export function useUpdatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<Part>) => {
      const res = await fetch(`${API_BASE}/parts/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update part");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  });
}

export type { Part };
