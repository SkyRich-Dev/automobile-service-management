import { useState, useEffect, useCallback } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Receipt,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  RefreshCw,
  Plus,
  Eye,
  Send,
  Ban,
  BookOpen,
  Calculator,
  Coins,
  LandmarkIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface FinanceDashboard {
  total_revenue: number;
  total_receivables: number;
  total_payables: number;
  total_expenses: number;
  cash_balance: number;
  bank_balance: number;
  outstanding_invoices: number;
  overdue_invoices: number;
  pending_payments: number;
  pending_expenses: number;
  receivables_aging: Record<string, number>;
  payables_aging: Record<string, number>;
}

interface EnhancedInvoice {
  id: number;
  invoice_number: string;
  invoice_type: string;
  status: string;
  customer_name: string;
  branch_name: string;
  grand_total: number;
  balance_due: number;
  invoice_date: string;
  due_date: string | null;
}

interface Expense {
  id: number;
  expense_number: string;
  category_name: string;
  description: string;
  total_amount: number;
  status: string;
  expense_date: string;
}

interface CustomerReceivable {
  id: number;
  customer_name: string;
  invoice_number: string;
  original_amount: number;
  outstanding_amount: number;
  due_date: string;
  aging_bucket: string;
  days_overdue: number;
}

interface Account {
  id: number;
  code: string;
  name: string;
  category: string;
  account_type: string;
  current_balance: number;
  is_active: boolean;
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ISSUED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  PARTIALLY_PAID: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CLOSED: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
};

const EXPENSE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  PAID: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
};

