import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { getLevelName } from "@/lib/member";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { ShipButton } from "@/components/admin/ship-button";

export const metadata: Metadata = { title: "订单详情 - Mini Mall" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, items: true },
  });
  if (!order) notFound();

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal - order.totalAmount;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">订单详情</h2>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-xl border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-b p-4 last:border-b-0">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border p-4 text-sm">
            <p className="mb-2 text-muted-foreground">订单信息</p>
            <dl className="space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">订单号</dt>
                <dd className="font-mono">{order.orderNo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">下单用户</dt>
                <dd>{order.user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">下单时间</dt>
                <dd>{formatDate(order.createdAt)}</dd>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">支付时间</dt>
                  <dd>{formatDate(order.paidAt)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">会员快照</dt>
                <dd>
                  <Badge variant="secondary">{getLevelName(order.memberLevel)}</Badge>
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">商品总额</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {order.discountPercent < 100 && (
              <div className="mt-1.5 flex justify-between">
                <span className="text-muted-foreground">
                  会员折扣（{order.discountPercent} 折）
                </span>
                <span className="text-primary">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <Separator className="my-3" />
            <div className="flex items-baseline justify-between">
              <span>实付</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          {order.status === "PAID" && <ShipButton orderId={order.id} />}
          {order.status === "SHIPPED" && (
            <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
              订单已发货
            </p>
          )}
          {order.status === "PENDING" && (
            <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
              等待用户支付
            </p>
          )}
          {order.status === "CANCELLED" && (
            <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
              订单已取消
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
