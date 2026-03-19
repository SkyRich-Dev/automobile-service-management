import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocalization } from "@/lib/currency-context";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient, getCsrfToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, TrendingUp, FileText, CreditCard, Receipt, Wallet, AlertCircle,
  CheckCircle, Clock, Building2, ArrowUpRight, ArrowDownRight, PieChart, Search,
  RefreshCw, Plus, Eye, Send, Ban, BookOpen, Calculator, Coins, LandmarkIcon,
  ChevronLeft, ChevronRight, X, Download, Undo2, Hash,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
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
  customer: number;
  customer_name: string;
  branch: number;
  branch_name: string;
  grand_total: number | string;
  balance_due: number | string;
  amount_paid: number | string;
  subtotal: number | string;
  total_tax: number | string;
  discount_amount: number | string;
  invoice_date: string;
  due_date: string | null;
  payment_terms: string;
  gstin: string;
  place_of_supply: string;
  notes: string;
  lines: any[];
  created_by_name: string;
  approved_by_name: string | null;
  created_at: string;
}

interface EnhancedPayment {
  id: number;
  payment_number: string;
  customer: number;
  customer_name: string;
  branch_name: string;
  invoice: number | null;
  invoice_number: string | null;
  amount: number | string;
  payment_mode: string;
  status: string;
  payment_date: string;
  reference_number: string;
  received_by_name: string;
  notes: string;
}

interface Expense {
  id: number;
  expense_number: string;
  category: number;
  category_name: string;
  branch_name: string;
  supplier_name: string | null;
  description: string;
  amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  status: string;
  expense_date: string;
  payment_mode: string;
  reference_number: string;
  notes: string;
  submitted_by_name: string | null;
  approved_by_name: string | null;
  rejection_reason: string;
}

interface CustomerReceivable {
  id: number;
  customer_name: string;
  invoice_number: string;
  original_amount: number | string;
  outstanding_amount: number | string;
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
  current_balance: number | string;
  is_active: boolean;
  description: string;
}

interface CreditNote {
  id: number;
  credit_note_number: string;
  original_invoice_number: string;
  customer_name: string;
  reason: string;
  total_amount: number | string;
  status: string;
  credit_note_date: string;
}

