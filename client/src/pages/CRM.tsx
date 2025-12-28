import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useCustomers, useCreateCustomer, useCreateVehicle } from "@/hooks/use-crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Mail, Phone, Users, Star, Loader2, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mb-6">
          <div className="skeleton mb-2 h-8 w-32" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function CRM() {
  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const createVehicle = useCreateVehicle();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    loyalty_points: 0,
    address: "",
    notes: "",
  });
  const [vehicleData, setVehicleData] = useState({
    plate_number: "",
    make: "",
    model: "",
    vin: "",
    year: "",
    color: "",
    vehicle_type: "CAR",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const type = (e.target as HTMLInputElement).type;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleVehicleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer.mutate(formData, {
      onSuccess: (newCustomer) => {
        if (vehicleData.plate_number && vehicleData.model) {
          createVehicle.mutate({
            customer: newCustomer.id,
            plate_number: vehicleData.plate_number,
            make: vehicleData.make || "Unknown",
            model: vehicleData.model,
            vin: vehicleData.vin || `VIN-${Date.now()}`,
            year: vehicleData.year ? parseInt(vehicleData.year) : null,
            color: vehicleData.color || null,
          }, {
            onSuccess: () => {
              toast({ title: "Customer and vehicle added successfully" });
            },
            onError: () => {
              toast({ title: "Customer added but failed to add vehicle", variant: "destructive" });
            }
          });
        } else {
          toast({ title: "Customer added successfully" });
        }
        setOpen(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          loyalty_points: 0,
          address: "",
          notes: "",
        });
        setVehicleData({
          plate_number: "",
          make: "",
          model: "",
          vin: "",
          year: "",
          color: "",
          vehicle_type: "CAR",
        });
      },
      onError: () => {
        toast({ title: "Failed to create customer", variant: "destructive" });
      }
    });
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !vehicleData.plate_number || !vehicleData.model) {
      toast({ title: "Please fill in vehicle number and model", variant: "destructive" });
      return;
    }
    createVehicle.mutate({
      customer: selectedCustomer.id,
      plate_number: vehicleData.plate_number,
      make: vehicleData.make || "Unknown",
      model: vehicleData.model,
      vin: vehicleData.vin || `VIN-${Date.now()}`,
      year: vehicleData.year ? parseInt(vehicleData.year) : null,
      color: vehicleData.color || null,
    }, {
      onSuccess: () => {
        toast({ title: "Vehicle added successfully" });
        setVehicleDialogOpen(false);
        setSelectedCustomer(null);
        setVehicleData({
          plate_number: "",
          make: "",
          model: "",
          vin: "",
          year: "",
          color: "",
          vehicle_type: "CAR",
        });
      },
      onError: () => {
        toast({ title: "Failed to add vehicle", variant: "destructive" });
      }
    });
  };

  const openAddVehicleDialog = (customer: { id: number; name: string }) => {
    setSelectedCustomer(customer);
    setVehicleDialogOpen(true);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-crm">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage customer relationships and data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {customers?.length || 0} Customers
            </Badge>
            <Button onClick={() => setOpen(true)} className="gap-2" data-testid="button-add-customer">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers?.map((customer) => (
            <Card
              key={customer.id}
              className="card-hover border-border/50"
              data-testid={`card-customer-${customer.id}`}
            >
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-lg font-semibold text-white">
                      {customer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{customer.name}</h3>
                    <Badge
                      variant="outline"
                      className="mt-1 gap-1 text-[10px] badge-info"
                    >
                      <Star className="h-2.5 w-2.5" />
                      {customer.loyalty_points} Points
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.vehicles && customer.vehicles.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Car className="h-4 w-4" />
                      <span className="truncate">
                        {customer.vehicles[0].plate_number} - {customer.vehicles[0].make} {customer.vehicles[0].model}
                      </span>
                      {customer.vehicles.length > 1 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{customer.vehicles.length - 1}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-sm text-muted-foreground"
                      onClick={() => openAddVehicleDialog({ id: customer.id, name: customer.name })}
                      data-testid={`button-add-vehicle-${customer.id}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Vehicle
                    </Button>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openAddVehicleDialog({ id: customer.id, name: customer.name })}
                    data-testid={`button-add-another-vehicle-${customer.id}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Vehicle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!customers || customers.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No customers yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setOpen(true)}
              >
                Add your first customer
              </Button>
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Add customer details and their vehicle information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Customer name"
                  required
                  data-testid="input-customer-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    required
                    data-testid="input-customer-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    required
                    data-testid="input-customer-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  data-testid="input-customer-address"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Vehicle Details</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plate_number">Vehicle Number</Label>
                    <Input
                      id="plate_number"
                      name="plate_number"
                      value={vehicleData.plate_number}
                      onChange={handleVehicleChange}
                      placeholder="ABC-1234"
                      data-testid="input-vehicle-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Vehicle Model</Label>
                    <Input
                      id="model"
                      name="model"
                      value={vehicleData.model}
                      onChange={handleVehicleChange}
                      placeholder="Civic, Corolla, etc."
                      data-testid="input-vehicle-model"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make / Brand</Label>
                    <Input
                      id="make"
                      name="make"
                      value={vehicleData.make}
                      onChange={handleVehicleChange}
                      placeholder="Honda, Toyota, etc."
                      data-testid="input-vehicle-make"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      value={vehicleData.year}
                      onChange={handleVehicleChange}
                      placeholder="2024"
                      data-testid="input-vehicle-year"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      name="color"
                      value={vehicleData.color}
                      onChange={handleVehicleChange}
                      placeholder="Red, Blue, etc."
                      data-testid="input-vehicle-color"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN (optional)</Label>
                    <Input
                      id="vin"
                      name="vin"
                      value={vehicleData.vin}
                      onChange={handleVehicleChange}
                      placeholder="Vehicle identification number"
                      data-testid="input-vehicle-vin"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes..."
                  rows={2}
                  data-testid="input-customer-notes"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createCustomer.isPending || createVehicle.isPending} data-testid="button-save-customer">
                  {(createCustomer.isPending || createVehicle.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Customer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={vehicleDialogOpen} onOpenChange={(open) => { setVehicleDialogOpen(open); if (!open) setSelectedCustomer(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Vehicle</DialogTitle>
              <DialogDescription>
                Add a new vehicle for {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_plate_number">Vehicle Number</Label>
                  <Input
                    id="new_plate_number"
                    name="plate_number"
                    value={vehicleData.plate_number}
                    onChange={handleVehicleChange}
                    placeholder="ABC-1234"
                    required
                    data-testid="input-new-vehicle-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_model">Model</Label>
                  <Input
                    id="new_model"
                    name="model"
                    value={vehicleData.model}
                    onChange={handleVehicleChange}
                    placeholder="Civic, Corolla"
                    required
                    data-testid="input-new-vehicle-model"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_make">Make / Brand</Label>
                  <Input
                    id="new_make"
                    name="make"
                    value={vehicleData.make}
                    onChange={handleVehicleChange}
                    placeholder="Honda, Toyota"
                    data-testid="input-new-vehicle-make"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_year">Year</Label>
                  <Input
                    id="new_year"
                    name="year"
                    type="number"
                    value={vehicleData.year}
                    onChange={handleVehicleChange}
                    placeholder="2024"
                    data-testid="input-new-vehicle-year"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_color">Color</Label>
                  <Input
                    id="new_color"
                    name="color"
                    value={vehicleData.color}
                    onChange={handleVehicleChange}
                    placeholder="Red, Blue"
                    data-testid="input-new-vehicle-color"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_vin">VIN (optional)</Label>
                  <Input
                    id="new_vin"
                    name="vin"
                    value={vehicleData.vin}
                    onChange={handleVehicleChange}
                    placeholder="VIN number"
                    data-testid="input-new-vehicle-vin"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setVehicleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createVehicle.isPending} data-testid="button-save-vehicle">
                  {createVehicle.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Vehicle"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
