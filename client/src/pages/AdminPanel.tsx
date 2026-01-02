import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield,
  Key,
  CreditCard,
  Building2,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Plug,
  RefreshCw,
  Download,
  Upload,
  Zap,
  Database,
  Server,
  Plus,
  Pencil,
  Trash2,
  UserCog,
  Building,
  Calendar,
  ShieldCheck,
  Mail,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface License {
  id: number;
  license_key: string;
  license_type: string;
  status: string;
  expiry_date: string;
  max_branches: number;
  max_users: number;
  features: Record<string, boolean>;
  is_primary: boolean;
}

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  category: string;
  value_type: string;
}

interface IntegrationConfig {
  id: number;
  name: string;
  integration_type: string;
  is_enabled: boolean;
  config: Record<string, string>;
  last_sync_at?: string;
}

interface UserProfile {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
  };
  role: string;
  branch: number | null;
  branch_name: string | null;
  employee_id: string;
  phone: string;
  is_available: boolean;
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface ConfigOption {
  id: number;
  category: number;
  category_code: string;
  category_name: string;
  code: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  metadata: Record<string, unknown>;
  display_order: number;
  is_default: boolean;
  is_system: boolean;
  is_active: boolean;
}

interface ConfigCategory {
  id: number;
  code: string;
  name: string;
  description: string;
  module: string;
  display_order: number;
  is_system: boolean;
  is_active: boolean;
  options: ConfigOption[];
  options_count: number;
}

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  branch: number;
  branch_name?: string;
  manager: number | null;
  manager_name?: string;
  allowed_roles: string[];
  is_active: boolean;
}

interface RolePermission {
  id: number;
  role: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
}

interface AttendanceRecord {
  id: number;
  profile: number;
  profile_name?: string;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number | null;
  overtime_hours: number;
  notes: string | null;
}

interface EmailConfig {
  id: number;
  name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  test_status: string | null;
}

interface WhatsAppConfig {
  id: number;
  name: string;
  provider: string;
  phone_number: string;
  is_active: boolean;
  is_default: boolean;
  test_status: string | null;
}

interface EmployeeAssignment {
  id: number;
  profile: number;
  employee_name?: string;
  department: number;
  department_name?: string;
  designation: string | null;
  start_date: string;
  end_date: string | null;
  allocation_percentage: number;
  is_primary: boolean;
  is_active: boolean;
}

const USER_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CEO_OWNER', label: 'CEO / Owner' },
  { value: 'REGIONAL_MANAGER', label: 'Regional Manager' },
  { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
  { value: 'SERVICE_MANAGER', label: 'Service Manager' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'ACCOUNTS_MANAGER', label: 'Accounts Manager' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'SERVICE_ADVISOR', label: 'Service Advisor' },
  { value: 'SERVICE_ENGINEER', label: 'Service Engineer' },
  { value: 'SALES_EXECUTIVE', label: 'Sales Executive' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'TECHNICIAN', label: 'Technician' },
  { value: 'CRM_EXECUTIVE', label: 'CRM Executive' },
  { value: 'CUSTOMER', label: 'Customer' },
];

