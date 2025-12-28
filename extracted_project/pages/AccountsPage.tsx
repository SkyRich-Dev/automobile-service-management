
import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  MoreVertical,
  ChevronRight,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Printer
} from 'lucide-react';
import dayjs from 'dayjs';

const AccountsPage: React.FC<{ user: any }> = ({ user }) => {
  const [filter, setFilter] = useState('ALL');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const invoices = [
    { id: 'INV-2024-001', customer: 'Robert D\'Souza', date: '20/03/2024', amount: 18500.00, status: 'PAID', method: 'Credit Card', vehicle: 'MH-01-AB-1234' },
    { id: 'INV-2024-002', customer: 'Anjali Gupta', date: '21/03/2024', amount: 12500.50, status: 'PENDING', method: '-', vehicle: 'KA-03-MG-7890' },
    { id: 'INV-2024-003', customer: 'Rajesh Khanna', date: '21/03/2024', amount: 8400.00, status: 'OVERDUE', method: '-', vehicle: 'DL-04-CA-5678' },
    { id: 'INV-2024-004', customer: 'Vikram Singh', date: '22/03/2024', amount: 24900.00, status: 'PAID', method: 'UPI', vehicle: 'HR-26-BK-1122' },
  ];

  const handleOpenPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setShowPaymentModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Financial Hub</h1>
          <p className="text-slate-500 text-sm">Revenue tracking, payment collection, and taxation reconciliation.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-2.5 bg-white border border-slate-200 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors shadow-sm">GST Reports</button>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">Export GSTN</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AccountStatCard title="Total Receivables" value="₹1,24,500" change="+8%" icon={<DollarSign size={20}/>} color="blue" />
        <AccountStatCard title="Collected Today" value="₹31,200" change="+12%" icon={<CheckCircle size={20}/>} color="emerald" />
        <AccountStatCard title="Overdue Aging" value="14 Days" change="Critical" icon={<Clock size={20}/>} color="rose" />
        <AccountStatCard title="Monthly Goal" value="92%" change="+15.4%" icon={<TrendingUp size={20}/>} color="indigo" />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by Invoice, Customer or Vehicle Plate..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map(s => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Accounting Ref</th>
                <th className="px-8 py-5">Customer Entity</th>
                <th className="px-8 py-5">Asset</th>
                <th className="px-8 py-5">Amount Due</th>
                <th className="px-8 py-5">Payment Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><FileText size={16} /></div>
                      <span className="font-black text-slate-900 tracking-tight">{inv.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-sm font-black text-slate-700">{inv.customer}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">{inv.date}</p>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600">{inv.vehicle}</td>
                  <td className="px-8 py-6 text-sm font-black text-slate-900">₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      {inv.status !== 'PAID' && (
                        <button 
                          onClick={() => handleOpenPayment(inv)}
                          className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 hover:scale-105 transition-all"
                        >
                          Collect
                        </button>
                      )}
                      <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><MoreVertical size={20}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Collection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/20"><DollarSign size={24} /></div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Collect Payment</h2>
                       <p className="text-slate-500 text-sm font-medium">{selectedInvoice?.customer} ({selectedInvoice?.id})</p>
                    </div>
                 </div>
                 <button onClick={() => setShowPaymentModal(false)} className="p-3 hover:bg-white rounded-full transition-all"><X size={24} /></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Outstanding Balance</p>
                       <h3 className="text-4xl font-black text-emerald-400">₹{selectedInvoice?.amount.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="absolute right-0 top-0 p-8 opacity-10"><DollarSign size={120} /></div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-4">
                       <PaymentMethodCard icon={<Banknote />} label="Cash" />
                       <PaymentMethodCard icon={<CreditCard />} label="Card" active />
                       <PaymentMethodCard icon={<Smartphone />} label="UPI / Digital" />
                    </div>
                 </div>

                 <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><ShieldCheck size={20} /></div>
                    <p className="text-xs text-blue-900 font-bold leading-relaxed">
                       Upon successful confirmation, a <strong>Release Pass (Gate Pass)</strong> will be automatically generated for vehicle {selectedInvoice?.vehicle}.
                    </p>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                 <button className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                    <Printer size={18} /> Print Proforma
                 </button>
                 <button 
                   onClick={() => setShowPaymentModal(false)}
                   className="w-full md:w-auto px-12 py-4 bg-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/40 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 text-white"
                 >
                    Confirm Collection <ArrowRight size={18} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PaymentMethodCard: React.FC<any> = ({ icon, label, active }) => (
  <div className={`p-6 rounded-[1.5rem] border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${active ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
     <div className="transition-transform group-hover:scale-110">{React.cloneElement(icon, { size: 28 })}</div>
     <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </div>
);

const AccountStatCard: React.FC<any> = ({ title, value, change, icon, color }) => (
  <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-600`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 tracking-[0.2em]">{title}</p>
    <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">{value}</h3>
    <p className="text-[10px] font-black uppercase tracking-widest">
      <span className={change.includes('+') ? 'text-emerald-500' : 'text-rose-500'}>{change}</span>
      <span className="text-slate-400 ml-1">Trend</span>
    </p>
  </div>
);

export default AccountsPage;
