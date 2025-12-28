
import React, { useState } from 'react';
import { 
  Building, 
  Lock, 
  Bell, 
  ShieldCheck, 
  Zap,
  ChevronRight,
  Database,
  Globe,
  Mail,
  UserCheck,
  Smartphone,
  Server,
  Sparkles,
  Cpu,
  Shield,
  RefreshCcw,
  CheckCircle2,
  BrainCircuit,
  ExternalLink,
  /* Added missing FileText import */
  FileText
} from 'lucide-react';

const SettingsPage: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('INTEGRATIONS');

  const tabs = [
    { id: 'GENERAL', label: 'Company Info', icon: Building },
    { id: 'WORKFLOW', label: 'Service Governance', icon: UserCheck },
    { id: 'INTEGRATIONS', label: 'Ready Marketplace', icon: Zap },
    { id: 'ROLES', label: 'Access Controls', icon: Lock },
    { id: 'ALERTS', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">System Configuration</h1>
          <p className="text-slate-500 font-medium tracking-wide">Enterprise governance and modular service management.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">Export Settings</button>
           <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">Apply to Network</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-3 sticky top-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] transition-all rounded-[1.5rem] mb-2 ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/30 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
            <div className="mt-8 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Status</p>
               <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  All Clusters Healthy
               </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
           <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12 min-h-[600px]">
              {activeTab === 'INTEGRATIONS' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">AI & Model Marketplace</h3>
                         <p className="text-slate-500 text-sm font-medium mt-1">Deploy production-ready machine learning models to your workshop floor.</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                         <Cpu size={14} /> 2 Connected Modules
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Gemini Integration Model Card */}
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                         <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                               <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40">
                                  <Sparkles size={32} />
                               </div>
                               <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 backdrop-blur-md">Recommended</span>
                            </div>
                            <h4 className="text-xl font-black tracking-tight mb-2">Google Gemini AI</h4>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-10">Advanced LLM for smart technical summaries, predictive diagnostics, and automated customer communication.</p>
                            
                            <div className="space-y-4 mb-10">
                               <FeatureToggle active label="Predictive Diagnostics" />
                               <FeatureToggle label="Automated Customer Insights" />
                               <FeatureToggle active label="Anomaly Detection" />
                            </div>

                            <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-white/5">
                               Configure Model <ExternalLink size={14} />
                            </button>
                         </div>
                         <div className="absolute right-0 top-0 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                            <BrainCircuit size={200} />
                         </div>
                      </div>

                      {/* Generic Marketplace Card Placeholder */}
                      <div className="bg-slate-50 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-blue-300 transition-all">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 mb-6 group-hover:scale-110 transition-transform">
                            <Zap size={32} />
                         </div>
                         <h4 className="text-lg font-black text-slate-900 uppercase tracking-widest">Connect CRM Hub</h4>
                         <p className="text-slate-400 text-xs font-medium max-w-[200px] mt-2 mb-8 italic">Automate vehicle history syncing with external CRM platforms.</p>
                         <button className="px-8 py-3 bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                            Browse Adapters
                         </button>
                      </div>
                   </div>

                   <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
                      <div className="flex items-center gap-3 mb-8">
                         <Shield className="text-blue-600" size={24} />
                         <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Governance & Privacy</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Data Residency</p>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">AI processing occurs in restricted secure nodes. No customer personally identifiable information (PII) is transmitted to external models by default.</p>
                         </div>
                         <div className="space-y-4">
                            <button className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                               <FileText size={14} /> View Audit Logs
                            </button>
                            <button className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                               <ShieldCheck size={14} /> Data Processing Addendum
                            </button>
                         </div>
                      </div>
                   </section>
                </div>
              )}

              {activeTab === 'WORKFLOW' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                   <section>
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">SLA Thresholds</h3>
                         <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Global Policy</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <GovernanceInput label="Critical Service Limit" value="04:00" unit="Hours" />
                         <GovernanceInput label="Escalation Delay" value="15" unit="Minutes" />
                      </div>
                   </section>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const FeatureToggle: React.FC<{active?: boolean, label: string}> = ({ active, label }) => (
  <div className="flex items-center justify-between group">
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-slate-100' : 'text-slate-500'}`}>{label}</span>
    <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-indigo-500' : 'bg-slate-700'}`}>
       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-1 shadow-[0_0_8px_white]' : 'left-1'}`}></div>
    </div>
  </div>
);

const GovernanceInput: React.FC<any> = ({ label, value, unit }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
    <div className="flex items-center gap-4">
       <input type="text" defaultValue={value} className="flex-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 focus:ring-4 focus:ring-blue-100 outline-none transition-all" />
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">{unit}</span>
    </div>
  </div>
);

export default SettingsPage;
