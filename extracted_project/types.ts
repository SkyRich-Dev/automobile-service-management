
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  ADVISOR = 'ADVISOR',
  TECHNICIAN = 'TECHNICIAN',
  ACCOUNTS = 'ACCOUNTS',
  INVENTORY = 'INVENTORY',
  CUSTOMER = 'CUSTOMER'
}

export enum JobStatus {
  APPOINTED = 'APPOINTED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  QC_PENDING = 'QC_PENDING',
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
  DELIVERED = 'DELIVERED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
  avatar?: string;
  phone?: string;
  utilization?: number;
}

export interface JobCard {
  id: string;
  vehicleId: string;
  customerId: string;
  advisorId: string;
  technicianId?: string;
  status: JobStatus;
  estimatedAmount: number;
  actualAmount?: number;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  timeline: TimelineEvent[];
  versions: JobVersion[];
  exceptionHistory: ExceptionEvent[];
  slaDeadline?: string;
  aiSummary?: string;
  aiDiagnostics?: string[];
}

export interface JobVersion {
  versionId: number;
  timestamp: string;
  actor: string;
  changes: { field: string; old: any; new: any }[];
  totalAmount: number;
}

export interface Task {
  id: string;
  description: string;
  isCompleted: boolean;
  laborCost: number;
  partsUsed: PartUsage[];
  startTime?: string;
  endTime?: string;
  evidenceUrls?: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
}

export interface PartUsage {
  partId: string;
  quantity: number;
  price: number;
  isReserved: boolean;
}

export interface TimelineEvent {
  status: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  comment?: string;
  evidenceUrl?: string;
  type: 'STATUS_CHANGE' | 'TASK_LOG' | 'COMMUNICATION' | 'APPROVAL' | 'SYSTEM' | 'AI_INSIGHT';
}

export interface ExceptionEvent {
  id: string;
  reason: string;
  type: 'DELAY' | 'REJECTION' | 'TECHNICAL_BLOCK';
  timestamp: string;
  actor: string;
  resolved: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  vehicles: Vehicle[];
}

export interface Vehicle {
  id: string;
  vin: string;
  plateNumber: string;
  model: string;
  make: string;
  ownerId: string;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  price: number;
  category: string;
  reserved: number;
}
