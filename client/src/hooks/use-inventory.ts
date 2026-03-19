import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCsrfToken } from "@/lib/queryClient";

function csrfHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getCsrfToken();
  if (token) headers["X-CSRFToken"] = token;
  return headers;
}

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
  cost_price: string;
  reserved: number;
  damaged: number;
  in_transit: number;
  location: string | null;
  available_stock: number;
  is_low_stock: boolean;
  item_type: string;
  tax_category: string;
  hsn_code: string;
  tax_rate: string;
  cgst_rate: string;
  sgst_rate: string;
  igst_rate: string;
  gst_type: string;
  landing_cost: string;
  margin_percent: string;
  warranty_eligible: boolean;
  is_returnable: boolean;
  expiry_date: string | null;
  last_purchase_date: string | null;
  brand: string;
}

interface StockMovement {
  id: number;
  ledger_id: string;
  movement_type: string;
  part: number;
  part_name: string;
  part_sku: string;
  branch: number;
  branch_name: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reserved_before: number;
  reserved_after: number;
  available_before: number;
  available_after: number;
  reference_type: string;
  reference_id: number | null;
  reference_number: string;
  reason: string;
  performed_by_name: string;
  timestamp: string;
}

interface SupplierInvoice {
  id: number;
  invoice_number: string;
  supplier_name: string;
  po_number: string;
  grn_number: string;
  branch_name: string;
  status: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  total_tax: string;
  freight_charges: string;
  other_charges: string;
  discount: string;
  grand_total: string;
  amount_paid: string;
  balance_due: string;
  supplier_gst_number: string;
  created_at: string;
}

interface FastMovingItem {
  part__id: number;
  part__name: string;
  part__sku: string;
  part__stock: number;
  part__min_stock: number;
  issue_count: number;
  total_issued: number;
}

interface DeadStockItem {
  id: number;
  name: string;
  sku: string;
  stock: number;
  cost_price: string;
  last_purchase_date: string | null;
}

interface ValuationReport {
  by_category: {
    category: string;
    item_count: number;
    total_stock: number;
    cost_value: number;
    selling_value: number;
  }[];
  totals: {
    total_items: number;
    total_stock: number;
    total_cost_value: number;
    total_selling_value: number;
  };
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
  receipt_date: string;
  received_date?: string;
  created_at: string;
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
        headers: csrfHeaders({ "Content-Type": "application/json" }),
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
        headers: csrfHeaders({ "Content-Type": "application/json" }),
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
        headers: csrfHeaders({ "Content-Type": "application/json" }),
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
        headers: csrfHeaders(),
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
        headers: csrfHeaders(),
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
        headers: csrfHeaders({ "Content-Type": "application/json" }),
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
    mutationFn: async (branch_id?: number) => {
      const body: Record<string, unknown> = {};
      if (branch_id) body.branch_id = branch_id;
      const res = await fetch(`${API_BASE}/inventory-alerts/generate_alerts/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
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

interface InventoryDashboard {
  total_items: number;
  total_stock_value: number;
  total_selling_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  overstock_count: number;
  pending_reservations: number;
  pending_returns: number;
  pending_adjustments: number;
  items_expiring_soon: number;
  total_reserved: number;
  total_damaged: number;
  total_in_transit: number;
  recent_movements: AuditLogEntry[];
}

interface AuditLogEntry {
  id: number;
  log_id: string;
  part: number;
  part_name: string;
  part_sku: string;
  branch: number;
  branch_name: string;
  action: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_type: string;
  reference_number: string;
  reason: string;
  performed_by_name: string;
  timestamp: string;
}

interface StockOverviewItem {
  id: number;
  part_number: string;
  name: string;
  sku: string;
  category: string;
  item_type: string;
  brand: string;
  stock: number;
  reserved: number;
  available_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_quantity: number;
  is_low_stock: boolean;
  stock_status: string;
  cost_price: string;
  selling_price: string;
  inventory_value: number;
  location: string;
  pending_reservations: number;
  pending_orders: number;
  expiry_date: string | null;
}

interface StockAdjustment {
  id: number;
  adjustment_number: string;
  branch: number;
  branch_name: string;
  part: number;
  part_name: string;
  part_sku: string;
  adjustment_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reason: string;
  status: string;
  created_by_name: string;
  approved_by_name: string | null;
  approval_date: string | null;
  created_at: string;
}

interface StockReturn {
  id: number;
  return_number: string;
  branch: number;
  branch_name: string;
  job_card: number;
  job_card_number: string;
  part: number;
  part_name: string;
  part_sku: string;
  quantity: number;
  return_reason: string;
  condition: string;
  status: string;
  returned_by_name: string;
  approved_by_name: string | null;
  created_at: string;
}

export function useInventoryDashboard(branchId?: number) {
  return useQuery<InventoryDashboard>({
    queryKey: ["inventory-dashboard", branchId],
    queryFn: async () => {
      const url = branchId 
        ? `${API_BASE}/inventory/dashboard/?branch=${branchId}` 
        : `${API_BASE}/inventory/dashboard/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inventory dashboard");
      return res.json();
    },
  });
}

