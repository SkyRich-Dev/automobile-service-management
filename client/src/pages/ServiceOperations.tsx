import { Sidebar } from "@/components/Sidebar";
import { useJobCards, useUpdateJobCard } from "@/hooks/use-job-cards";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { CreateJobCardDialog } from "@/components/CreateJobCardDialog";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

const COLUMNS = [
  { id: "APPOINTED", label: "Appointed" },
  { id: "CHECKED_IN", label: "Checked In" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "QC_PENDING", label: "QC Pending" },
  { id: "READY_FOR_DELIVERY", label: "Ready" },
];

export default function ServiceOperations() {
  const { data: jobCards, isLoading } = useJobCards();
  const { user } = useAuth();
  const updateJobCard = useUpdateJobCard();

  // Handle Drag & Drop (simplified for this iteration - just render columns)
  // Real D&D would require dnd-kit or react-beautiful-dnd

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-x-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Operations</h1>
            <p className="text-muted-foreground mt-1">Manage service workflow and job cards.</p>
          </div>
          <CreateJobCardDialog />
        </div>

        <div className="flex gap-6 pb-8 min-w-max">
          {COLUMNS.map((column) => {
            const jobsInColumn = jobCards?.filter(j => j.status === column.id) || [];
            
            return (
              <div key={column.id} className="w-80 flex-shrink-0">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    {column.label}
                  </h3>
                  <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full">
                    {jobsInColumn.length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {jobsInColumn.map((job) => (
                    <Link key={job.id} href={`/job-cards/${job.id}`}>
                      <div className="group cursor-pointer">
                        <Card className="hover-card-effect border-none shadow-sm transition-all">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-xs font-mono text-muted-foreground">#{job.id}</span>
                              {job.slaDeadline && new Date(job.slaDeadline) < new Date() && (
                                <AlertCircle className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                            
                            <h4 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                              {job.vehicle.make} {job.vehicle.model}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">{job.customer.name}</p>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                              <span>{formatDistanceToNow(new Date(job.createdAt || ''), { addSuffix: true })}</span>
                              <span className="font-medium text-foreground">${job.estimatedAmount}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </Link>
                  ))}
                  
                  {jobsInColumn.length === 0 && (
                    <div className="h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-sm text-muted-foreground bg-muted/20">
                      No jobs
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
