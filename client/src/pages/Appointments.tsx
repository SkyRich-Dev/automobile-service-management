import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useSidebar } from "@/lib/sidebar-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Appointment {
  id: number;
  appointment_id: string;
  customer: number;
  customer_name: string;
  vehicle: number;
  vehicle_info: string;
  branch: number;
  branch_name: string;
  service_advisor: number | null;
  advisor_name: string | null;
  appointment_date: string;
  appointment_time: string;
  estimated_duration: string;
  service_type: string;
  complaint: string;
  status: string;
  job_card: number | null;
  reminder_sent: boolean;
  confirmation_sent: boolean;
  notes: string;
  created_at: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Vehicle {
  id: number;
  customer: number;
  plate_number: string;
  make: string;
  model: string;
}

interface Branch {
  id: number;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CHECKED_IN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  NO_SHOW: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const SERVICE_TYPES = [
  "REGULAR_SERVICE",
  "MAJOR_SERVICE",
  "REPAIR",
  "INSPECTION",
  "WARRANTY_WORK",
  "BODY_WORK",
  "EMERGENCY",
];

export default function Appointments() {
  const { isCollapsed } = useSidebar();
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const [formData, setFormData] = useState({
    customer: "",
    vehicle: "",
    branch: "1",
    appointment_date: format(new Date(), "yyyy-MM-dd"),
    appointment_time: "09:00",
    service_type: "REGULAR_SERVICE",
    complaint: "",
    notes: "",
  });

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", selectedDate, statusFilter],
    queryFn: async () => {
      let url = `/api/appointments/?date=${selectedDate}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers/", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["vehicles", selectedCustomerId],
    queryFn: async () => {
      const url = selectedCustomerId
        ? `/api/vehicles/?customer_id=${selectedCustomerId}`
        : "/api/vehicles/";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!selectedCustomerId || isDialogOpen,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await fetch("/api/branches/", { credentials: "include" });
      if (!res.ok) return [{ id: 1, name: "Main Branch" }];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/appointments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: parseInt(data.customer),
          vehicle: parseInt(data.vehicle),
          branch: parseInt(data.branch),
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          service_type: data.service_type,
          complaint: data.complaint,
          notes: data.notes,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to create appointment");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: t('appointments.bookSuccess', 'Appointment booked successfully') });
    },
    onError: (error) => {
      toast({ title: t('appointments.bookError', 'Failed to book appointment'), description: error.message, variant: "destructive" });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/appointments/${id}/confirm/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: t('appointments.confirmSuccess', 'Appointment confirmed') });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/appointments/${id}/check_in/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["job-cards"] });
      toast({ title: t('appointments.checkInSuccess', 'Customer checked in, job card created') });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest("POST", `/api/appointments/${id}/cancel/`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: t('appointments.cancelSuccess', 'Appointment cancelled') });
    },
  });

  const resetForm = () => {
    setFormData({
      customer: "",
      vehicle: "",
      branch: "1",
      appointment_date: format(new Date(), "yyyy-MM-dd"),
      appointment_time: "09:00",
      service_type: "REGULAR_SERVICE",
      complaint: "",
      notes: "",
    });
    setSelectedCustomerId("");
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setFormData({ ...formData, customer: customerId, vehicle: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || !formData.vehicle) {
      toast({ title: t('appointments.selectCustomerVehicle', 'Please select customer and vehicle'), variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        apt.customer_name?.toLowerCase().includes(query) ||
        apt.vehicle_info?.toLowerCase().includes(query) ||
        apt.appointment_id?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const groupedByTime = filteredAppointments.reduce((acc, apt) => {
    const time = apt.appointment_time.slice(0, 5);
    if (!acc[time]) acc[time] = [];
    acc[time].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedTimes = Object.keys(groupedByTime).sort();

  const customerVehicles = vehicles.filter(
    (v) => v.customer === parseInt(selectedCustomerId)
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">{t('appointments.title', 'Appointments')}</h1>
              <p className="text-muted-foreground">{t('appointments.subtitle', 'Manage service appointments and bookings')}</p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-appointment">
              <Plus className="h-4 w-4 mr-2" />
              {t('appointments.newAppointment', 'New Appointment')}
            </Button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('appointments.searchPlaceholder', 'Search appointments...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
              data-testid="input-date"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('common.status', 'Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('appointments.allStatus', 'All Status')}</SelectItem>
                <SelectItem value="SCHEDULED">{t('appointments.status.scheduled', 'Scheduled')}</SelectItem>
                <SelectItem value="CONFIRMED">{t('appointments.status.confirmed', 'Confirmed')}</SelectItem>
                <SelectItem value="CHECKED_IN">{t('appointments.status.checkedIn', 'Checked In')}</SelectItem>
                <SelectItem value="CANCELLED">{t('appointments.status.cancelled', 'Cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('appointments.totalToday', 'Total Today')}</p>
                    <p className="text-2xl font-bold" data-testid="text-total-appointments">{appointments.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('appointments.status.confirmed', 'Confirmed')}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {appointments.filter((a) => a.status === "CONFIRMED").length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.pending', 'Pending')}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {appointments.filter((a) => a.status === "SCHEDULED").length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('appointments.status.checkedIn', 'Checked In')}</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {appointments.filter((a) => a.status === "CHECKED_IN").length}
                    </p>
                  </div>
                  <Car className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : sortedTimes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('appointments.noAppointments', 'No appointments for this date')}</p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('appointments.bookFirst', 'Book First Appointment')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedTimes.map((time) => (
                <div key={time} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{time}</span>
                    <Badge variant="outline">{groupedByTime[time].length} {t('appointments.appointments', 'appointments')}</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {groupedByTime[time].map((apt) => (
                      <Card key={apt.id} className="overflow-visible" data-testid={`card-appointment-${apt.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-sm font-medium">{apt.appointment_id}</CardTitle>
                              <p className="text-xs text-muted-foreground">{apt.service_type.replace(/_/g, " ")}</p>
                            </div>
                            <Badge className={cn("text-xs", STATUS_COLORS[apt.status])}>
                              {apt.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{apt.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{apt.vehicle_info}</span>
                          </div>
                          {apt.complaint && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{apt.complaint}</p>
                          )}
                          <div className="flex gap-2 pt-2 flex-wrap">
                            {apt.status === "SCHEDULED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => confirmMutation.mutate(apt.id)}
                                disabled={confirmMutation.isPending}
                                data-testid={`button-confirm-${apt.id}`}
                              >
                                {t('common.confirm', 'Confirm')}
                              </Button>
                            )}
                            {(apt.status === "SCHEDULED" || apt.status === "CONFIRMED") && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => checkInMutation.mutate(apt.id)}
                                  disabled={checkInMutation.isPending}
                                  data-testid={`button-checkin-${apt.id}`}
                                >
                                  {t('appointments.checkIn', 'Check In')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => cancelMutation.mutate({ id: apt.id, reason: t('appointments.customerCancelled', 'Customer cancelled') })}
                                  disabled={cancelMutation.isPending}
                                  data-testid={`button-cancel-${apt.id}`}
                                >
                                  {t('common.cancel', 'Cancel')}
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('appointments.bookNewAppointment', 'Book New Appointment')}</DialogTitle>
              <DialogDescription>{t('appointments.bookDescription', 'Schedule a service appointment for a customer')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">{t('customer.title', 'Customer')}</Label>
                <Select value={formData.customer} onValueChange={handleCustomerChange}>
                  <SelectTrigger data-testid="select-customer">
                    <SelectValue placeholder={t('appointments.selectCustomer', 'Select customer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} - {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle">{t('vehicle.title', 'Vehicle')}</Label>
                <Select
                  value={formData.vehicle}
                  onValueChange={(v) => setFormData({ ...formData, vehicle: v })}
                  disabled={!selectedCustomerId}
                >
                  <SelectTrigger data-testid="select-vehicle">
                    <SelectValue placeholder={selectedCustomerId ? t('appointments.selectVehicle', 'Select vehicle') : t('appointments.selectCustomerFirst', 'Select customer first')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerVehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.plate_number} - {v.make} {v.model}
                      </SelectItem>
                    ))}
                    {customerVehicles.length === 0 && selectedCustomerId && (
                      <div className="p-2 text-sm text-muted-foreground">{t('appointments.noVehiclesFound', 'No vehicles found for this customer')}</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointment_date">{t('common.date', 'Date')}</Label>
                  <Input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    data-testid="input-appointment-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment_time">{t('appointments.time', 'Time')}</Label>
                  <Input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    data-testid="input-appointment-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">{t('appointments.serviceType', 'Service Type')}</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(v) => setFormData({ ...formData, service_type: v })}
                >
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`appointments.serviceTypes.${type}`, type.replace(/_/g, " "))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complaint">{t('appointments.complaint', 'Complaint / Issue')}</Label>
                <Textarea
                  value={formData.complaint}
                  onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                  placeholder={t('appointments.complaintPlaceholder', 'Describe the issue or service needed...')}
                  rows={3}
                  data-testid="input-complaint"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('appointments.additionalNotes', 'Additional Notes')}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('appointments.notesPlaceholder', 'Any additional notes...')}
                  rows={2}
                  data-testid="input-notes"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-book-appointment">
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('appointments.booking', 'Booking...')}
                    </>
                  ) : (
                    t('appointments.bookAppointment', 'Book Appointment')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
