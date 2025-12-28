import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Car,
  User,
  Filter,
  Search,
  Plus,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface Contract {
  id: number;
  contract_number: string;
  vehicle: number;
  vehicle_info: string;
  customer: number;
  customer_name: string;
  contract_type: string;
  provider: string;
  policy_number: string;
  start_date: string;
  end_date: string;
  coverage_amount: string;
  deductible: string;
  premium: string;
  services_included: string[];
  services_used: number;
  max_services: number | null;
  is_active: boolean;
  is_expired: boolean;
  days_remaining: number;
  created_at: string;
}

const CONTRACT_TYPE_COLORS: Record<string, string> = {
  WARRANTY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  EXTENDED_WARRANTY: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  AMC: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  SERVICE_PACKAGE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  INSURANCE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  WARRANTY: "Warranty",
  EXTENDED_WARRANTY: "Extended Warranty",
  AMC: "AMC",
  SERVICE_PACKAGE: "Service Package",
  INSURANCE: "Insurance",
};

export default function Contracts() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showExpiring, setShowExpiring] = useState(false);

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["contracts", typeFilter],
    queryFn: async () => {
      let url = "/api/contracts/";
      if (typeFilter !== "all") {
        url += `?contract_type=${typeFilter}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return res.json();
    },
  });

  const { data: expiringContracts = [] } = useQuery<Contract[]>({
    queryKey: ["contracts", "expiring_soon"],
    queryFn: async () => {
      const res = await fetch("/api/contracts/expiring_soon/?days=30", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filteredContracts = (showExpiring ? expiringContracts : contracts).filter((contract) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contract.customer_name?.toLowerCase().includes(query) ||
        contract.vehicle_info?.toLowerCase().includes(query) ||
        contract.contract_number?.toLowerCase().includes(query) ||
        contract.policy_number?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const activeContracts = contracts.filter((c) => c.is_active && !c.is_expired);
  const warrantyContracts = contracts.filter((c) => c.contract_type === "WARRANTY" || c.contract_type === "EXTENDED_WARRANTY");
  const amcContracts = contracts.filter((c) => c.contract_type === "AMC");

  return (
    <div className="flex h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Contracts & Warranties</h1>
              <p className="text-muted-foreground">Manage warranties, AMC, and service contracts</p>
            </div>
            <Button data-testid="button-new-contract">
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Active</p>
                    <p className="text-2xl font-bold" data-testid="text-total-active">{activeContracts.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Warranties</p>
                    <p className="text-2xl font-bold text-blue-600">{warrantyContracts.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">AMC Contracts</p>
                    <p className="text-2xl font-bold text-green-600">{amcContracts.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className={cn(expiringContracts.length > 0 && "border-orange-500")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-expiring-count">
                      {expiringContracts.length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48" data-testid="select-type-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Contract Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="WARRANTY">Warranty</SelectItem>
                <SelectItem value="EXTENDED_WARRANTY">Extended Warranty</SelectItem>
                <SelectItem value="AMC">AMC</SelectItem>
                <SelectItem value="SERVICE_PACKAGE">Service Package</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showExpiring ? "default" : "outline"}
              onClick={() => setShowExpiring(!showExpiring)}
              data-testid="button-show-expiring"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Expiring Soon
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No contracts found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContracts.map((contract) => (
                <Card
                  key={contract.id}
                  className={cn(
                    "overflow-visible",
                    contract.is_expired && "opacity-60",
                    contract.days_remaining <= 30 && contract.days_remaining > 0 && "border-orange-500"
                  )}
                  data-testid={`card-contract-${contract.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-medium">{contract.contract_number}</CardTitle>
                        <p className="text-xs text-muted-foreground">{contract.policy_number}</p>
                      </div>
                      <Badge className={cn("text-xs", CONTRACT_TYPE_COLORS[contract.contract_type])}>
                        {CONTRACT_TYPE_LABELS[contract.contract_type]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{contract.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{contract.vehicle_info}</span>
                    </div>
                    {contract.provider && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{contract.provider}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(contract.start_date), "MMM d, yyyy")} -{" "}
                        {format(new Date(contract.end_date), "MMM d, yyyy")}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Days Remaining</span>
                        <span className={cn(
                          "font-medium",
                          contract.is_expired && "text-red-600",
                          contract.days_remaining <= 30 && !contract.is_expired && "text-orange-600"
                        )}>
                          {contract.is_expired ? "Expired" : `${contract.days_remaining} days`}
                        </span>
                      </div>
                      {!contract.is_expired && (
                        <Progress
                          value={Math.min(100, (contract.days_remaining / 365) * 100)}
                          className={cn(
                            "h-1.5",
                            contract.days_remaining <= 30 && "[&>div]:bg-orange-500"
                          )}
                        />
                      )}
                    </div>

                    {contract.max_services && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Services Used</span>
                          <span className="font-medium">
                            {contract.services_used} / {contract.max_services}
                          </span>
                        </div>
                        <Progress
                          value={(contract.services_used / contract.max_services) * 100}
                          className="h-1.5"
                        />
                      </div>
                    )}

                    {parseFloat(contract.coverage_amount) > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Coverage</span>
                          <span className="font-medium">
                            ${parseFloat(contract.coverage_amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
