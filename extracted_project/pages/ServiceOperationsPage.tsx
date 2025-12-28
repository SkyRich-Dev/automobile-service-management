
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  FileEdit, 
  Trash, 
  LayoutGrid, 
  List as ListIcon, 
  UserPlus, 
  Wrench, 
  Clock,
  ChevronRight,
  X,
  CheckCircle2
} from 'lucide-react';
import { MOCK_JOB_CARDS, MOCK_USERS } from '../mockData';
import { User, JobStatus, JobCard, UserRole } from '../types';
import { ServiceAPI } from '../services';

const ServiceOperationsPage: React.FC<{ user: User }> = ({ user }) => {
  const [viewType, setViewType] = useState<'LIST' | 'KANBAN'>('LIST');
  const [filter, setFilter] = useState<string>('ALL');
  const [jobCards, setJobCards] = useState<JobCard[]>(MOCK_JOB_CARDS);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredJobs = filter === 'ALL' 
    ? jobCards 
    : jobCards.filter(j => j.status === filter);

  const getStatusColor = (status: JobStatus) => {
    switch(status) {
      case JobStatus.CHECKED_IN: return 'bg-blue-100 text-blue-700';
      case JobStatus.IN_PROGRESS: return 'bg-emerald-100 text-emerald-700';
      case JobStatus.QC_PENDING: return 'bg-amber-100 text-amber-700';
      case JobStatus.READY_FOR_DELIVERY: return 'bg-purple-100 text-purple-700';
      case JobStatus.DELIVERED: return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const openAssignModal = (id: string) => {
    setSelectedJobId(id);
    setShowAssignModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Service Operations</h1>
          <p className="text-slate-500 text-sm">Orchestrate workshop floor, technician loads, and vehicle throughput.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex gap-1 mr-2 shadow-sm">
            <button 
              onClick={() => setViewType('LIST')}
              className={`p-2 rounded-lg transition-all ${viewType === 'LIST' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewType('KANBAN')}
              className={`p-2 rounded-lg transition-all ${viewType === 'KANBAN' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button 
            onClick={() => navigate('/service/new')}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={18} /> New Job Card
          </button>
        </div>
      </div>

      {/* Kanban Board Mode */}
      {viewType === 'KANBAN' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
          {[JobStatus.CHECKED_IN, JobStatus.IN_PROGRESS, JobStatus.QC_PENDING, JobStatus.READY_FOR_DELIVERY].map(status => (
            <div key={status} className="flex-1 min-w-[320px] bg-slate-100/50 rounded-3xl p-4 flex flex-col gap-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{status.replace('_', ' ')}</h3>
                  <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400">
                    {jobCards.filter(j => j.status === status).length}
                  </span>
               </div>
               <div className="flex flex-col gap-3">
                  {jobCards.filter(j => j.status === status).map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => navigate(`/service/job/${job.id}`)}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group"
                    >
                       <div className="flex justify-between items-start mb-4">
                          <span className="text-sm font-black text-slate-900">{job.id}</span>
                          <button className="text-slate-300 hover:text-slate-900"><MoreVertical size={16} /></button>
                       </div>
                       <p className="text-sm font-bold text-slate-700 mb-1">Toyota Camry Hybrid</p>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-4">
                          <Clock size={12} /> Checked in 2h ago
                       </div>
                       <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex -space-x-2">
                             <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">M</div>
                             <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">D</div>
                          </div>
                          {!job.technicianId && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); openAssignModal(job.id); }}
                              className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                            >
                              Assign Tech
                            </button>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Mode - Enhanced with Quick Assign */
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Job ID</th>
                  <th className="px-8 py-5">Vehicle & Customer</th>
                  <th className="px-8 py-5">Personnel</th>
                  <th className="px-8 py-5">Workflow State</th>
                  <th className="px-8 py-5">SLA Check</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="font-black text-blue-600 text-lg tracking-tighter">{job.id}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(job.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900">Honda Civic <span className="text-slate-300 font-normal">• ABC-1234</span></p>
                      <p className="text-xs text-slate-500 font-medium">Robert Brown (VIP)</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">M</div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advisor</p>
                          <p className="text-xs font-bold text-slate-700">Mike Advisor</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-600">On Track</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openAssignModal(job.id)}
                          className="p-2.5 hover:bg-blue-50 text-blue-600 rounded-xl transition-all"
                        >
                          <UserPlus size={18} />
                        </button>
                        <Link 
                          to={`/service/job/${job.id}`}
                          className="p-2.5 hover:bg-slate-100 text-slate-900 rounded-xl transition-all"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Technician Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">Dispatch Technician</h2>
                    <p className="text-slate-500 text-xs font-medium">Selecting available resources for {selectedJobId}</p>
                 </div>
                 <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search by name or specialty..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                 </div>
                 <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {MOCK_USERS.filter(u => u.role === UserRole.TECHNICIAN).map(tech => (
                      <div key={tech.id} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between group cursor-pointer">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-blue-600 font-black text-sm">{tech.name.charAt(0)}</div>
                            <div>
                               <p className="text-sm font-black text-slate-900">{tech.name}</p>
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-emerald-600">88% Efficiency</span>
                                  <span className="text-[10px] text-slate-300 font-normal">|</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mechanical Expert</span>
                               </div>
                            </div>
                         </div>
                         <button className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
                            Assign
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Bay: Lift #04</span>
                 <button onClick={() => setShowAssignModal(false)} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOperationsPage;
