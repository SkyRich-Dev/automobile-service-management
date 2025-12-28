
import { UserRole, JobStatus, User, Customer, Part, JobCard } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Arjun Mehta', email: 'owner@autoserv.in', role: UserRole.OWNER, branchId: 'b1' },
  { id: 'u2', name: 'Priya Sharma', email: 'manager@autoserv.in', role: UserRole.MANAGER, branchId: 'b1' },
  { id: 'u3', name: 'Rahul Verma', email: 'advisor@autoserv.in', role: UserRole.ADVISOR, branchId: 'b1' },
  { id: 'u4', name: 'Suresh Kumar', email: 'tech@autoserv.in', role: UserRole.TECHNICIAN, branchId: 'b1', utilization: 88 },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Robert D\'Souza',
    phone: '+91 98765 43210',
    email: 'robert.dsouza@example.in',
    loyaltyPoints: 452,
    vehicles: [
      { id: 'v1', vin: 'VIN-9876-XJ01-992', plateNumber: 'MH-01-AB-1234', make: 'Toyota', model: 'Camry', ownerId: 'c1' }
    ]
  },
  {
    id: 'c2',
    name: 'Anjali Gupta',
    phone: '+91 91234 56789',
    email: 'anjali.g@example.in',
    loyaltyPoints: 120,
    vehicles: [
      { id: 'v2', vin: 'VIN-1234-AB02-111', plateNumber: 'KA-03-MG-7890', make: 'Honda', model: 'Civic', ownerId: 'c2' }
    ]
  }
];

export const MOCK_PARTS: Part[] = [
  { id: 'p1', name: 'Engine Oil 5W-30', sku: 'EO-5W30-01', stock: 45, minStock: 10, price: 3200.00, category: 'Consumables', reserved: 4 },
  { id: 'p2', name: 'Oil Filter', sku: 'OF-TY-001', stock: 2, minStock: 15, price: 850.50, category: 'Filters', reserved: 1 },
  { id: 'p3', name: 'Brake Pads Front', sku: 'BP-F-02', stock: 12, minStock: 5, price: 4500.00, category: 'Brakes', reserved: 0 },
];

export const MOCK_JOB_CARDS: JobCard[] = [
  {
    id: 'JC-2024-001',
    vehicleId: 'v1',
    customerId: 'c1',
    advisorId: 'u3',
    technicianId: 'u4',
    status: JobStatus.IN_PROGRESS,
    estimatedAmount: 18500.00,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
    slaDeadline: new Date(Date.now() + 3600000 * 4).toISOString(),
    tasks: [
      { 
        id: 't1', 
        description: 'Engine Oil Change', 
        isCompleted: true, 
        status: 'COMPLETED',
        laborCost: 1200, 
        startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
        endTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        partsUsed: [{ partId: 'p1', quantity: 1, price: 3200, isReserved: true }],
        evidenceUrls: ['https://picsum.photos/seed/oil1/400/300']
      },
      { 
        id: 't2', 
        description: 'General Inspection', 
        isCompleted: false, 
        status: 'IN_PROGRESS',
        laborCost: 2500, 
        partsUsed: [] 
      }
    ],
    timeline: [
      { status: 'Appointment Created', timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), actor: 'System', role: UserRole.OWNER, type: 'SYSTEM' },
      { status: 'Checked In', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), actor: 'Rahul Verma', role: UserRole.ADVISOR, type: 'STATUS_CHANGE', comment: 'Minor scratches on rear bumper.' },
      { status: 'Technician Assigned', timestamp: new Date(Date.now() - 3600000 * 23).toISOString(), actor: 'Priya Sharma', role: UserRole.MANAGER, type: 'TASK_LOG' },
      { status: 'Engine Oil Change Started', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), actor: 'Suresh Kumar', role: UserRole.TECHNICIAN, type: 'TASK_LOG' },
      { status: 'Engine Oil Change Completed', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), actor: 'Suresh Kumar', role: UserRole.TECHNICIAN, type: 'TASK_LOG', evidenceUrl: 'https://picsum.photos/seed/oil1/400/300' }
    ],
    versions: [
      { versionId: 1, timestamp: new Date(Date.now() - 3600000 * 23.5).toISOString(), actor: 'Rahul Verma', totalAmount: 15400, changes: [] },
      { versionId: 2, timestamp: new Date(Date.now() - 3600000 * 22).toISOString(), actor: 'Priya Sharma', totalAmount: 18500, changes: [{ field: 'Labor', old: 1800, new: 2500 }] }
    ],
    exceptionHistory: []
  }
];