export function useStockOverview(params?: { branch?: number; category?: string; status?: string; search?: string }) {
  return useQuery<StockOverviewItem[]>({
    queryKey: ["stock-overview", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.branch) searchParams.append("branch", String(params.branch));
      if (params?.category) searchParams.append("category", params.category);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.search) searchParams.append("search", params.search);
      const res = await fetch(`${API_BASE}/inventory/stock_overview/?${searchParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stock overview");
      return res.json();
    },
  });
}

export function useStockAdjustments(status?: string) {
  return useQuery<StockAdjustment[]>({
    queryKey: ["stock-adjustments", status],
    queryFn: async () => {
      const url = status 
        ? `${API_BASE}/inventory/adjustments/?status=${status}` 
        : `${API_BASE}/inventory/adjustments/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stock adjustments");
      return res.json();
    },
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { part_id: number; adjustment_type: string; quantity: number; reason: string }) => {
      const res = await fetch(`${API_BASE}/inventory/create_adjustment/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create adjustment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
  });
}

export function useApproveAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/inventory/${id}/approve-adjustment/`, {
        method: "POST",
        headers: csrfHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve adjustment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
  });
}

export function useStockReturns(status?: string) {
  return useQuery<StockReturn[]>({
    queryKey: ["stock-returns", status],
    queryFn: async () => {
      const url = status 
        ? `${API_BASE}/inventory/returns/?status=${status}` 
        : `${API_BASE}/inventory/returns/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stock returns");
      return res.json();
    },
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/inventory/${id}/approve-return/`, {
        method: "POST",
        headers: csrfHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve return");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-returns"] });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
  });
}

export function useAuditLog(params?: { part?: number; branch?: number; action?: string }) {
  return useQuery<AuditLogEntry[]>({
    queryKey: ["inventory-audit-log", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.part) searchParams.append("part", String(params.part));
      if (params?.branch) searchParams.append("branch", String(params.branch));
      if (params?.action) searchParams.append("action", params.action);
      const res = await fetch(`${API_BASE}/inventory/audit_log/?${searchParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit log");
      return res.json();
    },
  });
}

export function useStockMovements(params?: { part?: number; branch?: number; type?: string }) {
  return useQuery<StockMovement[]>({
    queryKey: ["stock-movements", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.part) searchParams.append("part", String(params.part));
      if (params?.branch) searchParams.append("branch", String(params.branch));
      if (params?.type) searchParams.append("type", params.type);
      const res = await fetch(`${API_BASE}/inventory/stock_movements/?${searchParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stock movements");
      return res.json();
    },
  });
}

export function useSupplierInvoices(params?: { status?: string; supplier?: number }) {
  return useQuery<SupplierInvoice[]>({
    queryKey: ["supplier-invoices", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append("status", String(params.status));
      if (params?.supplier) searchParams.append("supplier", String(params.supplier));
      const res = await fetch(`${API_BASE}/inventory/supplier_invoices/?${searchParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch supplier invoices");
      return res.json();
    },
  });
}

export function useFastMovingItems(days?: number) {
  return useQuery<FastMovingItem[]>({
    queryKey: ["fast-moving", days],
    queryFn: async () => {
      const url = days
        ? `${API_BASE}/inventory/fast_moving/?days=${days}`
        : `${API_BASE}/inventory/fast_moving/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fast-moving items");
      return res.json();
    },
  });
}

export function useDeadStock(days?: number) {
  return useQuery<DeadStockItem[]>({
    queryKey: ["dead-stock", days],
    queryFn: async () => {
      const url = days
        ? `${API_BASE}/inventory/dead_stock/?days=${days}`
        : `${API_BASE}/inventory/dead_stock/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dead stock");
      return res.json();
    },
  });
}

export function useValuationReport(branchId?: number) {
  return useQuery<ValuationReport>({
    queryKey: ["valuation-report", branchId],
    queryFn: async () => {
      const url = branchId
        ? `${API_BASE}/inventory/valuation_report/?branch=${branchId}`
        : `${API_BASE}/inventory/valuation_report/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch valuation report");
      return res.json();
    },
  });
}

export type { 
  Part, PartReservation, GRN, GRNLine, StockTransfer, StockTransferLine, 
  PurchaseRequisition, PRLine, InventoryAlert, SupplierPerformance,
  InventoryDashboard, StockOverviewItem, StockAdjustment, StockReturn, AuditLogEntry,
  StockMovement, SupplierInvoice, FastMovingItem, DeadStockItem, ValuationReport
};
