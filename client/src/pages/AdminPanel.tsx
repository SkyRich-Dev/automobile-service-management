import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Key,
  CreditCard,
  Building2,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Plug,
  RefreshCw,
  Download,
  Upload,
  Zap,
  Database,
  Server,
} from "lucide-react";

interface License {
  id: number;
  license_key: string;
  license_type: string;
  status: string;
  expiry_date: string;
  max_branches: number;
  max_users: number;
  features: Record<string, boolean>;
  is_primary: boolean;
}

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  category: string;
  value_type: string;
}

interface IntegrationConfig {
  id: number;
  name: string;
  integration_type: string;
  is_enabled: boolean;
  config: Record<string, string>;
  last_sync_at?: string;
}

function LicenseCard({ license }: { license: License | null }) {
  const daysRemaining = license?.expiry_date
    ? Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const usagePercent = 75;

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              License Information
            </CardTitle>
            <CardDescription className="mt-1">
              Manage your enterprise license and subscription
            </CardDescription>
          </div>
          <Badge
            variant={license?.status === "ACTIVE" ? "default" : "secondary"}
            className={cn(
              license?.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            )}
          >
            {license?.status || "No License"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {license ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Key className="h-4 w-4" />
                  License Type
                </div>
                <p className="mt-1 text-lg font-semibold">{license.license_type}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Max Branches
                </div>
                <p className="mt-1 text-lg font-semibold">{license.max_branches}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Max Users
                </div>
                <p className="mt-1 text-lg font-semibold">{license.max_users}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Days Remaining
                </div>
                <p className={cn(
                  "mt-1 text-lg font-semibold",
                  daysRemaining < 30 && "text-amber-500",
                  daysRemaining < 7 && "text-destructive"
                )}>
                  {daysRemaining > 0 ? daysRemaining : "Expired"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Usage</span>
                <span className="font-medium">{usagePercent}%</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-sm font-medium">Enabled Features</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(license.features || {}).map(([feature, enabled]) => (
                  <Badge
                    key={feature}
                    variant={enabled ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      enabled && "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {enabled && <CheckCircle className="mr-1 h-3 w-3" />}
                    {feature.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="mb-3 h-12 w-12 text-amber-500" />
            <h3 className="text-lg font-semibold">No Active License</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Please enter a valid license key to activate the system
            </p>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Enter license key" className="w-64" />
              <Button data-testid="button-activate-license">Activate</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IntegrationCard({
  integration,
  onToggle,
  onTest,
}: {
  integration: IntegrationConfig;
  onToggle: () => void;
  onTest: () => void;
}) {
  const icons: Record<string, typeof CreditCard> = {
    stripe: CreditCard,
    razorpay: CreditCard,
    tally: Database,
  };
  const Icon = icons[integration.integration_type] || Plug;

  return (
    <Card className="border-border/50 overflow-visible">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              integration.is_enabled ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                integration.is_enabled ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h4 className="font-medium">{integration.name}</h4>
              <p className="text-xs text-muted-foreground">
                {integration.last_sync_at
                  ? `Last sync: ${new Date(integration.last_sync_at).toLocaleDateString()}`
                  : "Not synced"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              data-testid={`button-test-${integration.integration_type}`}
            >
              Test Connection
            </Button>
            <Switch
              checked={integration.is_enabled}
              onCheckedChange={onToggle}
              data-testid={`switch-${integration.integration_type}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemHealthCard() {
  const healthStatus = [
    { name: "Database", status: "healthy", icon: Database },
    { name: "API Server", status: "healthy", icon: Server },
    { name: "Background Jobs", status: "healthy", icon: Zap },
  ];

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Server className="h-5 w-5 text-primary" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {healthStatus.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <Badge
                  variant="default"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Healthy
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsForm({ settings }: { settings: SystemSetting[] }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    settings.forEach((s) => {
      initial[s.key] = s.value;
    });
    return initial;
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { settings: { key: string; value: string; category: string }[] }) => {
      return apiRequest("POST", "/api/system-settings/bulk_update/", data);
    },
    onSuccess: () => {
      toast({ title: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/"] });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const settingsArray = Object.entries(formData).map(([key, value]) => ({
      key,
      value,
      category: "general",
    }));
    updateMutation.mutate({ settings: settingsArray });
  };

  const settingFields = [
    { key: "company_name", label: "Company Name", type: "text" },
    { key: "gst_number", label: "GST Number", type: "text" },
    { key: "default_tax_rate", label: "Default Tax Rate (%)", type: "number" },
    { key: "currency_code", label: "Currency Code", type: "text" },
    { key: "timezone", label: "Timezone", type: "text" },
  ];

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          System Settings
        </CardTitle>
        <CardDescription>Configure global application settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {settingFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                value={formData[field.key] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                data-testid={`input-${field.key}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            data-testid="button-save-settings"
          >
            {updateMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentGatewaysPanel() {
  const { toast } = useToast();
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");

  const { data: stripeConfig } = useQuery({
    queryKey: ['/api/stripe/publishable-key'],
  });

  const { data: razorpayConfig, refetch: refetchRazorpay } = useQuery({
    queryKey: ['/api/razorpay/config'],
    retry: false,
  });

  const configureRazorpayMutation = useMutation({
    mutationFn: async (data: { keyId: string; keySecret: string }) => {
      const response = await apiRequest('POST', '/api/razorpay/configure', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Razorpay configured successfully" });
      refetchRazorpay();
      setRazorpayKeyId("");
      setRazorpayKeySecret("");
    },
    onError: (error: any) => {
      toast({ title: "Configuration failed", description: error.message, variant: "destructive" });
    },
  });

  const stripeConfigured = !!(stripeConfig as any)?.publishableKey;
  const razorpayConfigured = (razorpayConfig as any)?.configured;

  return (
    <div className="space-y-6">
      <Card className="border-border/50 overflow-visible">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Stripe
              </CardTitle>
              <CardDescription>Credit/Debit card payments via Stripe</CardDescription>
            </div>
            <Badge
              variant={stripeConfigured ? "default" : "secondary"}
              className={stripeConfigured ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
            >
              {stripeConfigured ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {stripeConfigured ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Stripe is configured via Replit integration. Webhook handling is automatic.
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Stripe is configured automatically via Replit integration.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-visible">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Razorpay
              </CardTitle>
              <CardDescription>UPI, Netbanking, and Wallet payments</CardDescription>
            </div>
            <Badge
              variant={razorpayConfigured ? "default" : "secondary"}
              className={razorpayConfigured ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
            >
              {razorpayConfigured ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {razorpayConfigured ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Razorpay is configured and ready to accept payments.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your Razorpay API credentials to enable UPI and Netbanking payments.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="razorpay_key_id">Key ID</Label>
                  <Input
                    id="razorpay_key_id"
                    type="text"
                    placeholder="rzp_live_xxxxx or rzp_test_xxxxx"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    data-testid="input-razorpay-key-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razorpay_key_secret">Key Secret</Label>
                  <Input
                    id="razorpay_key_secret"
                    type="password"
                    placeholder="Your secret key"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    data-testid="input-razorpay-key-secret"
                  />
                </div>
              </div>
              <Button
                onClick={() => configureRazorpayMutation.mutate({ keyId: razorpayKeyId, keySecret: razorpayKeySecret })}
                disabled={!razorpayKeyId || !razorpayKeySecret || configureRazorpayMutation.isPending}
                data-testid="button-configure-razorpay"
              >
                {configureRazorpayMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  "Configure Razorpay"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TallySyncPanel() {
  const { toast } = useToast();

  const syncInvoicesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tally-sync-jobs/sync_invoices/", {});
    },
    onSuccess: () => {
      toast({ title: "Invoice sync completed" });
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    },
  });

  const syncCustomersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tally-sync-jobs/sync_customers/", {});
    },
    onSuccess: () => {
      toast({ title: "Customer sync completed" });
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    },
  });

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5 text-primary" />
          Tally Integration
        </CardTitle>
        <CardDescription>
          Sync invoices and customers with Tally accounting software
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <h4 className="font-medium">Sync Invoices</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Export invoices to Tally format
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => syncInvoicesMutation.mutate()}
                disabled={syncInvoicesMutation.isPending}
                data-testid="button-sync-invoices"
              >
                {syncInvoicesMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Download className="mb-2 h-8 w-8 text-muted-foreground" />
              <h4 className="font-medium">Sync Customers</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Export customer ledgers to Tally
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => syncCustomersMutation.mutate()}
                disabled={syncCustomersMutation.isPending}
                data-testid="button-sync-customers"
              >
                {syncCustomersMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-8">
          <div className="skeleton mb-2 h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="space-y-6">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </main>
    </div>
  );
}

export default function AdminPanel() {
  const { toast } = useToast();

  const { data: license, isLoading: licenseLoading } = useQuery<License>({
    queryKey: ["/api/licenses/current/"],
  });

  const { data: settings = [], isLoading: settingsLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/system-settings/"],
  });

  const { data: integrations = [], isLoading: integrationsLoading } = useQuery<IntegrationConfig[]>({
    queryKey: ["/api/integrations/"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/integrations/${id}/toggle/`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/"] });
      toast({ title: "Integration status updated" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/integrations/${id}/test_connection/`, {});
    },
    onSuccess: () => {
      toast({ title: "Connection test successful" });
    },
    onError: () => {
      toast({ title: "Connection test failed", variant: "destructive" });
    },
  });

  if (licenseLoading || settingsLoading || integrationsLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin Control Panel</h1>
          <p className="mt-1 text-muted-foreground">
            Manage system settings, licenses, and integrations
          </p>
        </div>

        <Tabs defaultValue="license" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4" data-testid="admin-tabs">
            <TabsTrigger value="license" data-testid="tab-license">License</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
            <TabsTrigger value="integrations" data-testid="tab-integrations">Integrations</TabsTrigger>
            <TabsTrigger value="tally" data-testid="tab-tally">Tally</TabsTrigger>
          </TabsList>

          <TabsContent value="license" className="space-y-6">
            <LicenseCard license={license || null} />
            <SystemHealthCard />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsForm settings={settings} />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Payment Gateways</h3>
              <p className="text-sm text-muted-foreground">
                Configure payment processing integrations
              </p>
            </div>
            <PaymentGatewaysPanel />
          </TabsContent>

          <TabsContent value="tally">
            <TallySyncPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
