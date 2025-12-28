
import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  CreditCard, 
  MapPin, 
  ShieldCheck,
  Star
} from 'lucide-react';

const CustomerPortalPage: React.FC = () => {
  const { customerId } = useParams();

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      {/* Brand Header */}
      <div className="bg-slate-900 text-white py-8 px-6 text-center shadow-xl">
        <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold">A</div>
        <h1 className="text-xl font-bold">AutoServ Service Hub</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time Service Tracking Portal</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hello, Robert!</h2>
              <p className="text-sm text-slate-500">Your Toyota Camry is currently at Bay 04.</p>
            </div>
            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              IN PROGRESS
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            <PortalStep active done title="Checked In" time="09:00 AM" desc="Vehicle received and initial inspection completed." />
            <PortalStep active title="Repairing" time="11:15 AM" desc="Our technician Dave is currently performing the engine oil change." />
            <PortalStep title="Quality Check" desc="Final safety and cleanliness audit by the supervisor." />
            <PortalStep title="Ready for Pick-up" desc="You will receive a notification when your car is ready." />
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xs font-bold text-slate-700">Approve Quote</span>
          </button>
          <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <span className="text-xs font-bold text-slate-700">Chat Advisor</span>
          </button>
          <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <span className="text-xs font-bold text-slate-700">Pay Online</span>
          </button>
          <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <span className="text-xs font-bold text-slate-700">Locate Bay</span>
          </button>
        </div>

        {/* Tech Info */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
             <Star size={24} className="fill-amber-400 text-amber-400" />
           </div>
           <div>
              <p className="text-xs text-slate-500 font-medium">Assigned Technician</p>
              <p className="text-sm font-bold text-slate-900">Dave Smith (Expert Tech)</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const PortalStep: React.FC<any> = ({ title, time, desc, active, done }) => (
  <div className="relative pl-8">
    <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full border-4 z-10 flex items-center justify-center transition-all ${
      done ? 'bg-emerald-500 border-emerald-500 text-white' : 
      active ? 'bg-white border-blue-600 text-blue-600 animate-pulse' : 'bg-white border-slate-200 text-slate-200'
    }`}>
      {done ? <CheckCircle2 size={12} /> : active ? <Clock size={12} /> : null}
    </div>
    <div className="flex items-center justify-between mb-0.5">
      <h4 className={`font-bold text-sm ${active ? 'text-slate-900' : 'text-slate-400'}`}>{title}</h4>
      {time && <span className="text-[10px] font-bold text-slate-400 uppercase">{time}</span>}
    </div>
    <p className={`text-xs ${active ? 'text-slate-600' : 'text-slate-300'}`}>{desc}</p>
  </div>
);

export default CustomerPortalPage;
