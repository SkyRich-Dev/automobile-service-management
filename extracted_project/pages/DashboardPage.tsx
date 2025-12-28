
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  Wrench, 
  AlertTriangle,
  Zap,
  Clock,
  ShieldCheck,
  ChevronRight,
  Timer
} from 'lucide-react';
import { User, UserRole } from '../types';
import { MOCK_JOB_CARDS } from '../mockData';
import dayjs from 'dayjs';

const REVENUE_DATA = [
  { name: 'Mon', revenue: 42000 },
  { name: 'Tue', revenue: 38500 },
  { name: 'Wed', revenue: 51200 },
  { name: 'Thu', revenue: 49000 },
  { name: 'Fri', revenue: 72800 },
  { name: 'Sat', revenue: 85400 },
  { name: 'Sun', revenue: 31000 },
];

const DashboardPage: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const isTechnician = user.role === UserRole.TECHNICIAN;

  if (isTechnician) return <TechnicianCommandCenter user={user} navigate={navigate} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">COMMAND CENTER</h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide">Workshop Intelligence • {user.branchId}</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-slate-200 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> Operational Feed
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="SLA Breaches" value="03" sub="Critical Attention" color="rose" icon={<AlertTriangle />} />
        <KPICard label="Approvals" value="07" sub="Pending Estimates" color="amber" icon={<Clock />} />
        <KPICard label="QC Pipeline" value="12" sub="Vehicles Ready" color="emerald" icon={<ShieldCheck />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Revenue Velocity (₹)</h3>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">+12.4% vs Last Week</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Live Floor Tracking</h3>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-black uppercase tracking-widest">Capacity: 42%</span>
             </div>
             <div className="divide-y divide-slate-100">
                {MOCK_JOB_CARDS.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate(`/service/job/${job.id}`)}
                    className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg transition-all duration-300">
                          <Wrench size={24} />
                       </div>
                       <div>
                          <p className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">{job.id} • <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Toyota Camry</span></p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-1">Lead: {job.technicianId === 'u4' ? 'Suresh Kumar' : 'TBD'} • Level 4 Priority</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center gap-1.5 justify-end">
                         <Timer size={14} className="text-blue-500" />
                         <span className="text-sm font-black text-slate-900 font-mono tracking-tighter">03:45:00</span>
                       </div>
                       <div className="w-32 h-2 bg-slate-100 rounded-full mt-3 overflow-hidden border border-slate-200">
                          <div className="h-full bg-blue-600 w-[65%] rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Customer Sentiment Index</h3>
            <div className="flex items-end gap-3 mb-10">
              <span className="text-6xl font-black tracking-tighter">4.9</span>
              <span className="text-xs text-emerald-400 font-black mb-3 flex items-center gap-1 uppercase"><TrendingUp size={14} /> +2.4%</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Monthly Growth Target</span>
                <span>₹45L / ₹50L</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className="h-full bg-blue-500 w-[90%] shadow-[0_0_15px_#3b82f6]"></div>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform">
               <ShieldCheck size={180} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Asset Allocation</h3>
             <div className="space-y-6">
                {[
                  { name: 'Suresh Kumar', util: 92, status: 'Active' },
                  { name: 'Amit Jha', util: 78, status: 'Idle' },
                  { name: 'Pooja Rai', util: 85, status: 'QC' },
                ].map(tech => (
                  <div key={tech.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">{tech.name.charAt(0)}</div>
                       <div>
                         <p className="text-sm font-black text-slate-900">{tech.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tech.status}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-blue-600">{tech.util}%</p>
                       <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Efficiency</p>
                    </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-10 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all">Manage Bench Capacity</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TechnicianCommandCenter: React.FC<{ user: User, navigate: any }> = ({ user, navigate }) => {
  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">TECH BENCH</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Authorized ID: {user.name} • L-4 Specialist</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-black bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">LOGGED IN: 08:30 AM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div 
              onClick={() => navigate('/service/job/JC-2024-001')}
              className="bg-blue-600 rounded-[3rem] p-12 text-white shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
            >
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                     <span className="px-5 py-2 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/10">Priority Alpha</span>
                     <span className="text-4xl font-black tracking-tighter">JC-2024-001</span>
                  </div>
                  <h2 className="text-6xl font-black mb-4 tracking-tight leading-none">TOYOTA CAMRY<br/><span className="text-blue-300">MH-01-AB-1234</span></h2>
                  <p className="text-blue-100 font-black uppercase tracking-[0.2em] mb-12 text-sm">Full Engine Service + Hybrid Cell Audit</p>
                  
                  <div className="flex flex-wrap gap-4">
                     <button className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-blue-50 transition-all flex items-center gap-3">
                        <Timer size={20} /> Stop Clock
                     </button>
                     <button className="bg-blue-500 text-white border-2 border-blue-400/30 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-400 transition-all">
                        Technical Manual
                     </button>
                  </div>
               </div>
               <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Wrench size={350} />
               </div>
            </div>
         </div>
         
         <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 text-center">Efficiency Score</h3>
            <div className="flex justify-center mb-10">
               <div className="w-48 h-48 rounded-full border-[20px] border-slate-50 relative flex items-center justify-center">
                  <div className="absolute inset-0 border-[20px] border-blue-600 rounded-full clip-path-half animate-pulse opacity-20"></div>
                  <div className="text-center">
                     <p className="text-6xl font-black text-slate-900 tracking-tighter">88%</p>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Daily Yield</p>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                  <p className="text-3xl font-black text-slate-900">04</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Done</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                  <p className="text-3xl font-black text-slate-900">02</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Todo</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<any> = ({ label, value, sub, color, icon }) => {
  const colorMap: any = {
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100'
  };
  return (
    <div className={`p-8 rounded-[2rem] border shadow-sm ${colorMap[color]} group hover:shadow-xl transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
        <div className="opacity-20 group-hover:opacity-40 transition-opacity">{React.cloneElement(icon, { size: 24 })}</div>
      </div>
      <h4 className="text-4xl font-black mb-1">{value}</h4>
      <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">{sub}</p>
    </div>
  );
};

export default DashboardPage;
