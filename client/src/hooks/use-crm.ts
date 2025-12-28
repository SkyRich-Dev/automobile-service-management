import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Vehicle {
  id: number;
  customer: number;
  customer_name?: string;
  vin: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  loyalty_points: number;
  address: string | null;
  notes: string | null;
  vehicles?: Vehicle[];
  created_at: string;
  updated_at: string;
}

const API_BASE = "/api";

export function useCustomers(search?: string) {
  return useQuery<Customer[]>({
    queryKey: ["customers", search],
    queryFn: async () => {
      const url = search
        ? `${API_BASE}/customers/?search=${encodeURIComponent(search)}`
        : `${API_BASE}/customers/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });
}

export function useCustomer(id: number) {
  return useQuery<Customer | null>({
    queryKey: ["customers", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/customers/${id}/`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch customer");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Customer, "id" | "created_at" | "updated_at" | "vehicles">) => {
      const res = await fetch(`${API_BASE}/customers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create customer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useVehicles(customerId?: number) {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles", customerId],
    queryFn: async () => {
      const url = customerId
        ? `${API_BASE}/vehicles/?customer_id=${customerId}`
        : `${API_BASE}/vehicles/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Vehicle, "id" | "customer_name">) => {
      const res = await fetch(`${API_BASE}/vehicles/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create vehicle");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export type { Customer, Vehicle };
