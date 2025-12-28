import { cn } from "@/lib/utils";

type StatusType = "APPOINTED" | "CHECKED_IN" | "IN_PROGRESS" | "ON_HOLD" | "QC_PENDING" | "READY_FOR_DELIVERY" | "DELIVERED";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStyles = (status: string) => {
    switch (status) {
      case "APPOINTED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "CHECKED_IN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "QC_PENDING":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "READY_FOR_DELIVERY":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "DELIVERED":
        return "bg-green-100 text-green-700 border-green-200";
      case "ON_HOLD":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide",
      getStyles(status),
      className
    )}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
