import { Sidebar } from "@/components/Sidebar";
import { useJobCard, useJobCardAIInsight, useCreateTask, useUpdateTask } from "@/hooks/use-job-cards";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckSquare, Square, Save } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function JobCardDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJobCard(Number(id));
  const generateInsight = useJobCardAIInsight();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const [newTaskDesc, setNewTaskDesc] = useState("");

  if (isLoading || !job) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleGenerateInsight = () => {
    generateInsight.mutate(job.id, {
      onSuccess: () => {
        toast({ title: "AI Insight Generated", description: "The insight has been added to the job card." });
        // In a real app, invalidating the query would refresh the data
        window.location.reload(); 
      }
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;
    
    createTask.mutate({
      jobCardId: job.id,
      description: newTaskDesc,
      status: "PENDING",
      isCompleted: false,
    }, {
      onSuccess: () => setNewTaskDesc("")
    });
  };

  const toggleTask = (taskId: number, currentStatus: boolean) => {
    updateTask.mutate({
      id: taskId,
      jobCardId: job.id,
      isCompleted: !currentStatus,
      status: !currentStatus ? "COMPLETED" : "PENDING"
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">Job Card #{job.id}</h1>
              <StatusBadge status={job.status} className="text-sm px-3 py-1" />
            </div>
            <p className="text-muted-foreground">Created on {format(new Date(job.createdAt || ''), 'PPP')}</p>
          </div>
          <Button 
            onClick={handleGenerateInsight} 
            disabled={generateInsight.isPending}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg border-none"
          >
            {generateInsight.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate AI Insight
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Vehicle & Customer Info */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-medium">{job.vehicle.make} {job.vehicle.model}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Plate</span>
                    <span className="font-medium">{job.vehicle.plateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VIN</span>
                    <span className="font-medium">{job.vehicle.vin}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{job.customer.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{job.customer.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{job.customer.email}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insight */}
            {job.aiSummary && (
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center text-indigo-900">
                    <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
                    AI Diagnostics Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-indigo-800 leading-relaxed">{job.aiSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Tasks */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Service Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg hover:bg-secondary/40 transition-colors">
                      <button onClick={() => toggleTask(task.id, task.isCompleted || false)}>
                        {task.isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      <span className={task.isCompleted ? "line-through text-muted-foreground" : ""}>
                        {task.description}
                      </span>
                    </div>
                  ))}
                  
                  <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
                    <Input 
                      placeholder="Add a new task..." 
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="bg-transparent"
                    />
                    <Button type="submit" size="sm" disabled={!newTaskDesc.trim()}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Sidebar */}
          <div className="col-span-1">
            <Card className="border-none shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l border-muted ml-2 space-y-6">
                  {job.timeline.map((event, idx) => (
                    <div key={idx} className="ml-6 relative">
                      <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      <p className="text-xs text-muted-foreground mb-1">
                        {event.timestamp ? format(new Date(event.timestamp), 'PP p') : 'Unknown date'}
                      </p>
                      <h4 className="font-semibold text-sm">{event.type.replace('_', ' ')}</h4>
                      {event.status && <p className="text-sm mt-1 text-muted-foreground">Status: {event.status}</p>}
                      {event.comment && <p className="text-sm mt-1 bg-muted p-2 rounded italic">"{event.comment}"</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
