
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Mail, 
  Phone, 
  MessageSquare, 
  ChevronRight, 
  Star, 
  Heart, 
  Plus,
  X,
  UserPlus,
  Car,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { MOCK_CUSTOMERS } from '../mockData';

const CRMPage: React.FC<{ user: any }> = ({ user }) => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Customer Registry</h1>
          <p className="text-slate-500 font-medium">Manage client relationships, loyalty tiers, and lifetime engagement.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-6 py-2.5 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm">Engagement Reports</button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={16} /> Add New Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Search bar */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query by Name, Phone, or Plate ID..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                />
             </div>
             <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 hover:text-slate-900 transition-all">
                <Filter size={20} />
             </button>
          </div>

          {/* Customer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCustomers.map(customer => (
              <div 
                key={customer.id} 
                onClick={() => navigate(`/crm/customer/${customer.id}`)}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-blue-400 transition-all group shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-2xl transition-all duration-500 font-black text-xl">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg tracking-tight uppercase">{customer.name}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                         {customer.vehicles[0].make} {customer.vehicles[0].model} • {customer.vehicles[0].plateNumber}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                    <Phone size={14} className="text-blue-400" /> {customer.phone}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                    <Mail size={14} className="text-blue-400" /> {customer.email}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{customer.loyaltyPoints} Points</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"><MessageSquare size={16} /></button>
                    <button className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><Heart size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CRM Insights */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Network Retention</h3>
            <div className="flex items-end gap-3 mb-12">
               <div className="text-6xl font-black tracking-tighter">92%</div>
               <div className="text-[10px] text-emerald-400 font-black mb-3 flex items-center gap-1 uppercase tracking-widest">
                  Active Growth
               </div>
            </div>
            <div className="space-y-6">
               <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                 <div className="bg-blue-500 h-full w-[92%] shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
               </div>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Calculated based on 250+ reviews and return service frequency this quarter.
               </p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Segment Overview</h3>
             <div className="space-y-6">
                {[
                  { tier: 'Platinum', count: 42, color: 'bg-indigo-600 shadow-indigo-200' },
                  { tier: 'Gold', count: 128, color: 'bg-amber-400 shadow-amber-200' },
                  { tier: 'Silver', count: 350, color: 'bg-slate-400 shadow-slate-200' },
                ].map(tier => (
                  <div key={tier.tier} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className={`w-3 h-3 rounded-full ${tier.color} shadow-[0_0_10px_currentColor]`}></div>
                       <span className="text-xs font-black text-slate-900 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{tier.tier} Tier</span>
                    </div>
                    <span className="text-base font-black text-slate-900">{tier.count}</span>
                  </div>
                ))}
             </div>
             <button className="w-full mt-12 py-5 border-2 border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                Loyalty Policy Hub
             </button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/20">
                       <UserPlus size={28} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Register New Client</h2>
                       <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Onboarding Flow v2.4</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white rounded-full transition-all">
                    <X size={28} />
                 </button>
              </div>
              <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto no-scrollbar">
                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-4">Personal Demographics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputGroup label="Full Name" placeholder="e.g. Robert Brown" />
                       <InputGroup label="Phone Number" placeholder="+1 (555) 000-0000" />
                       <InputGroup label="Email Address" placeholder="robert@example.com" />
                       <InputGroup label="Reference" placeholder="Social / Referral / Walk-in" />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-4">Vehicle Specification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputGroup label="Plate Number" placeholder="e.g. ABC-1234" />
                       <InputGroup label="Model Line" placeholder="Toyota Camry" />
                       <InputGroup label="VIN Number" placeholder="17 Digit Serial" />
                       <InputGroup label="Year" placeholder="2024" />
                    </div>
                 </div>
              </div>
              <div className="p-10 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                 <button onClick={() => setShowAddModal(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                    Discard Entry
                 </button>
                 <button 
                   onClick={() => setShowAddModal(false)}
                   className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                 >
                    Onboard Client <CheckCircle2 size={18} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const InputGroup: React.FC<any> = ({ label, placeholder }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <input 
      type="text" 
      placeholder={placeholder} 
      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
    />
  </div>
);

export default CRMPage;