function UserManagementPanel() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'TECHNICIAN',
    branch: '',
    employee_id: '',
    phone: '',
  });

  const { data: profiles = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/profiles/"],
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches/"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/profiles/create_user/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/"] });
      toast({ title: "User created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/profiles/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/"] });
      toast({ title: "User updated successfully" });
      setEditingUser(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return apiRequest("POST", `/api/profiles/${id}/toggle_status/`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/"] });
      toast({ title: "User status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      role: 'TECHNICIAN',
      branch: '',
      employee_id: '',
      phone: '',
    });
  };

  const handleEdit = (profile: UserProfile) => {
    setEditingUser(profile);
    setFormData({
      username: profile.user.username,
      email: profile.user.email,
      first_name: profile.user.first_name,
      last_name: profile.user.last_name,
      password: '',
      role: profile.role,
      branch: profile.branch?.toString() || '',
      employee_id: profile.employee_id || '',
      phone: profile.phone || '',
    });
  };

  const handleSubmit = () => {
    if (editingUser) {
      updateProfileMutation.mutate({
        id: editingUser.id,
        data: {
          role: formData.role,
          branch: formData.branch,
          employee_id: formData.employee_id,
          phone: formData.phone,
        },
      });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-500/10 text-red-600 border-red-500/20',
      'CEO_OWNER': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'BRANCH_MANAGER': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'SERVICE_MANAGER': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      'TECHNICIAN': 'bg-green-500/10 text-green-600 border-green-500/20',
    };
    return colors[role] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  if (isLoading) {
    return <div className="space-y-4">Loading users...</div>;
  }

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCog className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription className="mt-1">
              Create, edit, and manage user accounts and permissions
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen || !!editingUser} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingUser(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-user">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {!editingUser && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="username"
                          data-testid="input-username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          data-testid="input-email"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          placeholder="First name"
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          placeholder="Last name"
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        data-testid="input-password"
                      />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select
                      value={formData.branch}
                      onValueChange={(value) => setFormData({ ...formData, branch: value })}
                    >
                      <SelectTrigger data-testid="select-branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      placeholder="EMP-001"
                      data-testid="input-employee-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createUserMutation.isPending || updateProfileMutation.isPending}
                  data-testid="button-submit-user"
                >
                  {createUserMutation.isPending || updateProfileMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <div className="grid grid-cols-6 gap-4 border-b bg-muted/30 p-3 text-sm font-medium">
            <div>User</div>
            <div>Role</div>
            <div>Branch</div>
            <div>Employee ID</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="grid grid-cols-6 gap-4 p-3 items-center text-sm"
                data-testid={`row-user-${profile.id}`}
              >
                <div>
                  <p className="font-medium">{profile.user.first_name} {profile.user.last_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.user.email}</p>
                </div>
                <div>
                  <Badge variant="outline" className={getRoleBadgeColor(profile.role)}>
                    {USER_ROLES.find(r => r.value === profile.role)?.label || profile.role}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  {profile.branch_name || '-'}
                </div>
                <div className="text-muted-foreground">
                  {profile.employee_id || '-'}
                </div>
                <div>
                  <Switch
                    checked={profile.user.is_active}
                    onCheckedChange={(checked) => 
                      toggleUserStatusMutation.mutate({ id: profile.id, is_active: checked })
                    }
                    data-testid={`switch-user-status-${profile.id}`}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(profile)}
                    data-testid={`button-edit-user-${profile.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {profiles.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No users found. Click "Add User" to create one.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentManagementPanel() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    branch: '',
    allowed_roles: [] as string[],
  });

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments/"],
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches/"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/departments/", {
        ...data,
        branch: parseInt(data.branch),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments/"] });
      toast({ title: "Department created successfully" });
      setIsCreateOpen(false);
      setFormData({ name: '', code: '', description: '', branch: '', allowed_roles: [] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create department", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/departments/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments/"] });
      toast({ title: "Department deleted" });
    },
  });

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5 text-primary" />
            Department Management
          </CardTitle>
          <CardDescription>Create and manage organizational departments</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-department">
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Service Department"
                    data-testid="input-department-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="SVC"
                    data-testid="input-department-code"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Vehicle service operations"
                  data-testid="input-department-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(val) => setFormData({ ...formData, branch: val })}
                >
                  <SelectTrigger data-testid="select-department-branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
                data-testid="button-submit-department"
              >
                {createMutation.isPending ? "Creating..." : "Create Department"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No departments found</TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id} data-testid={`row-department-${dept.id}`}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>{dept.branch_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={dept.is_active ? "default" : "secondary"}>
                      {dept.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(dept.id)}
                      data-testid={`button-delete-department-${dept.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const MODULES = [
  'dashboard', 'customers', 'vehicles', 'job_cards', 'appointments',
  'inventory', 'suppliers', 'invoices', 'payments', 'contracts',
  'crm', 'leads', 'tickets', 'campaigns', 'analytics', 'admin'
];

function RolePermissionPanel() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState('BRANCH_MANAGER');

  const { data: permissions = [], isLoading } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions/", selectedRole],
    queryFn: async () => {
      const res = await fetch(`/api/role-permissions/?role=${selectedRole}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { permissions: Partial<RolePermission>[] }) => {
      return apiRequest("POST", "/api/role-permissions/bulk_update/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions/"] });
      toast({ title: "Permissions updated" });
    },
  });

  const getPermissionForModule = (module: string) => {
    return permissions.find(p => p.module === module) || {
      role: selectedRole,
      module,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_approve: false,
      can_export: false,
    };
  };

  const handlePermissionChange = (module: string, field: keyof RolePermission, value: boolean) => {
    const perm = getPermissionForModule(module);
    const updated = { ...perm, [field]: value };
    updateMutation.mutate({
      permissions: [updated],
    });
  };

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Role Permissions Matrix
          </CardTitle>
          <CardDescription>Configure granular permissions for each role</CardDescription>
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48" data-testid="select-role-permission">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead className="text-center">View</TableHead>
              <TableHead className="text-center">Create</TableHead>
              <TableHead className="text-center">Edit</TableHead>
              <TableHead className="text-center">Delete</TableHead>
              <TableHead className="text-center">Approve</TableHead>
              <TableHead className="text-center">Export</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULES.map((module) => {
              const perm = getPermissionForModule(module);
              return (
                <TableRow key={module} data-testid={`row-permission-${module}`}>
                  <TableCell className="font-medium capitalize">{module.replace('_', ' ')}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm.can_view}
                      onCheckedChange={(checked) => handlePermissionChange(module, 'can_view', !!checked)}
                      data-testid={`checkbox-${module}-view`}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm.can_create}
                      onCheckedChange={(checked) => handlePermissionChange(module, 'can_create', !!checked)}
                      data-testid={`checkbox-${module}-create`}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm.can_edit}
                      onCheckedChange={(checked) => handlePermissionChange(module, 'can_edit', !!checked)}
                      data-testid={`checkbox-${module}-edit`}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm.can_delete}
                      onCheckedChange={(checked) => handlePermissionChange(module, 'can_delete', !!checked)}
                      data-testid={`checkbox-${module}-delete`}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm.can_approve}
                      onCheckedChange={(checked) => handlePermissionChange(module, 'can_approve', !!checked)}
                      data-testid={`checkbox-${module}-approve`}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm.can_export}
                      onCheckedChange={(checked) => handlePermissionChange(module, 'can_export', !!checked)}
                      data-testid={`checkbox-${module}-export`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const ATTENDANCE_STATUS = [
  { value: 'PRESENT', label: 'Present', color: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-500/10 text-red-600' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'LATE', label: 'Late', color: 'bg-orange-500/10 text-orange-600' },
  { value: 'ON_LEAVE', label: 'On Leave', color: 'bg-blue-500/10 text-blue-600' },
];

function AttendancePanel() {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const { data: attendanceRecords = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance-records/today/"],
  });

  const { data: profiles = [] } = useQuery<UserProfile[]>({
    queryKey: ["/api/profiles/"],
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/attendance-records/${id}/check_in/`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-records/today/"] });
      toast({ title: "Checked in successfully" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/attendance-records/${id}/check_out/`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-records/today/"] });
      toast({ title: "Checked out successfully" });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = ATTENDANCE_STATUS.find(s => s.value === status);
    return statusConfig ? (
      <Badge variant="outline" className={statusConfig.color}>{statusConfig.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
  };

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCheck className="h-5 w-5 text-primary" />
          Attendance Tracking
        </CardTitle>
        <CardDescription>Today's attendance records - {today}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Work Hours</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : attendanceRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No attendance records for today
                </TableCell>
              </TableRow>
            ) : (
              attendanceRecords.map((record) => (
                <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                  <TableCell className="font-medium">{record.profile_name || `Employee #${record.profile}`}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>{record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}</TableCell>
                  <TableCell>{record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}</TableCell>
                  <TableCell>{record.work_hours ? `${record.work_hours}h` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!record.check_in && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkInMutation.mutate(record.id)}
                          disabled={checkInMutation.isPending}
                          data-testid={`button-checkin-${record.id}`}
                        >
                          Check In
                        </Button>
                      )}
                      {record.check_in && !record.check_out && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkOutMutation.mutate(record.id)}
                          disabled={checkOutMutation.isPending}
                          data-testid={`button-checkout-${record.id}`}
                        >
                          Check Out
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EmployeeAllocationPanel() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    profile: '',
    department: '',
    designation: '',
    start_date: new Date().toISOString().split('T')[0],
    allocation_percentage: 100,
    is_primary: true,
  });

  const { data: assignments = [], isLoading } = useQuery<EmployeeAssignment[]>({
    queryKey: ["/api/employee-assignments/"],
  });

  const { data: profiles = [] } = useQuery<UserProfile[]>({
    queryKey: ["/api/profiles/"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments/"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/employee-assignments/", {
        ...data,
        profile: parseInt(data.profile),
        department: parseInt(data.department),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-assignments/"] });
      toast({ title: "Employee assigned successfully" });
      setIsCreateOpen(false);
      setFormData({
        profile: '',
        department: '',
        designation: '',
        start_date: new Date().toISOString().split('T')[0],
        allocation_percentage: 100,
        is_primary: true,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to assign employee", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/employee-assignments/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-assignments/"] });
      toast({ title: "Assignment removed" });
    },
  });

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Employee Allocation
          </CardTitle>
          <CardDescription>Assign employees to departments</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-assignment">
              <Plus className="mr-2 h-4 w-4" />
              Assign Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Employee to Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={formData.profile}
                  onValueChange={(val) => setFormData({ ...formData, profile: val })}
                >
                  <SelectTrigger data-testid="select-assignment-profile">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id.toString()}>
                        {profile.user.first_name} {profile.user.last_name} ({profile.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(val) => setFormData({ ...formData, department: val })}
                >
                  <SelectTrigger data-testid="select-assignment-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g., Senior Technician"
                    data-testid="input-assignment-designation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allocation %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.allocation_percentage}
                    onChange={(e) => setFormData({ ...formData, allocation_percentage: parseInt(e.target.value) || 100 })}
                    data-testid="input-allocation-percentage"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
                  data-testid="switch-is-primary"
                />
                <Label>Primary Assignment</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
                data-testid="button-submit-assignment"
              >
                {createMutation.isPending ? "Assigning..." : "Assign Employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead>Primary</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No employee assignments found</TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                  <TableCell className="font-medium">{assignment.employee_name || `Employee #${assignment.profile}`}</TableCell>
                  <TableCell>{assignment.department_name || `Dept #${assignment.department}`}</TableCell>
                  <TableCell>{assignment.designation || '-'}</TableCell>
                  <TableCell>{assignment.allocation_percentage}%</TableCell>
                  <TableCell>
                    <Badge variant={assignment.is_primary ? "default" : "secondary"}>
                      {assignment.is_primary ? "Primary" : "Secondary"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(assignment.id)}
                      data-testid={`button-delete-assignment-${assignment.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EmailIntegrationPanel() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Default',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_tls: true,
  });

  const { data: configs = [], isLoading } = useQuery<EmailConfig[]>({
    queryKey: ["/api/email-configurations/"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/email-configurations/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-configurations/"] });
      toast({ title: "Email configuration saved" });
      setIsCreateOpen(false);
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/email-configurations/${id}/test_connection/`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-configurations/"] });
      toast({ title: "Connection test successful" });
    },
    onError: () => {
      toast({ title: "Connection test failed", variant: "destructive" });
    },
  });

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Email / SMTP Configuration
          </CardTitle>
          <CardDescription>Configure email sending for notifications and alerts</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-email-config">
              <Plus className="mr-2 h-4 w-4" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Email Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={formData.smtp_host}
                    onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    data-testid="input-smtp-host"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                    data-testid="input-smtp-port"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={formData.smtp_username}
                    onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                    data-testid="input-smtp-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                    data-testid="input-smtp-password"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    placeholder="noreply@example.com"
                    data-testid="input-from-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={formData.from_name}
                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    placeholder="Service Center"
                    data-testid="input-from-name"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.use_tls}
                  onCheckedChange={(checked) => setFormData({ ...formData, use_tls: checked })}
                  data-testid="switch-use-tls"
                />
                <Label>Use TLS</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
                data-testid="button-save-email-config"
              >
                {createMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {configs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No email configurations. Click "Add Configuration" to set up email.
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 rounded-lg border"
                data-testid={`row-email-config-${config.id}`}
              >
                <div>
                  <p className="font-medium">{config.name}</p>
                  <p className="text-sm text-muted-foreground">{config.smtp_host}:{config.smtp_port}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={config.is_active ? "default" : "secondary"}>
                    {config.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className={
                    config.test_status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600' :
                    config.test_status === 'FAILED' ? 'bg-red-500/10 text-red-600' : ''
                  }>
                    {config.test_status || 'Not Tested'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testMutation.mutate(config.id)}
                    disabled={testMutation.isPending}
                    data-testid={`button-test-email-${config.id}`}
                  >
                    Test Connection
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WhatsAppIntegrationPanel() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Default',
    provider: 'twilio',
    api_key: '',
    api_secret: '',
    phone_number: '',
    account_sid: '',
  });

  const { data: configs = [], isLoading } = useQuery<WhatsAppConfig[]>({
    queryKey: ["/api/whatsapp-configurations/"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/whatsapp-configurations/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-configurations/"] });
      toast({ title: "WhatsApp configuration saved" });
      setIsCreateOpen(false);
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/whatsapp-configurations/${id}/test_connection/`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-configurations/"] });
      toast({ title: "Connection test successful" });
    },
    onError: () => {
      toast({ title: "Connection test failed", variant: "destructive" });
    },
  });

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            WhatsApp Integration
          </CardTitle>
          <CardDescription>Configure WhatsApp for customer notifications</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-whatsapp-config">
              <Plus className="mr-2 h-4 w-4" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>WhatsApp Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(val) => setFormData({ ...formData, provider: val })}
                >
                  <SelectTrigger data-testid="select-whatsapp-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="meta">Meta Business</SelectItem>
                    <SelectItem value="gupshup">Gupshup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    data-testid="input-whatsapp-api-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    data-testid="input-whatsapp-api-secret"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1234567890"
                  data-testid="input-whatsapp-phone"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
                data-testid="button-save-whatsapp-config"
              >
                {createMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {configs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No WhatsApp configurations. Click "Add Configuration" to set up WhatsApp.
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 rounded-lg border"
                data-testid={`row-whatsapp-config-${config.id}`}
              >
                <div>
                  <p className="font-medium">{config.name}</p>
                  <p className="text-sm text-muted-foreground">{config.provider} - {config.phone_number}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={config.is_active ? "default" : "secondary"}>
                    {config.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testMutation.mutate(config.id)}
                    disabled={testMutation.isPending}
                    data-testid={`button-test-whatsapp-${config.id}`}
                  >
                    Test Connection
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LicenseCard({ license }: { license: License | null }) {
  const daysRemaining = license?.expiry_date
    ? Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const usagePercent = 75;

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              License Information
            </CardTitle>
            <CardDescription className="mt-1">
              Manage your enterprise license and subscription
            </CardDescription>
          </div>
          <Badge
            variant={license?.status === "ACTIVE" ? "default" : "secondary"}
            className={cn(
              license?.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            )}
          >
            {license?.status || "No License"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {license ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Key className="h-4 w-4" />
                  License Type
                </div>
                <p className="mt-1 text-lg font-semibold">{license.license_type}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Max Branches
                </div>
                <p className="mt-1 text-lg font-semibold">{license.max_branches}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Max Users
                </div>
                <p className="mt-1 text-lg font-semibold">{license.max_users}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Days Remaining
                </div>
                <p className={cn(
                  "mt-1 text-lg font-semibold",
                  daysRemaining < 30 && "text-amber-500",
                  daysRemaining < 7 && "text-destructive"
                )}>
                  {daysRemaining > 0 ? daysRemaining : "Expired"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Usage</span>
                <span className="font-medium">{usagePercent}%</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-sm font-medium">Enabled Features</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(license.features || {}).map(([feature, enabled]) => (
                  <Badge
                    key={feature}
                    variant={enabled ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      enabled && "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {enabled && <CheckCircle className="mr-1 h-3 w-3" />}
                    {feature.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="mb-3 h-12 w-12 text-amber-500" />
            <h3 className="text-lg font-semibold">No Active License</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Please enter a valid license key to activate the system
            </p>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Enter license key" className="w-64" />
              <Button data-testid="button-activate-license">Activate</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IntegrationCard({
  integration,
  onToggle,
  onTest,
}: {
  integration: IntegrationConfig;
  onToggle: () => void;
  onTest: () => void;
}) {
  const icons: Record<string, typeof CreditCard> = {
    stripe: CreditCard,
    razorpay: CreditCard,
    tally: Database,
  };
  const Icon = icons[integration.integration_type] || Plug;

  return (
    <Card className="border-border/50 overflow-visible">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              integration.is_enabled ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                integration.is_enabled ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h4 className="font-medium">{integration.name}</h4>
              <p className="text-xs text-muted-foreground">
                {integration.last_sync_at
                  ? `Last sync: ${new Date(integration.last_sync_at).toLocaleDateString()}`
                  : "Not synced"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              data-testid={`button-test-${integration.integration_type}`}
            >
              Test Connection
            </Button>
            <Switch
              checked={integration.is_enabled}
              onCheckedChange={onToggle}
              data-testid={`switch-${integration.integration_type}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemHealthCard() {
  const healthStatus = [
    { name: "Database", status: "healthy", icon: Database },
    { name: "API Server", status: "healthy", icon: Server },
    { name: "Background Jobs", status: "healthy", icon: Zap },
  ];

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Server className="h-5 w-5 text-primary" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {healthStatus.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <Badge
                  variant="default"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Healthy
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigurationManagementPanel() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory | null>(null);
  const [editingOption, setEditingOption] = useState<ConfigOption | null>(null);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOption, setNewOption] = useState({
    code: "",
    label: "",
    description: "",
    color: "",
    icon: "",
    display_order: 0,
    is_default: false,
    is_active: true,
  });

  const { data: categories = [], isLoading } = useQuery<ConfigCategory[]>({
    queryKey: ["/api/config/categories/"],
  });

  const createOptionMutation = useMutation({
    mutationFn: async (data: { category: number } & typeof newOption) => {
      return apiRequest("POST", "/api/config/options/", data);
    },
    onSuccess: () => {
      toast({ title: "Option created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/config/categories/"] });
      setIsAddingOption(false);
      setNewOption({
        code: "",
        label: "",
        description: "",
        color: "",
        icon: "",
        display_order: 0,
        is_default: false,
        is_active: true,
      });
    },
    onError: () => {
      toast({ title: "Failed to create option", variant: "destructive" });
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ConfigOption> }) => {
      return apiRequest("PATCH", `/api/config/options/${id}/`, data);
    },
    onSuccess: () => {
      toast({ title: "Option updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/config/categories/"] });
      setEditingOption(null);
    },
    onError: () => {
      toast({ title: "Failed to update option", variant: "destructive" });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/config/options/${id}/`);
    },
    onSuccess: () => {
      toast({ title: "Option deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/config/categories/"] });
    },
    onError: () => {
      toast({ title: "Failed to delete option", variant: "destructive" });
    },
  });

  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/config/categories/seed_defaults/", {});
    },
    onSuccess: () => {
      toast({ title: "Default configurations seeded" });
      queryClient.invalidateQueries({ queryKey: ["/api/config/categories/"] });
    },
    onError: () => {
      toast({ title: "Failed to seed defaults", variant: "destructive" });
    },
  });

  const groupedCategories = categories.reduce((acc, cat) => {
    const module = cat.module || "OTHER";
    if (!acc[module]) acc[module] = [];
    acc[module].push(cat);
    return acc;
  }, {} as Record<string, ConfigCategory[]>);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Configuration Management
            </CardTitle>
            <CardDescription>
              Manage system-wide configuration options for all modules
            </CardDescription>
          </div>
          <Button
            onClick={() => seedDefaultsMutation.mutate()}
            disabled={seedDefaultsMutation.isPending}
            variant="outline"
            data-testid="button-seed-defaults"
          >
            {seedDefaultsMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Seed Defaults
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedCategories).map(([module, cats]) => (
            <div key={module}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{module}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cats.map((category) => (
                  <Card
                    key={category.id}
                    className={cn(
                      "cursor-pointer hover-elevate transition-colors border-border/50",
                      selectedCategory?.id === category.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`card-category-${category.code}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.code}</p>
                        </div>
                        <Badge variant="secondary">{category.options_count} options</Badge>
                      </div>
                      {category.is_system && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          System
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedCategory && (
        <Card className="border-border/50 overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4 flex-wrap">
            <div>
              <CardTitle className="text-lg">{selectedCategory.name}</CardTitle>
              <CardDescription>{selectedCategory.description || `Manage ${selectedCategory.name} options`}</CardDescription>
            </div>
            {!selectedCategory.is_system && (
              <Button
                onClick={() => setIsAddingOption(true)}
                size="sm"
                data-testid="button-add-option"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCategory.options.map((option) => (
                  <TableRow key={option.id} data-testid={`row-option-${option.id}`}>
                    <TableCell className="font-mono text-xs">{option.code}</TableCell>
                    <TableCell>{option.label}</TableCell>
                    <TableCell>
                      {option.color && (
                        <Badge className={option.color}>{option.label}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{option.display_order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={option.is_active}
                        onCheckedChange={(checked) =>
                          updateOptionMutation.mutate({
                            id: option.id,
                            data: { is_active: checked },
                          })
                        }
                        disabled={option.is_system}
                        data-testid={`switch-active-${option.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingOption(option)}
                          data-testid={`button-edit-option-${option.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!option.is_system && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteOptionMutation.mutate(option.id)}
                            className="text-destructive"
                            data-testid={`button-delete-option-${option.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddingOption} onOpenChange={setIsAddingOption}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Configuration Option</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="option-code">Code</Label>
              <Input
                id="option-code"
                value={newOption.code}
                onChange={(e) => setNewOption({ ...newOption, code: e.target.value.toUpperCase().replace(/\s/g, "_") })}
                placeholder="OPTION_CODE"
                data-testid="input-option-code"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="option-label">Label</Label>
              <Input
                id="option-label"
                value={newOption.label}
                onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                placeholder="Option Label"
                data-testid="input-option-label"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="option-color">Color Classes</Label>
              <Input
                id="option-color"
                value={newOption.color}
                onChange={(e) => setNewOption({ ...newOption, color: e.target.value })}
                placeholder="bg-blue-100 text-blue-800"
                data-testid="input-option-color"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="option-order">Display Order</Label>
              <Input
                id="option-order"
                type="number"
                value={newOption.display_order}
                onChange={(e) => setNewOption({ ...newOption, display_order: parseInt(e.target.value) || 0 })}
                data-testid="input-option-order"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="option-default"
                checked={newOption.is_default}
                onCheckedChange={(checked) => setNewOption({ ...newOption, is_default: checked as boolean })}
              />
              <Label htmlFor="option-default">Is Default</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingOption(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedCategory) {
                  createOptionMutation.mutate({ category: selectedCategory.id, ...newOption });
                }
              }}
              disabled={createOptionMutation.isPending || !newOption.code || !newOption.label}
              data-testid="button-save-option"
            >
              {createOptionMutation.isPending ? "Saving..." : "Save Option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingOption} onOpenChange={() => setEditingOption(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Configuration Option</DialogTitle>
          </DialogHeader>
          {editingOption && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Code</Label>
                <Input value={editingOption.code} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-label">Label</Label>
                <Input
                  id="edit-label"
                  value={editingOption.label}
                  onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })}
                  data-testid="input-edit-label"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Color Classes</Label>
                <Input
                  id="edit-color"
                  value={editingOption.color || ""}
                  onChange={(e) => setEditingOption({ ...editingOption, color: e.target.value })}
                  data-testid="input-edit-color"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-order">Display Order</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={editingOption.display_order}
                  onChange={(e) => setEditingOption({ ...editingOption, display_order: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-order"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOption(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingOption) {
                  updateOptionMutation.mutate({
                    id: editingOption.id,
                    data: {
                      label: editingOption.label,
                      color: editingOption.color,
                      display_order: editingOption.display_order,
                    },
                  });
                }
              }}
              disabled={updateOptionMutation.isPending}
              data-testid="button-update-option"
            >
              {updateOptionMutation.isPending ? "Updating..." : "Update Option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsForm({ settings }: { settings: SystemSetting[] }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    settings.forEach((s) => {
      initial[s.key] = s.value;
    });
    return initial;
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { settings: { key: string; value: string; category: string }[] }) => {
      return apiRequest("POST", "/api/system-settings/bulk_update/", data);
    },
    onSuccess: () => {
      toast({ title: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/"] });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const settingsArray = Object.entries(formData).map(([key, value]) => ({
      key,
      value,
      category: "general",
    }));
    updateMutation.mutate({ settings: settingsArray });
  };

  const settingFields = [
    { key: "company_name", label: "Company Name", type: "text" },
    { key: "gst_number", label: "GST Number", type: "text" },
    { key: "default_tax_rate", label: "Default Tax Rate (%)", type: "number" },
    { key: "currency_code", label: "Currency Code", type: "text" },
    { key: "timezone", label: "Timezone", type: "text" },
  ];

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          System Settings
        </CardTitle>
        <CardDescription>Configure global application settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {settingFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                value={formData[field.key] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                data-testid={`input-${field.key}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            data-testid="button-save-settings"
          >
            {updateMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentGatewaysPanel() {
  const { toast } = useToast();
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");

  const { data: stripeConfig } = useQuery({
    queryKey: ['/api/stripe/publishable-key'],
  });

  const { data: razorpayConfig, refetch: refetchRazorpay } = useQuery({
    queryKey: ['/api/razorpay/config'],
    retry: false,
  });

  const configureRazorpayMutation = useMutation({
    mutationFn: async (data: { keyId: string; keySecret: string }) => {
      const response = await apiRequest('POST', '/api/razorpay/configure', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Razorpay configured successfully" });
      refetchRazorpay();
      setRazorpayKeyId("");
      setRazorpayKeySecret("");
    },
    onError: (error: any) => {
      toast({ title: "Configuration failed", description: error.message, variant: "destructive" });
    },
  });

  const stripeConfigured = !!(stripeConfig as any)?.publishableKey;
  const razorpayConfigured = (razorpayConfig as any)?.configured;

  return (
    <div className="space-y-6">
      <Card className="border-border/50 overflow-visible">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Stripe
              </CardTitle>
              <CardDescription>Credit/Debit card payments via Stripe</CardDescription>
            </div>
            <Badge
              variant={stripeConfigured ? "default" : "secondary"}
              className={stripeConfigured ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
            >
              {stripeConfigured ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {stripeConfigured ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Stripe is configured via Replit integration. Webhook handling is automatic.
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Stripe is configured automatically via Replit integration.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-visible">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Razorpay
              </CardTitle>
              <CardDescription>UPI, Netbanking, and Wallet payments</CardDescription>
            </div>
            <Badge
              variant={razorpayConfigured ? "default" : "secondary"}
              className={razorpayConfigured ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
            >
              {razorpayConfigured ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {razorpayConfigured ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Razorpay is configured and ready to accept payments.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your Razorpay API credentials to enable UPI and Netbanking payments.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="razorpay_key_id">Key ID</Label>
                  <Input
                    id="razorpay_key_id"
                    type="text"
                    placeholder="rzp_live_xxxxx or rzp_test_xxxxx"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    data-testid="input-razorpay-key-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razorpay_key_secret">Key Secret</Label>
                  <Input
                    id="razorpay_key_secret"
                    type="password"
                    placeholder="Your secret key"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    data-testid="input-razorpay-key-secret"
                  />
                </div>
              </div>
              <Button
                onClick={() => configureRazorpayMutation.mutate({ keyId: razorpayKeyId, keySecret: razorpayKeySecret })}
                disabled={!razorpayKeyId || !razorpayKeySecret || configureRazorpayMutation.isPending}
                data-testid="button-configure-razorpay"
              >
                {configureRazorpayMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  "Configure Razorpay"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TallySyncPanel() {
  const { toast } = useToast();

  const syncInvoicesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tally-sync-jobs/sync_invoices/", {});
    },
    onSuccess: () => {
      toast({ title: "Invoice sync completed" });
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    },
  });

  const syncCustomersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tally-sync-jobs/sync_customers/", {});
    },
    onSuccess: () => {
      toast({ title: "Customer sync completed" });
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    },
  });

  return (
    <Card className="border-border/50 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5 text-primary" />
          Tally Integration
        </CardTitle>
        <CardDescription>
          Sync invoices and customers with Tally accounting software
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <h4 className="font-medium">Sync Invoices</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Export invoices to Tally format
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => syncInvoicesMutation.mutate()}
                disabled={syncInvoicesMutation.isPending}
                data-testid="button-sync-invoices"
              >
                {syncInvoicesMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Download className="mb-2 h-8 w-8 text-muted-foreground" />
              <h4 className="font-medium">Sync Customers</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Export customer ledgers to Tally
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => syncCustomersMutation.mutate()}
                disabled={syncCustomersMutation.isPending}
                data-testid="button-sync-customers"
              >
                {syncCustomersMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-8">
          <div className="skeleton mb-2 h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="space-y-6">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </main>
    </div>
  );
}

export default function AdminPanel() {
  const { toast } = useToast();

  const { data: license, isLoading: licenseLoading } = useQuery<License>({
    queryKey: ["/api/licenses/current/"],
  });

  const { data: settings = [], isLoading: settingsLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/system-settings/"],
  });

  const { data: integrations = [], isLoading: integrationsLoading } = useQuery<IntegrationConfig[]>({
    queryKey: ["/api/integrations/"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/integrations/${id}/toggle/`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/"] });
      toast({ title: "Integration status updated" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/integrations/${id}/test_connection/`, {});
    },
    onSuccess: () => {
      toast({ title: "Connection test successful" });
    },
    onError: () => {
      toast({ title: "Connection test failed", variant: "destructive" });
    },
  });

  if (licenseLoading || settingsLoading || integrationsLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin Control Panel</h1>
          <p className="mt-1 text-muted-foreground">
            Manage system settings, licenses, and integrations
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full max-w-4xl" data-testid="admin-tabs">
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
            <TabsTrigger value="allocation" data-testid="tab-allocation">Allocation</TabsTrigger>
            <TabsTrigger value="permissions" data-testid="tab-permissions">Permissions</TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
            <TabsTrigger value="configuration" data-testid="tab-configuration">Configuration</TabsTrigger>
            <TabsTrigger value="integrations" data-testid="tab-integrations">Integrations</TabsTrigger>
            <TabsTrigger value="license" data-testid="tab-license">License</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagementPanel />
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManagementPanel />
          </TabsContent>

          <TabsContent value="allocation">
            <EmployeeAllocationPanel />
          </TabsContent>

          <TabsContent value="permissions">
            <RolePermissionPanel />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendancePanel />
          </TabsContent>

          <TabsContent value="configuration">
            <ConfigurationManagementPanel />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <EmailIntegrationPanel />
            <WhatsAppIntegrationPanel />
            <PaymentGatewaysPanel />
            <TallySyncPanel />
          </TabsContent>

          <TabsContent value="license" className="space-y-6">
            <LicenseCard license={license || null} />
            <SystemHealthCard />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsForm settings={settings} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
