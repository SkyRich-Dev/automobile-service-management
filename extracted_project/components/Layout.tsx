
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  ChevronRight,
  User as UserIcon,
  Calendar,
  CreditCard,
  Briefcase,
  Car,
  Zap
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: Object.values(UserRole) },
    { name: 'Appointments', path: '/appointments', icon: Calendar, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.ADVISOR] },
    { name: 'Vehicle Sales', path: '/sales', icon: Car, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { name: 'Service Ops', path: '/service', icon: Wrench, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.ADVISOR, UserRole.TECHNICIAN] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY, UserRole.ACCOUNTS] },
    { name: 'CRM', path: '/crm', icon: Users, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.ADVISOR] },
    { name: 'Accounts', path: '/accounts', icon: CreditCard, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTS] },
    { name: 'HRMS', path: '/hrms', icon: Briefcase, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { name: 'Marketplace', path: '/settings', icon: Zap, roles: [UserRole.OWNER, UserRole.MANAGER] }, // Unified Marketplace/Settings
    { name: 'Settings', path: '/settings', icon: Settings, roles: [UserRole.OWNER, UserRole.MANAGER] },
  ].filter(item => item.roles.includes(user.role));

  // Deduplicate items that point to same path (like Marketplace/Settings for this demo)
  const uniqueMenuItems = Array.from(new Set(menuItems.map(a => a.name)))
    .map(name => menuItems.find(a => a.name === name)!);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col z-50`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shrink-0">A</div>
          {isSidebarOpen && <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap uppercase">AutoServ</span>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          {uniqueMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-rose-600/10 hover:text-rose-500 transition-all group"
          >
            <LogOut size={20} className="text-slate-400 group-hover:text-rose-500" />
            {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors border border-transparent hover:border-slate-200"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
              <span className="text-slate-900">Branch Identity:</span>
              <select className="bg-transparent border-none focus:ring-0 p-0 text-blue-600 cursor-pointer">
                <option>Main Workshop #01</option>
                <option>South Branch #02</option>
                <option>Airport Service Center</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Global Traceability Search..." 
                className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest w-80 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all"
              />
            </div>
            <button className="p-2.5 hover:bg-slate-50 rounded-full relative text-slate-400 transition-colors border border-transparent hover:border-slate-100">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 tracking-tight leading-tight">{user.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mt-0.5">{user.role}</p>
              </div>
              <div className="w-11 h-11 bg-slate-900 text-white rounded-2xl flex items-center justify-center border-2 border-white shadow-xl shadow-slate-900/10 font-black text-sm tracking-tighter">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
