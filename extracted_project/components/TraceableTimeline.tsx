
import React from 'react';
import { TimelineEvent, UserRole } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  User as UserIcon, 
  FileText,
  ShieldCheck,
  Camera
} from 'lucide-react';

interface TraceableTimelineProps {
  events: TimelineEvent[];
}

const TraceableTimeline: React.FC<TraceableTimelineProps> = ({ events }) => {
  const getIcon = (type: string, status: string) => {
    if (status.includes('Completed') || status.includes('Ready')) return <CheckCircle2 size={14} className="text-white" />;
    if (status.includes('Delayed') || status.includes('Hold')) return <AlertCircle size={14} className="text-white" />;
    if (type === 'TASK_LOG') return <ShieldCheck size={14} className="text-white" />;
    if (type === 'COMMUNICATION') return <MessageCircle size={14} className="text-white" />;
    return <Clock size={14} className="text-white" />;
  };

  const getEventColor = (type: string, status: string) => {
    if (status.includes('Completed') || status.includes('Ready')) return 'bg-emerald-500 border-emerald-500';
    if (status.includes('Delayed') || status.includes('Hold')) return 'bg-rose-500 border-rose-500';
    if (type === 'TASK_LOG') return 'bg-blue-500 border-blue-500';
    if (type === 'APPROVAL') return 'bg-purple-500 border-purple-500';
    return 'bg-slate-400 border-slate-400';
  };

  return (
    <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
      {events.map((event, idx) => (
        <div key={idx} className="relative pl-10 group">
          <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full border-4 z-10 flex items-center justify-center transition-all shadow-sm ${getEventColor(event.type, event.status)}`}>
            {getIcon(event.type, event.status)}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-1 gap-2">
            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{event.status}</h4>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  {new Date(event.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
               </span>
               <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">
                 {event.role}
               </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-3 bg-white p-3 rounded-xl border border-slate-50 shadow-sm leading-relaxed">
            {event.comment || `Activity logged by ${event.actor}. Status changed to ${event.status}.`}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <UserIcon size={12} /> <span className="font-medium">{event.actor}</span>
            </div>
            {event.evidenceUrl && (
              <button className="flex items-center gap-1 text-blue-600 font-bold hover:underline">
                <Camera size={12} /> View Evidence
              </button>
            )}
            <div className="flex items-center gap-1">
              <FileText size={12} /> <span className="font-medium">System Ver: 1.0.4</span>
            </div>
          </div>

          {event.evidenceUrl && (
            <div className="mt-4 flex gap-2">
               <img src={event.evidenceUrl} className="w-32 h-24 rounded-xl object-cover border border-slate-200 shadow-sm hover:scale-105 transition-transform cursor-pointer" alt="Event Evidence" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TraceableTimeline;
