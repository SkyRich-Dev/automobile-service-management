import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Database,
  Users,
  Car,
  Calendar,
  Wrench,
  Package,
  Truck,
  Shield,
  UserPlus,
  CheckCircle,
  Loader2,
  AlertCircle,
  Play,
} from "lucide-react";

interface SeedResult {
  module: string;
  status: "pending" | "loading" | "success" | "error";
  message?: string;
  count?: number;
}

const SAMPLE_CUSTOMERS = [
  { name: "Rajesh Kumar", phone: "9876543210", email: "rajesh.kumar@email.com", address: "123 MG Road, Mumbai" },
  { name: "Priya Sharma", phone: "9876543211", email: "priya.sharma@email.com", address: "456 Brigade Road, Bangalore" },
  { name: "Amit Patel", phone: "9876543212", email: "amit.patel@email.com", address: "789 FC Road, Pune" },
  { name: "Sunita Verma", phone: "9876543213", email: "sunita.verma@email.com", address: "321 Park Street, Kolkata" },
  { name: "Vikram Singh", phone: "9876543214", email: "vikram.singh@email.com", address: "654 Connaught Place, Delhi" },
  { name: "Meera Reddy", phone: "9876543215", email: "meera.reddy@email.com", address: "987 Jubilee Hills, Hyderabad" },
  { name: "Arjun Nair", phone: "9876543216", email: "arjun.nair@email.com", address: "147 Marine Drive, Kochi" },
  { name: "Kavitha Menon", phone: "9876543217", email: "kavitha.menon@email.com", address: "258 Anna Salai, Chennai" },
];

const SAMPLE_VEHICLES = [
  { make: "Maruti Suzuki", model: "Swift", year: 2022, plate_number: "MH01AB1234", vin: "VIN001234567890123", color: "White", fuel_type: "PETROL" },
  { make: "Hyundai", model: "Creta", year: 2023, plate_number: "KA02CD5678", vin: "VIN002345678901234", color: "Black", fuel_type: "DIESEL" },
  { make: "Tata", model: "Nexon", year: 2021, plate_number: "MH03EF9012", vin: "VIN003456789012345", color: "Blue", fuel_type: "PETROL" },
  { make: "Honda", model: "City", year: 2022, plate_number: "DL04GH3456", vin: "VIN004567890123456", color: "Silver", fuel_type: "PETROL" },
  { make: "Toyota", model: "Fortuner", year: 2023, plate_number: "TN05IJ7890", vin: "VIN005678901234567", color: "White", fuel_type: "DIESEL" },
  { make: "Mahindra", model: "XUV700", year: 2023, plate_number: "GJ06KL2345", vin: "VIN006789012345678", color: "Red", fuel_type: "DIESEL" },
  { make: "Kia", model: "Seltos", year: 2022, plate_number: "RJ07MN6789", vin: "VIN007890123456789", color: "Grey", fuel_type: "PETROL" },
  { make: "MG", model: "Hector", year: 2021, plate_number: "UP08OP0123", vin: "VIN008901234567890", color: "Black", fuel_type: "DIESEL" },
];

const SAMPLE_LEADS = [
  { name: "Rohit Mehta", phone: "9998887770", email: "rohit.m@email.com", source: "WALK_IN", interest: "Regular Service" },
  { name: "Anjali Gupta", phone: "9998887771", email: "anjali.g@email.com", source: "WEBSITE", interest: "AC Repair" },
  { name: "Suresh Iyer", phone: "9998887772", email: "suresh.i@email.com", source: "REFERRAL", interest: "Engine Overhaul" },
  { name: "Deepa Joshi", phone: "9998887773", email: "deepa.j@email.com", source: "SOCIAL_MEDIA", interest: "Body Work" },
  { name: "Karan Malhotra", phone: "9998887774", email: "karan.m@email.com", source: "PHONE", interest: "Insurance Claim" },
];

