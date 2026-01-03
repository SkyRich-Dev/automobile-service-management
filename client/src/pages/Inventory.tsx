import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocalization } from "@/lib/currency-context";
import { useSidebar } from "@/lib/sidebar-context";
import { 
  useParts, 
  useCreatePart, 
  usePartReservations, 
  useIssueReservation, 
  useReleaseReservation,
  useGRNs,
  useStockTransfers,
  usePurchaseRequisitions,
  useInventoryAlerts,
  useAcknowledgeAlert,
  useResolveAlert,
  useGenerateAlerts
} from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Plus, AlertTriangle, Package, Loader2, BookmarkCheck, FileText, ArrowRightLeft, ClipboardList, Bell, Check, X } from "lucide-react";

function LoadingSkeleton() {
  const { isCollapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
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

function PartsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { formatCurrency } = useLocalization();
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
    createPart.mutate(formData as any, {
      onSuccess: () => {
        toast({ title: t('inventory.messages.partCreated', 'Part created successfully') });
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
      onError: (error) => {
        toast({ title: t('inventory.messages.partCreateError', 'Failed to create part'), description: error.message, variant: "destructive" });
      },
    });
  };

  if (isLoading) {
    return <div className="skeleton h-48 rounded-xl" />;
  }

  const lowStockCount = parts?.filter((p) => p.stock <= p.min_stock).length || 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} {t('inventory.lowStock', 'Low Stock')}
            </Badge>
          )}
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2" data-testid="button-add-part">
          <Plus className="h-4 w-4" />
          {t('inventory.addPart', 'Add Part')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parts?.map((part) => {
          const stockPercentage = Math.min((part.stock / (part.min_stock * 3)) * 100, 100);
          const isLow = part.stock <= part.min_stock;

          return (
            <Card
              key={part.id}
              className={cn(
                "border-border/50",
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
                    <p className="text-lg font-bold">{formatCurrency(Number(part.price))}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {part.category}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('inventory.stockLevel', 'Stock Level')}</span>
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
                  <span>{t('inventory.min', 'Min')}: {part.min_stock}</span>
                  <span>{t('inventory.reserved', 'Reserved')}: {part.reserved}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!parts || parts.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
            <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('inventory.noPartsInInventory', 'No parts in inventory')}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setOpen(true)}
            >
              {t('inventory.addFirstPart', 'Add your first part')}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inventory.addNewPart', 'Add New Part')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('inventory.partName', 'Part Name')}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('inventory.enterPartName', 'Enter part name')}
                required
                data-testid="input-part-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">{t('inventory.sku', 'SKU')}</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder={t('inventory.skuPlaceholder', 'SKU-001')}
                  required
                  data-testid="input-part-sku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t('inventory.category', 'Category')}</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder={t('inventory.categoryPlaceholder', 'e.g., Filters')}
                  required
                  data-testid="input-part-category"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">{t('inventory.stock', 'Stock')}</Label>
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
                <Label htmlFor="min_stock">{t('inventory.minStock', 'Min Stock')}</Label>
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
                <Label htmlFor="price">{t('inventory.price', 'Price ($)')}</Label>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-part">
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={createPart.isPending} data-testid="button-save-part">
                {createPart.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('inventory.messages.saving', 'Saving...')}
                  </>
                ) : (
                  t('inventory.messages.savePart', 'Save Part')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReservationsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: reservations, isLoading } = usePartReservations();
  const issueReservation = useIssueReservation();
  const releaseReservation = useReleaseReservation();

  const handleIssue = (id: number) => {
    issueReservation.mutate({ id }, {
      onSuccess: () => toast({ title: t('inventory.messages.reservationIssued', 'Reservation issued successfully') }),
      onError: (error) => toast({ title: t('inventory.messages.reservationIssueError', 'Failed to issue reservation'), description: error.message, variant: "destructive" }),
    });
  };

  const handleRelease = (id: number) => {
    releaseReservation.mutate(id, {
      onSuccess: () => toast({ title: t('inventory.messages.reservationReleased', 'Reservation released successfully') }),
      onError: (error) => toast({ title: t('inventory.messages.reservationReleaseError', 'Failed to release reservation'), description: error.message, variant: "destructive" }),
    });
  };

  if (isLoading) {
    return <div className="skeleton h-48 rounded-xl" />;
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ISSUED: "bg-green-500/10 text-green-600 dark:text-green-400",
    RELEASED: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('inventory.reservations.reservationNumber', 'Reservation #')}</TableHead>
            <TableHead>{t('inventory.reservations.jobCard', 'Job Card')}</TableHead>
            <TableHead>{t('inventory.reservations.part', 'Part')}</TableHead>
            <TableHead>{t('inventory.reservations.quantity', 'Quantity')}</TableHead>
            <TableHead>{t('inventory.reservations.status', 'Status')}</TableHead>
            <TableHead>{t('inventory.reservations.reservedAt', 'Reserved At')}</TableHead>
            <TableHead>{t('inventory.reservations.actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations?.map((reservation) => (
            <TableRow key={reservation.id} data-testid={`row-reservation-${reservation.id}`}>
              <TableCell className="font-mono text-sm">{reservation.reservation_number}</TableCell>
              <TableCell>{reservation.job_card_number}</TableCell>
              <TableCell>{reservation.part_name}</TableCell>
              <TableCell>{reservation.quantity}</TableCell>
              <TableCell>
                <Badge className={statusColors[reservation.status] || ""}>
                  {t(`inventory.status.${reservation.status}`, reservation.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(reservation.reserved_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {reservation.status === "ACTIVE" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleIssue(reservation.id)}
                      disabled={issueReservation.isPending}
                      data-testid={`button-issue-${reservation.id}`}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      {t('inventory.reservations.issue', 'Issue')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRelease(reservation.id)}
                      disabled={releaseReservation.isPending}
                      data-testid={`button-release-${reservation.id}`}
                    >
                      <X className="mr-1 h-3 w-3" />
                      {t('inventory.reservations.release', 'Release')}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
          {(!reservations || reservations.length === 0) && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                <BookmarkCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                {t('inventory.reservations.noReservations', 'No part reservations found')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function GRNsTab() {
  const { t } = useTranslation();
  const { data: grns, isLoading } = useGRNs();

  if (isLoading) {
    return <div className="skeleton h-48 rounded-xl" />;
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    PENDING_INSPECTION: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    INSPECTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ACCEPTED: "bg-green-500/10 text-green-600 dark:text-green-400",
    PARTIAL_ACCEPT: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('inventory.grns.grnNumber', 'GRN #')}</TableHead>
            <TableHead>{t('inventory.grns.poNumber', 'PO #')}</TableHead>
            <TableHead>{t('inventory.grns.branch', 'Branch')}</TableHead>
            <TableHead>{t('inventory.grns.status', 'Status')}</TableHead>
            <TableHead>{t('inventory.grns.received', 'Received')}</TableHead>
            <TableHead>{t('inventory.grns.accepted', 'Accepted')}</TableHead>
            <TableHead>{t('inventory.grns.rejected', 'Rejected')}</TableHead>
            <TableHead>{t('inventory.grns.date', 'Date')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grns?.map((grn) => (
            <TableRow key={grn.id} data-testid={`row-grn-${grn.id}`}>
              <TableCell className="font-mono text-sm">{grn.grn_number}</TableCell>
              <TableCell>{grn.po_number}</TableCell>
              <TableCell>{grn.branch_name}</TableCell>
              <TableCell>
                <Badge className={statusColors[grn.status] || ""}>
                  {t(`inventory.status.${grn.status}`, grn.status.replace("_", " "))}
                </Badge>
              </TableCell>
              <TableCell>{grn.total_received_qty}</TableCell>
              <TableCell className="text-green-600">{grn.total_accepted_qty}</TableCell>
              <TableCell className="text-red-600">{grn.total_rejected_qty}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(grn.received_date).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {(!grns || grns.length === 0) && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                {t('inventory.grns.noGRNs', 'No GRNs found')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function StockTransfersTab() {
  const { t } = useTranslation();
  const { data: transfers, isLoading } = useStockTransfers();

  if (isLoading) {
    return <div className="skeleton h-48 rounded-xl" />;
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    PENDING_APPROVAL: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    APPROVED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    IN_TRANSIT: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    RECEIVED: "bg-green-500/10 text-green-600 dark:text-green-400",
    CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('inventory.transfers.transferNumber', 'Transfer #')}</TableHead>
            <TableHead>{t('inventory.transfers.fromBranch', 'From Branch')}</TableHead>
            <TableHead>{t('inventory.transfers.toBranch', 'To Branch')}</TableHead>
            <TableHead>{t('inventory.transfers.status', 'Status')}</TableHead>
            <TableHead>{t('inventory.transfers.items', 'Items')}</TableHead>
            <TableHead>{t('inventory.transfers.vehicle', 'Vehicle')}</TableHead>
            <TableHead>{t('inventory.transfers.created', 'Created')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers?.map((transfer) => (
            <TableRow key={transfer.id} data-testid={`row-transfer-${transfer.id}`}>
              <TableCell className="font-mono text-sm">{transfer.transfer_number}</TableCell>
              <TableCell>{transfer.from_branch_name}</TableCell>
              <TableCell>{transfer.to_branch_name}</TableCell>
              <TableCell>
                <Badge className={statusColors[transfer.status] || ""}>
                  {t(`inventory.status.${transfer.status}`, transfer.status.replace("_", " "))}
                </Badge>
              </TableCell>
              <TableCell>{transfer.lines?.length || 0}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {transfer.vehicle_number || "-"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(transfer.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {(!transfers || transfers.length === 0) && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                <ArrowRightLeft className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                {t('inventory.transfers.noTransfers', 'No stock transfers found')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function PurchaseRequisitionsTab() {
  const { t } = useTranslation();
  const { data: prs, isLoading } = usePurchaseRequisitions();

  if (isLoading) {
    return <div className="skeleton h-48 rounded-xl" />;
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    PENDING_APPROVAL: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    APPROVED: "bg-green-500/10 text-green-600 dark:text-green-400",
    REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400",
    CONVERTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-500/10 text-gray-600",
    MEDIUM: "bg-yellow-500/10 text-yellow-600",
    HIGH: "bg-orange-500/10 text-orange-600",
    URGENT: "bg-red-500/10 text-red-600",
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('inventory.requisitions.prNumber', 'PR #')}</TableHead>
            <TableHead>{t('inventory.requisitions.branch', 'Branch')}</TableHead>
            <TableHead>{t('inventory.requisitions.status', 'Status')}</TableHead>
            <TableHead>{t('inventory.requisitions.priority', 'Priority')}</TableHead>
            <TableHead>{t('inventory.requisitions.source', 'Source')}</TableHead>
            <TableHead>{t('inventory.requisitions.items', 'Items')}</TableHead>
            <TableHead>{t('inventory.requisitions.created', 'Created')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prs?.map((pr) => (
            <TableRow key={pr.id} data-testid={`row-pr-${pr.id}`}>
              <TableCell className="font-mono text-sm">{pr.pr_number}</TableCell>
              <TableCell>{pr.branch_name}</TableCell>
              <TableCell>
                <Badge className={statusColors[pr.status] || ""}>
                  {t(`inventory.status.${pr.status}`, pr.status.replace("_", " "))}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={priorityColors[pr.priority] || ""}>
                  {t(`inventory.priority.${pr.priority}`, pr.priority)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{pr.source.replace("_", " ")}</TableCell>
              <TableCell>{pr.lines?.length || 0}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(pr.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {(!prs || prs.length === 0) && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                {t('inventory.requisitions.noRequisitions', 'No purchase requisitions found')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function AlertsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: alerts, isLoading } = useInventoryAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const generateAlerts = useGenerateAlerts();

  const handleAcknowledge = (id: number) => {
    acknowledgeAlert.mutate(id, {
      onSuccess: () => toast({ title: t('inventory.messages.alertAcknowledged', 'Alert acknowledged') }),
      onError: (error) => toast({ title: t('inventory.messages.alertAcknowledgeError', 'Failed to acknowledge alert'), description: error.message, variant: "destructive" }),
    });
  };

  const handleResolve = (id: number) => {
    resolveAlert.mutate({ id }, {
      onSuccess: () => toast({ title: t('inventory.messages.alertResolved', 'Alert resolved successfully') }),
      onError: (error) => toast({ title: t('inventory.messages.alertResolveError', 'Failed to resolve alert'), description: error.message, variant: "destructive" }),
    });
  };

  const handleGenerateAlerts = () => {
    if (!profile?.branch) {
      toast({ title: t('inventory.messages.cannotGenerateAlerts', 'Cannot generate alerts'), description: t('inventory.messages.branchNotAvailable', 'Branch information not available'), variant: "destructive" });
      return;
    }
    generateAlerts.mutate(profile.branch, {
      onSuccess: (data) => toast({ title: t('inventory.messages.alertScanComplete', 'Alert scan complete'), description: t('inventory.messages.alertsGenerated', 'Generated {{count}} new alerts', { count: data.created || 0 }) }),
      onError: (error) => toast({ title: t('inventory.messages.alertGenerateError', 'Failed to generate alerts'), description: error.message, variant: "destructive" }),
    });
  };

  if (isLoading) {
    return <div className="skeleton h-48 rounded-xl" />;
  }

  const severityColors: Record<string, string> = {
    LOW: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    MEDIUM: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    HIGH: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    CRITICAL: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  const typeColors: Record<string, string> = {
    LOW_STOCK: "bg-red-500/10 text-red-600",
    OVERSTOCK: "bg-blue-500/10 text-blue-600",
    EXPIRY_WARNING: "bg-yellow-500/10 text-yellow-600",
    EXPIRED: "bg-red-500/10 text-red-600",
    REORDER: "bg-purple-500/10 text-purple-600",
  };

  const unresolvedCount = alerts?.filter(a => !a.is_resolved).length || 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {unresolvedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Bell className="h-3 w-3" />
              {unresolvedCount} {t('inventory.alerts.unresolved', 'Unresolved').replace('{{count}} ', '')}
            </Badge>
          )}
        </div>
        <Button
          onClick={handleGenerateAlerts}
          disabled={generateAlerts.isPending || !profile?.branch}
          data-testid="button-generate-alerts"
        >
          {generateAlerts.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bell className="mr-2 h-4 w-4" />
          )}
          {t('inventory.alerts.scanForAlerts', 'Scan for Alerts')}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('inventory.alerts.alertNumber', 'Alert #')}</TableHead>
            <TableHead>{t('inventory.alerts.part', 'Part')}</TableHead>
            <TableHead>{t('inventory.alerts.type', 'Type')}</TableHead>
            <TableHead>{t('inventory.alerts.severity', 'Severity')}</TableHead>
            <TableHead>{t('inventory.alerts.message', 'Message')}</TableHead>
            <TableHead>{t('inventory.alerts.status', 'Status')}</TableHead>
            <TableHead>{t('inventory.alerts.actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts?.map((alert) => (
            <TableRow key={alert.id} data-testid={`row-alert-${alert.id}`} className={cn(!alert.is_read && "bg-muted/30")}>
              <TableCell className="font-mono text-sm">{alert.alert_number}</TableCell>
              <TableCell>{alert.part_name}</TableCell>
              <TableCell>
                <Badge className={typeColors[alert.alert_type] || ""}>
                  {t(`inventory.alertTypes.${alert.alert_type}`, alert.alert_type.replace("_", " "))}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={severityColors[alert.severity] || ""}>
                  {t(`inventory.priority.${alert.severity}`, alert.severity)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate text-sm">{alert.message}</TableCell>
              <TableCell>
                {alert.is_resolved ? (
                  <Badge variant="secondary">{t('inventory.alerts.resolved', 'Resolved')}</Badge>
                ) : alert.is_read ? (
                  <Badge variant="outline">{t('inventory.alerts.read', 'Read')}</Badge>
                ) : (
                  <Badge variant="destructive">{t('inventory.alerts.new', 'New')}</Badge>
                )}
              </TableCell>
              <TableCell>
                {!alert.is_resolved && (
                  <div className="flex gap-2">
                    {!alert.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledgeAlert.isPending}
                        data-testid={`button-acknowledge-${alert.id}`}
                      >
                        {t('inventory.alerts.markRead', 'Mark Read')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolveAlert.isPending}
                      data-testid={`button-resolve-${alert.id}`}
                    >
                      {t('inventory.alerts.resolve', 'Resolve')}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
          {(!alerts || alerts.length === 0) && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                {t('inventory.alerts.noAlerts', 'No inventory alerts found')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Inventory() {
  const { t } = useTranslation();
  const { isCollapsed } = useSidebar();
  const { data: alerts } = useInventoryAlerts();
  const { data: reservations } = usePartReservations();
  
  const unresolvedAlerts = alerts?.filter(a => !a.is_resolved).length || 0;
  const activeReservations = reservations?.filter(r => r.status === "ACTIVE").length || 0;

  return (
    <div className="flex min-h-screen bg-background" data-testid="page-inventory">
      <AppSidebar />
      <main className={cn("flex-1 p-6 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('inventory.title', 'Inventory Management')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('inventory.subtitle', 'Manage parts, reservations, receiving, transfers, and alerts')}
          </p>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium">{t('inventory.tabs.parts', 'Parts')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{useParts().data?.length || 0}</div>
              <p className="text-xs text-muted-foreground">{t('inventory.totalItemsInInventory', 'Total items in inventory')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium">{t('inventory.tabs.reservations', 'Reservations')}</CardTitle>
              <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeReservations}</div>
              <p className="text-xs text-muted-foreground">{t('inventory.reservations.activeReservations', 'Active reservations')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium">{t('inventory.grns.pendingGRNs', 'Pending GRNs')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{useGRNs().data?.filter(g => g.status !== "ACCEPTED").length || 0}</div>
              <p className="text-xs text-muted-foreground">{t('inventory.grns.awaitingAcceptance', 'Awaiting acceptance')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium">{t('inventory.tabs.alerts', 'Alerts')}</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{unresolvedAlerts}</div>
              <p className="text-xs text-muted-foreground">{t('inventory.alerts.unresolvedAlerts', 'Unresolved alerts')}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="parts" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="parts" className="gap-2" data-testid="tab-parts">
              <Package className="h-4 w-4" />
              {t('inventory.tabs.parts', 'Parts')}
            </TabsTrigger>
            <TabsTrigger value="reservations" className="gap-2" data-testid="tab-reservations">
              <BookmarkCheck className="h-4 w-4" />
              {t('inventory.tabs.reservations', 'Reservations')}
              {activeReservations > 0 && (
                <Badge variant="secondary" className="ml-1">{activeReservations}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="grns" className="gap-2" data-testid="tab-grns">
              <FileText className="h-4 w-4" />
              {t('inventory.tabs.grns', 'GRNs')}
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-2" data-testid="tab-transfers">
              <ArrowRightLeft className="h-4 w-4" />
              {t('inventory.tabs.transfers', 'Transfers')}
            </TabsTrigger>
            <TabsTrigger value="requisitions" className="gap-2" data-testid="tab-requisitions">
              <ClipboardList className="h-4 w-4" />
              {t('inventory.tabs.requisitions', 'Requisitions')}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2" data-testid="tab-alerts">
              <Bell className="h-4 w-4" />
              {t('inventory.tabs.alerts', 'Alerts')}
              {unresolvedAlerts > 0 && (
                <Badge variant="destructive" className="ml-1">{unresolvedAlerts}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts">
            <PartsTab />
          </TabsContent>
          <TabsContent value="reservations">
            <ReservationsTab />
          </TabsContent>
          <TabsContent value="grns">
            <GRNsTab />
          </TabsContent>
          <TabsContent value="transfers">
            <StockTransfersTab />
          </TabsContent>
          <TabsContent value="requisitions">
            <PurchaseRequisitionsTab />
          </TabsContent>
          <TabsContent value="alerts">
            <AlertsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
