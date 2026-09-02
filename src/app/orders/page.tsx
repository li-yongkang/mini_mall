import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export const metadata: Metadata = { title: "我的订单 - Mini Mall" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">我的订单</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border py-20 text-muted-foreground">
          <PackageIcon className="size-12" />
          <p>暂无订单</p>
          <Button nativeButton={false} render={<Link href="/products" />}>
            去逛逛
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm text-muted-foreground">{order.orderNo}</span>
                </div>
                <p className="mt-1.5 truncate text-sm text-muted-foreground">
                  {order.items.map((item) => `${item.name}×${item.quantity}`).join("、")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <span className="shrink-0 font-bold text-primary">
                {formatPrice(order.totalAmount)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
