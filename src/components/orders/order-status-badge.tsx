import { Badge } from "@/components/ui/badge";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

const STATUS_VARIANTS = {
  PENDING: "secondary",
  PAID: "default",
  SHIPPED: "outline",
  CANCELLED: "destructive",
} as const satisfies Record<OrderStatus, "secondary" | "default" | "outline" | "destructive">;

export function OrderStatusBadge({ status }: { status: string }) {
  const valid = (ORDER_STATUSES as readonly string[]).includes(status);
  const s: OrderStatus = valid ? (status as OrderStatus) : "PENDING";
  return <Badge variant={STATUS_VARIANTS[s]}>{ORDER_STATUS_LABELS[s]}</Badge>;
}
