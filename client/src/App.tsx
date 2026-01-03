import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { LocalizationProvider } from "@/lib/currency-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import '@/lib/i18n';

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ServiceOperations from "@/pages/ServiceOperations";
import Inventory from "@/pages/Inventory";
import CRM from "@/pages/CRM";
import JobCardDetail from "@/pages/JobCardDetail";
import Appointments from "@/pages/Appointments";
import Contracts from "@/pages/Contracts";
import Suppliers from "@/pages/Suppliers";
import PODetail from "@/pages/PODetail";
import Analytics from "@/pages/Analytics";
import AdminPanel from "@/pages/AdminPanel";
import AccountsFinance from "@/pages/AccountsFinance";
import HRMS from "@/pages/HRMS";
import AdminConfig from "@/pages/AdminConfig";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import NotFound from "@/pages/not-found";

type UserRole = 
  | 'SUPER_ADMIN'
  | 'CEO_OWNER'
  | 'REGIONAL_MANAGER'
  | 'BRANCH_MANAGER' 
  | 'SERVICE_MANAGER'
  | 'SALES_MANAGER'
  | 'ACCOUNTS_MANAGER'
  | 'SUPERVISOR'
  | 'SERVICE_ADVISOR' 
  | 'SERVICE_ENGINEER'
  | 'SALES_EXECUTIVE'
  | 'ACCOUNTANT'
  | 'INVENTORY_MANAGER'
  | 'HR_MANAGER'
  | 'TECHNICIAN' 
  | 'CRM_EXECUTIVE'
  | 'CUSTOMER';

const routePermissions: Record<string, UserRole[]> = {
  '/': ['SUPER_ADMIN', 'CEO_OWNER', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'SERVICE_MANAGER', 'SALES_MANAGER', 'ACCOUNTS_MANAGER', 'SUPERVISOR', 'SERVICE_ADVISOR', 'SERVICE_ENGINEER', 'SALES_EXECUTIVE', 'ACCOUNTANT', 'INVENTORY_MANAGER', 'TECHNICIAN', 'CRM_EXECUTIVE'],
  '/service': ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER', 'SERVICE_MANAGER', 'SUPERVISOR', 'SERVICE_ADVISOR', 'SERVICE_ENGINEER', 'TECHNICIAN'],
  '/appointments': ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER', 'SERVICE_MANAGER', 'SERVICE_ADVISOR', 'CRM_EXECUTIVE'],
  '/inventory': ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER', 'SERVICE_MANAGER', 'INVENTORY_MANAGER'],
  '/suppliers': ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER'],
  '/crm': ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER', 'SERVICE_MANAGER', 'SALES_MANAGER', 'SERVICE_ADVISOR', 'CRM_EXECUTIVE'],
  '/contracts': ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER', 'SERVICE_MANAGER', 'SALES_MANAGER', 'SERVICE_ADVISOR', 'ACCOUNTANT'],
  '/analytics': ['SUPER_ADMIN', 'CEO_OWNER', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'SERVICE_MANAGER', 'SALES_MANAGER', 'ACCOUNTS_MANAGER'],
  '/accounts-finance': ['SUPER_ADMIN', 'CEO_OWNER', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'ACCOUNTS_MANAGER', 'ACCOUNTANT'],
  '/admin': ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER'],
  '/admin-config': ['SUPER_ADMIN', 'CEO_OWNER'],
};

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles?: UserRole[] }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (profile?.role || 'TECHNICIAN') as UserRole;
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} allowedRoles={routePermissions['/']} />} />
      <Route path="/service" component={() => <ProtectedRoute component={ServiceOperations} allowedRoles={routePermissions['/service']} />} />
      <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} allowedRoles={routePermissions['/inventory']} />} />
      <Route path="/crm" component={() => <ProtectedRoute component={CRM} allowedRoles={routePermissions['/crm']} />} />
      <Route path="/job-cards/:id" component={() => <ProtectedRoute component={JobCardDetail} allowedRoles={routePermissions['/service']} />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} allowedRoles={routePermissions['/appointments']} />} />
      <Route path="/contracts" component={() => <ProtectedRoute component={Contracts} allowedRoles={routePermissions['/contracts']} />} />
      <Route path="/suppliers" component={() => <ProtectedRoute component={Suppliers} allowedRoles={routePermissions['/suppliers']} />} />
      <Route path="/purchase-orders/:id" component={() => <ProtectedRoute component={PODetail} allowedRoles={routePermissions['/suppliers']} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} allowedRoles={routePermissions['/analytics']} />} />
      <Route path="/accounts-finance" component={() => <ProtectedRoute component={AccountsFinance} allowedRoles={routePermissions['/accounts-finance']} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPanel} allowedRoles={routePermissions['/admin']} />} />
      <Route path="/accounts" component={() => <ProtectedRoute component={AccountsFinance} allowedRoles={routePermissions['/accounts-finance']} />} />
      <Route path="/hrms" component={() => <ProtectedRoute component={HRMS} allowedRoles={routePermissions['/admin']} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={AdminPanel} allowedRoles={routePermissions['/admin']} />} />
      <Route path="/admin-config" component={() => <ProtectedRoute component={AdminConfig} allowedRoles={routePermissions['/admin-config']} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </SidebarProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
