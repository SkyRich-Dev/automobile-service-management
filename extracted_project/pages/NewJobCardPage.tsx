
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  User, 
  Car, 
  CheckCircle2, 
  Camera, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

const NewJobCardPage: React.FC<{ user: any }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentData = location.state as { customer?: string; vehicle?: string } | null;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: appointmentData?.customer || '',
    plateNumber: appointmentData?.vehicle || '',
    odometer: '',
    fuelLevel: '50',
    complaints: '',
    serviceType: 'PERIODIC'
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/service')} className="p-2 hover:bg-slate-200 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Check-In</h1>
          <p className="text-sm text-slate-500">Create a new job card and record vehicle condition.</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between px-8 py-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        {[
          { num: 1, label: 'Identify' },
          { num: 2, label: 'Condition' },
          { num: 3, label: 'Service' },
          { num: 4, label: 'Confirm' }
        ].map((s) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                step === s.num ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 
                step > s.num ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-400'
              }`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step === s.num ? 'text-blue-600' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {s.num < 4 && <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 overflow-hidden min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="space-y-6 flex-1 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="text-blue-500" size={20} /> Customer & Vehicle Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    placeholder="Search Name or Phone..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Vehicle Plate Number</label>
                <input 
                  type="text" 
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                  placeholder="e.g. MH-01-AB-1234" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
            {formData.plateNumber && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-2">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                  <Car size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Recognized Asset: Toyota Camry (Verified)</p>
                  <p className="text-xs text-blue-700">Service Advisor: Rahul Verma | Last Service: 15/01/2024</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 flex-1 animate-in slide-in-from-right duration-300">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Camera className="text-blue-500" size={20} /> Inspection & Inventory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Odometer (KM)</label>
                <input type="number" placeholder="45230" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Fuel Level (%)</label>
                <input type="range" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">External Condition Photos (Mandatory)</label>
              <div className="grid grid-cols-3 gap-4">
                {['FRONT', 'REAR', 'SIDES'].map(side => (
                  <div key={side} className="aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer group">
                    <Camera size={24} className="group-hover:text-blue-500 transition-colors" />
                    <span className="text-[10px] font-bold mt-1 uppercase">{side}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 flex-1 animate-in slide-in-from-right duration-300">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="text-blue-500" size={20} /> Service Selection
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Primary Complaints</label>
                <textarea rows={3} placeholder="Describe customer issues..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Standard Packages</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Essential', 'Periodic', 'Premium'].map((pkg) => (
                    <div key={pkg} className="p-4 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                      <p className="font-bold text-slate-900 group-hover:text-blue-700">{pkg} Service</p>
                      <p className="text-xs text-slate-500">12 Point Check-up</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 flex-1 text-center animate-in zoom-in duration-300 py-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Confirm Generation</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Review summary before generating JC-2024-X and notifying customer via WhatsApp.</p>
            <div className="bg-slate-50 p-8 rounded-3xl text-left max-w-md mx-auto mt-6 border border-slate-100 space-y-3">
               <SummaryItem label="Customer" val={formData.customerName || 'N/A'} />
               <SummaryItem label="Asset" val={formData.plateNumber || 'N/A'} />
               <SummaryItem label="Type" val="Periodic Maintenance" />
               <SummaryItem label="Estimate" val="₹18,500.00" highlight />
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={step === 1 ? () => navigate('/service') : prevStep}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button 
            onClick={step === 4 ? () => navigate('/service/job/JC-2024-001') : nextStep}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
          >
            {step === 4 ? 'Generate & Notify' : 'Continue'}
            <ArrowLeft className="rotate-180" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SummaryItem: React.FC<any> = ({ label, val, highlight }) => (
  <div className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-black ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>{val}</span>
  </div>
);

export default NewJobCardPage;
