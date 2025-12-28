import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Package, 
  Settings, 
  LogOut,
  Calendar,
  Briefcase,
  UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Wrench, label: "Service Ops", href: "/service" },
    { icon: Package, label: "Inventory", href: "/inventory" },
    { icon: Users, label: "CRM", href: "/crm" },
    { icon: Briefcase, label: "Accounts", href: "/accounts" },
    { icon: Calendar, label: "HRMS", href: "/hrms" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col fixed left-0 top-0 shadow-lg z-50">
      <div className="p-6 border-b border-border/50">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          AutoServ
        </h1>
        <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase font-medium">Enterprise</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                location === item.href
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", location === item.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              {item.label}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full border border-border" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-foreground">{user?.firstName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
