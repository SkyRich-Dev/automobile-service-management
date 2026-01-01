import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Part {
  id: number;
  name: string;
  sku: string;
  part_number: string;
  category: string;
  stock: number;
  min_stock: number;
  max_stock: number;
  price: string;
  selling_price: string;
  reserved: number;
  location: string | null;
  available_stock: number;
  is_low_stock: boolean;
  item_type: string;
  tax_category: string;
  hsn_code: string;
  warranty_eligible: boolean;
  is_returnable: boolean;
  expiry_date: string | null;
}

interface PartReservation {
  id: number;
  reservation_number: string;
  job_card: number;
  job_card_number: string;
  part: number;
  part_name: string;
  task: number | null;
  quantity: number;
  status: string;
  reserved_at: string;
  issued_at: string | null;
  released_at: string | null;
  notes: string;
}

interface GRN {
  id: number;
  grn_number: string;
  purchase_order: number;
  po_number: string;
  branch: number;
  branch_name: string;
  status: string;
  received_date: string;
  total_received_qty: number;
  total_accepted_qty: number;
  total_rejected_qty: number;
  lines: GRNLine[];
}

interface GRNLine {
  id: number;
  part: number;
  part_name: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  unit_cost: string;
  rejection_reason: string;
}

interface StockTransfer {
  id: number;
  transfer_number: string;
  from_branch: number;
  from_branch_name: string;
  to_branch: number;
  to_branch_name: string;
  status: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  created_at: string;
  dispatched_at: string | null;
  received_at: string | null;
  lines: StockTransferLine[];
}

interface StockTransferLine {
  id: number;
  part: number;
  part_name: string;
  quantity: number;
  quantity_received: number;
}

interface PurchaseRequisition {
  id: number;
  pr_number: string;
  branch: number;
  branch_name: string;
  status: string;
  priority: string;
  source: string;
  required_date: string | null;
  notes: string;
  created_at: string;
  lines: PRLine[];
}

interface PRLine {
  id: number;
  part: number;
  part_name: string;
  quantity: number;
  current_stock: number;
  min_stock: number;
  notes: string;
}

interface InventoryAlert {
  id: number;
  alert_number: string;
  part: number;
  part_name: string;
  branch: number;
  branch_name: string;
  alert_type: string;
  severity: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  resolved_by_name: string | null;
}

interface SupplierPerformance {
  id: number;
  supplier: number;
  supplier_name: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  orders_on_time: number;
  on_time_rate: number;
  total_items_ordered: number;
  items_accepted: number;
  items_rejected: number;
  quality_rate: number;
  price_variance: string;
  overall_score: number;
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

export function usePartReservations() {
  return useQuery<PartReservation[]>({
    queryKey: ["part-reservations"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/part-reservations/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch part reservations");
      return res.json();
    },
  });
}

export function useIssueReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, unit_price }: { id: number; unit_price?: number }) => {
      const res = await fetch(`${API_BASE}/part-reservations/${id}/issue/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_price }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to issue reservation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["part-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  });
}

export function useReleaseReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/part-reservations/${id}/release/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to release reservation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["part-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  });
}

export function useGRNs() {
  return useQuery<GRN[]>({
    queryKey: ["grns"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/grns/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch GRNs");
      return res.json();
    },
  });
}

export function useStockTransfers() {
  return useQuery<StockTransfer[]>({
    queryKey: ["stock-transfers"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/stock-transfers/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stock transfers");
      return res.json();
    },
  });
}

export function usePurchaseRequisitions() {
  return useQuery<PurchaseRequisition[]>({
    queryKey: ["purchase-requisitions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/purchase-requisitions/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch purchase requisitions");
      return res.json();
    },
  });
}

export function useInventoryAlerts() {
  return useQuery<InventoryAlert[]>({
    queryKey: ["inventory-alerts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/inventory-alerts/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inventory alerts");
      return res.json();
    },
  });
}

export function useSupplierPerformance() {
  return useQuery<SupplierPerformance[]>({
    queryKey: ["supplier-performance"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/supplier-performance/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch supplier performance");
      return res.json();
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/inventory-alerts/${id}/acknowledge/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to acknowledge alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const res = await fetch(`${API_BASE}/inventory-alerts/${id}/resolve/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to resolve alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
    },
  });
}

export function useGenerateAlerts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (branch_id: number) => {
      const res = await fetch(`${API_BASE}/inventory-alerts/generate_alerts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch_id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate alerts");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
    },
  });
}

export type { Part, PartReservation, GRN, GRNLine, StockTransfer, StockTransferLine, PurchaseRequisition, PRLine, InventoryAlert, SupplierPerformance };
