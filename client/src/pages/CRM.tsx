import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useCustomers, useCreateCustomer, useCreateVehicle } from "@/hooks/use-crm";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Mail,
  Phone,
  Users,
  Star,
  Loader2,
  Car,
  Target,
  Ticket,
  Clock,
  Megaphone,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  User,
  MessageSquare,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Lead {
  id: number;
  lead_id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  lead_type: string;
  vehicle_make: string;
  vehicle_model: string;
  expected_value: string;
  priority: string;
  owner_name: string;
  assigned_to_name: string;
  next_follow_up: string | null;
  created_at: string;
}

interface TicketData {
  id: number;
  ticket_id: string;
  customer_name: string;
  vehicle_info: string;
  ticket_type: string;
  status: string;
  priority: string;
  subject: string;
  assigned_to_name: string;
  escalation_level: number;
  sla_breached: boolean;
  age_hours: number;
  created_at: string;
}

interface FollowUpTask {
  id: number;
  task_id: string;
  customer_name: string;
  lead_name: string;
  follow_up_type: string;
  status: string;
  priority: string;
  subject: string;
  due_date: string;
  assigned_to_name: string;
  is_overdue: boolean;
}

interface Campaign {
  id: number;
  campaign_id: string;
  name: string;
  campaign_type: string;
  status: string;
  channel: string;
  total_recipients: number;
  messages_sent: number;
  conversions: number;
  conversion_rate: number;
  created_at: string;
}

