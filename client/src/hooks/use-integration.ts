import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface UnifiedDashboard {
  service: {
    active_jobs: number;
    jobs_today: number;
    pending_approval: number;
    overdue_sla: number;
  };
  crm: {
    new_leads_today: number;
    open_tickets: number;
    pending_followups: number;
  };
  inventory: {
    low_stock_alerts: number;
    pending_pos: number;
    pending_grns: number;
  };
  finance: {
    unpaid_invoices: number;
    pending_payments: number;
    pending_expenses: number;
  };
  hrms: {
    employees_present: number;
    pending_leave: number;
    training_in_progress: number;
  };
  generated_at: string;
}

export interface AvailableTechnician {
  id: number;
  user_id: number;
  employee_id: string | null;
  name: string;
  role: string;
  branch: string | null;
  skills: Array<{
    skill_name: string;
    category: string;
    level: string;
    is_certified: boolean;
  }>;
  skill_match_count: number;
  active_jobs: number;
  utilization: number;
  avg_rating: number;
  hourly_rate: number;
}

export interface ContractCoverage {
  vehicle_id: string;
  has_coverage: boolean;
  coverages: Array<{
    contract_id: number;
    contract_number: string;
    contract_type: string;
    service_type: string;
    coverage_percentage: number;
    max_amount: number | null;
    quantity_limit: number | null;
    quantity_consumed: number;
    remaining: number | null;
  }>;
}

export interface MasterLookupResult {
  customers?: Array<{
    id: number;
    customer_id: string;
    name: string;
    phone: string;
    email: string;
  }>;
  vehicles?: Array<{
    id: number;
    vehicle_id: string;
    plate_number: string;
    make: string;
    model: string;
    customer_name: string | null;
    customer_id: number;
  }>;
  employees?: Array<{
    id: number;
    employee_id: string | null;
    name: string;
    role: string;
    branch: string | null;
    is_available: boolean;
  }>;
  job_cards?: Array<{
    id: number;
    job_card_number: string;
    workflow_stage: string;
    customer_name: string;
    vehicle: string;
  }>;
}

export interface Customer360 {
  customer: {
    id: number;
    customer_id: string;
    name: string;
    phone: string;
    email: string;
    address: string | null;
    loyalty_points: number;
    total_revenue: number;
    total_visits: number;
    last_visit_date: string | null;
  };
  score: {
    overall_score: number;
    revenue_score: number;
    loyalty_score: number;
    engagement_score: number;
    segment: string;
  } | null;
  vehicles: Array<{
    id: number;
    plate_number: string;
    make: string;
    model: string;
    year: number;
  }>;
  recent_jobs: Array<{
    id: number;
    job_card_number: string;
    workflow_stage: string;
    job_type: string;
    created_at: string;
  }>;
  contracts: Array<{
    id: number;
    contract_number: string;
    contract_type: string;
    status: string;
    end_date: string;
  }>;
  recent_invoices: Array<{
    id: number;
    invoice_number: string;
    total_amount: number;
    status: string;
    invoice_date: string;
  }>;
  open_tickets: Array<{
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
  }>;
  recent_interactions: Array<{
    id: number;
    interaction_type: string;
    channel: string;
    summary: string | null;
    date: string;
  }>;
}

export function useUnifiedDashboard(branchId?: string) {
  const branchParam = branchId && branchId !== 'all' ? `?branch=${branchId}` : '';
  return useQuery<UnifiedDashboard>({
    queryKey: ["/api/integration/unified_dashboard/", branchId],
    queryFn: async () => {
      const res = await fetch(`/api/integration/unified_dashboard/${branchParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch unified dashboard");
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useAvailableTechnicians(params?: {
  skill_category?: string;
  min_level?: string;
  branch_id?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.skill_category) queryParams.set("skill_category", params.skill_category);
  if (params?.min_level) queryParams.set("min_level", params.min_level);
  if (params?.branch_id) queryParams.set("branch_id", params.branch_id);
  
  const queryString = queryParams.toString();
  const url = `/api/integration/available_technicians/${queryString ? `?${queryString}` : ""}`;
  
  return useQuery<AvailableTechnician[]>({
    queryKey: ["/api/integration/available_technicians/", params],
  });
}

export function useContractCoverage(vehicleId: number | string | undefined) {
  return useQuery<ContractCoverage>({
    queryKey: ["/api/integration/check_contract_coverage/", vehicleId],
    enabled: !!vehicleId,
  });
}

export function useMasterLookup(search: string, type: string = "all") {
  return useQuery<MasterLookupResult>({
    queryKey: ["/api/integration/master_lookup/", { search, type }],
    enabled: search.length >= 2,
    staleTime: 1000 * 30,
  });
}

export function useCustomer360(customerId: number | undefined) {
  return useQuery<Customer360>({
    queryKey: ["/api/integration/customer_360/", customerId],
    enabled: !!customerId,
  });
}

export function useAssignTechnician() {
  return useMutation({
    mutationFn: (data: { job_card_id: number; technician_id: number }) =>
      apiRequest("POST", "/api/integration/assign_technician_to_job/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-cards/"] });
    },
  });
}

export function useReserveParts() {
  return useMutation({
    mutationFn: (data: { job_card_id: number; parts: Array<{ part_id: number; quantity: number }> }) =>
      apiRequest("POST", "/api/integration/reserve_parts_for_job/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/part-reservations/"] });
    },
  });
}

export function useGenerateInvoice() {
  return useMutation({
    mutationFn: (data: { job_card_id: number }) =>
      apiRequest("POST", "/api/integration/generate_invoice_from_job/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-cards/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-invoices/"] });
    },
  });
}
