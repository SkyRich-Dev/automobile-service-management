import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCsrfToken } from "@/lib/queryClient";

function csrfHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getCsrfToken();
  if (token) headers["X-CSRFToken"] = token;
  return headers;
}

const API_BASE = "/api/notification-center";

export interface NotificationEvent {
  id: number;
  code: string;
  name: string;
  description: string;
  module: string;
  module_display: string;
  trigger_type: string;
  trigger_type_display: string;
  trigger_condition: Record<string, unknown>;
  available_variables: string[];
  is_active: boolean;
  is_system_event: boolean;
  display_order: number;
  template_count: number;
  rule_count: number;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: number;
  code: string;
  name: string;
  event: number;
  event_name: string;
  event_code: string;
  channel: string;
  channel_display: string;
  subject: string;
  body: string;
  body_html: string;
  variables: string[];
  extracted_variables: string[];
  language: string;
  status: string;
  status_display: string;
  is_default: boolean;
  version: number;
  is_active: boolean;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannelConfig {
  id: number;
  event: number;
  event_name: string;
  channel: string;
  channel_display: string;
  is_enabled: boolean;
  template: number | null;
  template_name: string | null;
  priority: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  id: number;
  code: string;
  name: string;
  description: string;
  event: number | null;
  event_name: string | null;
  event_type: string;
  module: string;
  template: number | null;
  template_name: string | null;
  recipient_roles: string[];
  conditions: Record<string, unknown>;
  delay_value: number;
  delay_unit: string;
  delay_unit_display: string;
  delay_minutes: number;
  retry_count: number;
  retry_interval: number;
  business_hours_only: boolean;
  skip_holidays: boolean;
  is_escalation: boolean;
  branch: number | null;
  is_active: boolean;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRecipientRule {
  id: number;
  event: number;
  event_name: string;
  name: string;
  recipient_type: string;
  recipient_type_display: string;
  is_primary: boolean;
  is_cc: boolean;
  specific_roles: string[];
  is_active: boolean;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationEscalationRule {
  id: number;
  event: number;
  event_name: string;
  name: string;
  escalation_level: number;
  escalation_after_minutes: number;
  escalation_condition: string;
  condition_display: string;
  escalate_to_roles: string[];
  fallback_channel: string | null;
  fallback_channel_display: string | null;
  notify_original_recipient: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: number;
  log_number: string;
  event: number | null;
  event_code: string;
  event_name: string;
  template: number | null;
  template_name: string;
  channel: string;
  channel_display: string;
  recipient_type: string;
  recipient_type_display: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  recipient_user: number | null;
  subject: string;
  content_rendered: string;
  context_data: Record<string, unknown>;
  reference_type: string;
  reference_id: string;
  branch: number | null;
  branch_name: string | null;
  status: string;
  status_display: string;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  failure_reason: string;
  retry_count: number;
  external_message_id: string;
  created_at: string;
}

export interface NotificationAuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  entity_name: string;
  action: string;
  action_display: string;
  changes: Record<string, unknown>;
  reason: string;
  performed_by: number | null;
  performed_by_name: string | null;
  ip_address: string;
  created_at: string;
}

export interface NotificationCenterDashboard {
  total_events: number;
  active_events: number;
  total_templates: number;
  active_templates: number;
  total_rules: number;
  active_rules: number;
  notifications_today: number;
  notifications_failed_today: number;
  pending_queue: number;
  recent_logs: NotificationLog[];
  events_by_module: Record<string, number>;
  delivery_stats: Record<string, number>;
}

export function useNotificationCenterDashboard() {
  return useQuery<NotificationCenterDashboard>({
    queryKey: ["notification-center", "dashboard"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });
}

export function useNotificationEvents(filters?: { module?: string; is_active?: boolean }) {
  return useQuery<NotificationEvent[]>({
    queryKey: ["notification-center", "events", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.module) params.append("module", filters.module);
      if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active));
      const url = `${API_BASE}/events/${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });
}

export function useCreateNotificationEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationEvent>) => {
      const res = await fetch(`${API_BASE}/events/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "events"] });
      queryClient.invalidateQueries({ queryKey: ["notification-center", "dashboard"] });
    },
  });
}

export function useUpdateNotificationEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<NotificationEvent> & { id: number }) => {
      const res = await fetch(`${API_BASE}/events/${id}/`, {
        method: "PUT",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "events"] });
    },
  });
}

export function useNotificationTemplates(filters?: { event?: number; channel?: string; status?: string }) {
  return useQuery<NotificationTemplate[]>({
    queryKey: ["notification-center", "templates", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.event) params.append("event", String(filters.event));
      if (filters?.channel) params.append("channel", filters.channel);
      if (filters?.status) params.append("status", filters.status);
      const url = `${API_BASE}/templates/${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationTemplate>) => {
      const res = await fetch(`${API_BASE}/templates/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "templates"] });
      queryClient.invalidateQueries({ queryKey: ["notification-center", "dashboard"] });
    },
  });
}

