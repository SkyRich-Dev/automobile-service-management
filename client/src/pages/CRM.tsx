import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useCustomers, useCreateCustomer } from "@/hooks/use-crm";
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
} from "@/components/ui/dialog";
import { Plus, Mail, Phone, Users, Star, Loader2 } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    loyalty_points: 0,
    address: "",
    notes: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          loyalty_points: 0,
          address: "",
          notes: "",
        });
      },
    });
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
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
                />
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
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? (
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
      </main>
    </div>
  );
}
