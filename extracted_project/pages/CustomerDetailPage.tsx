
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Car, 
  Wrench, 
  History, 
  MessageSquare, 
  Plus, 
  MoreVertical,
  Calendar,
  ShieldCheck,
  TrendingUp,
  FileText,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  Heart
} from 'lucide-react';
import { MOCK_CUSTOMERS, MOCK_JOB_CARDS } from '../mockData';
import { UserRole } from '../types';

const CustomerDetailPage: React.FC<{ user: any }> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = MOCK_CUSTOMERS.find(c => c.id === id) || MOCK_CUSTOMERS[0];
  const [activeTab, setActiveTab] = useState<'VEHICLES' | 'HISTORY' | 'LOGS'>('VEHICLES');

  // Filter job cards for this specific customer
  const customerHistory = MOCK_JOB_CARDS.filter(j => j.customerId === customer.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/crm')} 
            className="p-3 hover:bg-slate-200 rounded-2xl transition-all border border-transparent hover:border-slate-300 shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">{customer.name}</h1>
              <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                 Platinum Member
              </span>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
              Customer Reference: CU-9422-00 • Since Oct 2022
            </p>
          </div>
        </div>
        <div className="flex gap-3">
           <button className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">
              <Heart size={20} />
           </button>
           <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
              Initiate Communication
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-10">
              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-4">Contact Intelligence</h3>
                 <div className="space-y-4">
                    <ContactRow icon={<Phone size={14} />} label="Primary" value={customer.phone} />
                    <ContactRow icon={<Mail size={14} />} label="Email" value={customer.email} />
                    <ContactRow icon={<MapPin size={14} />} label="Geo" value="New York, NY" />
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-4">Loyalty Stats</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Points</p>
                       <p className="text-xl font-black text-slate-900">{customer.loyaltyPoints}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tier Value</p>
                       <p className="text-xl font-black text-emerald-600">$4.2k</p>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
                 <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="text-indigo-600" size={18} />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Active Warranty</span>
                 </div>
                 <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                    Extended Care Package (Gold) expires in <strong>240 Days</strong>.
                 </p>
              </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
           {/* Tab Navigation */}
           <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
              {['VEHICLES', 'HISTORY', 'LOGS'].map((tab: any) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-12 py-6 text-[11px] font-black uppercase tracking-widest transition-all relative shrink-0 ${
                    activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>
                  )}
                </button>
              ))}
           </div>

           <div className="min-h-[600px]">
              {activeTab === 'VEHICLES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                  {customer.vehicles.map(vehicle => (
                    <div key={vehicle.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm group hover:border-blue-500 transition-all relative overflow-hidden">
                       <div className="relative z-10">
                          <div className="flex items-start justify-between mb-8">
                             <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                <Car size={32} />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{vehicle.plateNumber}</span>
                          </div>
                          <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">{vehicle.make} {vehicle.model}</h4>
                          <p className="text-xs text-slate-400 font-bold mb-10">VIN: {vehicle.vin}</p>
                          
                          <div className="space-y-3 pt-6 border-t border-slate-50">
                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Last Service</span>
                                <span className="text-slate-900">12 Mar 2024</span>
                             </div>
                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Upcoming Service</span>
                                <span className="text-blue-600">May 2024 (Scheduled)</span>
                             </div>
                          </div>
                       </div>
                       <div className="absolute right-0 bottom-0 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                          <Wrench size={180} />
                       </div>
                    </div>
                  ))}
                  <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-10 flex flex-col items-center justify-center text-center group hover:border-blue-400 transition-all cursor-pointer">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                     </div>
                     <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Register Vehicle</h4>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Expand Asset Profile</p>
                  </div>
                </div>
              )}

              {activeTab === 'HISTORY' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                               <th className="px-10 py-6">Service Ref</th>
                               <th className="px-10 py-6">Operation Details</th>
                               <th className="px-10 py-6">Asset ID</th>
                               <th className="px-10 py-6">Revenue</th>
                               <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {customerHistory.map(job => (
                               <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-10 py-8">
                                     <span className="font-black text-blue-600 text-lg tracking-tighter">{job.id}</span>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(job.createdAt).toLocaleDateString()}</p>
                                  </td>
                                  <td className="px-10 py-8">
                                     <p className="text-sm font-black text-slate-900">Periodic Maintenance</p>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
                                     </div>
                                  </td>
                                  <td className="px-10 py-8 text-sm font-bold text-slate-600">ABC-1234</td>
                                  <td className="px-10 py-8 font-black text-slate-900">${job.estimatedAmount.toFixed(2)}</td>
                                  <td className="px-10 py-8 text-right">
                                     <button 
                                       onClick={() => navigate(`/service/job/${job.id}`)}
                                       className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-slate-100"
                                     >
                                        <ChevronRight size={18} />
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {activeTab === 'LOGS' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 space-y-8 animate-in fade-in duration-500">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Communication Audit</h3>
                      <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                         <FileText size={16} /> Export Audit Log
                      </button>
                   </div>
                   <div className="space-y-6">
                      <LogEntry 
                        type="WhatsApp" 
                        title="Quote Approval Sent" 
                        time="Mar 20, 04:22 PM" 
                        desc="Automated delivery of service estimate for JC-2024-001. Delivered & Read." 
                        status="Success"
                      />
                      <LogEntry 
                        type="Email" 
                        title="Marketing: Anniversary Offer" 
                        time="Mar 12, 10:00 AM" 
                        desc="Campaign 'Retention-NY-2024' sent to robert.b@example.com." 
                        status="Delivered"
                      />
                      <LogEntry 
                        type="System" 
                        title="Profile Tier Upgrade" 
                        time="Feb 15, 02:30 PM" 
                        desc="Customer moved from Gold to Platinum based on lifetime spending threshold." 
                        status="Automated"
                      />
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const ContactRow: React.FC<any> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
       {icon}
    </div>
    <div>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
       <p className="text-xs font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

const LogEntry: React.FC<any> = ({ type, title, time, desc, status }) => (
  <div className="flex gap-6 pb-6 border-b border-slate-50 last:border-0 last:pb-0 group">
    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all">
       {type === 'WhatsApp' ? <MessageSquare size={20} /> : type === 'Email' ? <Mail size={20} /> : <FileText size={20} />}
    </div>
    <div className="flex-1">
       <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{time}</span>
       </div>
       <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">{desc}</p>
       <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">
          {status}
       </span>
    </div>
  </div>
);

export default CustomerDetailPage;