const AGING_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  color: string;
}) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
              {trend && (
                <span className={cn(
                  "flex items-center text-xs font-medium",
                  trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {trend}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn("rounded-xl p-2.5", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgingChart({ data, title }: { data: Record<string, number>; title: string }) {
  const chartData = Object.entries(data).map(([bucket, amount], index) => ({
    name: bucket,
    value: amount,
    color: AGING_COLORS[index] || AGING_COLORS[4],
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </RechartsPieChart>
        </ResponsiveContainer>
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
          <div className="skeleton mb-2 h-8 w-64" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function AccountsFinance() {
  const { toast } = useToast();
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [expenseStatusFilter, setExpenseStatusFilter] = useState("all");
  const searchString = useSearch();

  const getTabFromSearch = useCallback((search: string) => {
    const params = new URLSearchParams(search);
    return params.get("tab") || "dashboard";
  }, []);

  const [activeTab, setActiveTabState] = useState(() => {
    const initialSearch = typeof window !== 'undefined' ? window.location.search : '';
    return getTabFromSearch(initialSearch);
  });

  const [, setLocation] = useLocation();

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setLocation(`/accounts-finance?tab=${tab}`, { replace: true });
  };

  useEffect(() => {
    if (searchString) {
      setActiveTabState(getTabFromSearch(searchString));
    }
  }, [searchString, getTabFromSearch]);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery<FinanceDashboard>({
    queryKey: ["/api/finance/dashboard/"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<EnhancedInvoice[]>({
    queryKey: ["/api/finance/enhanced-invoices/"],
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/finance/expenses/"],
  });

  const { data: receivables } = useQuery<CustomerReceivable[]>({
    queryKey: ["/api/finance/receivables/"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/finance/accounts/"],
  });

  const seedAccountsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/finance/accounts/seed_default/"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/accounts/"] });
      toast({ title: "Success", description: "Default accounts seeded successfully" });
    },
  });

  const seedTaxRatesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/finance/tax-rates/seed_default/"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/tax-rates/"] });
      toast({ title: "Success", description: "Default tax rates seeded successfully" });
    },
  });

  const approveInvoiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/finance/enhanced-invoices/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-invoices/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard/"] });
      toast({ title: "Success", description: "Invoice approved" });
    },
  });

  const issueInvoiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/finance/enhanced-invoices/${id}/issue/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-invoices/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/receivables/"] });
      toast({ title: "Success", description: "Invoice issued" });
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/finance/expenses/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses/"] });
      toast({ title: "Success", description: "Expense approved" });
    },
  });

  if (dashboardLoading) {
    return <LoadingSkeleton />;
  }

  const filteredInvoices = invoices?.filter((inv) =>
    invoiceStatusFilter === "all" ? true : inv.status === invoiceStatusFilter
  ) || [];

  const filteredExpenses = expenses?.filter((exp) =>
    expenseStatusFilter === "all" ? true : exp.status === expenseStatusFilter
  ) || [];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                Accounts & Finance
              </h1>
              <p className="text-muted-foreground">
                Enterprise financial management, billing, receivables, and reporting
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => seedAccountsMutation.mutate()}
                disabled={seedAccountsMutation.isPending}
                data-testid="button-seed-accounts"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Seed Accounts
              </Button>
              <Button
                variant="outline"
                onClick={() => seedTaxRatesMutation.mutate()}
                disabled={seedTaxRatesMutation.isPending}
                data-testid="button-seed-taxes"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Seed Tax Rates
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:gap-2" data-testid="tabs-finance">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <PieChart className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">
              <FileText className="mr-2 h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">
              <Receipt className="mr-2 h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="receivables" data-testid="tab-receivables">
              <Coins className="mr-2 h-4 w-4" />
              Receivables
            </TabsTrigger>
            <TabsTrigger value="accounts" data-testid="tab-accounts">
              <LandmarkIcon className="mr-2 h-4 w-4" />
              Chart of Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(dashboard?.total_revenue || 0)}
                subtitle="From paid invoices"
                icon={TrendingUp}
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <StatCard
                title="Outstanding Receivables"
                value={formatCurrency(dashboard?.total_receivables || 0)}
                subtitle={`${dashboard?.outstanding_invoices || 0} outstanding invoices`}
                icon={Wallet}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                title="Total Payables"
                value={formatCurrency(dashboard?.total_payables || 0)}
                subtitle="Due to vendors"
                icon={Building2}
                color="bg-gradient-to-br from-amber-500 to-amber-600"
              />
              <StatCard
                title="Total Expenses"
                value={formatCurrency(dashboard?.total_expenses || 0)}
                subtitle="Paid expenses"
                icon={Receipt}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="text-lg">Cash & Bank Balances</CardTitle>
                    <CardDescription>Current liquidity position</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900">
                        <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium">Cash Balance</p>
                        <p className="text-sm text-muted-foreground">Petty cash and cash in hand</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{formatCurrency(dashboard?.cash_balance || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                        <LandmarkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">Bank Balance</p>
                        <p className="text-sm text-muted-foreground">All bank accounts</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{formatCurrency(dashboard?.bank_balance || 0)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                    <CardDescription>Action items requiring attention</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span>Overdue Invoices</span>
                    </div>
                    <Badge variant="destructive">{dashboard?.overdue_invoices || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <span>Pending Payments</span>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">{dashboard?.pending_payments || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span>Outstanding Invoices</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">{dashboard?.outstanding_invoices || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5 text-purple-500" />
                      <span>Pending Expense Approvals</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">{dashboard?.pending_expenses || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AgingChart
                data={dashboard?.receivables_aging || {}}
                title="Receivables Aging"
              />
              <AgingChart
                data={dashboard?.payables_aging || {}}
                title="Payables Aging"
              />
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Enhanced Invoices</CardTitle>
                  <CardDescription>Service, sales, and contract invoices with GST compliance</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="select-invoice-status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="ISSUED">Issued</SelectItem>
                      <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button data-testid="button-new-invoice">
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <FileText className="mb-2 h-12 w-12 opacity-50" />
                    <p>No invoices found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.invoice_type}</TableCell>
                          <TableCell>{invoice.customer_name}</TableCell>
                          <TableCell>{invoice.invoice_date}</TableCell>
                          <TableCell>{invoice.due_date || "-"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.grand_total)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.balance_due)}</TableCell>
                          <TableCell>
                            <Badge className={INVOICE_STATUS_COLORS[invoice.status] || ""}>
                              {invoice.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" data-testid={`button-view-invoice-${invoice.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {invoice.status === "PENDING_APPROVAL" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => approveInvoiceMutation.mutate(invoice.id)}
                                  data-testid={`button-approve-invoice-${invoice.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                </Button>
                              )}
                              {(invoice.status === "APPROVED" || invoice.status === "DRAFT") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => issueInvoiceMutation.mutate(invoice.id)}
                                  data-testid={`button-issue-invoice-${invoice.id}`}
                                >
                                  <Send className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Payment Collections</CardTitle>
                  <CardDescription>Track all payment receipts and collections</CardDescription>
                </div>
                <Button data-testid="button-record-payment">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                  <CreditCard className="mb-2 h-12 w-12 opacity-50" />
                  <p>Payment collection functionality coming soon</p>
                  <p className="text-sm">Payments are automatically created when invoices are paid</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Expense Management</CardTitle>
                  <CardDescription>Track and approve operational expenses</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={expenseStatusFilter} onValueChange={setExpenseStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="select-expense-status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button data-testid="button-new-expense">
                    <Plus className="mr-2 h-4 w-4" />
                    New Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <Receipt className="mb-2 h-12 w-12 opacity-50" />
                    <p>No expenses found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense #</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                          <TableCell className="font-medium">{expense.expense_number}</TableCell>
                          <TableCell>{expense.category_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                          <TableCell>{expense.expense_date}</TableCell>
                          <TableCell className="text-right">{formatCurrency(expense.total_amount)}</TableCell>
                          <TableCell>
                            <Badge className={EXPENSE_STATUS_COLORS[expense.status] || ""}>
                              {expense.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" data-testid={`button-view-expense-${expense.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(expense.status === "SUBMITTED" || expense.status === "PENDING_APPROVAL") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => approveExpenseMutation.mutate(expense.id)}
                                  data-testid={`button-approve-expense-${expense.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receivables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Receivables</CardTitle>
                <CardDescription>Outstanding amounts and aging analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {!receivables || receivables.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <Coins className="mb-2 h-12 w-12 opacity-50" />
                    <p>No outstanding receivables</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead className="text-right">Original Amount</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Aging Bucket</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivables.map((rec) => (
                        <TableRow key={rec.id} data-testid={`row-receivable-${rec.id}`}>
                          <TableCell className="font-medium">{rec.customer_name}</TableCell>
                          <TableCell>{rec.invoice_number}</TableCell>
                          <TableCell className="text-right">{formatCurrency(rec.original_amount)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(rec.outstanding_amount)}</TableCell>
                          <TableCell>{rec.due_date}</TableCell>
                          <TableCell>
                            {rec.days_overdue > 0 ? (
                              <span className="text-red-600">{rec.days_overdue} days</span>
                            ) : (
                              <span className="text-emerald-600">Current</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                rec.aging_bucket === "Current" && "bg-emerald-100 text-emerald-700",
                                rec.aging_bucket === "1-30 Days" && "bg-lime-100 text-lime-700",
                                rec.aging_bucket === "31-60 Days" && "bg-amber-100 text-amber-700",
                                rec.aging_bucket === "61-90 Days" && "bg-orange-100 text-orange-700",
                                rec.aging_bucket === "90+ Days" && "bg-red-100 text-red-700"
                              )}
                            >
                              {rec.aging_bucket}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Chart of Accounts</CardTitle>
                  <CardDescription>Configurable account structure for double-entry bookkeeping</CardDescription>
                </div>
                <Button data-testid="button-new-account">
                  <Plus className="mr-2 h-4 w-4" />
                  New Account
                </Button>
              </CardHeader>
              <CardContent>
                {!accounts || accounts.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <LandmarkIcon className="mb-2 h-12 w-12 opacity-50" />
                    <p>No accounts configured</p>
                    <p className="text-sm">Click "Seed Accounts" to create default chart of accounts</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Current Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account) => (
                        <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                          <TableCell className="font-mono font-medium">{account.code}</TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{account.category}</Badge>
                          </TableCell>
                          <TableCell>{account.account_type.replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(account.current_balance)}
                          </TableCell>
                          <TableCell>
                            {account.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
