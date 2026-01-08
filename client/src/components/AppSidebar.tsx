import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wrench,
  Package,
  Users,
  Wallet,
  LogOut,
  ChevronRight,
  ChevronDown,
  Car,
  Calendar,
  Shield,
  Truck,
  BarChart3,
  ShieldCheck,
  DollarSign,
  Receipt,
  CreditCard,
  FileText,
  BookOpen,
  PieChart,
  UserCheck,
  GraduationCap,
  Award,
  CalendarDays,
  Target,
  Sliders,
  PanelLeftClose,
  PanelLeft,
  History,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'CEO_OWNER', 'REGIONAL_MANAGER', 'BRANCH_MANAGER'];
const MANAGER_ROLES: UserRole[] = [...ADMIN_ROLES, 'SERVICE_MANAGER', 'SALES_MANAGER', 'ACCOUNTS_MANAGER'];
const ACCOUNTS_ROLES: UserRole[] = [...ADMIN_ROLES, 'ACCOUNTS_MANAGER', 'ACCOUNTANT'];

interface SubMenuItem {
  text: string;
  icon: any;
  path: string;
}

interface MenuItem {
  text: string;
  icon: any;
  path: string;
  allowedRoles: UserRole[];
  subItems?: SubMenuItem[];
}

interface MenuItemConfig {
  key: string;
  icon: any;
  path: string;
  allowedRoles: UserRole[];
  subItems?: { key: string; icon: any; path: string }[];
}

