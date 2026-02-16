import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocalization } from "@/lib/currency-context";
import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  User,
  Building,
  MapPin,
  Car,
  DollarSign,
  Clock,
  Edit,
  Save,
  X,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  MessageSquare,
  FileText,
  History,
  AlertTriangle,
} from "lucide-react";

interface Lead {
  id: number;
  lead_id: string;
  name: string;
  phone: string;
  email: string;
  alternate_phone: string | null;
  company_name: string | null;
  address: string | null;
  city: string | null;
  source: string;
  status: string;
  lead_type: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  registration_number: string | null;
  service_interest: string | null;
  contract_interest: string | null;
  budget_range: string | null;
  expected_value: string | null;
  priority: string;
  owner_name: string | null;
  assigned_to_name: string | null;
  referred_by_customer_name: string | null;
  converted_customer: number | null;
  lost_reason: string | null;
  lost_to_competitor: string | null;
  next_follow_up: string | null;
  last_contact_date: string | null;
  contact_attempts: number;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface CRMEvent {
  id: number;
  event_type: string;
  description: string;
  metadata: any;
  created_at: string;
  triggered_by_name: string | null;
}

const LEAD_STATUSES = [
  { value: 'NEW', label: 'New', color: 'bg-blue-500' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-purple-500' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-cyan-500' },
  { value: 'QUOTED', label: 'Quoted', color: 'bg-amber-500' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-500' },
  { value: 'CUSTOMER', label: 'Customer', color: 'bg-emerald-500' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-500' },
];

const LEAD_SOURCES = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'MOBILE_APP', label: 'Mobile App' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'CAMPAIGN', label: 'Campaign' },
  { value: 'FLEET_INQUIRY', label: 'Fleet Inquiry' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'ADVERTISEMENT', label: 'Advertisement' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const LEAD_TYPES = [
  { value: 'SERVICE', label: 'Service' },
  { value: 'SALES', label: 'Sales' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FLEET', label: 'Fleet' },
  { value: 'INSURANCE', label: 'Insurance' },
];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [lostCompetitor, setLostCompetitor] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const { data: lead, isLoading, error } = useQuery<Lead>({
    queryKey: ["/api/leads/", id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${id}/`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<CRMEvent[]>({
    queryKey: ["/api/crm-events/", id],
    queryFn: async () => {
      const res = await fetch(`/api/crm-events/?lead=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (lead && !isEditing) {
      setEditData({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        alternate_phone: lead.alternate_phone,
        company_name: lead.company_name,
        address: lead.address,
        city: lead.city,
        source: lead.source,
        lead_type: lead.lead_type,
        vehicle_make: lead.vehicle_make,
        vehicle_model: lead.vehicle_model,
        vehicle_year: lead.vehicle_year,
        registration_number: lead.registration_number,
        service_interest: lead.service_interest,
        contract_interest: lead.contract_interest,
        budget_range: lead.budget_range,
        expected_value: lead.expected_value,
        priority: lead.priority,
        next_follow_up: lead.next_follow_up,
        notes: lead.notes,
      });
    }
  }, [lead, isEditing]);

  const updateLead = useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}/`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads/", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/"] });
      toast({ title: t('crm.messages.leadUpdated', 'Lead updated successfully') });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: t('crm.messages.leadUpdateError', 'Failed to update lead'), variant: "destructive" });
    },
  });

  const transitionLead = useMutation({
    mutationFn: async ({ status, lost_reason, lost_to_competitor }: { status: string; lost_reason?: string; lost_to_competitor?: string }) => {
      const res = await apiRequest("POST", `/api/leads/${id}/transition/`, { 
        status, 
        lost_reason, 
        lost_to_competitor 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads/", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm-events/", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard/"] });
      toast({ title: t('crm.messages.leadStatusUpdated', 'Lead status updated') });
      setLostDialogOpen(false);
      setLostReason("");
      setLostCompetitor("");
      setPendingStatus(null);
    },
    onError: () => {
      toast({ title: t('crm.messages.statusChangeError', 'Failed to change status'), variant: "destructive" });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'LOST') {
      setPendingStatus(newStatus);
      setLostDialogOpen(true);
    } else {
      transitionLead.mutate({ status: newStatus });
    }
  };

  const handleLostConfirm = () => {
    if (pendingStatus) {
      transitionLead.mutate({ 
        status: pendingStatus, 
        lost_reason: lostReason, 
        lost_to_competitor: lostCompetitor 
      });
    }
  };

  const handleSave = () => {
    updateLead.mutate(editData);
  };

  const handleChange = (field: keyof Lead, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = LEAD_STATUSES.find(s => s.value === status);
    return (
      <Badge className={cn("text-white", statusInfo?.color || "bg-gray-500")}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-500",
      MEDIUM: "bg-blue-500",
      HIGH: "bg-orange-500",
      URGENT: "bg-red-500",
    };
    return (
      <Badge className={cn("text-white", colors[priority] || "bg-gray-500")}>
        {priority}
      </Badge>
    );
  };

  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium">{t('crm.leadNotFound', 'Lead not found')}</p>
              <Button className="mt-4" onClick={() => setLocation('/crm')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.backToCRM', 'Back to CRM')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-lead-detail">
      <AppSidebar />
      <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/crm')} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{lead.name}</h1>
                {getStatusBadge(lead.status)}
                {getPriorityBadge(lead.priority)}
              </div>
              <p className="text-muted-foreground">{lead.lead_id} | {t('crm.lead', 'Lead')}</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                    <X className="h-4 w-4 mr-2" />
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button onClick={handleSave} disabled={updateLead.isPending} data-testid="button-save">
                    {updateLead.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {t('common.save', 'Save')}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} data-testid="button-edit">
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit', 'Edit')}
                </Button>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">{t('crm.leadPipeline', 'Lead Pipeline')}</h3>
                <div className="flex items-center gap-2">
                  {lead.converted_customer && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation(`/crm/customers/${lead.converted_customer}`)}
                      data-testid="button-view-customer"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('crm.viewCustomer', 'View Customer')}
                    </Button>
                  )}
                  <Select 
                    value={lead.status} 
                    onValueChange={handleStatusChange}
                    disabled={transitionLead.isPending || lead.status === 'CUSTOMER'}
                  >
                    <SelectTrigger className="w-48" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES
                        .filter(status => {
                          // Hide LOST option for CUSTOMER status
                          if (status.value === 'LOST' && lead.status === 'CUSTOMER') {
                            return false;
                          }
                          // Only show CUSTOMER option when in NEGOTIATION
                          if (status.value === 'CUSTOMER' && lead.status !== 'NEGOTIATION') {
                            return false;
                          }
                          // Hide earlier stages when in CUSTOMER
                          const earlierStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATION'];
                          if (lead.status === 'CUSTOMER' && earlierStages.includes(status.value)) {
                            return false;
                          }
                          return true;
                        })
                        .map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(() => {
                // Pipeline statuses (excludes LOST as it's a terminal state)
                const pipelineStatuses = LEAD_STATUSES.filter(s => s.value !== 'LOST');
                const pipelineIndex = pipelineStatuses.findIndex(s => s.value === lead.status);
                const isLost = lead.status === 'LOST';
                
                return (
                  <>
                    <div className="flex items-center gap-2">
                      {pipelineStatuses.map((status, index) => {
                        const isActive = isLost ? false : index <= pipelineIndex;
                        return (
                          <div key={status.value} className="flex items-center flex-1">
                            <div
                              className={cn(
                                "flex-1 h-2 rounded-full transition-colors",
                                isLost ? "bg-red-500" : (isActive ? status.color : "bg-muted")
                              )}
                            />
                            {index < pipelineStatuses.length - 1 && (
                              <ChevronRight className={cn("h-4 w-4 mx-1", isActive ? "text-foreground" : "text-muted-foreground")} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      {pipelineStatuses.map(status => (
                        <span key={status.value} className={cn(status.value === lead.status && "font-medium text-foreground")}>
                          {status.label}
                        </span>
                      ))}
                    </div>
                    {isLost && (
                      <div className="mt-2 text-center">
                        <Badge variant="destructive">{t('crm.leadLost', 'Lead Lost')}</Badge>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </header>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details" data-testid="tab-details">
              <FileText className="h-4 w-4 mr-2" />
              {t('crm.details', 'Details')}
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              <History className="h-4 w-4 mr-2" />
              {t('crm.activity', 'Activity')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('crm.contactInfo', 'Contact Information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('crm.form.name', 'Name')}</Label>
                          <Input value={editData.name || ""} onChange={(e) => handleChange('name', e.target.value)} data-testid="input-name" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('crm.form.phone', 'Phone')}</Label>
                          <Input value={editData.phone || ""} onChange={(e) => handleChange('phone', e.target.value)} data-testid="input-phone" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('crm.form.email', 'Email')}</Label>
                          <Input type="email" value={editData.email || ""} onChange={(e) => handleChange('email', e.target.value)} data-testid="input-email" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('crm.form.alternatePhone', 'Alternate Phone')}</Label>
                          <Input value={editData.alternate_phone || ""} onChange={(e) => handleChange('alternate_phone', e.target.value)} data-testid="input-alt-phone" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('crm.form.company', 'Company')}</Label>
                          <Input value={editData.company_name || ""} onChange={(e) => handleChange('company_name', e.target.value)} data-testid="input-company" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('crm.form.city', 'City')}</Label>
                          <Input value={editData.city || ""} onChange={(e) => handleChange('city', e.target.value)} data-testid="input-city" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('crm.form.address', 'Address')}</Label>
                        <Textarea value={editData.address || ""} onChange={(e) => handleChange('address', e.target.value)} data-testid="input-address" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.phone}</span>
                        {lead.alternate_phone && <span className="text-muted-foreground">/ {lead.alternate_phone}</span>}
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                      {lead.company_name && (
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.company_name}</span>
                        </div>
                      )}
                      {(lead.address || lead.city) && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{[lead.address, lead.city].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    {t('crm.vehicleInfo', 'Vehicle Information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('crm.form.make', 'Make')}</Label>
                          <Input value={editData.vehicle_make || ""} onChange={(e) => handleChange('vehicle_make', e.target.value)} data-testid="input-make" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('crm.form.model', 'Model')}</Label>
                          <Input value={editData.vehicle_model || ""} onChange={(e) => handleChange('vehicle_model', e.target.value)} data-testid="input-model" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('crm.form.year', 'Year')}</Label>
                          <Input type="number" value={editData.vehicle_year || ""} onChange={(e) => handleChange('vehicle_year', parseInt(e.target.value) || null)} data-testid="input-year" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('crm.form.registrationNumber', 'Registration Number')}</Label>
                          <Input value={editData.registration_number || ""} onChange={(e) => handleChange('registration_number', e.target.value)} data-testid="input-reg" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {lead.vehicle_make || lead.vehicle_model ? (
                        <>
                          <div className="flex items-center gap-3">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{lead.vehicle_make} {lead.vehicle_model}</span>
                            {lead.vehicle_year && <Badge variant="outline">{lead.vehicle_year}</Badge>}
                          </div>
                          {lead.registration_number && (
                            <div className="text-sm text-muted-foreground">
                              {t('crm.registration', 'Registration')}: {lead.registration_number}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">{t('crm.noVehicleInfo', 'No vehicle information')}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t('crm.leadDetails', 'Lead Details')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('crm.form.source', 'Source')}</Label>
                          <Select value={editData.source} onValueChange={(v) => handleChange('source', v)}>
                            <SelectTrigger data-testid="select-source">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_SOURCES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('crm.form.leadType', 'Lead Type')}</Label>
                          <Select value={editData.lead_type} onValueChange={(v) => handleChange('lead_type', v)}>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('crm.form.priority', 'Priority')}</Label>
                          <Select value={editData.priority} onValueChange={(v) => handleChange('priority', v)}>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITIES.map(p => (
                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('crm.form.expectedValue', 'Expected Value')}</Label>
                          <Input type="number" value={editData.expected_value || ""} onChange={(e) => handleChange('expected_value', e.target.value)} data-testid="input-value" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('crm.form.serviceInterest', 'Service Interest')}</Label>
                          <Input value={editData.service_interest || ""} onChange={(e) => handleChange('service_interest', e.target.value)} data-testid="input-service" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('crm.form.budgetRange', 'Budget Range')}</Label>
                          <Input value={editData.budget_range || ""} onChange={(e) => handleChange('budget_range', e.target.value)} data-testid="input-budget" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('crm.source', 'Source')}</p>
                        <p className="font-medium">{LEAD_SOURCES.find(s => s.value === lead.source)?.label || lead.source}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('crm.type', 'Type')}</p>
                        <p className="font-medium">{lead.lead_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('crm.expectedValue', 'Expected Value')}</p>
                        <p className="font-medium">{lead.expected_value ? formatCurrency(parseFloat(lead.expected_value)) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('crm.budgetRange', 'Budget Range')}</p>
                        <p className="font-medium">{lead.budget_range || '-'}</p>
                      </div>
                      {lead.service_interest && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">{t('crm.serviceInterest', 'Service Interest')}</p>
                          <p className="font-medium">{lead.service_interest}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {t('crm.followUp', 'Follow-up & Notes')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>{t('crm.form.nextFollowUp', 'Next Follow-up')}</Label>
                        <Input 
                          type="datetime-local" 
                          value={editData.next_follow_up ? editData.next_follow_up.slice(0, 16) : ""} 
                          onChange={(e) => handleChange('next_follow_up', e.target.value ? new Date(e.target.value).toISOString() : null)} 
                          data-testid="input-followup"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('crm.form.notes', 'Notes')}</Label>
                        <Textarea 
                          rows={4} 
                          value={editData.notes || ""} 
                          onChange={(e) => handleChange('notes', e.target.value)} 
                          data-testid="input-notes"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('crm.nextFollowUp', 'Next Follow-up')}</p>
                          <p className="font-medium">{lead.next_follow_up ? formatDate(lead.next_follow_up) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('crm.lastContact', 'Last Contact')}</p>
                          <p className="font-medium">{lead.last_contact_date ? formatDate(lead.last_contact_date) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('crm.contactAttempts', 'Contact Attempts')}</p>
                          <p className="font-medium">{lead.contact_attempts}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('crm.assignedTo', 'Assigned To')}</p>
                          <p className="font-medium">{lead.assigned_to_name || lead.owner_name || '-'}</p>
                        </div>
                      </div>
                      {lead.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('crm.notes', 'Notes')}</p>
                          <p className="text-sm bg-muted p-3 rounded-md">{lead.notes}</p>
                        </div>
                      )}
                      {lead.status === 'LOST' && (lead.lost_reason || lead.lost_to_competitor) && (
                        <div className="border-t pt-4 mt-4">
                          <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            {t('crm.lostDetails', 'Lost Details')}
                          </p>
                          {lead.lost_reason && <p className="text-sm">{t('crm.reason', 'Reason')}: {lead.lost_reason}</p>}
                          {lead.lost_to_competitor && <p className="text-sm">{t('crm.competitor', 'Competitor')}: {lead.lost_to_competitor}</p>}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('crm.activityHistory', 'Activity History')}</CardTitle>
                <CardDescription>{t('crm.activityDesc', 'Timeline of all activities related to this lead')}</CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('crm.noActivity', 'No activity recorded yet')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                          {index < events.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.event_type.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          {event.triggered_by_name && (
                            <p className="text-xs text-muted-foreground mt-1">By: {event.triggered_by_name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('crm.markAsLost', 'Mark Lead as Lost')}</DialogTitle>
              <DialogDescription>{t('crm.lostDialogDesc', 'Please provide details about why this lead was lost')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('crm.form.lostReason', 'Reason for Loss')}</Label>
                <Textarea 
                  value={lostReason} 
                  onChange={(e) => setLostReason(e.target.value)} 
                  placeholder={t('crm.form.lostReasonPlaceholder', 'e.g., Price too high, Not ready to buy...')}
                  data-testid="input-lost-reason"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('crm.form.lostToCompetitor', 'Lost to Competitor (optional)')}</Label>
                <Input 
                  value={lostCompetitor} 
                  onChange={(e) => setLostCompetitor(e.target.value)} 
                  placeholder={t('crm.form.competitorPlaceholder', 'Competitor name...')}
                  data-testid="input-competitor"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLostDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
              <Button variant="destructive" onClick={handleLostConfirm} disabled={transitionLead.isPending} data-testid="button-confirm-lost">
                {transitionLead.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                {t('crm.markLost', 'Mark as Lost')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
