import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useParts, useCreatePart } from "@/hooks/use-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, AlertTriangle, Package, Loader2 } from "lucide-react";

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
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Inventory() {
  const { data: parts, isLoading } = useParts();
  const createPart = useCreatePart();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    stock: 0,
    min_stock: 5,
    price: "0",
    reserved: 0,
    location: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPart.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: "",
          sku: "",
          category: "",
          stock: 0,
          min_stock: 5,
          price: "0",
          reserved: 0,
          location: "",
        });
      },
    });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const lowStockCount = parts?.filter((p) => p.stock <= p.min_stock).length || 0;

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-inventory">
      <AppSidebar />
      <main className="ml-64 flex-1 p-6">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage parts, stock levels, and procurement
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {lowStockCount} Low Stock
              </Badge>
            )}
            <Button onClick={() => setOpen(true)} className="gap-2" data-testid="button-add-part">
              <Plus className="h-4 w-4" />
              Add Part
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parts?.map((part) => {
            const stockPercentage = Math.min((part.stock / (part.min_stock * 3)) * 100, 100);
            const isLow = part.stock <= part.min_stock;

            return (
              <Card
                key={part.id}
                className={cn(
                  "card-hover border-border/50",
                  isLow && "border-destructive/30"
                )}
                data-testid={`card-part-${part.id}`}
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <h3 className="truncate font-semibold">{part.name}</h3>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {part.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${part.price}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {part.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span
                        className={cn(
                          "flex items-center gap-1 font-semibold",
                          isLow ? "text-destructive" : "text-foreground"
                        )}
                      >
                        {isLow && <AlertTriangle className="h-3.5 w-3.5" />}
                        {part.stock}
                      </span>
                    </div>
                    <Progress
                      value={stockPercentage}
                      className={cn("h-2", isLow && "[&>div]:bg-destructive")}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Min: {part.min_stock}</span>
                    <span>Reserved: {part.reserved}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {(!parts || parts.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No parts in inventory</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setOpen(true)}
              >
                Add your first part
              </Button>
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Part</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Part Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter part name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="SKU-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., Filters"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Min Stock</Label>
                  <Input
                    id="min_stock"
                    name="min_stock"
                    type="number"
                    value={formData.min_stock}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPart.isPending}>
                  {createPart.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Part"
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