const SAMPLE_SUPPLIERS = [
  { name: "AutoParts India Ltd", contact_person: "Ramesh Agarwal", phone: "9111222333", email: "sales@autopartsindia.com", city: "Mumbai", state: "Maharashtra", gst_number: "27AABCT1234A1ZV", payment_terms: "NET_30" },
  { name: "Genuine Spares Co", contact_person: "Sunil Kapoor", phone: "9111222334", email: "orders@genuinespares.com", city: "Delhi", state: "Delhi", gst_number: "07AABCT2345B1ZV", payment_terms: "NET_15" },
  { name: "Premium Lubricants", contact_person: "Vijay Sharma", phone: "9111222335", email: "bulk@premiumlube.com", city: "Chennai", state: "Tamil Nadu", gst_number: "33AABCT3456C1ZV", payment_terms: "NET_45" },
  { name: "Tire World Distributors", contact_person: "Anand Puri", phone: "9111222336", email: "sales@tireworld.com", city: "Bangalore", state: "Karnataka", gst_number: "29AABCT4567D1ZV", payment_terms: "NET_30" },
];

const SAMPLE_PARTS = [
  { name: "Engine Oil 5W-30", sku: "OIL-5W30-001", category: "Lubricants", unit_price: "850", quantity: 100, reorder_level: 20 },
  { name: "Oil Filter", sku: "FILT-OIL-001", category: "Filters", unit_price: "350", quantity: 75, reorder_level: 15 },
  { name: "Air Filter", sku: "FILT-AIR-001", category: "Filters", unit_price: "450", quantity: 60, reorder_level: 15 },
  { name: "Brake Pads (Front)", sku: "BRK-PAD-F01", category: "Brakes", unit_price: "2200", quantity: 40, reorder_level: 10 },
  { name: "Brake Pads (Rear)", sku: "BRK-PAD-R01", category: "Brakes", unit_price: "1800", quantity: 40, reorder_level: 10 },
  { name: "Spark Plug (Set of 4)", sku: "SPK-PLG-004", category: "Ignition", unit_price: "1200", quantity: 50, reorder_level: 12 },
  { name: "Battery 12V 60Ah", sku: "BAT-12V-60", category: "Electrical", unit_price: "5500", quantity: 20, reorder_level: 5 },
  { name: "Coolant 5L", sku: "COOL-5L-001", category: "Fluids", unit_price: "650", quantity: 80, reorder_level: 20 },
  { name: "Wiper Blade Set", sku: "WIP-BLD-SET", category: "Accessories", unit_price: "550", quantity: 35, reorder_level: 10 },
  { name: "Headlight Bulb H4", sku: "BLB-H4-001", category: "Lighting", unit_price: "280", quantity: 60, reorder_level: 15 },
];

const SERVICE_TYPES = [
  "Regular Service",
  "Major Service",
  "AC Service",
  "Brake Service",
  "Engine Repair",
  "Transmission Service",
  "Electrical Repair",
  "Body Work",
  "Wheel Alignment",
  "Battery Replacement",
];

