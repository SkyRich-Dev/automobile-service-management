import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Award,
  GraduationCap,
  DollarSign,
  Calendar,
  Clock,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  Briefcase,
  UserCheck,
  CalendarDays,
  Shield,
  BookOpen,
  RefreshCw,
} from "lucide-react";

interface Skill {
  id: number;
  name: string;
  code: string;
  category: string;
  description: string;
  is_certifiable: boolean;
  certification_required: boolean;
  max_level: number;
  is_active: boolean;
}

interface EmployeeSkill {
  id: number;
  employee: number;
  employee_name: string;
  skill: number;
  skill_name: string;
  skill_category: string;
  level: string;
  years_of_experience: number;
  approval_status: string;
  certification_number: string | null;
  certification_expiry: string | null;
  jobs_completed: number;
  average_rating: number;
}

interface Employee {
  id: number;
  profile: number;
  profile_name: string;
  department: string;
  designation: string;
  employment_type: string;
  joining_date: string;
  base_salary: number;
  is_active: boolean;
  skills: EmployeeSkill[];
}

interface TrainingProgram {
  id: number;
  name: string;
  code: string;
  description: string;
  training_type: string;
  skill: number | null;
  duration_hours: number;
  start_date: string;
  end_date: string;
  status: string;
  enrolled_count: number;
  max_participants: number;
}

interface LeaveRequest {
  id: number;
  employee_name: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: string;
}

interface SkillMatrix {
  skills_by_category: Record<string, Array<{ id: number; name: string; code: string }>>;
  skill_coverage: Array<{
    skill_id: number;
    skill_name: string;
    category: string;
    coverage: Array<{ level: string; count: number }>;
  }>;
  certification_expiry_alerts: Array<{
    employee_name: string;
    skill_name: string;
    expiry_date: string;
    days_until_expiry: number;
  }>;
}

interface ConfigOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
  is_default?: boolean;
}

interface ConfigData {
  [categoryCode: string]: {
    name: string;
    module: string;
    options: ConfigOption[];
  };
}

const FALLBACK_SKILL_CATEGORIES = [
  { value: "MECHANICAL", label: "Mechanical" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "ELECTRONICS", label: "Electronics & Diagnostics" },
  { value: "EV_HYBRID", label: "EV & Hybrid" },
  { value: "BODY_PAINT", label: "Body & Paint" },
  { value: "SOFT_SKILLS", label: "Soft Skills" },
];

