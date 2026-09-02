import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "后台统计 - Mini Mall" };

export default async function AdminDashboardPage() {
  const [userCount, productCount, activeProducts, orderCount, paidAgg, pendingShip] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { status: "PAID" } }),
    ]);

  const stats = [
    { title: "用户总数", value: String(userCount), desc: "注册用户" },
    {
      title: "商品总数",
      value: `${productCount}`,
      desc: `上架 ${activeProducts} / 下架 ${productCount - activeProducts}`,
    },
    { title: "订单总数", value: String(orderCount), desc: "全部订单" },
    {
      title: "销售额",
      value: formatPrice(paidAgg._sum.totalAmount ?? 0),
      desc: `已支付订单 · 待发货 ${pendingShip} 单`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
