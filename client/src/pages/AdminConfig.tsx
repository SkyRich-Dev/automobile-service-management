import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings, Wrench, Users, Package, IndianRupee, UserCheck,
  FileText, Bell, Plug, Cpu, Search, Plus, History,
  Calendar, Clock, Flag, Shield, GitBranch, AlertTriangle,
  CheckCircle, CheckCircle2, XCircle, Activity, Sliders, Workflow, Zap, ArrowRightLeft,
  Eye, Pencil, Trash2, ToggleLeft, ChevronLeft, ChevronRight,
  RefreshCw, LayoutDashboard, Menu, Timer, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient, getCsrfToken } from '@/lib/queryClient';

const n = (v: any) => (v == null ? 0 : typeof v === 'string' ? parseFloat(v) || 0 : Number(v));

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "default" : "secondary"} className={active ? "bg-emerald-600" : ""} data-testid="badge-status">{active ? "Active" : "Inactive"}</Badge>;
}

function ModuleBadge({ module }: { module: string }) {
  const colors: Record<string, string> = {
    SYSTEM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    SERVICE: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    CRM: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    INVENTORY: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    FINANCE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    HR: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    CONTRACT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
    NOTIFICATION: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    INTEGRATION: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
    AUTOMATION: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    ACCOUNTS: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };
  return <Badge variant="outline" className={colors[module] || ""}>{module}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const c: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-700", MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700", CRITICAL: "bg-red-100 text-red-700"
  };
  return <Badge variant="outline" className={c[priority] || ""}>{priority}</Badge>;
}

function Paginator({ page, setPage, total, perPage }: { page: number; setPage: (p: number) => void; total: number; perPage: number }) {
  const pages = Math.ceil(total / perPage) || 1;
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-muted-foreground">Page {page} of {pages} ({total} items)</span>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} data-testid="button-prev-page"><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)} data-testid="button-next-page"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function usePost(url: string, invalidateKeys: string[], successMsg: string) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const csrfToken = getCsrfToken();
      const res = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include", body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.text(); throw new Error(err || "Failed"); }
      return res.json();
    },
    onSuccess: () => { invalidateKeys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] })); toast({ title: successMsg }); },
    onError: (err: any) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });
}

function useDelete(invalidateKeys: string[], successMsg: string) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (url: string) => {
      const csrfToken = getCsrfToken();
      const res = await fetch(url, {
        method: "DELETE", headers: { ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) }, credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => { invalidateKeys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] })); toast({ title: successMsg }); },
    onError: (err: any) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });
}

function usePatch(invalidateKeys: string[], successMsg: string) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ url, data }: { url: string; data: any }) => {
      const csrfToken = getCsrfToken();
      const res = await fetch(url, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include", body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.text(); throw new Error(err || "Failed"); }
      return res.json();
    },
    onSuccess: () => { invalidateKeys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] })); toast({ title: successMsg }); },
    onError: (err: any) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });
}