export function useUpdateNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<NotificationTemplate> & { id: number }) => {
      const res = await fetch(`${API_BASE}/templates/${id}/`, {
        method: "PUT",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "templates"] });
    },
  });
}

export function useDeleteNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/templates/${id}/`, {
        method: "DELETE",
        headers: csrfHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "templates"] });
      queryClient.invalidateQueries({ queryKey: ["notification-center", "dashboard"] });
    },
  });
}

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: async (data: { content: string; variables: Record<string, string> }) => {
      const res = await fetch(`${API_BASE}/templates/preview/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to preview template");
      return res.json();
    },
  });
}

export function useNotificationChannelConfigs(eventId?: number) {
  return useQuery<NotificationChannelConfig[]>({
    queryKey: ["notification-center", "channel-configs", eventId],
    queryFn: async () => {
      const url = eventId
        ? `${API_BASE}/channel-configs/?event=${eventId}`
        : `${API_BASE}/channel-configs/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch channel configs");
      return res.json();
    },
  });
}

export function useSaveChannelConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationChannelConfig>) => {
      const res = await fetch(`${API_BASE}/channel-configs/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save channel config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "channel-configs"] });
    },
  });
}

export function useNotificationRules(filters?: { event?: number; module?: string }) {
  return useQuery<NotificationRule[]>({
    queryKey: ["notification-center", "rules", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.event) params.append("event", String(filters.event));
      if (filters?.module) params.append("module", filters.module);
      const url = `${API_BASE}/rules/${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch rules");
      return res.json();
    },
  });
}

export function useCreateNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationRule>) => {
      const res = await fetch(`${API_BASE}/rules/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "rules"] });
      queryClient.invalidateQueries({ queryKey: ["notification-center", "dashboard"] });
    },
  });
}

export function useNotificationRecipientRules(eventId?: number) {
  return useQuery<NotificationRecipientRule[]>({
    queryKey: ["notification-center", "recipient-rules", eventId],
    queryFn: async () => {
      const url = eventId
        ? `${API_BASE}/recipient-rules/?event=${eventId}`
        : `${API_BASE}/recipient-rules/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recipient rules");
      return res.json();
    },
  });
}

export function useCreateRecipientRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationRecipientRule>) => {
      const res = await fetch(`${API_BASE}/recipient-rules/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create recipient rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "recipient-rules"] });
    },
  });
}

export function useNotificationEscalationRules(eventId?: number) {
  return useQuery<NotificationEscalationRule[]>({
    queryKey: ["notification-center", "escalation-rules", eventId],
    queryFn: async () => {
      const url = eventId
        ? `${API_BASE}/escalation-rules/?event=${eventId}`
        : `${API_BASE}/escalation-rules/`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch escalation rules");
      return res.json();
    },
  });
}

export function useCreateEscalationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationEscalationRule>) => {
      const res = await fetch(`${API_BASE}/escalation-rules/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create escalation rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "escalation-rules"] });
    },
  });
}

export function useNotificationLogs(filters?: {
  event?: number;
  channel?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}) {
  return useQuery<NotificationLog[]>({
    queryKey: ["notification-center", "logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.event) params.append("event", String(filters.event));
      if (filters?.channel) params.append("channel", filters.channel);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.date_from) params.append("date_from", filters.date_from);
      if (filters?.date_to) params.append("date_to", filters.date_to);
      if (filters?.search) params.append("search", filters.search);
      const url = `${API_BASE}/logs/${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });
}

export function useNotificationAuditLogs(filters?: { entity_type?: string; action?: string }) {
  return useQuery<NotificationAuditLog[]>({
    queryKey: ["notification-center", "audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.entity_type) params.append("entity_type", filters.entity_type);
      if (filters?.action) params.append("action", filters.action);
      const url = `${API_BASE}/audit-logs/${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });
}

export function useTestSendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      template_id: number;
      variables?: Record<string, string>;
      email?: string;
      phone?: string;
    }) => {
      const res = await fetch(`${API_BASE}/test-send/`, {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send test notification");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-center", "logs"] });
    },
  });
}

export function useAvailableVariables() {
  return useQuery<Record<string, string[]>>({
    queryKey: ["notification-center", "available-variables"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/available-variables/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch available variables");
      return res.json();
    },
  });
}

export const NOTIFICATION_MODULES = [
  { value: "SERVICE", label: "Service" },
  { value: "CRM", label: "CRM" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "ACCOUNTS", label: "Accounts & Finance" },
  { value: "CONTRACTS", label: "Contracts" },
  { value: "HR", label: "HR & Payroll" },
  { value: "SYSTEM", label: "System" },
];

export const NOTIFICATION_CHANNELS = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PUSH", label: "Push Notification" },
  { value: "IN_APP", label: "In-App" },
];

export const TEMPLATE_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

export const DELIVERY_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "SENT", label: "Sent" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "BOUNCED", label: "Bounced" },
];