const FALLBACK_SKILL_LEVELS = [
  { value: "BEGINNER", label: "Beginner", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  { value: "INTERMEDIATE", label: "Intermediate", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "ADVANCED", label: "Advanced", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "EXPERT", label: "Expert", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "MASTER", label: "Master", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
];

const FALLBACK_APPROVAL_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const FALLBACK_TRAINING_STATUS: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Planned", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  ONGOING: { label: "Ongoing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const FALLBACK_LEAVE_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

function getConfigOptions(config: ConfigData | undefined, category: string, fallback: ConfigOption[]): ConfigOption[] {
  return config?.[category]?.options || fallback;
}

const DEFAULT_STATUS_COLOR = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

function getStatusConfig(config: ConfigData | undefined, category: string, fallback: Record<string, { label: string; color: string }>): Record<string, { label: string; color: string }> {
  const options = config?.[category]?.options;
  if (!options) return fallback;
  
  return options.reduce((acc, opt) => {
    acc[opt.value] = { 
      label: opt.label, 
      color: opt.color || fallback[opt.value]?.color || DEFAULT_STATUS_COLOR 
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);
}

export default function HRMS() {
  const { toast } = useToast();
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  const getTabFromSearch = () => {
    const params = new URLSearchParams(search);
    return params.get("tab") || "overview";
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  
  useEffect(() => {
    const tab = getTabFromSearch();
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [search]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/hrms?tab=${tab}`, { replace: true });
  };
  const [newSkill, setNewSkill] = useState({
    name: "",
    code: "",
    category: "MECHANICAL",
    description: "",
    is_certifiable: false,
    certification_required: false,
    max_level: 5,
  });

  const { data: skills = [], isLoading: skillsLoading, refetch: refetchSkills } = useQuery<Skill[]>({
    queryKey: ["/api/hrms/skills/"],
  });

  const { data: employeeSkills = [], isLoading: empSkillsLoading } = useQuery<EmployeeSkill[]>({
    queryKey: ["/api/hrms/employee-skills/"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/hrms/employees/"],
  });

  const { data: trainingPrograms = [], isLoading: trainingLoading } = useQuery<TrainingProgram[]>({
    queryKey: ["/api/hrms/training-programs/"],
  });

  const { data: leaveRequests = [], isLoading: leaveLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/hrms/leave-requests/"],
  });

  const { data: skillMatrix, isLoading: matrixLoading } = useQuery<SkillMatrix>({
    queryKey: ["/api/hrms/skill-matrix/"],
  });

  const { data: configData } = useQuery<ConfigData>({
    queryKey: ["/api/config/categories/all_options/"],
    staleTime: 1000 * 60 * 10,
  });

  const SKILL_CATEGORIES = getConfigOptions(configData, "SKILL_CATEGORIES", FALLBACK_SKILL_CATEGORIES);
  const SKILL_LEVELS = getConfigOptions(configData, "SKILL_LEVELS", FALLBACK_SKILL_LEVELS);
  const APPROVAL_STATUS = getStatusConfig(configData, "APPROVAL_STATUS", FALLBACK_APPROVAL_STATUS);
  const TRAINING_STATUS = getStatusConfig(configData, "TRAINING_STATUS", FALLBACK_TRAINING_STATUS);
  const LEAVE_STATUS = getStatusConfig(configData, "LEAVE_STATUS", FALLBACK_LEAVE_STATUS);

  const createSkillMutation = useMutation({
    mutationFn: (data: typeof newSkill) => 
      apiRequest("POST", "/api/hrms/skills/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrms/skills/"] });
      toast({ title: "Skill created successfully" });
      setSkillDialogOpen(false);
      setNewSkill({
        name: "",
        code: "",
        category: "MECHANICAL",
        description: "",
        is_certifiable: false,
        certification_required: false,
        max_level: 5,
      });
    },
    onError: () => {
      toast({ title: "Failed to create skill", variant: "destructive" });
    },
  });

  const approveLeaveRequest = useMutation({
    mutationFn: (id: number) => 
      apiRequest("POST", `/api/hrms/leave-requests/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrms/leave-requests/"] });
      toast({ title: "Leave request approved" });
    },
  });

  const rejectLeaveRequest = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      apiRequest("POST", `/api/hrms/leave-requests/${id}/reject/`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrms/leave-requests/"] });
      toast({ title: "Leave request rejected" });
    },
  });

  const filteredSkills = selectedCategory === "all" 
    ? skills 
    : skills.filter(s => s.category === selectedCategory);

  const pendingSkillApprovals = employeeSkills.filter(es => es.approval_status === "PENDING");
  const expiringCertifications = skillMatrix?.certification_expiry_alerts || [];
  const activeTrainingCount = trainingPrograms.filter(t => t.status === "ONGOING").length;
  const pendingLeaveCount = leaveRequests.filter(l => l.status === "PENDING").length;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      MECHANICAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      ELECTRICAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      ELECTRONICS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      EV_HYBRID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      BODY_PAINT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      SOFT_SKILLS: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    };
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const getLevelBadge = (level: string) => {
    const levelConfig = SKILL_LEVELS.find(l => l.value === level);
    return levelConfig?.color || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">HRMS</h1>
              <p className="text-muted-foreground">
                Human Resource Management & Skill Tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  refetchSkills();
                  queryClient.invalidateQueries({ queryKey: ["/api/hrms/"] });
                }}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>
            <TabsTrigger value="employees" data-testid="tab-employees">Employees</TabsTrigger>
            <TabsTrigger value="training" data-testid="tab-training">Training</TabsTrigger>
            <TabsTrigger value="leave" data-testid="tab-leave">Leave</TabsTrigger>
            <TabsTrigger value="matrix" data-testid="tab-matrix">Skill Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-skills">{skills.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {skills.filter(s => s.is_active).length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-pending-approvals">
                    {pendingSkillApprovals.length}
                  </div>
                  <p className="text-xs text-muted-foreground">skill requests pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Active Training</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-training">
                    {activeTrainingCount}
                  </div>
                  <p className="text-xs text-muted-foreground">programs in progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-pending-leave">
                    {pendingLeaveCount}
                  </div>
                  <p className="text-xs text-muted-foreground">awaiting approval</p>
                </CardContent>
              </Card>
            </div>

            {expiringCertifications.length > 0 && (
              <Card className="border-amber-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Certification Expiry Alerts
                  </CardTitle>
                  <CardDescription>
                    Certifications expiring within 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Skill</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Days Left</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiringCertifications.map((cert, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{cert.employee_name}</TableCell>
                          <TableCell>{cert.skill_name}</TableCell>
                          <TableCell>{new Date(cert.expiry_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={cert.days_until_expiry <= 7 ? "destructive" : "outline"}>
                              {cert.days_until_expiry} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {pendingSkillApprovals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Pending Skill Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Skill</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSkillApprovals.slice(0, 5).map((es) => (
                        <TableRow key={es.id}>
                          <TableCell className="font-medium">{es.employee_name}</TableCell>
                          <TableCell>{es.skill_name}</TableCell>
                          <TableCell>
                            <Badge className={getLevelBadge(es.level)}>{es.level}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(es.skill_category)}>
                              {es.skill_category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48" data-testid="select-category">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {SKILL_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-skill">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Skill</DialogTitle>
                    <DialogDescription>
                      Create a new skill that can be assigned to employees
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="skill-name">Skill Name</Label>
                        <Input
                          id="skill-name"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                          placeholder="e.g., Engine Diagnostics"
                          data-testid="input-skill-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="skill-code">Code</Label>
                        <Input
                          id="skill-code"
                          value={newSkill.code}
                          onChange={(e) => setNewSkill({ ...newSkill, code: e.target.value })}
                          placeholder="e.g., ENG-DIAG"
                          data-testid="input-skill-code"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skill-category">Category</Label>
                      <Select
                        value={newSkill.category}
                        onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}
                      >
                        <SelectTrigger data-testid="select-skill-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SKILL_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skill-description">Description</Label>
                      <Textarea
                        id="skill-description"
                        value={newSkill.description}
                        onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                        placeholder="Describe the skill..."
                        data-testid="input-skill-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSkillDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createSkillMutation.mutate(newSkill)}
                      disabled={createSkillMutation.isPending}
                      data-testid="button-save-skill"
                    >
                      {createSkillMutation.isPending ? "Creating..." : "Create Skill"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillsLoading ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Loading skills...
                  </CardContent>
                </Card>
              ) : filteredSkills.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No skills found. Create your first skill to get started.
                  </CardContent>
                </Card>
              ) : (
                filteredSkills.map((skill) => (
                  <Card key={skill.id} data-testid={`card-skill-${skill.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{skill.name}</CardTitle>
                        <Badge className={getCategoryColor(skill.category)}>
                          {skill.category}
                        </Badge>
                      </div>
                      <CardDescription>{skill.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {skill.description || "No description provided"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {skill.is_certifiable && (
                          <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            Certifiable
                          </Badge>
                        )}
                        {skill.certification_required && (
                          <Badge variant="outline">
                            <Award className="h-3 w-3 mr-1" />
                            Cert Required
                          </Badge>
                        )}
                        <Badge variant="outline">
                          Max Level: {skill.max_level}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Skills</CardTitle>
                <CardDescription>
                  View and manage employee skill assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Skill</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Jobs Completed</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empSkillsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Loading employee skills...
                        </TableCell>
                      </TableRow>
                    ) : employeeSkills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No employee skills found
                        </TableCell>
                      </TableRow>
                    ) : (
                      employeeSkills.map((es) => (
                        <TableRow key={es.id} data-testid={`row-employee-skill-${es.id}`}>
                          <TableCell className="font-medium">{es.employee_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{es.skill_name}</span>
                              <Badge className={cn("w-fit mt-1", getCategoryColor(es.skill_category))}>
                                {es.skill_category}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getLevelBadge(es.level)}>{es.level}</Badge>
                          </TableCell>
                          <TableCell>{es.years_of_experience} years</TableCell>
                          <TableCell>{es.jobs_completed}</TableCell>
                          <TableCell>
                            {es.average_rating > 0 ? (
                              <div className="flex items-center gap-1">
                                <span>{es.average_rating.toFixed(1)}</span>
                                <span className="text-amber-500">★</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={APPROVAL_STATUS[es.approval_status as keyof typeof APPROVAL_STATUS]?.color}>
                              {APPROVAL_STATUS[es.approval_status as keyof typeof APPROVAL_STATUS]?.label || es.approval_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-medium">Training Programs</h3>
              <Button data-testid="button-add-training">
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingLoading ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Loading training programs...
                  </CardContent>
                </Card>
              ) : trainingPrograms.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No training programs found
                  </CardContent>
                </Card>
              ) : (
                trainingPrograms.map((program) => (
                  <Card key={program.id} data-testid={`card-training-${program.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <Badge className={TRAINING_STATUS[program.status as keyof typeof TRAINING_STATUS]?.color}>
                          {TRAINING_STATUS[program.status as keyof typeof TRAINING_STATUS]?.label || program.status}
                        </Badge>
                      </div>
                      <CardDescription>{program.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {program.description || "No description provided"}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span>{program.duration_hours} hours</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Enrolled</span>
                          <span>{program.enrolled_count} / {program.max_participants}</span>
                        </div>
                        <Progress 
                          value={(program.enrolled_count / program.max_participants) * 100} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Dates</span>
                          <span>
                            {new Date(program.start_date).toLocaleDateString()} - {new Date(program.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>
                  Manage employee leave requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Loading leave requests...
                        </TableCell>
                      </TableRow>
                    ) : leaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No leave requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests.map((leave) => (
                        <TableRow key={leave.id} data-testid={`row-leave-${leave.id}`}>
                          <TableCell className="font-medium">{leave.employee_name}</TableCell>
                          <TableCell>{leave.leave_type_name}</TableCell>
                          <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                          <TableCell>{leave.days_count}</TableCell>
                          <TableCell className="max-w-48 truncate">{leave.reason}</TableCell>
                          <TableCell>
                            <Badge className={LEAVE_STATUS[leave.status as keyof typeof LEAVE_STATUS]?.color}>
                              {LEAVE_STATUS[leave.status as keyof typeof LEAVE_STATUS]?.label || leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {leave.status === "PENDING" && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approveLeaveRequest.mutate(leave.id)}
                                  disabled={approveLeaveRequest.isPending}
                                  data-testid={`button-approve-leave-${leave.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectLeaveRequest.mutate({ id: leave.id, reason: "Rejected" })}
                                  disabled={rejectLeaveRequest.isPending}
                                  data-testid={`button-reject-leave-${leave.id}`}
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Skill Matrix
                </CardTitle>
                <CardDescription>
                  Overview of skill coverage across the organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matrixLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading skill matrix...
                  </div>
                ) : skillMatrix ? (
                  <div className="space-y-6">
                    {Object.entries(skillMatrix.skills_by_category).map(([category, categorySkills]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Badge className={getCategoryColor(category)}>{category}</Badge>
                          <span className="text-muted-foreground">({categorySkills.length} skills)</span>
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {categorySkills.map((skill) => {
                            const coverage = skillMatrix.skill_coverage.find(s => s.skill_id === skill.id);
                            const totalEmployees = coverage?.coverage.reduce((sum, c) => sum + c.count, 0) || 0;
                            
                            return (
                              <Card key={skill.id} className="p-3">
                                <div className="font-medium text-sm">{skill.name}</div>
                                <div className="text-xs text-muted-foreground mb-2">{skill.code}</div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {SKILL_LEVELS.map((level) => {
                                    const count = coverage?.coverage.find(c => c.level === level.value)?.count || 0;
                                    return (
                                      <Badge key={level.value} variant="outline" className="text-xs">
                                        {level.label.charAt(0)}: {count}
                                      </Badge>
                                    );
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Total: {totalEmployees} employees
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No skill data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}