interface CRMDashboard {
  total_customers: number;
  new_leads: number;
  open_tickets: number;
  pending_tasks: number;
  overdue_tasks: number;
  active_campaigns: number;
  at_risk_customers: number;
  lead_pipeline: Record<string, number>;
  ticket_by_type: Record<string, number>;
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CONTACTED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  QUALIFIED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  QUOTED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  NEGOTIATION: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  CONVERTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  RAISED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  WAITING_CUSTOMER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ESCALATED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-6">
          <div className="skeleton mb-2 h-8 w-32" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function CRM() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const createVehicle = useCreateVehicle();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: dashboard, isLoading: dashboardLoading } = useQuery<CRMDashboard>({
    queryKey: ["/api/crm/dashboard/"],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads/"],
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<TicketData[]>({
    queryKey: ["/api/tickets/"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<FollowUpTask[]>({
    queryKey: ["/api/follow-up-tasks/"],
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns/"],
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    loyalty_points: 0,
    address: "",
    notes: "",
  });

  const [leadFormData, setLeadFormData] = useState({
    name: "",
    phone: "",
    email: "",
    source: "WALK_IN",
    lead_type: "SERVICE",
    vehicle_make: "",
    vehicle_model: "",
    expected_value: "",
    priority: "MEDIUM",
    notes: "",
  });

  const createLead = useMutation({
    mutationFn: async (data: typeof leadFormData) => {
      const res = await apiRequest("POST", "/api/leads/", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard/"] });
      toast({ title: "Lead created successfully" });
      setLeadDialogOpen(false);
      setLeadFormData({
        name: "",
        phone: "",
        email: "",
        source: "WALK_IN",
        lead_type: "SERVICE",
        vehicle_make: "",
        vehicle_model: "",
        expected_value: "",
        priority: "MEDIUM",
        notes: "",
      });
    },
    onError: () => {
      toast({ title: "Failed to create lead", variant: "destructive" });
    },
  });

  const transitionLead = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("POST", `/api/leads/${id}/transition/`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard/"] });
      toast({ title: "Lead status updated" });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const type = (e.target as HTMLInputElement).type;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleLeadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLeadFormData({ ...leadFormData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer.mutate(formData, {
      onSuccess: () => {
        toast({ title: "Customer added successfully" });
        setOpen(false);
        setFormData({ name: "", email: "", phone: "", loyalty_points: 0, address: "", notes: "" });
      },
      onError: () => {
        toast({ title: "Failed to create customer", variant: "destructive" });
      },
    });
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate(leadFormData);
  };

  const isLoading = customersLoading || dashboardLoading;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.email?.toLowerCase().includes(q)
    );
  });

  const openTickets = tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
  const overdueTasks = tasks.filter((t) => t.is_overdue);

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-crm">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage leads, customers, tickets, and campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setOpen(true)} data-testid="button-add-customer">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
            <Button onClick={() => setLeadDialogOpen(true)} data-testid="button-add-lead">
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold">{dashboard?.total_customers ?? 0}</p>
                </div>
                <Users className="h-6 w-6 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">New Leads</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboard?.new_leads ?? 0}</p>
                </div>
                <Target className="h-6 w-6 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={cn((dashboard?.open_tickets ?? 0) > 0 && "border-orange-500")}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Open Tickets</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboard?.open_tickets ?? 0}</p>
                </div>
                <Ticket className="h-6 w-6 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold">{dashboard?.pending_tasks ?? 0}</p>
                </div>
                <Clock className="h-6 w-6 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={cn((dashboard?.overdue_tasks ?? 0) > 0 && "border-red-500")}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{dashboard?.overdue_tasks ?? 0}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard?.active_campaigns ?? 0}</p>
                </div>
                <Megaphone className="h-6 w-6 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={cn((dashboard?.at_risk_customers ?? 0) > 0 && "border-yellow-500")}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold text-yellow-600">{dashboard?.at_risk_customers ?? 0}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="tickets" data-testid="tab-tickets">Tickets ({openTickets.length})</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">Follow-ups ({tasks.length})</TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">Customers ({customers?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lead Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(dashboard?.lead_pipeline ?? {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", LEAD_STATUS_COLORS[status])}>
                            {status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10">
                            {lead.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", LEAD_STATUS_COLORS[lead.status])}>
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No leads yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Open Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  {openTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">{ticket.customer_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", PRIORITY_COLORS[ticket.priority])}>
                          {ticket.priority}
                        </Badge>
                        {ticket.sla_breached && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  {openTickets.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No open tickets</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Overdue Follow-ups</CardTitle>
                </CardHeader>
                <CardContent>
                  {overdueTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{task.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.customer_name || task.lead_name} - Due: {format(new Date(task.due_date), "MMM d")}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs">Overdue</Badge>
                    </div>
                  ))}
                  {overdueTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No overdue tasks</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-leads"
                />
              </div>
            </div>

            {leadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No leads found</p>
                  <Button className="mt-4" onClick={() => setLeadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Lead
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredLeads.map((lead) => (
                  <Card key={lead.id} data-testid={`card-lead-${lead.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10">
                              {lead.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.lead_id}</p>
                          </div>
                        </div>
                        <Badge className={cn("text-xs", LEAD_STATUS_COLORS[lead.status])}>
                          {lead.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {(lead.vehicle_make || lead.vehicle_model) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Car className="h-3.5 w-3.5" />
                            <span>{lead.vehicle_make} {lead.vehicle_model}</span>
                          </div>
                        )}
                        {lead.expected_value && parseFloat(lead.expected_value) > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Expected: Rs {parseFloat(lead.expected_value).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                        {lead.status === "NEW" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => transitionLead.mutate({ id: lead.id, status: "CONTACTED" })}
                          >
                            Mark Contacted
                          </Button>
                        )}
                        {lead.status === "CONTACTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => transitionLead.mutate({ id: lead.id, status: "QUALIFIED" })}
                          >
                            Qualify
                          </Button>
                        )}
                        {lead.status === "QUALIFIED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => transitionLead.mutate({ id: lead.id, status: "QUOTED" })}
                          >
                            Send Quote
                          </Button>
                        )}
                        {["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "NEGOTIATION"].includes(lead.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => transitionLead.mutate({ id: lead.id, status: "LOST" })}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Lost
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tickets found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} data-testid={`card-ticket-${ticket.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">{ticket.ticket_id}</span>
                            <Badge className={cn("text-xs", TICKET_STATUS_COLORS[ticket.status])}>
                              {ticket.status.replace(/_/g, " ")}
                            </Badge>
                            <Badge className={cn("text-xs", PRIORITY_COLORS[ticket.priority])}>
                              {ticket.priority}
                            </Badge>
                            {ticket.sla_breached && (
                              <Badge variant="destructive" className="text-xs">SLA Breached</Badge>
                            )}
                          </div>
                          <h3 className="font-medium">{ticket.subject}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {ticket.customer_name}
                            </span>
                            {ticket.vehicle_info && (
                              <span className="flex items-center gap-1">
                                <Car className="h-3.5 w-3.5" />
                                {ticket.vehicle_info}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {Math.round(ticket.age_hours)}h ago
                            </span>
                          </div>
                        </div>
                        {ticket.escalation_level > 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Escalation L{ticket.escalation_level}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No follow-up tasks</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    className={cn(task.is_overdue && "border-red-500")}
                    data-testid={`card-task-${task.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">{task.task_id}</span>
                            <Badge variant="outline" className="text-xs">{task.follow_up_type}</Badge>
                            {task.is_overdue && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                          </div>
                          <h3 className="font-medium">{task.subject}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{task.customer_name || task.lead_name}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Due: {format(new Date(task.due_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <Badge className={cn("text-xs", PRIORITY_COLORS[task.priority])}>
                          {task.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customers?.map((customer) => (
                <Card key={customer.id} data-testid={`card-customer-${customer.id}`}>
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-lg font-semibold text-white">
                          {customer.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{customer.name}</h3>
                        <Badge variant="outline" className="mt-1 gap-1 text-[10px]">
                          <Star className="h-2.5 w-2.5" />
                          {customer.loyalty_points} Points
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.vehicles && customer.vehicles.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Car className="h-4 w-4" />
                          <span>{customer.vehicles.length} vehicle(s)</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!customers || customers.length === 0) && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
                  <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No customers yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
                    Add your first customer
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No campaigns yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.campaign_id}</p>
                        </div>
                        <Badge variant={campaign.status === "ACTIVE" ? "default" : "outline"}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span>{campaign.campaign_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recipients</span>
                          <span>{campaign.total_recipients}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sent</span>
                          <span>{campaign.messages_sent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conversions</span>
                          <span className="text-green-600 font-medium">
                            {campaign.conversions} ({campaign.conversion_rate.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Add customer details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Customer name" required data-testid="input-customer-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" required data-testid="input-customer-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" required data-testid="input-customer-phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Street address" data-testid="input-customer-address" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createCustomer.isPending} data-testid="button-save-customer">
                  {createCustomer.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>Add a new sales lead</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead_name">Name</Label>
                <Input id="lead_name" name="name" value={leadFormData.name} onChange={handleLeadChange} placeholder="Lead name" required data-testid="input-lead-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_phone">Phone</Label>
                  <Input id="lead_phone" name="phone" value={leadFormData.phone} onChange={handleLeadChange} placeholder="+91 98765 43210" required data-testid="input-lead-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_email">Email</Label>
                  <Input id="lead_email" name="email" type="email" value={leadFormData.email} onChange={handleLeadChange} placeholder="email@example.com" data-testid="input-lead-email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_source">Source</Label>
                  <Select value={leadFormData.source} onValueChange={(v) => setLeadFormData({ ...leadFormData, source: v })}>
                    <SelectTrigger data-testid="select-lead-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WALK_IN">Walk-in</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="REFERRAL">Referral</SelectItem>
                      <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                      <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_type">Type</Label>
                  <Select value={leadFormData.lead_type} onValueChange={(v) => setLeadFormData({ ...leadFormData, lead_type: v })}>
                    <SelectTrigger data-testid="select-lead-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICE">Service</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="PARTS">Parts</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_make">Vehicle Make</Label>
                  <Input id="vehicle_make" name="vehicle_make" value={leadFormData.vehicle_make} onChange={handleLeadChange} placeholder="Honda, Toyota" data-testid="input-lead-make" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">Vehicle Model</Label>
                  <Input id="vehicle_model" name="vehicle_model" value={leadFormData.vehicle_model} onChange={handleLeadChange} placeholder="Civic, Corolla" data-testid="input-lead-model" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_value">Expected Value (Rs)</Label>
                  <Input id="expected_value" name="expected_value" type="number" value={leadFormData.expected_value} onChange={handleLeadChange} placeholder="10000" data-testid="input-lead-value" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_priority">Priority</Label>
                  <Select value={leadFormData.priority} onValueChange={(v) => setLeadFormData({ ...leadFormData, priority: v })}>
                    <SelectTrigger data-testid="select-lead-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLeadDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createLead.isPending} data-testid="button-save-lead">
                  {createLead.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
