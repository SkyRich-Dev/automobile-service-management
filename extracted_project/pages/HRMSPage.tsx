
import React from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Star, 
  Award, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { MOCK_USERS } from '../mockData';

const HRMSPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Human Resources (HRMS)</h1>
          <p className="text-slate-500">Manage workshop staff, technicians, attendance and performance.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold rounded-lg hover:bg-slate-50">Shift Planner</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20">Onboard New Staff</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Performance Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Employee Directory</h3>
              <div className="flex items-center gap-2">
                <select className="bg-white border border-slate-200 text-xs px-2 py-1 rounded">
                  <option>All Departments</option>
                  <option>Service</option>
                  <option>Sales</option>
                  <option>Admin</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_USERS.map((employee) => (
                <div key={employee.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm capitalize">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{employee.name}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">{employee.role}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Efficiency</p>
                      <p className="text-sm font-bold text-emerald-600">92%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Jobs Done</p>
                      <p className="text-sm font-bold text-slate-900">45</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><Star size={18}/></button>
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><MoreHorizontal size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Award size={18} className="text-amber-500"/> Top Performers</h4>
              <div className="space-y-4">
                {['Dave Tech', 'Sarah Manager'].map((name, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300">#{i+1}</span>
                      <p className="text-sm font-semibold">{name}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">Elite Tier</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Attendance Summary</h4>
              <div className="flex items-end gap-2 h-20">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-100 rounded-t group relative">
                    <div style={{height: `${h}%`}} className="bg-blue-500 w-full rounded-t transition-all hover:bg-blue-600"></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase">
                <span>Mon</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Recruitment & Policies */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl text-white shadow-xl">
             <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" /> Payroll Analytics</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-400">Total Monthly Payout</span>
                   <span className="text-lg font-bold">$18,200</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-400">Bonus & Incentives</span>
                   <span className="text-sm font-bold text-emerald-400">+$2,450</span>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <button className="w-full py-2 bg-blue-600 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">Generate Pay Slips</button>
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
             <div className="space-y-2">
                {['Performance Appraisals', 'Leave Requests (4)', 'Skill Matrix Config', 'HR Policies'].map(link => (
                  <button key={link} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-sm font-medium group">
                    <span className="text-slate-600 group-hover:text-blue-600">{link}</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400"/>
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRMSPage;
