import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wrench,
  Package,
  Users,
  Wallet,
  UserCog,
  Settings,
  LogOut,
  ChevronRight,
  Car,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { text: "Dashboard", icon: LayoutDashboard, path: "/" },
  { text: "Service Operations", icon: Wrench, path: "/service" },
  { text: "Inventory", icon: Package, path: "/inventory" },
  { text: "CRM", icon: Users, path: "/crm" },
  { text: "Accounts", icon: Wallet, path: "/accounts" },
  { text: "HRMS", icon: UserCog, path: "/hrms" },
  { text: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, profile, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
          <Car className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight">AutoServ</span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
            Enterprise
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Main Menu
        </div>
        {menuItems.slice(0, 4).map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.text} href={item.path}>
              <div
                className={cn(
                  "sidebar-item group cursor-pointer",
                  isActive && "active"
                )}
                data-testid={`nav-${item.text.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className={cn(
                  "h-4.5 w-4.5 transition-colors",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                )} />
                <span className={cn(
                  "flex-1 transition-colors",
                  !isActive && "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
                )}>
                  {item.text}
                </span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-sidebar-primary-foreground/60" />
                )}
              </div>
            </Link>
          );
        })}

        <div className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Management
        </div>
        {menuItems.slice(4).map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.text} href={item.path}>
              <div
                className={cn(
                  "sidebar-item group cursor-pointer",
                  isActive && "active"
                )}
                data-testid={`nav-${item.text.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className={cn(
                  "h-4.5 w-4.5 transition-colors",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                )} />
                <span className={cn(
                  "flex-1 transition-colors",
                  !isActive && "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
                )}>
                  {item.text}
                </span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-sidebar-primary-foreground/60" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-sidebar-border">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-white">
              {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.first_name || user?.username || "User"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/50">
              {profile?.role?.replace(/_/g, " ") || "Team Member"}
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
              Sign Out
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Sign out of your account
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
