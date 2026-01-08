import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Play,
  History,
  Users,
  ChevronRight,
  LayoutGrid,
  Zap,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useNotificationCenterDashboard,
  useNotificationEvents,
  useNotificationTemplates,
  useNotificationRules,
  useNotificationLogs,
  useNotificationAuditLogs,
  useCreateNotificationEvent,
  useCreateNotificationTemplate,
  useUpdateNotificationEvent,
  usePreviewTemplate,
  useTestSendNotification,
  useAvailableVariables,
  NOTIFICATION_MODULES,
  NOTIFICATION_CHANNELS,
  TEMPLATE_STATUSES,
  DELIVERY_STATUSES,
  type NotificationEvent,
  type NotificationTemplate,
  type NotificationLog,
} from "@/hooks/use-notification-center";

function DashboardTab() {
  const { data: dashboard, isLoading, refetch } = useNotificationCenterDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-events">{dashboard?.total_events || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.active_events || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-templates">{dashboard?.total_templates || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.active_templates || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-notifications-today">{dashboard?.notifications_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.notifications_failed_today || 0} failed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Pending Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-queue">{dashboard?.pending_queue || 0}</div>
            <p className="text-xs text-muted-foreground">
              awaiting delivery
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Events by Module</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboard?.events_by_module || {}).map(([module, count]) => (
                <div key={module} className="flex items-center justify-between">
                  <span className="text-sm">{NOTIFICATION_MODULES.find(m => m.value === module)?.label || module}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
              {Object.keys(dashboard?.events_by_module || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">No events configured yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboard?.delivery_stats || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {status === "DELIVERED" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {status === "FAILED" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {status === "PENDING" && <Clock className="h-4 w-4 text-yellow-500" />}
                    {status === "SENT" && <Send className="h-4 w-4 text-blue-500" />}
                    <span className="text-sm">{DELIVERY_STATUSES.find(s => s.value === status)?.label || status}</span>
                  </div>
                  <Badge variant={status === "FAILED" ? "destructive" : "secondary"}>{count as number}</Badge>
                </div>
              ))}
              {Object.keys(dashboard?.delivery_stats || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">No deliveries today</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">Recent Notifications</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => refetch()} data-testid="button-refresh-logs">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Log #</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dashboard?.recent_logs || []).map((log) => (
                <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                  <TableCell className="font-mono text-xs">{log.log_number}</TableCell>
                  <TableCell>{log.event_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.channel_display}</Badge>
                  </TableCell>
                  <TableCell>{log.recipient_name || log.recipient_email || log.recipient_phone}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === "DELIVERED" ? "default" : log.status === "FAILED" ? "destructive" : "secondary"}>
                      {log.status_display}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {(dashboard?.recent_logs || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No recent notifications
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EventsTab() {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const { data: events, isLoading } = useNotificationEvents({ module: moduleFilter === "all" ? undefined : moduleFilter });
  const createEvent = useCreateNotificationEvent();
  const { toast } = useToast();
  const { data: availableVars } = useAvailableVariables();

  const [newEvent, setNewEvent] = useState({
    code: "",
    name: "",
    description: "",
    module: "SERVICE",
    trigger_type: "SYSTEM_EVENT",
    available_variables: [] as string[],
    is_active: true,
  });

  const handleCreate = async () => {
    try {
      await createEvent.mutateAsync(newEvent);
      toast({ title: "Event created successfully" });
      setShowCreate(false);
      setNewEvent({
        code: "",
        name: "",
        description: "",
        module: "SERVICE",
        trigger_type: "SYSTEM_EVENT",
        available_variables: [],
        is_active: true,
      });
    } catch (error) {
      toast({ title: "Failed to create event", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-module-filter">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {NOTIFICATION_MODULES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Notification Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Code</Label>
                  <Input
                    value={newEvent.code}
                    onChange={(e) => setNewEvent({ ...newEvent, code: e.target.value.toUpperCase() })}
                    placeholder="JOB_CARD_CREATED"
                    data-testid="input-event-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Select value={newEvent.module} onValueChange={(v) => setNewEvent({ ...newEvent, module: v })}>
                    <SelectTrigger data-testid="select-event-module">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_MODULES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="Job Card Created"
                  data-testid="input-event-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Triggered when a new job card is created"
                  data-testid="input-event-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-md min-h-[60px]">
                  {(availableVars?.[newEvent.module] || []).map((v) => (
                    <Badge
                      key={v}
                      variant={newEvent.available_variables.includes(v) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const vars = newEvent.available_variables.includes(v)
                          ? newEvent.available_variables.filter((x) => x !== v)
                          : [...newEvent.available_variables, v];
                        setNewEvent({ ...newEvent, available_variables: vars });
                      }}
                    >
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newEvent.is_active}
                  onCheckedChange={(v) => setNewEvent({ ...newEvent, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createEvent.isPending} data-testid="button-save-event">
                Create Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {(events || []).map((event) => (
            <Card key={event.id} data-testid={`card-event-${event.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{event.name}</span>
                      <Badge variant="outline" className="text-xs">{event.code}</Badge>
                      <Badge variant={event.is_active ? "default" : "secondary"}>
                        {event.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {event.is_system_event && <Badge variant="secondary">System</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <LayoutGrid className="h-3 w-3" />
                        {event.module_display}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {event.template_count} templates
                      </span>
                      <span className="flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        {event.rule_count} rules
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" data-testid={`button-edit-event-${event.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(events || []).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notification events found</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
                  Create your first event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function TemplatesTab() {
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const { data: templates, isLoading } = useNotificationTemplates({
    channel: channelFilter === "all" ? undefined : channelFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: events } = useNotificationEvents({ is_active: true });
  const createTemplate = useCreateNotificationTemplate();
  const previewTemplate = usePreviewTemplate();
  const testSend = useTestSendNotification();
  const { toast } = useToast();

  const [newTemplate, setNewTemplate] = useState({
    code: "",
    name: "",
    event: 0,
    channel: "EMAIL",
    subject: "",
    body: "",
    status: "DRAFT",
    is_active: true,
  });

  const [testDialog, setTestDialog] = useState<{ open: boolean; template: NotificationTemplate | null }>({
    open: false,
    template: null,
  });
  const [testEmail, setTestEmail] = useState("");

  const handleCreate = async () => {
    try {
      await createTemplate.mutateAsync(newTemplate);
      toast({ title: "Template created successfully" });
      setShowCreate(false);
    } catch (error) {
      toast({ title: "Failed to create template", variant: "destructive" });
    }
  };

  const handlePreview = async () => {
    try {
      const result = await previewTemplate.mutateAsync({
        content: newTemplate.body,
        variables: { CustomerName: "John Doe", VehicleNumber: "ABC-1234" },
      });
      setPreviewContent(result.rendered);
    } catch (error) {
      toast({ title: "Preview failed", variant: "destructive" });
    }
  };

  const handleTestSend = async () => {
    if (!testDialog.template) return;
    try {
      await testSend.mutateAsync({
        template_id: testDialog.template.id,
        email: testEmail,
        variables: { CustomerName: "Test User", VehicleNumber: "TEST-123" },
      });
      toast({ title: "Test notification sent" });
      setTestDialog({ open: false, template: null });
      setTestEmail("");
    } catch (error) {
      toast({ title: "Failed to send test", variant: "destructive" });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "EMAIL": return <Mail className="h-4 w-4" />;
      case "SMS": return <MessageSquare className="h-4 w-4" />;
      case "WHATSAPP": return <MessageSquare className="h-4 w-4" />;
      case "PUSH": return <Smartphone className="h-4 w-4" />;
      case "IN_APP": return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-channel-filter">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {NOTIFICATION_CHANNELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TEMPLATE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Notification Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Code</Label>
                  <Input
                    value={newTemplate.code}
                    onChange={(e) => setNewTemplate({ ...newTemplate, code: e.target.value.toUpperCase() })}
                    placeholder="TPL_JOB_CREATED_EMAIL"
                    data-testid="input-template-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={newTemplate.channel} onValueChange={(v) => setNewTemplate({ ...newTemplate, channel: v })}>
                    <SelectTrigger data-testid="select-template-channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_CHANNELS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Job Card Created Email"
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={String(newTemplate.event || "")} onValueChange={(v) => setNewTemplate({ ...newTemplate, event: Number(v) })}>
                  <SelectTrigger data-testid="select-template-event">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {(events || []).map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newTemplate.channel === "EMAIL" && (
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder="Your service is ready - {{VehicleNumber}}"
                    data-testid="input-template-subject"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  placeholder="Dear {{CustomerName}}, your vehicle {{VehicleNumber}} service has been completed."
                  className="min-h-[150px]"
                  data-testid="input-template-body"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{VariableName}}"} syntax for dynamic content
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handlePreview} disabled={!newTemplate.body}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                {previewContent && (
                  <div className="flex-1 p-3 bg-muted rounded-md text-sm">
                    {previewContent}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createTemplate.isPending} data-testid="button-save-template">
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(templates || []).map((template) => (
              <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                <TableCell>
                  <div>
                    <span className="font-medium">{template.name}</span>
                    <p className="text-xs text-muted-foreground">{template.code}</p>
                  </div>
                </TableCell>
                <TableCell>{template.event_name || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(template.channel)}
                    <span>{template.channel_display}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={template.status === "ACTIVE" ? "default" : "secondary"}>
                    {template.status_display}
                  </Badge>
                </TableCell>
                <TableCell>v{template.version}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTestDialog({ open: true, template })}
                      data-testid={`button-test-template-${template.id}`}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" data-testid={`button-edit-template-${template.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(templates || []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No templates found. Create your first template to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={testDialog.open} onOpenChange={(open) => setTestDialog({ open, template: testDialog.template })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a test notification using template: <strong>{testDialog.template?.name}</strong>
            </p>
            {testDialog.template?.channel === "EMAIL" && (
              <div className="space-y-2">
                <Label>Test Email</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  data-testid="input-test-email"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialog({ open: false, template: null })}>Cancel</Button>
            <Button onClick={handleTestSend} disabled={testSend.isPending} data-testid="button-send-test">
              <Send className="h-4 w-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RulesTab() {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const { data: rules, isLoading } = useNotificationRules({ module: moduleFilter === "all" ? undefined : moduleFilter });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-rule-module-filter">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {NOTIFICATION_MODULES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button data-testid="button-create-rule">
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Delay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rules || []).map((rule) => (
              <TableRow key={rule.id} data-testid={`row-rule-${rule.id}`}>
                <TableCell>
                  <div>
                    <span className="font-medium">{rule.name}</span>
                    <p className="text-xs text-muted-foreground">{rule.code}</p>
                  </div>
                </TableCell>
                <TableCell>{rule.event_name || "-"}</TableCell>
                <TableCell>{rule.template_name || "-"}</TableCell>
                <TableCell>
                  {rule.delay_value > 0 ? `${rule.delay_value} ${rule.delay_unit_display}` : "Immediate"}
                </TableCell>
                <TableCell>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" data-testid={`button-edit-rule-${rule.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(rules || []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No notification rules found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function LogsTab() {
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { data: logs, isLoading, refetch } = useNotificationLogs({
    channel: channelFilter === "all" ? undefined : channelFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });

  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="pl-9 w-[250px]"
              data-testid="input-search-logs"
            />
          </div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-log-channel-filter">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {NOTIFICATION_CHANNELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-log-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {DELIVERY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-logs-tab">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Log #</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(logs || []).map((log) => (
              <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                <TableCell className="font-mono text-xs">{log.log_number}</TableCell>
                <TableCell>{log.event_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.channel_display}</Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="text-sm">{log.recipient_name}</span>
                    <p className="text-xs text-muted-foreground">
                      {log.recipient_email || log.recipient_phone}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    log.status === "DELIVERED" ? "default" :
                    log.status === "FAILED" ? "destructive" :
                    log.status === "SENT" ? "secondary" : "outline"
                  }>
                    {log.status_display}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.sent_at ? new Date(log.sent_at).toLocaleString() : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedLog(log)}
                    data-testid={`button-view-log-${log.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(logs || []).length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No notification logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Log Number</Label>
                  <p className="font-mono">{selectedLog.log_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedLog.status === "DELIVERED" ? "default" : selectedLog.status === "FAILED" ? "destructive" : "secondary"}>
                    {selectedLog.status_display}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event</Label>
                  <p>{selectedLog.event_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Channel</Label>
                  <p>{selectedLog.channel_display}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Recipient</Label>
                  <p>{selectedLog.recipient_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedLog.recipient_email || selectedLog.recipient_phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sent At</Label>
                  <p>{selectedLog.sent_at ? new Date(selectedLog.sent_at).toLocaleString() : "-"}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="text-sm">{selectedLog.subject || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Content</Label>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {selectedLog.content_rendered}
                </div>
              </div>
              {selectedLog.failure_reason && (
                <div>
                  <Label className="text-muted-foreground">Failure Reason</Label>
                  <p className="text-sm text-destructive">{selectedLog.failure_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditTab() {
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const { data: auditLogs, isLoading } = useNotificationAuditLogs({
    entity_type: entityFilter === "all" ? undefined : entityFilter,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-audit-entity-filter">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="NotificationEvent">Events</SelectItem>
            <SelectItem value="NotificationTemplate">Templates</SelectItem>
            <SelectItem value="NotificationRule">Rules</SelectItem>
            <SelectItem value="NotificationChannelConfig">Channel Configs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(auditLogs || []).map((log) => (
              <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                <TableCell>
                  <div>
                    <span className="font-medium">{log.entity_name}</span>
                    <p className="text-xs text-muted-foreground">{log.entity_type}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    log.action === "CREATE" ? "default" :
                    log.action === "DELETE" ? "destructive" : "secondary"
                  }>
                    {log.action_display}
                  </Badge>
                </TableCell>
                <TableCell>{log.performed_by_name || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{log.reason || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {(auditLogs || []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No audit logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg" data-testid="text-page-title">Notification Center</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList data-testid="tabs-notification-center">
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
              <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
              <TabsTrigger value="rules" data-testid="tab-rules">Rules</TabsTrigger>
              <TabsTrigger value="logs" data-testid="tab-logs">Logs</TabsTrigger>
              <TabsTrigger value="audit" data-testid="tab-audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardTab />
            </TabsContent>
            <TabsContent value="events">
              <EventsTab />
            </TabsContent>
            <TabsContent value="templates">
              <TemplatesTab />
            </TabsContent>
            <TabsContent value="rules">
              <RulesTab />
            </TabsContent>
            <TabsContent value="logs">
              <LogsTab />
            </TabsContent>
            <TabsContent value="audit">
              <AuditTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
