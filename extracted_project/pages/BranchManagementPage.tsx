
import React from 'react';
import { 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  Shield
} from 'lucide-react';

const BranchManagementPage: React.FC<{ user: any }> = ({ user }) => {
  const branches = [
    { id: 'b1', name: 'Main HQ Workshop', location: 'New York, NY', manager: 'Sarah Manager', status: 'ACTIVE', bays: 12 },
    { id: 'b2', name: 'South Branch Service', location: 'Jersey City, NJ', manager: 'Mike Ross', status: 'ACTIVE', bays: 8 },
    { id: 'b3', name: 'Express West Hub', location: 'Newark, NJ', manager: 'David Smith', status: 'INACTIVE', bays: 4 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Branch & Franchise Management</h1>
          <p className="text-slate-500">Configure multi-location settings and oversight.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20">
          <Plus size={18} /> Register New Branch
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {branches.map((branch) => (
          <div key={branch.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                <Building2 size={32} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{branch.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    branch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {branch.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={14}/> {branch.location}</span>
                  <span className="flex items-center gap-1"><User size={14}/> Manager: {branch.manager}</span>
                  <span className="flex items-center gap-1 font-bold text-slate-700"><Shield size={14}/> {branch.bays} Active Bays</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 text-sm font-bold transition-all">
                    Dashboard
                 </button>
                 <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all">
                    <MoreHorizontal size={20} />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h3 className="text-xl font-bold mb-2">Franchise Performance Hub</h3>
              <p className="text-slate-400 text-sm max-w-md">Access consolidated financial reports and customer satisfaction indexes across your entire workshop network.</p>
           </div>
           <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all flex items-center gap-2 group">
              View Network Analytics <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600 opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>
    </div>
  );
};

export default BranchManagementPage;