export default function AdminConfig() {
  const { toast } = useToast();
  const [location] = useLocation();
  const urlTab = new URLSearchParams(window.location.search).get("tab");
  const [activeTab, setActiveTab] = useState(urlTab || "dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location]);

  const { data: overview } = useQuery<any>({ queryKey: ["/api/admin-config/dashboard/overview/"] });
  const { data: systemConfigs } = useQuery<any[]>({ queryKey: ["/api/admin-config/system-configs/"] });
  const { data: workflows } = useQuery<any[]>({ queryKey: ["/api/admin-config/workflows/"] });
  const { data: approvalRules } = useQuery<any[]>({ queryKey: ["/api/admin-config/approval-rules/"] });
  const { data: notifTemplates } = useQuery<any[]>({ queryKey: ["/api/admin-config/notification-templates/"] });
  const { data: automationRules } = useQuery<any[]>({ queryKey: ["/api/admin-config/automation-rules/"] });
  const { data: delegations } = useQuery<any[]>({ queryKey: ["/api/admin-config/delegations/"] });
  const { data: holidays } = useQuery<any[]>({ queryKey: ["/api/admin-config/holiday-calendar/"] });
  const { data: operatingHours } = useQuery<any[]>({ queryKey: ["/api/admin-config/operating-hours/"] });
  const { data: slaConfigs } = useQuery<any[]>({ queryKey: ["/api/admin-config/sla-configs/"] });
  const { data: menuConfigs } = useQuery<any[]>({ queryKey: ["/api/admin-config/menus/"] });
  const { data: featureFlags } = useQuery<any[]>({ queryKey: ["/api/admin-config/feature-flags/"] });
  const { data: auditLogs } = useQuery<any[]>({ queryKey: ["/api/admin-config/audit-logs/"] });

  const toggleFlagMutation = useMutation({
    mutationFn: async (id: number) => apiRequest('POST', `/api/admin-config/feature-flags/${id}/toggle/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-config/feature-flags/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin-config/dashboard/overview/"] });
      toast({ title: "Feature flag toggled" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "system-configs", label: "System Settings", icon: Settings },
    { id: "workflows", label: "Workflows", icon: Workflow },
    { id: "approval-rules", label: "Approval Rules", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "automation", label: "Automation", icon: Zap },
    { id: "delegations", label: "Delegations", icon: ArrowRightLeft },
    { id: "holidays", label: "Holidays", icon: Calendar },
    { id: "operating-hours", label: "Operating Hours", icon: Clock },
    { id: "sla", label: "SLA Config", icon: Timer },
    { id: "menus", label: "Menu Config", icon: Menu },
    { id: "feature-flags", label: "Feature Flags", icon: Flag },
    { id: "audit-log", label: "Audit Log", icon: History },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="admin-config-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Admin Configuration Center</h1>
          <p className="text-muted-foreground">Centralized control hub for system-wide configuration and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs py-1 px-3">Enterprise Control Hub</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1" data-testid="tabs-config">
            {tabs.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs gap-1.5" data-testid={`tab-${t.id}`}>
                <t.icon className="h-3.5 w-3.5" />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="dashboard"><DashboardTab overview={overview} auditLogs={auditLogs} /></TabsContent>
        <TabsContent value="system-configs"><SystemConfigsTab data={systemConfigs} /></TabsContent>
        <TabsContent value="workflows"><WorkflowsTab data={workflows} /></TabsContent>
        <TabsContent value="approval-rules"><ApprovalRulesTab data={approvalRules} /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab data={notifTemplates} /></TabsContent>
        <TabsContent value="automation"><AutomationTab data={automationRules} /></TabsContent>
        <TabsContent value="delegations"><DelegationsTab data={delegations} /></TabsContent>
        <TabsContent value="holidays"><HolidaysTab data={holidays} /></TabsContent>
        <TabsContent value="operating-hours"><OperatingHoursTab data={operatingHours} /></TabsContent>
        <TabsContent value="sla"><SLATab data={slaConfigs} /></TabsContent>
        <TabsContent value="menus"><MenuConfigTab data={menuConfigs} /></TabsContent>
        <TabsContent value="feature-flags"><FeatureFlagsTab data={featureFlags} toggleMutation={toggleFlagMutation} /></TabsContent>
        <TabsContent value="audit-log"><AuditLogTab data={auditLogs} /></TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardTab({ overview, auditLogs }: { overview: any; auditLogs: any[] | undefined }) {
  const stats = [
    { label: "System Configs", value: overview?.total_configs || 0, icon: Settings, color: "text-blue-600 bg-blue-100 dark:bg-blue-900" },
    { label: "Workflows", value: overview?.total_workflows || 0, icon: Workflow, color: "text-purple-600 bg-purple-100 dark:bg-purple-900" },
    { label: "Approval Rules", value: overview?.total_approval_rules || 0, icon: Shield, color: "text-orange-600 bg-orange-100 dark:bg-orange-900" },
    { label: "Automation Rules", value: overview?.total_automation_rules || 0, icon: Zap, color: "text-red-600 bg-red-100 dark:bg-red-900" },
    { label: "Notification Rules", value: overview?.total_notification_rules || 0, icon: Bell, color: "text-violet-600 bg-violet-100 dark:bg-violet-900" },
    { label: "Active Feature Flags", value: overview?.active_feature_flags || 0, icon: Flag, color: "text-green-600 bg-green-100 dark:bg-green-900" },
    { label: "Active Delegations", value: overview?.pending_delegations || 0, icon: ArrowRightLeft, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900" },
    { label: "Integration Errors", value: overview?.system_health?.integrations_error || 0, icon: AlertTriangle, color: (overview?.system_health?.integrations_error || 0) > 0 ? "text-red-600 bg-red-100 dark:bg-red-900" : "text-emerald-600 bg-emerald-100 dark:bg-emerald-900" },
  ];

  return (
    <div className="space-y-6" data-testid="content-dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} data-testid={`card-stat-${i}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-system-health">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /><span className="text-sm">Active Integrations</span></div>
              <span className="font-semibold" data-testid="text-integrations-active">{overview?.system_health?.integrations_active || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {(overview?.system_health?.integrations_error || 0) > 0 ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                <span className="text-sm">Integration Errors</span>
              </div>
              <span className="font-semibold" data-testid="text-integrations-error">{overview?.system_health?.integrations_error || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" /><span className="text-sm">Active Delegations</span></div>
              <span className="font-semibold">{overview?.pending_delegations || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-violet-500" /><span className="text-sm">Notification Templates</span></div>
              <span className="font-semibold">{overview?.total_notification_rules || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-changes">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />Recent Configuration Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.slice(0, 8).map((log: any, i: number) => (
                  <div key={log.id || i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-1.5 rounded-full mt-0.5 ${log.action === 'CREATE' ? 'bg-emerald-100 dark:bg-emerald-900' : log.action === 'DELETE' ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                      <Activity className={`h-3 w-3 ${log.action === 'CREATE' ? 'text-emerald-600' : log.action === 'DELETE' ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{log.entity_name}</span>
                        <Badge variant="outline" className="text-[10px]">{log.entity_type}</Badge>
                        <Badge variant={log.action === 'CREATE' ? 'default' : log.action === 'DELETE' ? 'destructive' : 'secondary'} className="text-[10px]">{log.action}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">by {log.performed_by_name || 'system'} · {new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground"><History className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No recent changes</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SystemConfigsTab({ data }: { data: any[] | undefined }) {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const perPage = 15;

  const createMut = usePost("/api/admin-config/system-configs/", ["/api/admin-config/system-configs/", "/api/admin-config/dashboard/overview/"], "System config created");
  const deleteMut = useDelete(["/api/admin-config/system-configs/", "/api/admin-config/dashboard/overview/"], "System config deleted");
  const patchMut = usePatch(["/api/admin-config/system-configs/"], "System config updated");

  const filtered = (data || []).filter(c =>
    (moduleFilter === "ALL" || c.module === moduleFilter) &&
    (search === "" || c.key.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()))
  );
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const modules = [...new Set((data || []).map((c: any) => c.module))];

  return (
    <div className="space-y-4" data-testid="content-system-configs">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">System Configuration</CardTitle>
              <CardDescription>Key-value system settings with versioning</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-config"><Plus className="h-4 w-4 mr-1" />Add Setting</Button>
          </div>
          <div className="flex gap-2 pt-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search configs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8" data-testid="input-search-configs" />
            </div>
            <Select value={moduleFilter} onValueChange={v => { setModuleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40" data-testid="select-module-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modules</SelectItem>
                {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((c: any) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailItem(c)} data-testid={`row-config-${c.id}`}>
                  <TableCell className="font-medium">{c.key}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.is_sensitive ? '••••••' : c.value}</TableCell>
                  <TableCell><ModuleBadge module={c.module} /></TableCell>
                  <TableCell><Badge variant="outline">{c.value_type}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">v{c.version}</Badge></TableCell>
                  <TableCell><StatusBadge active={c.is_active} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteMut.mutate(`/api/admin-config/system-configs/${c.id}/`); }} data-testid={`button-delete-config-${c.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><Settings className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No configurations found</p></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <div className="px-4 pb-4"><Paginator page={page} setPage={setPage} total={filtered.length} perPage={perPage} /></div>
        </CardContent>
      </Card>

      <CreateSystemConfigDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
      <SystemConfigDetailDialog item={detailItem} onClose={() => setDetailItem(null)} onSave={(id, data) => { patchMut.mutate({ url: `/api/admin-config/system-configs/${id}/`, data }); setDetailItem(null); }} />
    </div>
  );
}

function CreateSystemConfigDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ key: "", value: "", value_type: "STRING", module: "SYSTEM", category: "GENERAL", description: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add System Configuration</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Module</Label>
              <Select value={form.module} onValueChange={v => setForm(p => ({ ...p, module: v }))}>
                <SelectTrigger data-testid="select-config-module"><SelectValue /></SelectTrigger>
                <SelectContent>{["SYSTEM","SERVICE","CRM","INVENTORY","FINANCE","HR","CONTRACT","NOTIFICATION"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Type</Label>
              <Select value={form.value_type} onValueChange={v => setForm(p => ({ ...p, value_type: v }))}>
                <SelectTrigger data-testid="select-config-type"><SelectValue /></SelectTrigger>
                <SelectContent>{["STRING","NUMBER","BOOLEAN","JSON","LIST","SECRET"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div><Label>Key</Label><Input value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="config_key_name" data-testid="input-config-key" /></div>
          <div><Label>Value</Label><Input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="Configuration value" data-testid="input-config-value" /></div>
          <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="GENERAL" data-testid="input-config-category" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} data-testid="input-config-desc" /></div>
        </div>
        <DialogFooter><Button onClick={() => { if (form.key && form.value) onSubmit(form); }} data-testid="button-submit-config">Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SystemConfigDetailDialog({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (id: number, data: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  if (!item) return null;
  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Configuration Detail</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Key</Label><p className="font-medium">{item.key}</p></div>
            <div><Label className="text-xs text-muted-foreground">Module</Label><ModuleBadge module={item.module} /></div>
            <div><Label className="text-xs text-muted-foreground">Type</Label><Badge variant="outline">{item.value_type}</Badge></div>
            <div><Label className="text-xs text-muted-foreground">Version</Label><Badge variant="secondary">v{item.version}</Badge></div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Value</Label>
            {editing ? (
              <Input value={value} onChange={e => setValue(e.target.value)} autoFocus data-testid="input-edit-config-value" />
            ) : (
              <p className="font-mono text-sm bg-muted/50 p-2 rounded">{item.is_sensitive ? '••••••' : item.value}</p>
            )}
          </div>
          <div><Label className="text-xs text-muted-foreground">Description</Label><p className="text-sm">{item.description || '-'}</p></div>
          <div className="text-xs text-muted-foreground">Created by {item.created_by_name} · v{item.version} · {new Date(item.updated_at).toLocaleString()}</div>
        </div>
        <DialogFooter>
          {editing ? (
            <Button onClick={() => { onSave(item.id, { value }); setEditing(false); }} data-testid="button-save-config">Save</Button>
          ) : (
            <Button variant="outline" onClick={() => { setValue(item.value); setEditing(true); }} data-testid="button-edit-config"><Pencil className="h-4 w-4 mr-1" />Edit Value</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkflowsTab({ data }: { data: any[] | undefined }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const createMut = usePost("/api/admin-config/workflows/", ["/api/admin-config/workflows/", "/api/admin-config/dashboard/overview/"], "Workflow created");
  const deleteMut = useDelete(["/api/admin-config/workflows/", "/api/admin-config/dashboard/overview/"], "Workflow deleted");
  const patchMut = usePatch(["/api/admin-config/workflows/"], "Workflow updated");

  return (
    <div className="space-y-4" data-testid="content-workflows">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Workflow Configurations</CardTitle><CardDescription>Define and manage service process workflows</CardDescription></div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-workflow"><Plus className="h-4 w-4 mr-1" />Create Workflow</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data || []).map((wf: any) => (
              <div key={wf.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setDetail(wf)} data-testid={`card-workflow-${wf.id}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg"><GitBranch className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="font-medium">{wf.name}</p>
                    <p className="text-sm text-muted-foreground">{wf.code} · {wf.description?.substring(0, 60)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ModuleBadge module={wf.workflow_type} />
                  <Badge variant="outline">{wf.stages?.length || 0} stages</Badge>
                  <StatusBadge active={wf.is_active} />
                  <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteMut.mutate(`/api/admin-config/workflows/${wf.id}/`); }} data-testid={`button-delete-workflow-${wf.id}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <div className="text-center py-8 text-muted-foreground"><GitBranch className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No workflows configured</p></div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
          <CreateWorkflowForm onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs text-muted-foreground">Code</Label><p className="font-mono text-sm">{detail.code}</p></div>
                <div><Label className="text-xs text-muted-foreground">Type</Label><ModuleBadge module={detail.workflow_type} /></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label><StatusBadge active={detail.is_active} /></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stages ({detail.stages?.length || 0})</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(detail.stages || []).map((s: any, i: number) => (
                    <Badge key={i} variant="outline" className="gap-1"><span className="text-[10px] text-muted-foreground">{s.order}.</span>{s.name}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Version {detail.version} · Created by {detail.created_by_name} · {new Date(detail.created_at).toLocaleString()}</div>
              <DialogFooter>
                <Button variant={detail.is_active ? "secondary" : "default"} size="sm"
                  onClick={() => { patchMut.mutate({ url: `/api/admin-config/workflows/${detail.id}/`, data: { is_active: !detail.is_active } }); setDetail(null); }}
                  data-testid="button-toggle-workflow">
                  {detail.is_active ? "Deactivate" : "Activate"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateWorkflowForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ code: "", name: "", workflow_type: "SERVICE", description: "", stages: "[]" });
  return (
    <div className="space-y-3">
      <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="WF_CODE" data-testid="input-wf-code" /></div>
      <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Workflow Name" data-testid="input-wf-name" /></div>
      <div><Label>Type</Label>
        <Select value={form.workflow_type} onValueChange={v => setForm(p => ({ ...p, workflow_type: v }))}>
          <SelectTrigger data-testid="select-wf-type"><SelectValue /></SelectTrigger>
          <SelectContent>{["SERVICE","APPROVAL","INVENTORY","ACCOUNTS","HR","CRM","CONTRACT"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} data-testid="input-wf-desc" /></div>
      <div><Label>Stages (JSON)</Label><Textarea value={form.stages} onChange={e => setForm(p => ({ ...p, stages: e.target.value }))} rows={3} className="font-mono text-xs" data-testid="input-wf-stages" /></div>
      <DialogFooter>
        <Button onClick={() => { if (form.code && form.name) { try { onSubmit({ ...form, stages: JSON.parse(form.stages) }); } catch { onSubmit({ ...form, stages: [] }); } } }} data-testid="button-submit-workflow">Create</Button>
      </DialogFooter>
    </div>
  );
}

function ApprovalRulesTab({ data }: { data: any[] | undefined }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const createMut = usePost("/api/admin-config/approval-rules/", ["/api/admin-config/approval-rules/", "/api/admin-config/dashboard/overview/"], "Approval rule created");
  const deleteMut = useDelete(["/api/admin-config/approval-rules/", "/api/admin-config/dashboard/overview/"], "Approval rule deleted");

  return (
    <div className="space-y-4" data-testid="content-approval-rules">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Approval Rules</CardTitle><CardDescription>Dynamic multi-level approval chains</CardDescription></div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-approval"><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Module</TableHead><TableHead>Entity</TableHead><TableHead>Type</TableHead>
              <TableHead>Auto-Approve</TableHead><TableHead>Escalation</TableHead><TableHead>Status</TableHead><TableHead className="w-16"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data || []).map((r: any) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetail(r)} data-testid={`row-approval-${r.id}`}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell><ModuleBadge module={r.module} /></TableCell>
                  <TableCell>{r.entity_type}</TableCell>
                  <TableCell><Badge variant="outline">{r.approval_type}</Badge></TableCell>
                  <TableCell>{r.auto_approve_threshold ? `₹${n(r.auto_approve_threshold).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{r.escalation_hours}h</TableCell>
                  <TableCell><StatusBadge active={r.is_active} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteMut.mutate(`/api/admin-config/approval-rules/${r.id}/`); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No approval rules configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Code</Label><p className="font-mono text-sm">{detail.code}</p></div>
                <div><Label className="text-xs text-muted-foreground">Type</Label><Badge variant="outline">{detail.approval_type}</Badge></div>
                <div><Label className="text-xs text-muted-foreground">Module</Label><ModuleBadge module={detail.module} /></div>
                <div><Label className="text-xs text-muted-foreground">Entity</Label><p>{detail.entity_type}</p></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Approval Levels</Label>
                <div className="space-y-2 mt-1">
                  {(detail.levels || []).map((l: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Badge variant="secondary">L{l.level}</Badge>
                      <span className="text-sm font-medium">{l.role}</span>
                      {l.threshold && <span className="text-xs text-muted-foreground ml-auto">up to ₹{n(l.threshold).toLocaleString()}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Auto-Approve Below</Label><p>₹{n(detail.auto_approve_threshold).toLocaleString()}</p></div>
                <div><Label className="text-xs text-muted-foreground">Escalation</Label><p>{detail.escalation_hours} hours</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Approval Rule</DialogTitle></DialogHeader>
          <CreateApprovalForm onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateApprovalForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ code: "", name: "", module: "FINANCE", entity_type: "Expense", approval_type: "SEQUENTIAL", auto_approve_threshold: "", escalation_hours: "24", levels: "[]" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} data-testid="input-apr-code" /></div>
        <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-apr-name" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Module</Label>
          <Select value={form.module} onValueChange={v => setForm(p => ({ ...p, module: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["FINANCE","INVENTORY","HR","SERVICE","CRM","CONTRACT"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><Label>Type</Label>
          <Select value={form.approval_type} onValueChange={v => setForm(p => ({ ...p, approval_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["SEQUENTIAL","PARALLEL","ANY","HIERARCHY"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select></div>
      </div>
      <div><Label>Entity Type</Label><Input value={form.entity_type} onChange={e => setForm(p => ({ ...p, entity_type: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Auto-Approve Threshold</Label><Input type="number" value={form.auto_approve_threshold} onChange={e => setForm(p => ({ ...p, auto_approve_threshold: e.target.value }))} /></div>
        <div><Label>Escalation Hours</Label><Input type="number" value={form.escalation_hours} onChange={e => setForm(p => ({ ...p, escalation_hours: e.target.value }))} /></div>
      </div>
      <div><Label>Levels (JSON)</Label><Textarea value={form.levels} onChange={e => setForm(p => ({ ...p, levels: e.target.value }))} rows={3} className="font-mono text-xs" /></div>
      <DialogFooter>
        <Button onClick={() => { if (form.code && form.name) { try { onSubmit({ ...form, levels: JSON.parse(form.levels), auto_approve_threshold: form.auto_approve_threshold || null, escalation_hours: parseInt(form.escalation_hours) }); } catch { /* ignore */ } } }} data-testid="button-submit-approval">Create</Button>
      </DialogFooter>
    </div>
  );
}

function NotificationsTab({ data }: { data: any[] | undefined }) {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [detail, setDetail] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const createMut = usePost("/api/admin-config/notification-templates/", ["/api/admin-config/notification-templates/"], "Template created");
  const deleteMut = useDelete(["/api/admin-config/notification-templates/"], "Template deleted");

  const channelIcon = (ch: string) => {
    const map: Record<string, string> = { EMAIL: "📧", SMS: "📱", WHATSAPP: "💬", PUSH: "🔔", IN_APP: "🖥️" };
    return map[ch] || "📨";
  };

  const filtered = (data || []).filter(t =>
    (channelFilter === "ALL" || t.channel === channelFilter) &&
    (search === "" || t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4" data-testid="content-notifications">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Notification Templates</CardTitle><CardDescription>Multi-channel message templates</CardDescription></div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-notif"><Plus className="h-4 w-4 mr-1" />Add Template</Button>
          </div>
          <div className="flex gap-2 pt-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" data-testid="input-search-notif" /></div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">All Channels</SelectItem>{["EMAIL","SMS","WHATSAPP","PUSH","IN_APP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Channel</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Variables</TableHead><TableHead className="w-16"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((t: any) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetail(t)} data-testid={`row-notif-${t.id}`}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{channelIcon(t.channel)} {t.channel_display || t.channel}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate">{t.subject || '-'}</TableCell>
                  <TableCell><Badge variant={t.status === 'ACTIVE' ? 'default' : 'secondary'} className={t.status === 'ACTIVE' ? 'bg-emerald-600' : ''}>{t.status}</Badge></TableCell>
                  <TableCell>{(t.extracted_variables || []).length} vars</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteMut.mutate(`/api/admin-config/notification-templates/${t.id}/`); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No templates found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs text-muted-foreground">Code</Label><p className="font-mono text-sm">{detail.code}</p></div>
                <div><Label className="text-xs text-muted-foreground">Channel</Label><Badge variant="outline">{channelIcon(detail.channel)} {detail.channel_display}</Badge></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label><Badge variant={detail.status === 'ACTIVE' ? 'default' : 'secondary'}>{detail.status}</Badge></div>
              </div>
              {detail.subject && <div><Label className="text-xs text-muted-foreground">Subject</Label><p className="text-sm">{detail.subject}</p></div>}
              <div><Label className="text-xs text-muted-foreground">Body</Label><p className="text-sm bg-muted/50 p-3 rounded font-mono whitespace-pre-wrap">{detail.body}</p></div>
              {detail.extracted_variables?.length > 0 && (
                <div><Label className="text-xs text-muted-foreground">Variables</Label>
                  <div className="flex flex-wrap gap-1 mt-1">{detail.extracted_variables.map((v: string) => <Badge key={v} variant="outline" className="font-mono text-xs">{`{{${v}}}`}</Badge>)}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Notification Template</DialogTitle></DialogHeader>
          <CreateNotifForm onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateNotifForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ code: "", name: "", channel: "EMAIL", subject: "", body: "" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} data-testid="input-notif-code" /></div>
        <div><Label>Channel</Label>
          <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["EMAIL","SMS","WHATSAPP","PUSH","IN_APP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select></div>
      </div>
      <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-notif-name" /></div>
      <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
      <div><Label>Body</Label><Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={4} placeholder="Use {{variable}} for dynamic content" data-testid="input-notif-body" /></div>
      <DialogFooter><Button onClick={() => { if (form.code && form.name && form.body) onSubmit(form); }} data-testid="button-submit-notif">Create</Button></DialogFooter>
    </div>
  );
}

function AutomationTab({ data }: { data: any[] | undefined }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const createMut = usePost("/api/admin-config/automation-rules/", ["/api/admin-config/automation-rules/", "/api/admin-config/dashboard/overview/"], "Automation rule created");
  const deleteMut = useDelete(["/api/admin-config/automation-rules/", "/api/admin-config/dashboard/overview/"], "Automation rule deleted");
  const triggerMut = usePatch(["/api/admin-config/automation-rules/"], "Rule triggered");

  const triggerIcon = (t: string) => {
    const map: Record<string, any> = { EVENT: Zap, SCHEDULE: Clock, CONDITION: Eye, THRESHOLD: AlertTriangle };
    const Icon = map[t] || Zap;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4" data-testid="content-automation">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Automation Rules</CardTitle><CardDescription>IF-THEN automation engine</CardDescription></div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-automation"><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Module</TableHead><TableHead>Trigger</TableHead><TableHead>Action</TableHead>
              <TableHead>Runs</TableHead><TableHead>Status</TableHead><TableHead className="w-24"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data || []).map((r: any) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetail(r)} data-testid={`row-automation-${r.id}`}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell><ModuleBadge module={r.module} /></TableCell>
                  <TableCell><div className="flex items-center gap-1.5">{triggerIcon(r.trigger_type)}<span>{r.trigger_type}</span></div></TableCell>
                  <TableCell><Badge variant="outline">{r.action_type}</Badge></TableCell>
                  <TableCell>{r.trigger_count}</TableCell>
                  <TableCell><StatusBadge active={r.is_active} /></TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); triggerMut.mutate({ url: `/api/admin-config/automation-rules/${r.id}/trigger/`, data: {} }); }} title="Trigger manually" data-testid={`button-trigger-${r.id}`}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteMut.mutate(`/api/admin-config/automation-rules/${r.id}/`); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No automation rules</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Code</Label><p className="font-mono text-sm">{detail.code}</p></div>
                <div><Label className="text-xs text-muted-foreground">Module</Label><ModuleBadge module={detail.module} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Trigger</Label><div className="flex items-center gap-1.5">{triggerIcon(detail.trigger_type)}<span>{detail.trigger_type}</span></div></div>
                <div><Label className="text-xs text-muted-foreground">Event</Label><p className="font-mono text-sm">{detail.trigger_event || detail.trigger_schedule || '-'}</p></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Action</Label><Badge variant="outline">{detail.action_type}</Badge></div>
              <div><Label className="text-xs text-muted-foreground">Action Config</Label><pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">{JSON.stringify(detail.action_config, null, 2)}</pre></div>
              <div><Label className="text-xs text-muted-foreground">Description</Label><p className="text-sm">{detail.description || '-'}</p></div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Triggered {detail.trigger_count} times</span>
                {detail.last_triggered && <span>Last: {new Date(detail.last_triggered).toLocaleString()}</span>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Automation Rule</DialogTitle></DialogHeader>
          <CreateAutomationForm onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateAutomationForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ code: "", name: "", module: "SERVICE", trigger_type: "EVENT", trigger_event: "", action_type: "NOTIFY", description: "", action_config: "{}" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
        <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Module</Label>
          <Select value={form.module} onValueChange={v => setForm(p => ({ ...p, module: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["SERVICE","INVENTORY","FINANCE","CRM","HR","CONTRACT"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><Label>Trigger</Label>
          <Select value={form.trigger_type} onValueChange={v => setForm(p => ({ ...p, trigger_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["EVENT","SCHEDULE","CONDITION","THRESHOLD"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select></div>
      </div>
      <div><Label>Trigger Event/Schedule</Label><Input value={form.trigger_event} onChange={e => setForm(p => ({ ...p, trigger_event: e.target.value }))} /></div>
      <div><Label>Action Type</Label>
        <Select value={form.action_type} onValueChange={v => setForm(p => ({ ...p, action_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["NOTIFY","ASSIGN","UPDATE","CREATE","ESCALATE","WEBHOOK","WORKFLOW"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
        </Select></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
      <DialogFooter><Button onClick={() => { if (form.code && form.name) { try { onSubmit({ ...form, action_config: JSON.parse(form.action_config) }); } catch { onSubmit({ ...form, action_config: {} }); } } }}>Create</Button></DialogFooter>
    </div>
  );
}

function DelegationsTab({ data }: { data: any[] | undefined }) {
  const [createOpen, setCreateOpen] = useState(false);
  const createMut = usePost("/api/admin-config/delegations/", ["/api/admin-config/delegations/", "/api/admin-config/dashboard/overview/"], "Delegation created");
  const deleteMut = useDelete(["/api/admin-config/delegations/", "/api/admin-config/dashboard/overview/"], "Delegation removed");

  return (
    <div className="space-y-4" data-testid="content-delegations">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Role Delegations</CardTitle><CardDescription>Temporary role and permission delegation</CardDescription></div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-delegation"><Plus className="h-4 w-4 mr-1" />Add Delegation</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data || []).map((d: any) => {
              const now = new Date();
              const start = new Date(d.start_date);
              const end = new Date(d.end_date);
              const isActive = d.is_active && start <= now && end >= now;
              const isExpired = end < now;
              return (
                <div key={d.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg" data-testid={`card-delegation-${d.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${isActive ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'}`}>
                      <ArrowRightLeft className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{d.delegator_name} → {d.delegate_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {(d.roles || []).map((r: string) => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{d.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">{start.toLocaleDateString()} - {end.toLocaleDateString()}</p>
                      <Badge variant={isActive ? "default" : isExpired ? "secondary" : "outline"} className={isActive ? "bg-emerald-600" : ""}>
                        {isActive ? "Active" : isExpired ? "Expired" : "Scheduled"}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(`/api/admin-config/delegations/${d.id}/`)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {(!data || data.length === 0) && (
              <div className="text-center py-8 text-muted-foreground"><ArrowRightLeft className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No delegations configured</p></div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Delegation</DialogTitle><DialogDescription>Set up temporary role delegation between users</DialogDescription></DialogHeader>
          <CreateDelegationForm onSubmit={(formData: any) => { createMut.mutate(formData); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateDelegationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ delegator_name: "", delegate_name: "", roles: "", reason: "", start_date: "", end_date: "", is_active: true, requires_approval: false });
  const roleOptions = ["BRANCH_MANAGER", "SERVICE_ADVISOR", "WORKSHOP_MANAGER", "INVENTORY_MANAGER", "FINANCE_MANAGER", "CRM_MANAGER", "HR_MANAGER"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Delegator Name</Label><Input value={form.delegator_name} onChange={e => setForm(p => ({ ...p, delegator_name: e.target.value }))} placeholder="Manager name" data-testid="input-delegator" /></div>
        <div><Label>Delegate Name</Label><Input value={form.delegate_name} onChange={e => setForm(p => ({ ...p, delegate_name: e.target.value }))} placeholder="Deputy name" data-testid="input-delegate" /></div>
      </div>
      <div><Label>Roles to Delegate</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {roleOptions.map(r => {
            const selected = form.roles.split(",").filter(Boolean).includes(r);
            return <Badge key={r} variant={selected ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => {
              const current = form.roles.split(",").filter(Boolean);
              setForm(p => ({ ...p, roles: selected ? current.filter(x => x !== r).join(",") : [...current, r].join(",") }));
            }}>{r.replace(/_/g, " ")}</Badge>;
          })}
        </div>
      </div>
      <div><Label>Reason</Label><Input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for delegation" data-testid="input-delegation-reason" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} data-testid="input-delegation-start" /></div>
        <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} data-testid="input-delegation-end" /></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2"><Switch checked={form.requires_approval} onCheckedChange={v => setForm(p => ({ ...p, requires_approval: v }))} /><Label>Requires Approval</Label></div>
      </div>
      <DialogFooter>
        <Button onClick={() => { if (form.delegator_name && form.delegate_name && form.start_date && form.end_date) onSubmit({ ...form, roles: form.roles.split(",").filter(Boolean) }); }} data-testid="button-submit-delegation">Create Delegation</Button>
      </DialogFooter>
    </div>
  );
}

function HolidaysTab({ data }: { data: any[] | undefined }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState("ALL");
  const createMut = usePost("/api/admin-config/holiday-calendar/", ["/api/admin-config/holiday-calendar/"], "Holiday added");
  const deleteMut = useDelete(["/api/admin-config/holiday-calendar/"], "Holiday removed");

  const years = [...new Set((data || []).map((h: any) => String(h.year)))];
  const filtered = (data || []).filter(h => yearFilter === "ALL" || String(h.year) === yearFilter);

  const typeColor = (t: string) => {
    const map: Record<string, string> = { PUBLIC: "bg-blue-100 text-blue-700", OPTIONAL: "bg-amber-100 text-amber-700", RESTRICTED: "bg-orange-100 text-orange-700", COMPANY: "bg-purple-100 text-purple-700" };
    return map[t] || "";
  };

  return (
    <div className="space-y-4" data-testid="content-holidays">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Branch Holiday Calendar</CardTitle><CardDescription>Manage branch-specific holidays</CardDescription></div>
            <div className="flex gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ALL">All Years</SelectItem>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-holiday"><Plus className="h-4 w-4 mr-1" />Add Holiday</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Branch</TableHead><TableHead>Half Day</TableHead><TableHead className="w-16"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((h: any) => (
                <TableRow key={h.id} data-testid={`row-holiday-${h.id}`}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell><Badge variant="outline" className={typeColor(h.holiday_type)}>{h.holiday_type}</Badge></TableCell>
                  <TableCell>{h.branch_name || 'All'}</TableCell>
                  <TableCell>{h.is_half_day ? <Badge variant="outline">Half Day</Badge> : '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(`/api/admin-config/holiday-calendar/${h.id}/`)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No holidays found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <CreateHolidayForm onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateHolidayForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ name: "", date: "", holiday_type: "PUBLIC", year: "2026", is_half_day: false, description: "" });
  return (
    <div className="space-y-3">
      <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-holiday-name" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value, year: e.target.value.split('-')[0] || '2026' }))} data-testid="input-holiday-date" /></div>
        <div><Label>Type</Label>
          <Select value={form.holiday_type} onValueChange={v => setForm(p => ({ ...p, holiday_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["PUBLIC","OPTIONAL","RESTRICTED","COMPANY"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select></div>
      </div>
      <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
      <DialogFooter><Button onClick={() => { if (form.name && form.date) onSubmit({ ...form, year: parseInt(form.year) }); }} data-testid="button-submit-holiday">Add Holiday</Button></DialogFooter>
    </div>
  );
}

function OperatingHoursTab({ data }: { data: any[] | undefined }) {
  const patchMut = usePatch(["/api/admin-config/operating-hours/"], "Operating hours updated");
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const branches = [...new Set((data || []).map((h: any) => h.branch_name))];
  const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const dayNames: Record<string, string> = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' };

  const startEdit = (h: any) => { setEditId(h.id); setEditForm({ open_time: h.open_time?.substring(0, 5) || "", close_time: h.close_time?.substring(0, 5) || "", break_start: h.break_start?.substring(0, 5) || "", break_end: h.break_end?.substring(0, 5) || "" }); };
  const saveEdit = (id: number) => { patchMut.mutate({ url: `/api/admin-config/operating-hours/${id}/`, data: editForm }); setEditId(null); };

  return (
    <div className="space-y-4" data-testid="content-operating-hours">
      {branches.map(branch => {
        const branchHours = (data || []).filter(h => h.branch_name === branch).sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
        return (
          <Card key={branch}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />{branch}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Day</TableHead><TableHead>Status</TableHead><TableHead>Open</TableHead><TableHead>Close</TableHead><TableHead>Break Start</TableHead><TableHead>Break End</TableHead><TableHead className="w-20">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {branchHours.map((h: any) => (
                    <TableRow key={h.id} data-testid={`row-hours-${h.id}`}>
                      <TableCell className="font-medium">{dayNames[h.day] || h.day}</TableCell>
                      <TableCell>
                        <Switch checked={h.is_open} onCheckedChange={v => patchMut.mutate({ url: `/api/admin-config/operating-hours/${h.id}/`, data: { is_open: v } })} data-testid={`switch-open-${h.id}`} />
                      </TableCell>
                      {editId === h.id ? (
                        <>
                          <TableCell><Input type="time" value={editForm.open_time} onChange={e => setEditForm((p: any) => ({ ...p, open_time: e.target.value }))} className="h-8 w-24 text-xs" /></TableCell>
                          <TableCell><Input type="time" value={editForm.close_time} onChange={e => setEditForm((p: any) => ({ ...p, close_time: e.target.value }))} className="h-8 w-24 text-xs" /></TableCell>
                          <TableCell><Input type="time" value={editForm.break_start} onChange={e => setEditForm((p: any) => ({ ...p, break_start: e.target.value }))} className="h-8 w-24 text-xs" /></TableCell>
                          <TableCell><Input type="time" value={editForm.break_end} onChange={e => setEditForm((p: any) => ({ ...p, break_end: e.target.value }))} className="h-8 w-24 text-xs" /></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(h.id)} data-testid={`button-save-hours-${h.id}`}><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditId(null)}><XCircle className="h-4 w-4 text-muted-foreground" /></Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{h.open_time ? h.open_time.substring(0, 5) : '-'}</TableCell>
                          <TableCell>{h.close_time ? h.close_time.substring(0, 5) : '-'}</TableCell>
                          <TableCell>{h.break_start ? h.break_start.substring(0, 5) : '-'}</TableCell>
                          <TableCell>{h.break_end ? h.break_end.substring(0, 5) : '-'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(h)} data-testid={`button-edit-hours-${h.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
      {branches.length === 0 && (
        <Card><CardContent className="text-center py-8 text-muted-foreground"><Clock className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No operating hours configured</p></CardContent></Card>
      )}
    </div>
  );
}

function SLATab({ data }: { data: any[] | undefined }) {
  const [createOpen, setCreateOpen] = useState(false);
  const createMut = usePost("/api/admin-config/sla-configs/", ["/api/admin-config/sla-configs/"], "SLA config created");
  const deleteMut = useDelete(["/api/admin-config/sla-configs/"], "SLA config deleted");
  const [detail, setDetail] = useState<any>(null);

  return (
    <div className="space-y-4" data-testid="content-sla">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">SLA Configuration</CardTitle><CardDescription>Service Level Agreement settings with escalation</CardDescription></div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-sla"><Plus className="h-4 w-4 mr-1" />Add SLA</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Module</TableHead><TableHead>Entity</TableHead><TableHead>Priority</TableHead>
              <TableHead>Response</TableHead><TableHead>Resolution</TableHead><TableHead>Status</TableHead><TableHead className="w-16"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data || []).map((s: any) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetail(s)} data-testid={`row-sla-${s.id}`}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><ModuleBadge module={s.module} /></TableCell>
                  <TableCell>{s.entity_type}</TableCell>
                  <TableCell><PriorityBadge priority={s.priority} /></TableCell>
                  <TableCell>{s.response_hours}h</TableCell>
                  <TableCell>{s.resolution_hours}h</TableCell>
                  <TableCell><StatusBadge active={s.is_active} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteMut.mutate(`/api/admin-config/sla-configs/${s.id}/`); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No SLA configs</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs text-muted-foreground">Code</Label><p className="font-mono text-sm">{detail.code}</p></div>
                <div><Label className="text-xs text-muted-foreground">Module</Label><ModuleBadge module={detail.module} /></div>
                <div><Label className="text-xs text-muted-foreground">Priority</Label><PriorityBadge priority={detail.priority} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{detail.response_hours}h</p>
                  <p className="text-xs text-muted-foreground">Response Time</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{detail.resolution_hours}h</p>
                  <p className="text-xs text-muted-foreground">Resolution Time</p>
                </div>
              </div>
              {detail.escalation_levels?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Escalation Levels</Label>
                  <div className="space-y-2 mt-1">
                    {detail.escalation_levels.map((l: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Badge variant="secondary">L{l.level}</Badge>
                        <span className="text-sm">After {l.hours}h → Notify: {(l.notify || []).join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create SLA Config</DialogTitle></DialogHeader>
          <CreateSLAForm onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateSLAForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ code: "", name: "", module: "SERVICE", entity_type: "JobCard", priority: "MEDIUM", response_hours: "4", resolution_hours: "24" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
        <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-sla-name" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Module</Label>
          <Select value={form.module} onValueChange={v => setForm(p => ({ ...p, module: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["SERVICE","CRM","INVENTORY","FINANCE","HR"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select></div>
      </div>
      <div><Label>Entity Type</Label><Input value={form.entity_type} onChange={e => setForm(p => ({ ...p, entity_type: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Response Hours</Label><Input type="number" value={form.response_hours} onChange={e => setForm(p => ({ ...p, response_hours: e.target.value }))} /></div>
        <div><Label>Resolution Hours</Label><Input type="number" value={form.resolution_hours} onChange={e => setForm(p => ({ ...p, resolution_hours: e.target.value }))} /></div>
      </div>
      <DialogFooter><Button onClick={() => { if (form.code && form.name) onSubmit({ ...form, response_hours: parseInt(form.response_hours), resolution_hours: parseInt(form.resolution_hours) }); }} data-testid="button-submit-sla">Create</Button></DialogFooter>
    </div>
  );
}

function MenuConfigTab({ data }: { data: any[] | undefined }) {
  const [createOpen, setCreateOpen] = useState(false);
  const createMut = usePost("/api/admin-config/menus/", ["/api/admin-config/menus/"], "Menu item created");
  const deleteMut = useDelete(["/api/admin-config/menus/"], "Menu item deleted");
  const patchMut = usePatch(["/api/admin-config/menus/"], "Menu item updated");

  return (
    <div className="space-y-4" data-testid="content-menus">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Menu Configuration</CardTitle><CardDescription>Dynamic navigation structure with role-based visibility</CardDescription></div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-menu"><Plus className="h-4 w-4 mr-1" />Add Menu Item</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Name</TableHead><TableHead>Path</TableHead><TableHead>Module</TableHead>
              <TableHead>Icon</TableHead><TableHead>Roles</TableHead><TableHead>Visible</TableHead><TableHead className="w-20"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data || []).sort((a: any, b: any) => a.display_order - b.display_order).map((m: any) => (
                <TableRow key={m.id} data-testid={`row-menu-${m.id}`}>
                  <TableCell><Badge variant="secondary">{m.display_order}</Badge></TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="font-mono text-sm">{m.path}</TableCell>
                  <TableCell><ModuleBadge module={m.module} /></TableCell>
                  <TableCell><Badge variant="outline">{m.icon}</Badge></TableCell>
                  <TableCell>
                    {m.required_roles?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">{m.required_roles.slice(0, 2).map((r: string) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}{m.required_roles.length > 2 && <Badge variant="outline" className="text-[10px]">+{m.required_roles.length - 2}</Badge>}</div>
                    ) : <span className="text-xs text-muted-foreground">All roles</span>}
                  </TableCell>
                  <TableCell>
                    <Switch checked={m.is_visible} onCheckedChange={v => patchMut.mutate({ url: `/api/admin-config/menus/${m.id}/`, data: { is_visible: v } })} data-testid={`switch-menu-visible-${m.id}`} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(`/api/admin-config/menus/${m.id}/`)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No menu items configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
          <CreateMenuForm onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateMenuForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ code: "", name: "", module: "SYSTEM", icon: "settings", path: "/", display_order: "1" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
        <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-menu-name" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Path</Label><Input value={form.path} onChange={e => setForm(p => ({ ...p, path: e.target.value }))} /></div>
        <div><Label>Icon</Label><Input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Module</Label>
          <Select value={form.module} onValueChange={v => setForm(p => ({ ...p, module: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["SYSTEM","SERVICE","CRM","INVENTORY","FINANCE","HR","CONTRACT"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><Label>Order</Label><Input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: e.target.value }))} /></div>
      </div>
      <DialogFooter><Button onClick={() => { if (form.code && form.name) onSubmit({ ...form, display_order: parseInt(form.display_order) }); }} data-testid="button-submit-menu">Create</Button></DialogFooter>
    </div>
  );
}

function FeatureFlagsTab({ data, toggleMutation }: { data: any[] | undefined; toggleMutation: any }) {
  const [createOpen, setCreateOpen] = useState(false);
  const createMut = usePost("/api/admin-config/feature-flags/", ["/api/admin-config/feature-flags/", "/api/admin-config/dashboard/overview/"], "Feature flag created");
  const deleteMut = useDelete(["/api/admin-config/feature-flags/", "/api/admin-config/dashboard/overview/"], "Feature flag deleted");

  return (
    <div className="space-y-4" data-testid="content-feature-flags">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Feature Flags</CardTitle><CardDescription>Control feature rollout and availability</CardDescription></div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-flag"><Plus className="h-4 w-4 mr-1" />Add Flag</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data || []).map((flag: any) => (
              <div key={flag.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg transition-colors" data-testid={`card-flag-${flag.id}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${flag.is_enabled ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'}`}>
                    <Flag className={`h-5 w-5 ${flag.is_enabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{flag.name}</p>
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-[10px]">{flag.code}</Badge>
                      {flag.rollout_percentage < 100 && <Badge variant="outline" className="text-[10px]">{flag.rollout_percentage}% rollout</Badge>}
                      {flag.enabled_roles?.length > 0 && <Badge variant="outline" className="text-[10px]">{flag.enabled_roles.length} roles</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={() => toggleMutation.mutate(flag.id)}
                    data-testid={`switch-flag-${flag.id}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(`/api/admin-config/feature-flags/${flag.id}/`)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <div className="text-center py-8 text-muted-foreground"><Flag className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No feature flags defined</p></div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Feature Flag</DialogTitle></DialogHeader>
          <CreateFlagForm onSubmit={d => { createMut.mutate(d); setCreateOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateFlagForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ code: "", name: "", description: "", is_enabled: false, rollout_percentage: "100" });
  return (
    <div className="space-y-3">
      <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="FF_FEATURE_NAME" data-testid="input-flag-code" /></div>
      <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-flag-name" /></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} data-testid="input-flag-desc" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2"><Switch checked={form.is_enabled} onCheckedChange={v => setForm(p => ({ ...p, is_enabled: v }))} /><Label>Enabled</Label></div>
        <div><Label>Rollout %</Label><Input type="number" min="0" max="100" value={form.rollout_percentage} onChange={e => setForm(p => ({ ...p, rollout_percentage: e.target.value }))} /></div>
      </div>
      <DialogFooter><Button onClick={() => { if (form.code && form.name) onSubmit({ ...form, rollout_percentage: parseInt(form.rollout_percentage) }); }} data-testid="button-submit-flag">Create</Button></DialogFooter>
    </div>
  );
}

function AuditLogTab({ data }: { data: any[] | undefined }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const types = [...new Set((data || []).map((l: any) => l.entity_type))];
  const filtered = (data || []).filter(l =>
    (typeFilter === "ALL" || l.entity_type === typeFilter) &&
    (search === "" || l.entity_name.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()))
  );
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const actionColor = (a: string) => {
    const map: Record<string, string> = { CREATE: "bg-emerald-600", UPDATE: "bg-blue-600", DELETE: "bg-red-600", ACTIVATE: "bg-green-600", DEACTIVATE: "bg-amber-600", ROLLBACK: "bg-purple-600", TRIGGER: "bg-orange-600", TOGGLE: "bg-cyan-600" };
    return map[a] || "";
  };

  return (
    <div className="space-y-4" data-testid="content-audit-log">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle className="text-base">Configuration Audit Log</CardTitle><CardDescription>Immutable trail of all configuration changes</CardDescription></div>
          </div>
          <div className="flex gap-2 pt-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search audit log..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8" data-testid="input-search-audit" /></div>
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">All Types</SelectItem>{types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Timestamp</TableHead><TableHead>Entity</TableHead><TableHead>Name</TableHead><TableHead>Action</TableHead>
              <TableHead>User</TableHead><TableHead>Summary</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paged.map((log: any) => (
                <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{log.entity_type}</Badge></TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{log.entity_name}</TableCell>
                  <TableCell><Badge className={actionColor(log.action)}>{log.action}</Badge></TableCell>
                  <TableCell>{log.performed_by_name || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{log.change_summary || '-'}</TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No audit logs found</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className="px-4 pb-4"><Paginator page={page} setPage={setPage} total={filtered.length} perPage={perPage} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
