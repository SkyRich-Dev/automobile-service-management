
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Car,
  CheckCircle,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import dayjs from 'dayjs';

const AppointmentPage: React.FC<{ user: any }> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const appointments = [
    { time: '09:00 AM', customer: 'Robert D\'Souza', vehicle: 'Toyota Camry', type: 'Full Service', status: 'CONFIRMED' },
    { time: '10:30 AM', customer: 'Sushant Singh', vehicle: 'Honda Civic', type: 'Oil Change', status: 'WAITING' },
    { time: '12:00 PM', customer: 'Karan Johar', vehicle: 'Tesla Model 3', type: 'Inspection', status: 'CONFIRMED' },
    { time: '02:30 PM', customer: 'Ananya Pandey', vehicle: 'BMW X5', type: 'Brake Check', status: 'IN_TRANSIT' },
  ];

  const handleCheckIn = (apt: any) => {
    navigate('/service/new', { state: { customer: apt.customer, vehicle: apt.vehicle } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase">Service Appointments</h1>
          <p className="text-slate-500">Manage daily schedules and vehicle arrivals.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">Booking Link</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900">March 2024</h3>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft size={16}/></button>
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronRight size={16}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {days.map(d => <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d.charAt(0)}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: 31}, (_, i) => (
                <button 
                  key={i} 
                  className={`aspect-square text-[10px] font-bold rounded flex items-center justify-center transition-all ${
                    i + 1 === 21 ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 rounded-xl p-6 text-white shadow-xl shadow-blue-500/10">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-4">Capacity Status</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Bay Utilization</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-blue-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-[85%]"></div>
                </div>
              </div>
              <p className="text-[10px] opacity-70 italic">* Based on 12 active service bays</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Today's Schedule <span className="text-slate-400 font-normal ml-2">21/03/2024</span></h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold shadow-sm">Day</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-500 rounded text-xs font-bold">Week</button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {appointments.map((apt, idx) => (
                <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 w-32 shrink-0">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{apt.time}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><User size={16}/></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{apt.customer}</p>
                        <p className="text-xs text-slate-500">Corporate Client</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Car size={16}/></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{apt.vehicle}</p>
                        <p className="text-xs text-slate-500">{apt.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                        apt.status === 'WAITING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCheckIn(apt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      <PlayCircle size={14} /> Check In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentPage;
