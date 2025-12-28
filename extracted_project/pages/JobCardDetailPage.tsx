
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Package, 
  User as UserIcon, 
  Camera, 
  Plus,
  PlayCircle,
  History,
  AlertCircle,
  ShieldCheck,
  Zap,
  MoreVertical,
  ChevronDown,
  FileText,
  X,
  RefreshCcw,
  ArrowRight,
  Search,
  Check,
  Wrench,
  Activity
} from 'lucide-react';
import { MOCK_JOB_CARDS, MOCK_PARTS } from '../mockData';
import { JobStatus, UserRole } from '../types';
import TraceableTimeline from '../components/TraceableTimeline';
import dayjs from 'dayjs';

const JobCardDetailPage: React.FC<{ user: any }> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(MOCK_JOB_CARDS.find(j => j.id === id) || MOCK_JOB_CARDS[0]);

  const [activeTab, setActiveTab] = useState<'DETAILS' | 'TASKS' | 'TIMELINE' | 'INVENTORY' | 'VERSIONS'>('DETAILS');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);

  const isManager = [UserRole.MANAGER, UserRole.OWNER].includes(user.role);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/service')} className="p-2 hover:bg-slate-200 rounded-full transition-colors" aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{job.id}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                job.status === JobStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1 font-medium">
              <Zap size={14} className="text-amber-500" /> Operational SLA Target: 04:00 PM (IST)
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
             <Activity size={14} /> View Telemetry
          </button>
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">Print Service Pack</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Technical Digest (Replacement for AI Block) */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200 shadow-sm">
                  <FileText size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-[0.2em]">Technical Digest</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Service Reference: SR-IND-452</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Complaints</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                      Vibration detected in steering column at 80km/h.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                      Brake pedal responsiveness slightly delayed.
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Required Attention</h4>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100 text-xs font-bold text-amber-700">
                    <AlertCircle size={14} /> Mandatory Hybrid System Audit Pending
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
            {['DETAILS', 'TASKS', 'TIMELINE', 'INVENTORY', 'VERSIONS'].map((tab: any) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-10 py-5 text-[11px] font-black uppercase tracking-widest transition-all relative shrink-0 ${
                  activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 min-h-[500px]">
            {activeTab === 'TASKS' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Operational Checklist</h3>
                  <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">
                    <Plus size={16} /> Add Log Entry
                  </button>
                </div>
                {job.tasks.map((task) => (
                  <div key={task.id} className={`p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
                    task.status === 'COMPLETED' ? 'bg-slate-50 border-slate-100 opacity-60' : 'border-slate-100 hover:border-blue-500/30 hover:bg-blue-50/10'
                  }`}>
                    <div className="flex items-center gap-8">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                         task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-300'
                       }`}>
                         {task.status === 'COMPLETED' ? <Check size={28} /> : <Wrench size={24} />}
                       </div>
                       <div>
                         <p className={`text-xl font-black tracking-tight ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.description}</p>
                         <div className="flex items-center gap-4 mt-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target: 45m</span>
                           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Labor Ref: L-402</span>
                         </div>
                       </div>
                    </div>
                    <button className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'TIMELINE' && <TraceableTimeline events={job.timeline} />}
            {activeTab === 'DETAILS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                <div className="space-y-8">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-4">Asset Specification</h4>
                   <AttributeRow label="Manufacturer" value="Toyota Motors" />
                   <AttributeRow label="Model Line" value="Camry Hybrid" />
                   <AttributeRow label="VIN Number" value="VIN-XJ-01992" />
                   <AttributeRow label="Plate ID" value="MH-01-AB-1234" />
                </div>
                <div className="space-y-8">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-4">Owner Intelligence</h4>
                   <AttributeRow label="Profile Name" value="Robert D'Souza" />
                   <AttributeRow label="Membership" value="Platinum Member" />
                   <AttributeRow label="Lifetime Value" value="₹1,45,000" />
                   <AttributeRow label="Last Feedback" value="5/5 Stars" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Financial Summary</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center group cursor-pointer">
                    <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Parts Total</span>
                    <span className="text-sm font-black text-slate-100">₹12,450.00</span>
                 </div>
                 <div className="flex justify-between items-center group cursor-pointer">
                    <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Labor Total</span>
                    <span className="text-sm font-black text-slate-100">₹4,500.00</span>
                 </div>
                 <div className="flex justify-between items-center group cursor-pointer">
                    <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Consumables</span>
                    <span className="text-sm font-black text-slate-100">₹1,550.00</span>
                 </div>
                 <div className="pt-8 border-t border-slate-800">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Billing Value</p>
                          <p className="text-4xl font-black text-blue-400 tracking-tighter">₹18,500.00</p>
                       </div>
                       <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">NET TOTAL</span>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-12 py-5 bg-blue-600 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                 Generate Gate Pass <ArrowRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const AttributeRow: React.FC<{label: string; value: string}> = ({ label, value }) => (
  <div className="flex justify-between items-center py-4 border-b border-slate-50 hover:bg-slate-50/50 px-2 rounded-lg transition-all">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-slate-900 tracking-tight">{value}</span>
  </div>
);

export default JobCardDetailPage;
