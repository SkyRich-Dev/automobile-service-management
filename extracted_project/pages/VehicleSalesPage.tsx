
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Tag, 
  Car, 
  TrendingUp, 
  History,
  MoreVertical,
  CheckCircle,
  Clock,
  X,
  FileText,
  User,
  ShieldCheck
} from 'lucide-react';

const VehicleSalesPage: React.FC<{ user: any }> = ({ user }) => {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const inventory = [
    { id: 'VIN-101', model: 'Honda CR-V', price: 3450000, status: 'AVAILABLE', color: 'Midnight Blue' },
    { id: 'VIN-102', model: 'Toyota RAV4', price: 3280000, status: 'BOOKED', color: 'Silver Metallic' },
    { id: 'VIN-103', model: 'Tesla Model Y', price: 5200000, status: 'AVAILABLE', color: 'Solid Black' },
    { id: 'VIN-104', model: 'Hyundai Tucson', price: 2950000, status: 'DELIVERED', color: 'White' },
  ];

  const handleQuote = (v: any) => {
    setSelectedVehicle(v);
    setShowQuoteModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase">Showroom & Sales</h1>
          <p className="text-slate-500">Inventory management and quotation engine.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
          <Plus size={18} /> New Inventory Unit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Units" value="24" icon={<Car size={24} />} color="blue" />
        <StatCard title="Locked Deals" value="08" icon={<Clock size={24} />} color="amber" />
        <StatCard title="Total Value" value="₹4.20 Cr" icon={<TrendingUp size={24} />} color="emerald" />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Filter by VIN, Model or Specs..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button className="px-6 py-2.5 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
            <History size={16} /> Sales Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Vehicle Identification</th>
                <th className="px-8 py-5">Configuration</th>
                <th className="px-8 py-5">Ex-Showroom (INR)</th>
                <th className="px-8 py-5">Inventory Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 text-lg tracking-tight">{unit.model}</p>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{unit.id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{unit.color}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900">₹{unit.price.toLocaleString('en-IN')}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      unit.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                      unit.status === 'BOOKED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleQuote(unit)}
                      className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl transition-all shadow-sm group-hover:shadow-md border border-transparent group-hover:border-blue-100"
                    >
                      <Tag size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20"><FileText size={24} /></div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight">Generate Quotation</h2>
                       <p className="text-slate-500 text-sm font-medium">{selectedVehicle?.model} ({selectedVehicle?.id})</p>
                    </div>
                 </div>
                 <button onClick={() => setShowQuoteModal(false)} className="p-3 hover:bg-white rounded-full transition-all"><X size={24} /></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Customer Name</label>
                       <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Search or Enter Client..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Offer Validity</label>
                       <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" defaultValue="2024-04-21" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Value-Added Services</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <AddonCard label="Extended Warranty (3Y)" price="+₹15,200" active />
                       <AddonCard label="AMC Gold Package" price="+₹14,450" />
                       <AddonCard label="Accessories Pack" price="+₹21,890" />
                       <AddonCard label="Roadside Assist" price="FREE" active />
                    </div>
                 </div>
              </div>
              <div className="p-10 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                 <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated OTR Price</p>
                    <p className="text-3xl font-black text-blue-400">₹{(selectedVehicle?.price + 15200).toLocaleString('en-IN')}</p>
                 </div>
                 <button onClick={() => setShowQuoteModal(false)} className="w-full md:w-auto px-12 py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                    <ShieldCheck size={20} /> Create Official Quote
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<any> = ({ title, value, icon, color }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all text-${color}-600`}>
      {React.cloneElement(icon, { size: 100 })}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
  </div>
);

const AddonCard: React.FC<any> = ({ label, price, active }) => (
  <div className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${active ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
     <div className="flex justify-between items-center">
        <span className={`text-xs font-black ${active ? 'text-blue-900' : 'text-slate-600'}`}>{label}</span>
        <span className={`text-[10px] font-black ${active ? 'text-blue-600' : 'text-slate-400'}`}>{price}</span>
     </div>
  </div>
);

export default VehicleSalesPage;