const n = (v: any) => parseFloat(String(v)) || 0;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ISSUED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  PARTIALLY_PAID: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CLOSED: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  REFUNDED: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const AGING_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
const PAGE_SIZE = 25;

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).replace(/\bAnd\b/g, "and");
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color }: {
  title: string; value: string; subtitle: string; icon: React.ElementType;
  trend?: string; trendUp?: boolean; color: string;
}) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
              {trend && (
                <span className={cn("flex items-center text-xs font-medium",
                  trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {trend}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn("rounded-xl p-2.5 shrink-0", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgingChart({ data, title }: { data: Record<string, number>; title: string }) {
  const { formatCurrency } = useLocalization();
  const chartData = Object.entries(data).map(([bucket, amount], index) => ({
    name: bucket, value: amount, color: AGING_COLORS[index] || AGING_COLORS[4],
  }));
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <RechartsPieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
              paddingAngle={2} dataKey="value"
              label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
              {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t pt-4 mt-4" data-testid="pagination">
      <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} data-testid="button-prev-page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
          return (
            <Button key={p} variant={p === page ? "default" : "outline"} size="sm"
              onClick={() => onPageChange(p)} data-testid={`button-page-${p}`}>
              {p}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} data-testid="button-next-page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AccountsFinance() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { formatCurrency } = useLocalization();
  const { isCollapsed } = useSidebar();
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [expenseStatusFilter, setExpenseStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [invoicePage, setInvoicePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);

  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<EnhancedInvoice | null>(null);
  const [expenseDetailOpen, setExpenseDetailOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<EnhancedPayment | null>(null);

  const getTabFromSearch = useCallback((search: string) => {
    const params = new URLSearchParams(search);
    return params.get("tab") || "dashboard";
  }, []);

  const [activeTab, setActiveTabState] = useState(() => {
    const initialSearch = typeof window !== 'undefined' ? window.location.search : '';
    return getTabFromSearch(initialSearch);
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setLocation(`/accounts-finance?tab=${tab}`, { replace: true });
  };

  useEffect(() => {
    if (searchString) setActiveTabState(getTabFromSearch(searchString));
  }, [searchString, getTabFromSearch]);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery<FinanceDashboard>({ queryKey: ["/api/finance/dashboard/"] });
  const { data: invoices, isLoading: invoicesLoading } = useQuery<EnhancedInvoice[]>({ queryKey: ["/api/finance/enhanced-invoices/"] });
  const { data: payments, isLoading: paymentsLoading } = useQuery<EnhancedPayment[]>({ queryKey: ["/api/finance/enhanced-payments/"] });
  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({ queryKey: ["/api/finance/expenses/"] });
  const { data: receivables } = useQuery<CustomerReceivable[]>({ queryKey: ["/api/finance/receivables/"] });
  const { data: accounts } = useQuery<Account[]>({ queryKey: ["/api/finance/accounts/"] });
  const { data: creditNotes } = useQuery<CreditNote[]>({ queryKey: ["/api/finance/credit-notes/"] });
  const { data: customers } = useQuery<any[]>({ queryKey: ["/api/customers/"] });
  const { data: branches } = useQuery<any[]>({ queryKey: ["/api/branches/"] });
  const { data: expenseCategories } = useQuery<any[]>({ queryKey: ["/api/finance/expense-categories/"] });

  const seedAccountsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/finance/accounts/seed_default/"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finance/accounts/"] }); toast({ title: "Default accounts seeded" }); },
    onError: (err: any) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const seedTaxRatesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/finance/tax-rates/seed_default/"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finance/tax-rates/"] }); toast({ title: "Default tax rates seeded" }); },
    onError: (err: any) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const invoiceActionMutation = useMutation({
    mutationFn: async ({ id, action, data }: { id: number; action: string; data?: any }) => {
      const csrfToken = getCsrfToken();
      const res = await fetch(`/api/finance/enhanced-invoices/${id}/${action}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(data || {}),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Action failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-invoices/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/receivables/"] });
      setSelectedInvoice(data);
      toast({ title: "Invoice updated successfully" });
    },
    onError: (err: any) => { toast({ title: "Action failed", description: err.message, variant: "destructive" }); },
  });

  const expenseActionMutation = useMutation({
    mutationFn: async ({ id, action, data }: { id: number; action: string; data?: any }) => {
      const csrfToken = getCsrfToken();
      const res = await fetch(`/api/finance/expenses/${id}/${action}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(data || {}),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Action failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard/"] });
      setSelectedExpense(data);
      toast({ title: "Expense updated successfully" });
    },
    onError: (err: any) => { toast({ title: "Action failed", description: err.message, variant: "destructive" }); },
  });

  const paymentActionMutation = useMutation({
    mutationFn: async ({ id, action, data }: { id: number; action: string; data?: any }) => {
      const csrfToken = getCsrfToken();
      const res = await fetch(`/api/finance/enhanced-payments/${id}/${action}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(data || {}),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Action failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-payments/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-invoices/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/receivables/"] });
      setSelectedPayment(data);
      toast({ title: "Payment updated successfully" });
    },
    onError: (err: any) => { toast({ title: "Action failed", description: err.message, variant: "destructive" }); },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const csrfToken = getCsrfToken();
      const res = await fetch("/api/finance/enhanced-invoices/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.text(); throw new Error(err || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-invoices/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard/"] });
      setCreateInvoiceOpen(false);
      toast({ title: "Invoice created" });
    },
    onError: (err: any) => { toast({ title: "Error creating invoice", description: err.message, variant: "destructive" }); },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const csrfToken = getCsrfToken();
      const res = await fetch("/api/finance/expenses/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.text(); throw new Error(err || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard/"] });
      setCreateExpenseOpen(false);
      toast({ title: "Expense created" });
    },
    onError: (err: any) => { toast({ title: "Error creating expense", description: err.message, variant: "destructive" }); },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const csrfToken = getCsrfToken();
      const res = await fetch("/api/finance/enhanced-payments/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.text(); throw new Error(err || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-payments/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/enhanced-invoices/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard/"] });
      setCreatePaymentOpen(false);
      toast({ title: "Payment recorded" });
    },
    onError: (err: any) => { toast({ title: "Error recording payment", description: err.message, variant: "destructive" }); },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const csrfToken = getCsrfToken();
      const res = await fetch("/api/finance/accounts/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.text(); throw new Error(err || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/accounts/"] });
      setCreateAccountOpen(false);
      toast({ title: "Account created" });
    },
    onError: (err: any) => { toast({ title: "Error creating account", description: err.message, variant: "destructive" }); },
  });

  const filteredInvoices = useMemo(() => {
    let list = invoices || [];
    if (invoiceStatusFilter !== "all") list = list.filter(i => i.status === invoiceStatusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(i => i.invoice_number.toLowerCase().includes(q) || i.customer_name.toLowerCase().includes(q));
    }
    return list;
  }, [invoices, invoiceStatusFilter, searchTerm]);

  const filteredExpenses = useMemo(() => {
    let list = expenses || [];
    if (expenseStatusFilter !== "all") list = list.filter(e => e.status === expenseStatusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(e => e.expense_number.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.category_name.toLowerCase().includes(q));
    }
    return list;
  }, [expenses, expenseStatusFilter, searchTerm]);

  const filteredPayments = useMemo(() => {
    let list = payments || [];
    if (paymentStatusFilter !== "all") list = list.filter(p => p.status === paymentStatusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => p.payment_number.toLowerCase().includes(q) || p.customer_name.toLowerCase().includes(q));
    }
    return list;
  }, [payments, paymentStatusFilter, searchTerm]);

  const filteredReceivables = useMemo(() => {
    let list = receivables || [];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => r.invoice_number.toLowerCase().includes(q) || r.customer_name.toLowerCase().includes(q));
    }
    return list;
  }, [receivables, searchTerm]);

  const filteredAccounts = useMemo(() => {
    let list = accounts || [];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    }
    return list;
  }, [accounts, searchTerm]);

  const paginate = <T,>(items: T[], page: number) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    return { items: items.slice(start, start + PAGE_SIZE), totalPages, total: items.length };
  };

  const invoicePaginated = paginate(filteredInvoices, invoicePage);
  const expensePaginated = paginate(filteredExpenses, expensePage);
  const paymentPaginated = paginate(filteredPayments, paymentPage);

  const invoiceCounts = useMemo(() => {
    const list = invoices || [];
    return {
      all: list.length,
      DRAFT: list.filter(i => i.status === "DRAFT").length,
      PENDING_APPROVAL: list.filter(i => i.status === "PENDING_APPROVAL").length,
      ISSUED: list.filter(i => i.status === "ISSUED").length,
      PAID: list.filter(i => i.status === "PAID").length,
      OVERDUE: list.filter(i => i.status === "OVERDUE").length,
    };
  }, [invoices]);

  const expenseCounts = useMemo(() => {
    const list = expenses || [];
    return {
      all: list.length,
      DRAFT: list.filter(e => e.status === "DRAFT").length,
      SUBMITTED: list.filter(e => e.status === "SUBMITTED").length,
      APPROVED: list.filter(e => e.status === "APPROVED").length,
      PAID: list.filter(e => e.status === "PAID").length,
      REJECTED: list.filter(e => e.status === "REJECTED").length,
    };
  }, [expenses]);

  if (dashboardLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
          <div className="mb-8"><div className="h-8 w-64 rounded bg-muted animate-pulse mb-2" /><div className="h-4 w-96 rounded bg-muted animate-pulse" /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className={cn("flex-1 p-6 transition-all duration-300 overflow-x-hidden", isCollapsed ? "ml-16" : "ml-64")}>
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Accounts & Finance</h1>
              <p className="text-muted-foreground">Enterprise financial management, billing, receivables, and reporting</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => seedAccountsMutation.mutate()} disabled={seedAccountsMutation.isPending} data-testid="button-seed-accounts">
                <BookOpen className="mr-2 h-4 w-4" />Seed Accounts
              </Button>
              <Button variant="outline" size="sm" onClick={() => seedTaxRatesMutation.mutate()} disabled={seedTaxRatesMutation.isPending} data-testid="button-seed-taxes">
                <Calculator className="mr-2 h-4 w-4" />Seed Tax Rates
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by number, customer, or description..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setInvoicePage(1); setExpensePage(1); setPaymentPage(1); }}
              className="pl-9" data-testid="input-search-finance" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1" data-testid="tabs-finance">
            <TabsTrigger value="dashboard" className="gap-2" data-testid="tab-dashboard"><PieChart className="h-4 w-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2" data-testid="tab-invoices"><FileText className="h-4 w-4" />Invoices</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2" data-testid="tab-payments"><CreditCard className="h-4 w-4" />Payments</TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2" data-testid="tab-expenses"><Receipt className="h-4 w-4" />Expenses</TabsTrigger>
            <TabsTrigger value="receivables" className="gap-2" data-testid="tab-receivables"><Coins className="h-4 w-4" />Receivables</TabsTrigger>
            <TabsTrigger value="credit-notes" className="gap-2" data-testid="tab-credit-notes"><Undo2 className="h-4 w-4" />Credit Notes</TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2" data-testid="tab-accounts"><LandmarkIcon className="h-4 w-4" />Chart of Accounts</TabsTrigger>
          </TabsList>

          {/* =================== DASHBOARD TAB =================== */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Revenue" value={formatCurrency(n(dashboard?.total_revenue))} subtitle="From paid invoices" icon={TrendingUp} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
              <StatCard title="Outstanding Receivables" value={formatCurrency(n(dashboard?.total_receivables))} subtitle={`${dashboard?.outstanding_invoices || 0} outstanding invoices`} icon={Wallet} color="bg-gradient-to-br from-blue-500 to-blue-600" />
              <StatCard title="Total Payables" value={formatCurrency(n(dashboard?.total_payables))} subtitle="Due to vendors" icon={Building2} color="bg-gradient-to-br from-amber-500 to-amber-600" />
              <StatCard title="Total Expenses" value={formatCurrency(n(dashboard?.total_expenses))} subtitle="Paid expenses" icon={Receipt} color="bg-gradient-to-br from-purple-500 to-purple-600" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cash & Bank Balances</CardTitle>
                  <CardDescription>Current liquidity position</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                      <div><p className="font-medium">Cash Balance</p><p className="text-sm text-muted-foreground">Petty cash and cash in hand</p></div>
                    </div>
                    <span className="text-xl font-bold">{formatCurrency(n(dashboard?.cash_balance))}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900"><LandmarkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                      <div><p className="font-medium">Bank Balance</p><p className="text-sm text-muted-foreground">All bank accounts</p></div>
                    </div>
                    <span className="text-xl font-bold">{formatCurrency(n(dashboard?.bank_balance))}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                  <CardDescription>Action items requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-red-500" /><span>Overdue Invoices</span></div><Badge variant="destructive">{dashboard?.overdue_invoices || 0}</Badge></div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-amber-500" /><span>Pending Payments</span></div><Badge className="bg-amber-100 text-amber-700">{dashboard?.pending_payments || 0}</Badge></div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-blue-500" /><span>Outstanding Invoices</span></div><Badge className="bg-blue-100 text-blue-700">{dashboard?.outstanding_invoices || 0}</Badge></div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Receipt className="h-5 w-5 text-purple-500" /><span>Pending Expense Approvals</span></div><Badge className="bg-purple-100 text-purple-700">{dashboard?.pending_expenses || 0}</Badge></div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AgingChart data={dashboard?.receivables_aging || {}} title="Receivables Aging" />
              <AgingChart data={dashboard?.payables_aging || {}} title="Payables Aging" />
            </div>
          </TabsContent>

          {/* =================== INVOICES TAB =================== */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Enhanced Invoices</CardTitle>
                    <CardDescription>Service, sales, and contract invoices with GST compliance</CardDescription>
                  </div>
                  <Button onClick={() => setCreateInvoiceOpen(true)} data-testid="button-new-invoice"><Plus className="mr-2 h-4 w-4" />New Invoice</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    { key: "all", label: "All", count: invoiceCounts.all },
                    { key: "DRAFT", label: "Draft", count: invoiceCounts.DRAFT },
                    { key: "ISSUED", label: "Issued", count: invoiceCounts.ISSUED },
                    { key: "PAID", label: "Paid", count: invoiceCounts.PAID },
                    { key: "OVERDUE", label: "Overdue", count: invoiceCounts.OVERDUE },
                  ].map(f => (
                    <Button key={f.key} size="sm" variant={invoiceStatusFilter === f.key ? "default" : "outline"}
                      onClick={() => { setInvoiceStatusFilter(f.key); setInvoicePage(1); }}
                      data-testid={`button-invoice-filter-${f.key}`}>
                      {f.label} ({f.count})
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="flex h-48 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <FileText className="mb-2 h-12 w-12 opacity-50" /><p>No invoices found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
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
                          {invoicePaginated.items.map(inv => (
                            <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`} className="cursor-pointer hover:bg-muted/50"
                              onClick={() => { setSelectedInvoice(inv); setInvoiceDetailOpen(true); }}>
                              <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                              <TableCell><Badge variant="outline">{inv.invoice_type}</Badge></TableCell>
                              <TableCell>{inv.customer_name}</TableCell>
                              <TableCell>{inv.invoice_date}</TableCell>
                              <TableCell>{inv.due_date || "-"}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(n(inv.grand_total))}</TableCell>
                              <TableCell className="text-right">{formatCurrency(n(inv.balance_due))}</TableCell>
                              <TableCell><Badge className={STATUS_COLORS[inv.status] || ""}>{statusLabel(inv.status)}</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                  <Button size="icon" variant="ghost" onClick={() => { setSelectedInvoice(inv); setInvoiceDetailOpen(true); }} data-testid={`button-view-invoice-${inv.id}`}><Eye className="h-4 w-4" /></Button>
                                  {inv.status === "PENDING_APPROVAL" && (
                                    <Button size="icon" variant="ghost" onClick={() => invoiceActionMutation.mutate({ id: inv.id, action: "approve" })} data-testid={`button-approve-invoice-${inv.id}`}><CheckCircle className="h-4 w-4 text-emerald-500" /></Button>
                                  )}
                                  {(inv.status === "APPROVED" || inv.status === "DRAFT") && (
                                    <Button size="icon" variant="ghost" onClick={() => invoiceActionMutation.mutate({ id: inv.id, action: "issue" })} data-testid={`button-issue-invoice-${inv.id}`}><Send className="h-4 w-4 text-blue-500" /></Button>
                                  )}
                                  {!["PAID", "CANCELLED", "CLOSED"].includes(inv.status) && (
                                    <Button size="icon" variant="ghost" onClick={() => invoiceActionMutation.mutate({ id: inv.id, action: "cancel" })} data-testid={`button-cancel-invoice-${inv.id}`}><Ban className="h-4 w-4 text-red-500" /></Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination page={invoicePage} totalPages={invoicePaginated.totalPages} onPageChange={setInvoicePage} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== PAYMENTS TAB =================== */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Payment Collections</CardTitle>
                    <CardDescription>Track all payment receipts and collections</CardDescription>
                  </div>
                  <Button onClick={() => setCreatePaymentOpen(true)} data-testid="button-record-payment"><Plus className="mr-2 h-4 w-4" />Record Payment</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["all", "PENDING", "COMPLETED", "REFUNDED"].map(s => (
                    <Button key={s} size="sm" variant={paymentStatusFilter === s ? "default" : "outline"}
                      onClick={() => { setPaymentStatusFilter(s); setPaymentPage(1); }}
                      data-testid={`button-payment-filter-${s}`}>
                      {s === "all" ? "All" : statusLabel(s)} ({s === "all" ? (payments?.length || 0) : (payments?.filter(p => p.status === s).length || 0)})
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="flex h-48 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <CreditCard className="mb-2 h-12 w-12 opacity-50" /><p>No payments found</p>
                    <p className="text-sm mt-1">Click "Record Payment" to add a new payment</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Payment #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentPaginated.items.map(pay => (
                            <TableRow key={pay.id} data-testid={`row-payment-${pay.id}`} className="cursor-pointer hover:bg-muted/50"
                              onClick={() => { setSelectedPayment(pay); setPaymentDetailOpen(true); }}>
                              <TableCell className="font-medium">{pay.payment_number}</TableCell>
                              <TableCell>{pay.customer_name}</TableCell>
                              <TableCell>{pay.invoice_number || "-"}</TableCell>
                              <TableCell>{pay.payment_date}</TableCell>
                              <TableCell><Badge variant="outline">{statusLabel(pay.payment_mode || "-")}</Badge></TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(n(pay.amount))}</TableCell>
                              <TableCell><Badge className={STATUS_COLORS[pay.status] || ""}>{statusLabel(pay.status)}</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                  <Button size="icon" variant="ghost" onClick={() => { setSelectedPayment(pay); setPaymentDetailOpen(true); }} data-testid={`button-view-payment-${pay.id}`}><Eye className="h-4 w-4" /></Button>
                                  {pay.status === "PENDING" && (
                                    <Button size="icon" variant="ghost" onClick={() => paymentActionMutation.mutate({ id: pay.id, action: "confirm" })} data-testid={`button-confirm-payment-${pay.id}`}><CheckCircle className="h-4 w-4 text-emerald-500" /></Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination page={paymentPage} totalPages={paymentPaginated.totalPages} onPageChange={setPaymentPage} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== EXPENSES TAB =================== */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Expense Management</CardTitle>
                    <CardDescription>Track and approve operational expenses</CardDescription>
                  </div>
                  <Button onClick={() => setCreateExpenseOpen(true)} data-testid="button-new-expense"><Plus className="mr-2 h-4 w-4" />New Expense</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    { key: "all", label: "All", count: expenseCounts.all },
                    { key: "DRAFT", label: "Draft", count: expenseCounts.DRAFT },
                    { key: "SUBMITTED", label: "Submitted", count: expenseCounts.SUBMITTED },
                    { key: "APPROVED", label: "Approved", count: expenseCounts.APPROVED },
                    { key: "PAID", label: "Paid", count: expenseCounts.PAID },
                    { key: "REJECTED", label: "Rejected", count: expenseCounts.REJECTED },
                  ].map(f => (
                    <Button key={f.key} size="sm" variant={expenseStatusFilter === f.key ? "default" : "outline"}
                      onClick={() => { setExpenseStatusFilter(f.key); setExpensePage(1); }}
                      data-testid={`button-expense-filter-${f.key}`}>
                      {f.label} ({f.count})
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="flex h-48 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <Receipt className="mb-2 h-12 w-12 opacity-50" /><p>No expenses found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
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
                          {expensePaginated.items.map(exp => (
                            <TableRow key={exp.id} data-testid={`row-expense-${exp.id}`} className="cursor-pointer hover:bg-muted/50"
                              onClick={() => { setSelectedExpense(exp); setExpenseDetailOpen(true); }}>
                              <TableCell className="font-medium">{exp.expense_number}</TableCell>
                              <TableCell><Badge variant="outline">{exp.category_name}</Badge></TableCell>
                              <TableCell className="max-w-[200px] truncate">{exp.description}</TableCell>
                              <TableCell>{exp.expense_date}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(n(exp.total_amount))}</TableCell>
                              <TableCell><Badge className={STATUS_COLORS[exp.status] || ""}>{statusLabel(exp.status)}</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                  <Button size="icon" variant="ghost" onClick={() => { setSelectedExpense(exp); setExpenseDetailOpen(true); }} data-testid={`button-view-expense-${exp.id}`}><Eye className="h-4 w-4" /></Button>
                                  {exp.status === "DRAFT" && (
                                    <Button size="icon" variant="ghost" onClick={() => expenseActionMutation.mutate({ id: exp.id, action: "submit" })} data-testid={`button-submit-expense-${exp.id}`}><Send className="h-4 w-4 text-blue-500" /></Button>
                                  )}
                                  {(exp.status === "SUBMITTED" || exp.status === "PENDING_APPROVAL") && (
                                    <Button size="icon" variant="ghost" onClick={() => expenseActionMutation.mutate({ id: exp.id, action: "approve" })} data-testid={`button-approve-expense-${exp.id}`}><CheckCircle className="h-4 w-4 text-emerald-500" /></Button>
                                  )}
                                  {exp.status === "APPROVED" && (
                                    <Button size="icon" variant="ghost" onClick={() => expenseActionMutation.mutate({ id: exp.id, action: "mark_paid" })} data-testid={`button-pay-expense-${exp.id}`}><DollarSign className="h-4 w-4 text-emerald-500" /></Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination page={expensePage} totalPages={expensePaginated.totalPages} onPageChange={setExpensePage} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== RECEIVABLES TAB =================== */}
          <TabsContent value="receivables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Receivables</CardTitle>
                <CardDescription>Outstanding amounts and aging analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {!receivables || receivables.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <Coins className="mb-2 h-12 w-12 opacity-50" /><p>No outstanding receivables</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
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
                        {filteredReceivables.map(rec => (
                          <TableRow key={rec.id} data-testid={`row-receivable-${rec.id}`}>
                            <TableCell className="font-medium">{rec.customer_name}</TableCell>
                            <TableCell>{rec.invoice_number}</TableCell>
                            <TableCell className="text-right">{formatCurrency(n(rec.original_amount))}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(n(rec.outstanding_amount))}</TableCell>
                            <TableCell>{rec.due_date}</TableCell>
                            <TableCell>{rec.days_overdue > 0 ? <span className="text-red-600">{rec.days_overdue} days</span> : <span className="text-emerald-600">Current</span>}</TableCell>
                            <TableCell>
                              <Badge className={cn(
                                rec.aging_bucket === "Current" && "bg-emerald-100 text-emerald-700",
                                rec.aging_bucket === "1-30 Days" && "bg-lime-100 text-lime-700",
                                rec.aging_bucket === "31-60 Days" && "bg-amber-100 text-amber-700",
                                rec.aging_bucket === "61-90 Days" && "bg-orange-100 text-orange-700",
                                rec.aging_bucket === "90+ Days" && "bg-red-100 text-red-700",
                              )}>{rec.aging_bucket}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== CREDIT NOTES TAB =================== */}
          <TabsContent value="credit-notes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Credit Notes</CardTitle>
                    <CardDescription>Manage credit notes and refunds against invoices</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!creditNotes || creditNotes.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <Undo2 className="mb-2 h-12 w-12 opacity-50" /><p>No credit notes found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Credit Note #</TableHead>
                          <TableHead>Original Invoice</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditNotes.map(cn_item => (
                          <TableRow key={cn_item.id} data-testid={`row-credit-note-${cn_item.id}`}>
                            <TableCell className="font-medium">{cn_item.credit_note_number}</TableCell>
                            <TableCell>{cn_item.original_invoice_number}</TableCell>
                            <TableCell>{cn_item.customer_name}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{cn_item.reason}</TableCell>
                            <TableCell>{cn_item.credit_note_date}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(n(cn_item.total_amount))}</TableCell>
                            <TableCell><Badge className={STATUS_COLORS[cn_item.status] || ""}>{statusLabel(cn_item.status)}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== CHART OF ACCOUNTS TAB =================== */}
          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Chart of Accounts</CardTitle>
                    <CardDescription>Configurable account structure for double-entry bookkeeping</CardDescription>
                  </div>
                  <Button onClick={() => setCreateAccountOpen(true)} data-testid="button-new-account"><Plus className="mr-2 h-4 w-4" />New Account</Button>
                </div>
              </CardHeader>
              <CardContent>
                {!accounts || accounts.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <LandmarkIcon className="mb-2 h-12 w-12 opacity-50" /><p>No accounts configured</p>
                    <p className="text-sm">Click "Seed Accounts" to create default chart of accounts</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
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
                        {filteredAccounts.map(account => (
                          <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                            <TableCell className="font-mono font-medium">{account.code}</TableCell>
                            <TableCell>{account.name}</TableCell>
                            <TableCell><Badge variant="outline">{account.category}</Badge></TableCell>
                            <TableCell>{statusLabel(account.account_type)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(n(account.current_balance))}</TableCell>
                            <TableCell>{account.is_active ? <Badge className="bg-emerald-100 text-emerald-700">Active</Badge> : <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* =================== INVOICE DETAIL DIALOG =================== */}
        <Dialog open={invoiceDetailOpen} onOpenChange={setInvoiceDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span data-testid="text-invoice-detail-number">{selectedInvoice?.invoice_number}</span>
                <Badge className={STATUS_COLORS[selectedInvoice?.status || ""] || ""} data-testid="badge-invoice-status">{statusLabel(selectedInvoice?.status || "")}</Badge>
              </DialogTitle>
              <DialogDescription>Invoice details and actions</DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground text-xs">Customer</Label><p className="font-medium">{selectedInvoice.customer_name}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Branch</Label><p className="font-medium">{selectedInvoice.branch_name}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Type</Label><p>{selectedInvoice.invoice_type}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Date</Label><p>{selectedInvoice.invoice_date}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Due Date</Label><p>{selectedInvoice.due_date || "-"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Payment Terms</Label><p>{selectedInvoice.payment_terms || "-"}</p></div>
                  {selectedInvoice.gstin && <div><Label className="text-muted-foreground text-xs">GSTIN</Label><p className="font-mono">{selectedInvoice.gstin}</p></div>}
                  {selectedInvoice.place_of_supply && <div><Label className="text-muted-foreground text-xs">Place of Supply</Label><p>{selectedInvoice.place_of_supply}</p></div>}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground text-xs">Subtotal</Label><p className="text-lg font-bold">{formatCurrency(n(selectedInvoice.subtotal))}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Tax</Label><p className="text-lg font-bold">{formatCurrency(n(selectedInvoice.total_tax))}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Grand Total</Label><p className="text-xl font-bold text-primary">{formatCurrency(n(selectedInvoice.grand_total))}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Balance Due</Label><p className={cn("text-xl font-bold", n(selectedInvoice.balance_due) > 0 ? "text-red-600" : "text-emerald-600")}>{formatCurrency(n(selectedInvoice.balance_due))}</p></div>
                </div>
                {n(selectedInvoice.grand_total) > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs mb-1 block">Payment Progress</Label>
                    <Progress value={Math.min(100, (n(selectedInvoice.amount_paid) / n(selectedInvoice.grand_total)) * 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(n(selectedInvoice.amount_paid))} of {formatCurrency(n(selectedInvoice.grand_total))} paid</p>
                  </div>
                )}
                {selectedInvoice.notes && <div><Label className="text-muted-foreground text-xs">Notes</Label><p className="text-sm">{selectedInvoice.notes}</p></div>}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {selectedInvoice.status === "DRAFT" && (
                    <Button onClick={() => invoiceActionMutation.mutate({ id: selectedInvoice.id, action: "issue" })} disabled={invoiceActionMutation.isPending} data-testid="button-action-issue-invoice"><Send className="mr-2 h-4 w-4" />Issue Invoice</Button>
                  )}
                  {selectedInvoice.status === "PENDING_APPROVAL" && (
                    <Button onClick={() => invoiceActionMutation.mutate({ id: selectedInvoice.id, action: "approve" })} disabled={invoiceActionMutation.isPending} data-testid="button-action-approve-invoice"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                  )}
                  {selectedInvoice.status === "APPROVED" && (
                    <Button onClick={() => invoiceActionMutation.mutate({ id: selectedInvoice.id, action: "issue" })} disabled={invoiceActionMutation.isPending} data-testid="button-action-issue-approved"><Send className="mr-2 h-4 w-4" />Issue Invoice</Button>
                  )}
                  {["ISSUED", "PARTIALLY_PAID"].includes(selectedInvoice.status) && (
                    <Button variant="outline" onClick={() => { setCreatePaymentOpen(true); setInvoiceDetailOpen(false); }} data-testid="button-action-record-payment"><DollarSign className="mr-2 h-4 w-4" />Record Payment</Button>
                  )}
                  {!["PAID", "CANCELLED", "CLOSED"].includes(selectedInvoice.status) && (
                    <Button variant="destructive" onClick={() => invoiceActionMutation.mutate({ id: selectedInvoice.id, action: "cancel" })} disabled={invoiceActionMutation.isPending} data-testid="button-action-cancel-invoice"><Ban className="mr-2 h-4 w-4" />Cancel</Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* =================== EXPENSE DETAIL DIALOG =================== */}
        <Dialog open={expenseDetailOpen} onOpenChange={setExpenseDetailOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span data-testid="text-expense-detail-number">{selectedExpense?.expense_number}</span>
                <Badge className={STATUS_COLORS[selectedExpense?.status || ""] || ""} data-testid="badge-expense-status">{statusLabel(selectedExpense?.status || "")}</Badge>
              </DialogTitle>
              <DialogDescription>Expense details and workflow</DialogDescription>
            </DialogHeader>
            {selectedExpense && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground text-xs">Category</Label><p className="font-medium">{selectedExpense.category_name}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Branch</Label><p>{selectedExpense.branch_name}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Date</Label><p>{selectedExpense.expense_date}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Amount</Label><p className="text-lg font-bold">{formatCurrency(n(selectedExpense.total_amount))}</p></div>
                  {selectedExpense.supplier_name && <div><Label className="text-muted-foreground text-xs">Supplier</Label><p>{selectedExpense.supplier_name}</p></div>}
                  {selectedExpense.reference_number && <div><Label className="text-muted-foreground text-xs">Reference</Label><p className="font-mono">{selectedExpense.reference_number}</p></div>}
                </div>
                <div><Label className="text-muted-foreground text-xs">Description</Label><p className="text-sm">{selectedExpense.description}</p></div>
                {selectedExpense.notes && <div><Label className="text-muted-foreground text-xs">Notes</Label><p className="text-sm">{selectedExpense.notes}</p></div>}
                {selectedExpense.rejection_reason && (
                  <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <Label className="text-red-600 text-xs">Rejection Reason</Label>
                    <p className="text-sm text-red-700 dark:text-red-400">{selectedExpense.rejection_reason}</p>
                  </div>
                )}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {selectedExpense.status === "DRAFT" && (
                    <Button onClick={() => expenseActionMutation.mutate({ id: selectedExpense.id, action: "submit" })} disabled={expenseActionMutation.isPending} data-testid="button-action-submit-expense"><Send className="mr-2 h-4 w-4" />Submit for Approval</Button>
                  )}
                  {(selectedExpense.status === "SUBMITTED" || selectedExpense.status === "PENDING_APPROVAL") && (
                    <>
                      <Button onClick={() => expenseActionMutation.mutate({ id: selectedExpense.id, action: "approve" })} disabled={expenseActionMutation.isPending} data-testid="button-action-approve-expense"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                      <Button variant="destructive" onClick={() => expenseActionMutation.mutate({ id: selectedExpense.id, action: "reject", data: { reason: "Rejected by admin" } })} disabled={expenseActionMutation.isPending} data-testid="button-action-reject-expense"><Ban className="mr-2 h-4 w-4" />Reject</Button>
                    </>
                  )}
                  {selectedExpense.status === "APPROVED" && (
                    <Button onClick={() => expenseActionMutation.mutate({ id: selectedExpense.id, action: "mark_paid", data: { payment_mode: "BANK_TRANSFER" } })} disabled={expenseActionMutation.isPending} data-testid="button-action-pay-expense"><DollarSign className="mr-2 h-4 w-4" />Mark as Paid</Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* =================== PAYMENT DETAIL DIALOG =================== */}
        <Dialog open={paymentDetailOpen} onOpenChange={setPaymentDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span data-testid="text-payment-detail-number">{selectedPayment?.payment_number}</span>
                <Badge className={STATUS_COLORS[selectedPayment?.status || ""] || ""} data-testid="badge-payment-status">{statusLabel(selectedPayment?.status || "")}</Badge>
              </DialogTitle>
              <DialogDescription>Payment details</DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground text-xs">Customer</Label><p className="font-medium">{selectedPayment.customer_name}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Amount</Label><p className="text-xl font-bold text-primary">{formatCurrency(n(selectedPayment.amount))}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Date</Label><p>{selectedPayment.payment_date}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Mode</Label><p>{statusLabel(selectedPayment.payment_mode || "-")}</p></div>
                  {selectedPayment.invoice_number && <div><Label className="text-muted-foreground text-xs">Invoice</Label><p className="font-mono">{selectedPayment.invoice_number}</p></div>}
                  {selectedPayment.reference_number && <div><Label className="text-muted-foreground text-xs">Reference</Label><p className="font-mono">{selectedPayment.reference_number}</p></div>}
                  {selectedPayment.received_by_name && <div><Label className="text-muted-foreground text-xs">Received By</Label><p>{selectedPayment.received_by_name}</p></div>}
                </div>
                {selectedPayment.notes && <div><Label className="text-muted-foreground text-xs">Notes</Label><p className="text-sm">{selectedPayment.notes}</p></div>}
                {selectedPayment.status === "PENDING" && (
                  <>
                    <Separator />
                    <Button onClick={() => paymentActionMutation.mutate({ id: selectedPayment.id, action: "confirm" })} disabled={paymentActionMutation.isPending} data-testid="button-action-confirm-payment"><CheckCircle className="mr-2 h-4 w-4" />Confirm Payment</Button>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* =================== CREATE INVOICE DIALOG =================== */}
        <CreateInvoiceDialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}
          customers={customers || []} branches={branches || []} onSubmit={(data) => createInvoiceMutation.mutate(data)} isPending={createInvoiceMutation.isPending} />

        {/* =================== CREATE EXPENSE DIALOG =================== */}
        <CreateExpenseDialog open={createExpenseOpen} onOpenChange={setCreateExpenseOpen}
          categories={expenseCategories || []} branches={branches || []} onSubmit={(data) => createExpenseMutation.mutate(data)} isPending={createExpenseMutation.isPending} />

        {/* =================== CREATE PAYMENT DIALOG =================== */}
        <CreatePaymentDialog open={createPaymentOpen} onOpenChange={setCreatePaymentOpen}
          customers={customers || []} branches={branches || []} invoices={invoices || []}
          onSubmit={(data) => createPaymentMutation.mutate(data)} isPending={createPaymentMutation.isPending}
          preselectedInvoice={selectedInvoice} />

        {/* =================== CREATE ACCOUNT DIALOG =================== */}
        <CreateAccountDialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}
          onSubmit={(data) => createAccountMutation.mutate(data)} isPending={createAccountMutation.isPending} />
      </main>
    </div>
  );
}

function CreateInvoiceDialog({ open, onOpenChange, customers, branches, onSubmit, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void; customers: any[]; branches: any[]; onSubmit: (data: any) => void; isPending: boolean;
}) {
  const [form, setForm] = useState({ customer: "", branch: "", invoice_type: "SERVICE", subtotal: "", discount_percent: "0", notes: "", payment_terms: "NET_30", due_date: "" });
  const handleSubmit = () => {
    if (!form.customer || !form.branch) return;
    onSubmit({
      customer: parseInt(form.customer), branch: parseInt(form.branch), invoice_type: form.invoice_type,
      subtotal: form.subtotal || "0", grand_total: form.subtotal || "0", discount_percent: form.discount_percent,
      notes: form.notes, payment_terms: form.payment_terms, due_date: form.due_date || null,
      invoice_date: new Date().toISOString().split("T")[0], status: "DRAFT",
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create New Invoice</DialogTitle><DialogDescription>Fill in the invoice details</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer *</Label>
              <Select value={form.customer} onValueChange={v => setForm(p => ({ ...p, customer: v }))}>
                <SelectTrigger data-testid="select-invoice-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch *</Label>
              <Select value={form.branch} onValueChange={v => setForm(p => ({ ...p, branch: v }))}>
                <SelectTrigger data-testid="select-invoice-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice Type</Label>
              <Select value={form.invoice_type} onValueChange={v => setForm(p => ({ ...p, invoice_type: v }))}>
                <SelectTrigger data-testid="select-invoice-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICE">Service</SelectItem><SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem><SelectItem value="PROFORMA">Proforma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Select value={form.payment_terms} onValueChange={v => setForm(p => ({ ...p, payment_terms: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediate</SelectItem><SelectItem value="NET_15">Net 15</SelectItem>
                  <SelectItem value="NET_30">Net 30</SelectItem><SelectItem value="NET_45">Net 45</SelectItem>
                  <SelectItem value="NET_60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Subtotal</Label><Input type="number" value={form.subtotal} onChange={e => setForm(p => ({ ...p, subtotal: e.target.value }))} placeholder="0.00" data-testid="input-invoice-subtotal" /></div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} data-testid="input-invoice-due-date" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." data-testid="input-invoice-notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.customer || !form.branch} data-testid="button-create-invoice-submit">{isPending ? "Creating..." : "Create Invoice"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateExpenseDialog({ open, onOpenChange, categories, branches, onSubmit, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void; categories: any[]; branches: any[]; onSubmit: (data: any) => void; isPending: boolean;
}) {
  const [form, setForm] = useState({ category: "", branch: "", description: "", amount: "", expense_date: new Date().toISOString().split("T")[0], notes: "" });
  const handleSubmit = () => {
    if (!form.category || !form.branch || !form.description) return;
    onSubmit({
      category: parseInt(form.category), branch: parseInt(form.branch), description: form.description,
      amount: form.amount || "0", total_amount: form.amount || "0", expense_date: form.expense_date,
      notes: form.notes, status: "DRAFT",
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create New Expense</DialogTitle><DialogDescription>Record a new expense</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger data-testid="select-expense-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch *</Label>
              <Select value={form.branch} onValueChange={v => setForm(p => ({ ...p, branch: v }))}>
                <SelectTrigger data-testid="select-expense-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Description *</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Expense description" data-testid="input-expense-description" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" data-testid="input-expense-amount" /></div>
            <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))} data-testid="input-expense-date" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." data-testid="input-expense-notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.category || !form.branch || !form.description} data-testid="button-create-expense-submit">{isPending ? "Creating..." : "Create Expense"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatePaymentDialog({ open, onOpenChange, customers, branches, invoices, onSubmit, isPending, preselectedInvoice }: {
  open: boolean; onOpenChange: (v: boolean) => void; customers: any[]; branches: any[]; invoices: any[];
  onSubmit: (data: any) => void; isPending: boolean; preselectedInvoice: EnhancedInvoice | null;
}) {
  const [form, setForm] = useState({ customer: "", branch: "", invoice: "", amount: "", payment_mode: "CASH", payment_date: new Date().toISOString().split("T")[0], reference_number: "", notes: "" });

  useEffect(() => {
    if (preselectedInvoice && open) {
      setForm(p => ({
        ...p,
        customer: String(preselectedInvoice.customer),
        branch: String(preselectedInvoice.branch),
        invoice: String(preselectedInvoice.id),
        amount: String(n(preselectedInvoice.balance_due)),
      }));
    }
  }, [preselectedInvoice, open]);

  const handleSubmit = () => {
    if (!form.customer || !form.branch || !form.amount) return;
    onSubmit({
      customer: parseInt(form.customer), branch: parseInt(form.branch),
      invoice: form.invoice ? parseInt(form.invoice) : null,
      amount: form.amount, payment_mode: form.payment_mode,
      payment_date: form.payment_date, reference_number: form.reference_number,
      notes: form.notes, status: "PENDING",
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Record a new payment collection</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer *</Label>
              <Select value={form.customer} onValueChange={v => setForm(p => ({ ...p, customer: v }))}>
                <SelectTrigger data-testid="select-payment-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch *</Label>
              <Select value={form.branch} onValueChange={v => setForm(p => ({ ...p, branch: v }))}>
                <SelectTrigger data-testid="select-payment-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Against Invoice (optional)</Label>
            <Select value={form.invoice} onValueChange={v => setForm(p => ({ ...p, invoice: v }))}>
              <SelectTrigger data-testid="select-payment-invoice"><SelectValue placeholder="Select invoice (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Invoice (Advance)</SelectItem>
                {invoices.filter(i => ["ISSUED", "PARTIALLY_PAID"].includes(i.status)).map(i => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.invoice_number} - {i.customer_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Amount *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" data-testid="input-payment-amount" /></div>
            <div>
              <Label>Payment Mode</Label>
              <Select value={form.payment_mode} onValueChange={v => setForm(p => ({ ...p, payment_mode: v }))}>
                <SelectTrigger data-testid="select-payment-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem><SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem><SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem><SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))} data-testid="input-payment-date" /></div>
            <div><Label>Reference #</Label><Input value={form.reference_number} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))} placeholder="Transaction ref" data-testid="input-payment-reference" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Payment notes..." data-testid="input-payment-notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.customer || !form.branch || !form.amount} data-testid="button-record-payment-submit">{isPending ? "Recording..." : "Record Payment"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateAccountDialog({ open, onOpenChange, onSubmit, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (data: any) => void; isPending: boolean;
}) {
  const [form, setForm] = useState({ code: "", name: "", category: "ASSETS", account_type: "CASH", description: "", opening_balance: "0" });
  const handleSubmit = () => {
    if (!form.code || !form.name) return;
    onSubmit({ code: form.code, name: form.name, category: form.category, account_type: form.account_type, description: form.description, opening_balance: form.opening_balance });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create New Account</DialogTitle><DialogDescription>Add a new account to the chart of accounts</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Code *</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g., 1001" data-testid="input-account-code" /></div>
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Account name" data-testid="input-account-name" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger data-testid="select-account-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSETS">Assets</SelectItem><SelectItem value="LIABILITIES">Liabilities</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem><SelectItem value="EXPENSES">Expenses</SelectItem>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.account_type} onValueChange={v => setForm(p => ({ ...p, account_type: v }))}>
                <SelectTrigger data-testid="select-account-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem><SelectItem value="BANK">Bank</SelectItem>
                  <SelectItem value="RECEIVABLE">Accounts Receivable</SelectItem><SelectItem value="PAYABLE">Accounts Payable</SelectItem>
                  <SelectItem value="INVENTORY">Inventory</SelectItem><SelectItem value="FIXED_ASSET">Fixed Asset</SelectItem>
                  <SelectItem value="REVENUE">Revenue</SelectItem><SelectItem value="COGS">Cost of Goods Sold</SelectItem>
                  <SelectItem value="EXPENSE">Operating Expense</SelectItem><SelectItem value="TAX_LIABILITY">Tax Liability</SelectItem>
                  <SelectItem value="TAX_ASSET">Tax Asset (Input Credit)</SelectItem><SelectItem value="CAPITAL">Capital</SelectItem>
                  <SelectItem value="RETAINED_EARNINGS">Retained Earnings</SelectItem><SelectItem value="DEFERRED_REVENUE">Deferred Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Opening Balance</Label><Input type="number" value={form.opening_balance} onChange={e => setForm(p => ({ ...p, opening_balance: e.target.value }))} placeholder="0.00" data-testid="input-account-balance" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Account description..." data-testid="input-account-description" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.code || !form.name} data-testid="button-create-account-submit">{isPending ? "Creating..." : "Create Account"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