const menuItemsConfig: MenuItemConfig[] = [
  { 
    key: "dashboard",
    icon: LayoutDashboard, 
    path: "/",
    allowedRoles: [...MANAGER_ROLES, 'SUPERVISOR', 'SERVICE_ADVISOR', 'SERVICE_ENGINEER', 'SALES_EXECUTIVE', 
                   'ACCOUNTANT', 'INVENTORY_MANAGER', 'TECHNICIAN', 'CRM_EXECUTIVE', 'HR_MANAGER']
  },
  { 
    key: "serviceOperations",
    icon: Wrench, 
    path: "/service",
    allowedRoles: [...ADMIN_ROLES, 'SERVICE_MANAGER', 'SUPERVISOR', 'SERVICE_ADVISOR', 'SERVICE_ENGINEER', 'TECHNICIAN']
  },
  { 
    key: "serviceHistory",
    icon: History, 
    path: "/service-history",
    allowedRoles: [...ADMIN_ROLES, 'SERVICE_MANAGER', 'SUPERVISOR', 'SERVICE_ADVISOR', 'SERVICE_ENGINEER', 'TECHNICIAN']
  },
  { 
    key: "appointments",
    icon: Calendar, 
    path: "/appointments",
    allowedRoles: [...ADMIN_ROLES, 'SERVICE_MANAGER', 'SERVICE_ADVISOR', 'CRM_EXECUTIVE']
  },
  { 
    key: "inventory",
    icon: Package, 
    path: "/inventory",
    allowedRoles: [...ADMIN_ROLES, 'SERVICE_MANAGER', 'INVENTORY_MANAGER', 'SUPERVISOR']
  },
  { 
    key: "suppliers",
    icon: Truck, 
    path: "/suppliers",
    allowedRoles: [...ADMIN_ROLES, 'INVENTORY_MANAGER']
  },
  { 
    key: "crm",
    icon: Users, 
    path: "/crm",
    allowedRoles: [...ADMIN_ROLES, 'SERVICE_MANAGER', 'SALES_MANAGER', 'SERVICE_ADVISOR', 'SALES_EXECUTIVE', 'CRM_EXECUTIVE']
  },
  { 
    key: "contracts",
    icon: Shield, 
    path: "/contracts",
    allowedRoles: [...ADMIN_ROLES, 'SERVICE_MANAGER', 'SALES_MANAGER', 'ACCOUNTS_MANAGER', 'SERVICE_ADVISOR', 'ACCOUNTANT']
  },
  { 
    key: "analytics",
    icon: BarChart3, 
    path: "/analytics",
    allowedRoles: [...ADMIN_ROLES, 'SERVICE_MANAGER', 'SALES_MANAGER', 'ACCOUNTS_MANAGER']
  },
  { 
    key: "accountsFinance",
    icon: DollarSign, 
    path: "/accounts-finance",
    allowedRoles: ACCOUNTS_ROLES,
    subItems: [
      { key: "finance.dashboard", icon: PieChart, path: "/accounts-finance?tab=dashboard" },
      { key: "finance.invoices", icon: Receipt, path: "/accounts-finance?tab=invoices" },
      { key: "finance.payments", icon: CreditCard, path: "/accounts-finance?tab=payments" },
      { key: "finance.expenses", icon: FileText, path: "/accounts-finance?tab=expenses" },
      { key: "finance.receivables", icon: Wallet, path: "/accounts-finance?tab=receivables" },
      { key: "finance.chartOfAccounts", icon: BookOpen, path: "/accounts-finance?tab=accounts" },
    ]
  },
  { 
    key: "hrms",
    icon: UserCheck, 
    path: "/hrms",
    allowedRoles: [...ADMIN_ROLES, 'HR_MANAGER'],
    subItems: [
      { key: "hrms.overview", icon: PieChart, path: "/hrms?tab=overview" },
      { key: "hrms.skills", icon: Award, path: "/hrms?tab=skills" },
      { key: "hrms.employees", icon: Users, path: "/hrms?tab=employees" },
      { key: "hrms.training", icon: GraduationCap, path: "/hrms?tab=training" },
      { key: "hrms.leaveManagement", icon: CalendarDays, path: "/hrms?tab=leave" },
      { key: "hrms.skillMatrix", icon: Target, path: "/hrms?tab=matrix" },
    ]
  },
  { 
    key: "notificationCenter",
    icon: Bell, 
    path: "/notification-center",
    allowedRoles: ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER']
  },
  { 
    key: "adminPanel",
    icon: ShieldCheck, 
    path: "/admin",
    allowedRoles: ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER']
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, profile, logout } = useAuth();
  const { t } = useTranslation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["accountsFinance"]);

  const userRole = (profile?.role || 'TECHNICIAN') as UserRole;
  
  const getLocalizedMenuItems = (): MenuItem[] => {
    return menuItemsConfig.map(item => ({
      text: t(`sidebar.${item.key}`, item.key),
      icon: item.icon,
      path: item.path,
      allowedRoles: item.allowedRoles,
      subItems: item.subItems?.map(sub => ({
        text: t(`sidebar.${sub.key}`, sub.key),
        icon: sub.icon,
        path: sub.path,
      })),
    }));
  };

  const menuItems = getLocalizedMenuItems();
  
  const filteredMenuItems = menuItems.filter((item, idx) => 
    menuItemsConfig[idx].allowedRoles.includes(userRole)
  );
  
  const operationsItems = filteredMenuItems.filter((_, idx) => 
    menuItems.indexOf(filteredMenuItems[idx]) < 4
  );
  const managementItems = filteredMenuItems.filter((_, idx) => 
    menuItems.indexOf(filteredMenuItems[idx]) >= 4
  );

  const getMenuKey = (item: MenuItem): string => {
    const idx = menuItems.indexOf(item);
    return menuItemsConfig[idx]?.key || item.text;
  };

  const toggleExpanded = (menuKey: string) => {
    if (isCollapsed) return;
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(m => m !== menuKey)
        : [...prev, menuKey]
    );
  };

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  const renderMenuItem = (item: MenuItem, isManagement = false) => {
    const menuKey = getMenuKey(item);
    const basePath = item.path.split('?')[0];
    const isActive = location === basePath || location.startsWith(basePath + "/") || location.startsWith(basePath + "?");
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedMenus.includes(menuKey);

    if (hasSubItems && !isCollapsed) {
      return (
        <div key={menuKey}>
          <div
            className={cn(
              "sidebar-item group cursor-pointer",
              isActive && "active"
            )}
            onClick={() => toggleExpanded(menuKey)}
            data-testid={`nav-${menuKey}`}
          >
            <Icon className={cn(
              "h-4.5 w-4.5 shrink-0 transition-colors",
              isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
            )} />
            <span className={cn(
              "flex-1 truncate transition-colors",
              !isActive && "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
            )}>
              {item.text}
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              isExpanded && "rotate-180",
              isActive ? "text-sidebar-primary-foreground/60" : "text-sidebar-foreground/40"
            )} />
          </div>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
              {item.subItems!.map((subItem, subIdx) => {
                const SubIcon = subItem.icon;
                const isSubActive = location === subItem.path || 
                  (location.includes(subItem.path.split('?')[0]) && 
                   location.includes(subItem.path.split('?')[1]?.replace('tab=', '') || ''));
                return (
                  <Link 
                    key={subItem.path} 
                    href={subItem.path}
                  >
                    <div
                      className={cn(
                        "sidebar-sub-item group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                        isSubActive 
                          ? "bg-sidebar-accent text-sidebar-foreground font-medium" 
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                      data-testid={`nav-sub-${menuKey}-${subIdx}`}
                    >
                      <SubIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{subItem.text}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (isCollapsed) {
      return (
        <Tooltip key={menuKey} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href={item.path}>
              <div
                className={cn(
                  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg mx-auto transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${menuKey}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.text}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link key={menuKey} href={item.path}>
        <div
          className={cn(
            "sidebar-item group cursor-pointer",
            isActive && "active"
          )}
          data-testid={`nav-${menuKey}`}
        >
          <Icon className={cn(
            "h-4.5 w-4.5 shrink-0 transition-colors",
            isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
          )} />
          <span className={cn(
            "flex-1 truncate transition-colors",
            !isActive && "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
          )}>
            {item.text}
          </span>
          {isActive && (
            <ChevronRight className="h-4 w-4 shrink-0 text-sidebar-primary-foreground/60" />
          )}
        </div>
      </Link>
    );
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
      sidebarWidth
    )}>
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border",
        isCollapsed ? "justify-center px-2" : "gap-3 px-5"
      )}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
          <Car className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-bold tracking-tight">AutoServ</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
              Enterprise
            </span>
          </div>
        )}
      </div>

      <div className={cn(
        "flex items-center border-b border-sidebar-border",
        isCollapsed ? "justify-center py-2" : "justify-end px-3 py-2"
      )}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              data-testid="button-toggle-sidebar"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? t('sidebar.expand', 'Expand sidebar') : t('sidebar.collapse', 'Collapse sidebar')}
          </TooltipContent>
        </Tooltip>
      </div>

      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto py-4",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {operationsItems.length > 0 && (
          <>
            {!isCollapsed && (
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {t('sidebar.operations', 'Operations')}
              </div>
            )}
            {operationsItems.map((item) => renderMenuItem(item))}
          </>
        )}

        {managementItems.length > 0 && (
          <>
            {!isCollapsed && (
              <div className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {t('sidebar.management', 'Management')}
              </div>
            )}
            {isCollapsed && <div className="my-3 border-t border-sidebar-border" />}
            {managementItems.map((item) => renderMenuItem(item, true))}
          </>
        )}
      </nav>

      <div className={cn(
        "border-t border-sidebar-border",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-10 w-10 cursor-pointer border-2 border-sidebar-border">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-white">
                    {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{user?.first_name || user?.username || "User"}</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.role?.replace(/_/g, " ") || t('sidebar.teamMember', 'Team Member')}
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t('sidebar.logout', 'Sign Out')}
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 border-2 border-sidebar-border">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-white">
                  {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {user?.first_name || user?.username || "User"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {profile?.role?.replace(/_/g, " ") || t('sidebar.teamMember', 'Team Member')}
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  {t('sidebar.logout', 'Sign Out')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t('sidebar.logoutTooltip', 'Sign out of your account')}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </aside>
  );
}

export function MainContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { isCollapsed } = useSidebar();
  return (
    <main className={cn(
      "min-h-screen transition-all duration-300",
      isCollapsed ? "ml-16" : "ml-64",
      className
    )}>
      {children}
    </main>
  );
}