async function apiCall(url: string, method: string = "GET", body?: any) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API call failed: ${res.status}`);
  }
  return res.json();
}

export default function SampleDataLoader() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentModule, setCurrentModule] = useState("");
  const [results, setResults] = useState<SeedResult[]>([]);

  const updateResult = (module: string, status: SeedResult["status"], message?: string, count?: number) => {
    setResults(prev => {
      const existing = prev.find(r => r.module === module);
      if (existing) {
        return prev.map(r => r.module === module ? { ...r, status, message, count } : r);
      }
      return [...prev, { module, status, message, count }];
    });
  };

  const seedCustomers = async (): Promise<number[]> => {
    setCurrentModule("Customers");
    updateResult("Customers", "loading");
    const customerIds: number[] = [];
    
    for (const customer of SAMPLE_CUSTOMERS) {
      try {
        const result = await apiCall("/api/customers/", "POST", customer);
        customerIds.push(result.id);
      } catch (e: any) {
        console.log("Customer may exist:", e.message);
      }
    }
    
    updateResult("Customers", "success", `Created ${customerIds.length} customers`, customerIds.length);
    return customerIds;
  };

  const seedVehicles = async (customerIds: number[]): Promise<number[]> => {
    setCurrentModule("Vehicles");
    updateResult("Vehicles", "loading");
    const vehicleIds: number[] = [];
    
    for (let i = 0; i < SAMPLE_VEHICLES.length; i++) {
      const vehicle = SAMPLE_VEHICLES[i];
      const customerId = customerIds[i % customerIds.length];
      if (!customerId) continue;
      
      try {
        const result = await apiCall("/api/vehicles/", "POST", {
          ...vehicle,
          customer: customerId,
        });
        vehicleIds.push(result.id);
      } catch (e: any) {
        console.log("Vehicle may exist:", e.message);
      }
    }
    
    updateResult("Vehicles", "success", `Created ${vehicleIds.length} vehicles`, vehicleIds.length);
    return vehicleIds;
  };

  const seedLeads = async (): Promise<number[]> => {
    setCurrentModule("Leads");
    updateResult("Leads", "loading");
    const leadIds: number[] = [];
    
    for (const lead of SAMPLE_LEADS) {
      try {
        const result = await apiCall("/api/leads/", "POST", {
          ...lead,
          status: "NEW",
        });
        leadIds.push(result.id);
      } catch (e: any) {
        console.log("Lead creation issue:", e.message);
      }
    }
    
    updateResult("Leads", "success", `Created ${leadIds.length} leads`, leadIds.length);
    return leadIds;
  };

  const seedSuppliers = async (): Promise<number[]> => {
    setCurrentModule("Suppliers");
    updateResult("Suppliers", "loading");
    const supplierIds: number[] = [];
    
    for (const supplier of SAMPLE_SUPPLIERS) {
      try {
        const result = await apiCall("/api/suppliers/", "POST", {
          ...supplier,
          credit_limit: "100000",
        });
        supplierIds.push(result.id);
      } catch (e: any) {
        console.log("Supplier may exist:", e.message);
      }
    }
    
    updateResult("Suppliers", "success", `Created ${supplierIds.length} suppliers`, supplierIds.length);
    return supplierIds;
  };

  const seedParts = async (): Promise<number[]> => {
    setCurrentModule("Inventory Parts");
    updateResult("Inventory Parts", "loading");
    const partIds: number[] = [];
    
    for (const part of SAMPLE_PARTS) {
      try {
        const result = await apiCall("/api/parts/", "POST", part);
        partIds.push(result.id);
      } catch (e: any) {
        console.log("Part may exist:", e.message);
      }
    }
    
    updateResult("Inventory Parts", "success", `Created ${partIds.length} parts`, partIds.length);
    return partIds;
  };

  const seedAppointments = async (customerIds: number[], vehicleIds: number[]): Promise<number[]> => {
    setCurrentModule("Appointments");
    updateResult("Appointments", "loading");
    const appointmentIds: number[] = [];
    
    const today = new Date();
    const times = ["09:00", "10:30", "11:00", "14:00", "15:30", "16:00"];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      
      try {
        const result = await apiCall("/api/appointments/", "POST", {
          customer: customerIds[i % customerIds.length],
          vehicle: vehicleIds[i % vehicleIds.length],
          appointment_date: dateStr,
          appointment_time: times[i],
          service_type: SERVICE_TYPES[i % SERVICE_TYPES.length],
          notes: `Sample appointment for ${SERVICE_TYPES[i % SERVICE_TYPES.length]}`,
        });
        appointmentIds.push(result.id);
      } catch (e: any) {
        console.log("Appointment creation issue:", e.message);
      }
    }
    
    updateResult("Appointments", "success", `Created ${appointmentIds.length} appointments`, appointmentIds.length);
    return appointmentIds;
  };

  const seedJobCards = async (customerIds: number[], vehicleIds: number[]): Promise<number[]> => {
    setCurrentModule("Job Cards");
    updateResult("Job Cards", "loading");
    const jobCardIds: number[] = [];
    
    const stages = [
      "APPOINTMENT", "CHECK_IN", "INSPECTION", "JOB_CARD", "ESTIMATE",
      "APPROVAL", "EXECUTION", "QC", "BILLING", "DELIVERY", "COMPLETED"
    ];
    
    for (let i = 0; i < Math.min(11, customerIds.length); i++) {
      try {
        const result = await apiCall("/api/job-cards/", "POST", {
          customer: customerIds[i % customerIds.length],
          vehicle: vehicleIds[i % vehicleIds.length],
          service_type: SERVICE_TYPES[i % SERVICE_TYPES.length],
          customer_complaint: `Customer reports issues related to ${SERVICE_TYPES[i % SERVICE_TYPES.length]}`,
          estimated_amount: (1500 + i * 500).toString(),
          workflow_stage: "APPOINTMENT",
        });
        jobCardIds.push(result.id);
        
        const targetStage = stages[i % stages.length];
        const stageIndex = stages.indexOf(targetStage);
        
        for (let s = 1; s <= stageIndex; s++) {
          try {
            await apiCall(`/api/job-cards/${result.id}/transition/`, "POST", {
              target_stage: stages[s],
              notes: `Transitioning to ${stages[s]}`,
            });
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (e: any) {
            console.log(`Transition to ${stages[s]} failed:`, e.message);
            break;
          }
        }
      } catch (e: any) {
        console.log("Job card creation issue:", e.message);
      }
    }
    
    updateResult("Job Cards", "success", `Created ${jobCardIds.length} job cards at various stages`, jobCardIds.length);
    return jobCardIds;
  };

  const seedContracts = async (customerIds: number[], vehicleIds: number[]): Promise<number[]> => {
    setCurrentModule("Contracts");
    updateResult("Contracts", "loading");
    const contractIds: number[] = [];
    
    const contractTypes = ["WARRANTY", "EXTENDED_WARRANTY", "AMC", "SERVICE_PACKAGE", "INSURANCE"];
    const today = new Date();
    
    for (let i = 0; i < Math.min(5, customerIds.length); i++) {
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - (i * 2));
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      try {
        const result = await apiCall("/api/contracts/", "POST", {
          customer: customerIds[i],
          vehicle: vehicleIds[i % vehicleIds.length] || null,
          contract_type: contractTypes[i],
          provider: ["OEM Warranty", "Extended Care", "Premium AMC", "Service Plus", "Comprehensive Insurance"][i],
          policy_number: `POL-${2024}-${1000 + i}`,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          contract_value: ((i + 1) * 15000).toString(),
          billing_model: i % 2 === 0 ? "ONE_TIME" : "YEARLY",
          max_services: i === 2 ? 12 : null,
        });
        contractIds.push(result.id);
      } catch (e: any) {
        console.log("Contract creation issue:", e.message);
      }
    }
    
    updateResult("Contracts", "success", `Created ${contractIds.length} contracts`, contractIds.length);
    return contractIds;
  };

  const seedPurchaseOrders = async (supplierIds: number[]): Promise<number[]> => {
    setCurrentModule("Purchase Orders");
    updateResult("Purchase Orders", "loading");
    const poIds: number[] = [];
    
    for (let i = 0; i < Math.min(4, supplierIds.length); i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7 + i * 3);
      
      try {
        const result = await apiCall("/api/purchase-orders/", "POST", {
          supplier: supplierIds[i],
          expected_delivery: expectedDate.toISOString().split("T")[0],
          notes: `Sample PO for supplier ${i + 1}`,
        });
        poIds.push(result.id);
      } catch (e: any) {
        console.log("PO creation issue:", e.message);
      }
    }
    
    updateResult("Purchase Orders", "success", `Created ${poIds.length} purchase orders`, poIds.length);
    return poIds;
  };

  const runFullSeed = async () => {
    setIsLoading(true);
    setProgress(0);
    setResults([]);
    
    try {
      setProgress(5);
      const customerIds = await seedCustomers();
      
      setProgress(15);
      const vehicleIds = await seedVehicles(customerIds);
      
      setProgress(25);
      await seedLeads();
      
      setProgress(35);
      const supplierIds = await seedSuppliers();
      
      setProgress(45);
      await seedParts();
      
      setProgress(55);
      await seedAppointments(customerIds, vehicleIds);
      
      setProgress(70);
      await seedJobCards(customerIds, vehicleIds);
      
      setProgress(85);
      await seedContracts(customerIds, vehicleIds);
      
      setProgress(95);
      await seedPurchaseOrders(supplierIds);
      
      setProgress(100);
      setCurrentModule("Complete");
      
      queryClient.invalidateQueries();
      
      toast({
        title: "Sample data loaded successfully",
        description: "All modules have been populated with sample data",
      });
    } catch (error: any) {
      toast({
        title: "Error loading sample data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const moduleIcons: Record<string, any> = {
    "Customers": Users,
    "Vehicles": Car,
    "Leads": UserPlus,
    "Suppliers": Truck,
    "Inventory Parts": Package,
    "Appointments": Calendar,
    "Job Cards": Wrench,
    "Contracts": Shield,
    "Purchase Orders": Package,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Sample Data Loader</h1>
              <p className="text-muted-foreground">Load comprehensive sample data for testing and demonstration</p>
            </div>
            <Button
              onClick={runFullSeed}
              disabled={isLoading}
              size="lg"
              data-testid="button-load-data"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading Data...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Load All Sample Data
                </>
              )}
            </Button>
          </div>

          {isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Loading: {currentModule}</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { module: "Customers", desc: "8 sample customers with contact details", icon: Users },
              { module: "Vehicles", desc: "8 vehicles across different makes/models", icon: Car },
              { module: "Leads", desc: "5 leads at various stages", icon: UserPlus },
              { module: "Suppliers", desc: "4 suppliers with GST details", icon: Truck },
              { module: "Inventory Parts", desc: "10 parts across categories", icon: Package },
              { module: "Appointments", desc: "6 appointments over coming days", icon: Calendar },
              { module: "Job Cards", desc: "11 job cards at all workflow stages", icon: Wrench },
              { module: "Contracts", desc: "5 contracts of different types", icon: Shield },
              { module: "Purchase Orders", desc: "4 purchase orders", icon: Package },
            ].map(({ module, desc, icon: Icon }) => {
              const result = results.find(r => r.module === module);
              return (
                <Card key={module} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{module}</CardTitle>
                      </div>
                      {result && (
                        <Badge
                          variant={result.status === "success" ? "default" : result.status === "error" ? "destructive" : "secondary"}
                          className={result.status === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                        >
                          {result.status === "loading" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          {result.status === "success" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {result.status === "error" && <AlertCircle className="mr-1 h-3 w-3" />}
                          {result.status === "success" ? `${result.count} created` : result.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                    {result?.message && (
                      <p className="mt-2 text-xs text-muted-foreground">{result.message}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Loading Information
              </CardTitle>
              <CardDescription>
                Understanding the sample data loading process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">What gets created:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>8 customers with Indian names and addresses</li>
                    <li>8 vehicles (popular Indian car models)</li>
                    <li>5 leads from various sources</li>
                    <li>4 suppliers with GST numbers</li>
                    <li>10 inventory parts (oils, filters, brakes, etc.)</li>
                    <li>6 appointments scheduled over the week</li>
                    <li>11 job cards - one at each workflow stage</li>
                    <li>5 contracts (warranty, AMC, insurance, etc.)</li>
                    <li>4 purchase orders linked to suppliers</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Workflow stages covered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {["Appointment", "Check-in", "Inspection", "Job Card", "Estimate", "Approval", "Execution", "QC", "Billing", "Delivery", "Completed"].map(stage => (
                      <Badge key={stage} variant="secondary" className="text-xs">
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
