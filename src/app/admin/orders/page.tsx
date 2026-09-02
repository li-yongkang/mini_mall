import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { getLevelName } from "@/lib/member";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export const metadata: Metadata = { title: "订单管理 - Mini Mall" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true },
  });

  return (
    <div>
      {orders.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">暂无订单</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>实付</TableHead>
                <TableHead>折扣</TableHead>
                <TableHead>等级快照</TableHead>
                <TableHead>下单时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.orderNo}</TableCell>
                  <TableCell>{order.user.email}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatPrice(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    {order.discountPercent < 100 ? `${order.discountPercent} 折` : "无"}
                  </TableCell>
                  <TableCell>{getLevelName(order.memberLevel)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/admin/orders/${order.id}`} />}
                      >
                        详情
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
